//! Parses SQLite `EXPLAIN QUERY PLAN` tabular output (`id|parent|notused|detail`
//! rows, as returned by the query itself or copied from the CLI's raw mode).
//!
//! SQLite doesn't nest via indentation - it links rows by numeric parent id,
//! with `parent = 0` meaning "top-level" rather than a literal row 0. This
//! parses each row, then resolves the tree by id/parent linkage.

use crate::model::{ParseError, PlanNode};
use std::collections::{HashMap, HashSet};

pub fn parse(text: &str) -> Result<PlanNode, ParseError> {
    let mut rows: Vec<(i64, i64, String)> = Vec::new();

    for line in text.lines() {
        let line = line.trim();
        if line.is_empty() || line.eq_ignore_ascii_case("QUERY PLAN") {
            continue;
        }
        let parts: Vec<&str> = line.splitn(4, '|').collect();
        if parts.len() < 4 {
            continue; // not an id|parent|notused|detail row (e.g. CLI tree glyphs)
        }
        let id: i64 = parts[0]
            .trim()
            .parse()
            .map_err(|_| ParseError::new(format!("bad node id in row: {line}")))?;
        let parent: i64 = parts[1]
            .trim()
            .parse()
            .map_err(|_| ParseError::new(format!("bad parent id in row: {line}")))?;
        rows.push((id, parent, parts[3].trim().to_string()));
    }

    if rows.is_empty() {
        return Err(ParseError::new(
            "no \"id|parent|notused|detail\" rows found",
        ));
    }

    build_tree(rows)
}

fn build_tree(rows: Vec<(i64, i64, String)>) -> Result<PlanNode, ParseError> {
    let known_ids: HashSet<i64> = rows.iter().map(|(id, _, _)| *id).collect();
    let mut nodes: HashMap<i64, PlanNode> = HashMap::new();
    let mut child_ids: HashMap<i64, Vec<i64>> = HashMap::new();

    for (id, parent, detail) in &rows {
        nodes.insert(*id, node_from_detail(detail));
        // `parent == 0` means top-level (no real parent) - see the note
        // below - so it must not be recorded as a child-of-0 link, or a
        // row with id 0 would end up listed as its own child.
        if *parent != 0 {
            child_ids.entry(*parent).or_default().push(*id);
        }
    }

    // `parent == 0` is SQLite's own "no parent" convention (real row ids
    // start at 1), so it always means top-level even though 0 also happens
    // to be a valid i64 that could theoretically collide with a row id.
    let mut top_level: Vec<i64> = rows
        .iter()
        .filter(|(_, parent, _)| *parent == 0 || !known_ids.contains(parent))
        .map(|(id, _, _)| *id)
        .collect();
    top_level.dedup();

    let mut roots: Vec<PlanNode> = top_level
        .into_iter()
        .map(|id| attach(id, &mut nodes, &child_ids))
        .collect();

    match roots.len() {
        0 => Err(ParseError::new("could not resolve a root node")),
        1 => Ok(roots.remove(0)),
        _ => {
            let mut root = PlanNode::new("Query");
            root.children = roots;
            Ok(root)
        }
    }
}

/// Builds the subtree rooted at `id`, walking `child_ids` iteratively (an
/// explicit stack, not call-stack recursion) so a pathologically deep or
/// long chain of plan rows - e.g. thousands of nested subqueries - can't
/// blow the stack. See `sqlite.rs` adversarial tests for the regression
/// this guards against.
fn attach(
    id: i64,
    nodes: &mut HashMap<i64, PlanNode>,
    child_ids: &HashMap<i64, Vec<i64>>,
) -> PlanNode {
    struct Frame {
        id: i64,
        next_child_idx: usize,
    }

    let mut stack = vec![Frame {
        id,
        next_child_idx: 0,
    }];
    let mut built: HashMap<i64, PlanNode> = HashMap::new();

    while let Some(frame) = stack.last_mut() {
        let kids = child_ids.get(&frame.id);
        let kids_len = kids.map_or(0, |k| k.len());
        if frame.next_child_idx < kids_len {
            let kid_id = kids.unwrap()[frame.next_child_idx];
            frame.next_child_idx += 1;
            stack.push(Frame {
                id: kid_id,
                next_child_idx: 0,
            });
        } else {
            let current_id = frame.id;
            let mut node = nodes
                .remove(&current_id)
                .expect("row id must exist in node map");
            if let Some(kids) = child_ids.get(&current_id) {
                for kid_id in kids {
                    node.children
                        .push(built.remove(kid_id).expect("child must be built first"));
                }
            }
            stack.pop();
            built.insert(current_id, node);
        }
    }

    built.remove(&id).expect("root must be built")
}

fn node_from_detail(detail: &str) -> PlanNode {
    let mut parts = detail.splitn(2, ' ');
    let op = parts.next().unwrap_or("UNKNOWN").to_string();
    let rest = parts.next().unwrap_or("").trim();

    let mut node = PlanNode::new(op.clone());
    if matches!(op.as_str(), "SCAN" | "SEARCH") {
        if let Some(table) = rest.split_whitespace().next() {
            node.relation = Some(table.to_string());
        }
    }
    node
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_single_scan() {
        let plan = parse("0|0|0|SCAN t1").unwrap();
        assert_eq!(plan.node_type, "SCAN");
        assert_eq!(plan.relation.as_deref(), Some("t1"));
    }

    #[test]
    fn parses_join_as_two_top_level_scans() {
        let text = "1|0|0|SCAN t2\n2|0|0|SEARCH t1 USING INDEX idx (a=?)\n";
        let plan = parse(text).unwrap();
        assert_eq!(plan.node_type, "Query");
        assert_eq!(plan.children.len(), 2);
        assert_eq!(plan.children[0].relation.as_deref(), Some("t2"));
        assert_eq!(plan.children[1].node_type, "SEARCH");
        assert_eq!(plan.children[1].relation.as_deref(), Some("t1"));
    }

    #[test]
    fn parses_nested_subquery_by_parent_id() {
        let text = "1|0|0|SCAN t1\n2|1|0|SCAN t2\n";
        let plan = parse(text).unwrap();
        assert_eq!(plan.node_type, "SCAN");
        assert_eq!(plan.relation.as_deref(), Some("t1"));
        assert_eq!(plan.children.len(), 1);
        assert_eq!(plan.children[0].relation.as_deref(), Some("t2"));
    }

    #[test]
    fn rejects_empty_input() {
        assert!(parse("").is_err());
    }

    #[test]
    fn parses_a_very_deep_subquery_chain_without_overflowing_the_stack() {
        let depth = 50_000;
        let mut text = String::new();
        for i in 1..=depth {
            let parent = if i == 1 { 0 } else { i - 1 };
            text.push_str(&format!("{i}|{parent}|0|SCAN t{i}\n"));
        }
        let plan = parse(&text).unwrap();

        let mut seen = 1;
        let mut cur = &plan;
        while let Some(child) = cur.children.first() {
            seen += 1;
            cur = child;
        }
        assert_eq!(seen, depth);
    }

    #[test]
    fn ignores_a_row_whose_parent_is_itself() {
        // A self-referential parent id can't be a legitimate SQLite plan row,
        // but the parser must not loop or panic on it - it should simply
        // fail to resolve a root rather than treat the row as top-level.
        let plan = parse("5|5|0|SCAN t1");
        assert!(plan.is_err());
    }
}
