use serde::{Deserialize, Serialize};

/// The database engine a plan was produced by. Kept explicit on the tree
/// (rather than inferred later) because a few UI decisions - which fields
/// are meaningful to show - depend on it.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Engine {
    Postgres,
    MySql,
    Sqlite,
}

/// One node in a normalized query plan tree.
///
/// Every engine exposes a different set of fields under different names
/// (Postgres: `cost`, `rows`, `width`; MySQL: `cost_info`, `rows_examined_per_scan`;
/// SQLite: a flat `detail` string). This struct is the common shape every
/// engine-specific parser converges on, so the UI never has to branch on engine.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct PlanNode {
    /// e.g. "Seq Scan", "Index Scan", "SEARCH", "ALL"
    pub node_type: String,
    /// Table/index name, when the node operates on one.
    pub relation: Option<String>,
    /// Planner's estimated startup cost (Postgres only; arbitrary units).
    pub estimated_cost_start: Option<f64>,
    /// Planner's estimated total cost (Postgres only; arbitrary units).
    pub estimated_cost_total: Option<f64>,
    /// Planner's estimated row count for this node.
    pub estimated_rows: Option<u64>,
    /// Measured startup time in milliseconds (only present with ANALYZE).
    pub actual_time_start_ms: Option<f64>,
    /// Measured total time in milliseconds (only present with ANALYZE).
    pub actual_time_total_ms: Option<f64>,
    /// Measured row count (only present with ANALYZE).
    pub actual_rows: Option<u64>,
    /// Number of times this node executed (loops/nested-loop iterations).
    pub actual_loops: Option<u64>,
    pub children: Vec<PlanNode>,
}

impl PlanNode {
    pub fn new(node_type: impl Into<String>) -> Self {
        PlanNode {
            node_type: node_type.into(),
            relation: None,
            estimated_cost_start: None,
            estimated_cost_total: None,
            estimated_rows: None,
            actual_time_start_ms: None,
            actual_time_total_ms: None,
            actual_rows: None,
            actual_loops: None,
            children: Vec::new(),
        }
    }

    /// Self time in ms: this node's total time minus the sum of its
    /// children's total time. This is what should drive hotspot
    /// highlighting, not the node's own (inclusive) total_time, since an
    /// outer node's total always includes its children's cost.
    pub fn self_time_ms(&self) -> Option<f64> {
        let total = self.actual_time_total_ms?;
        let children_total: f64 = self
            .children
            .iter()
            .filter_map(|c| c.actual_time_total_ms)
            .sum();
        Some((total - children_total).max(0.0))
    }
}

// PlanNode's default (derived) drop glue recurses one stack frame per tree
// level, so a pathologically deep chain of nodes - e.g. thousands of nested
// SQLite subqueries - can overflow the stack when the tree is dropped, even
// though it was built iteratively. Flatten the drop into an explicit stack
// instead: each node's children are taken out before the node itself drops,
// so its own (recursive-looking) Drop::drop call has nothing left to walk.
impl Drop for PlanNode {
    fn drop(&mut self) {
        let mut pending = std::mem::take(&mut self.children);
        while let Some(mut node) = pending.pop() {
            pending.extend(std::mem::take(&mut node.children));
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ParseError {
    pub message: String,
}

impl std::fmt::Display for ParseError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl ParseError {
    pub fn new(message: impl Into<String>) -> Self {
        ParseError {
            message: message.into(),
        }
    }
}
