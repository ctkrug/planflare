import type { Engine } from "./engine";

/**
 * One realistic, hand-verified EXPLAIN dump per engine for the "Try an
 * example" control - lets the tool be demonstrated without a live database.
 * Each is chosen to show off the wow moment: the Postgres and SQLite
 * examples have a clear hotspot and a >10x row mis-estimation; verified to
 * actually parse via examples.test.ts (against the real wasm parser, not a
 * mock).
 */
export const EXAMPLE_PLANS: Record<Engine, string> = {
  postgres: `Hash Join  (cost=1.16..3.31 rows=2 width=68) (actual time=0.045..15.223 rows=1200 loops=1)
  ->  Seq Scan on orders  (cost=0.00..2.10 rows=10 width=40) (actual time=0.012..12.900 rows=1200 loops=1)
        Filter: (status = 'shipped'::text)
  ->  Hash  (cost=1.05..1.05 rows=5 width=36) (actual time=0.020..0.020 rows=5 loops=1)
        ->  Index Scan using customers_pkey on customers  (cost=0.15..1.05 rows=5 width=36) (actual time=0.008..0.015 rows=5 loops=1)
`,

  mysql: `{
  "query_block": {
    "select_id": 1,
    "cost_info": { "query_cost": "48.60" },
    "nested_loop": [
      {
        "table": {
          "table_name": "orders",
          "access_type": "ALL",
          "rows_examined_per_scan": 1200,
          "cost_info": { "read_cost": "2.25", "eval_cost": "1.20", "prefix_cost": "3.45" }
        }
      },
      {
        "table": {
          "table_name": "customers",
          "access_type": "eq_ref",
          "rows_examined_per_scan": 1,
          "cost_info": { "read_cost": "0.25", "eval_cost": "0.10", "prefix_cost": "45.15" }
        }
      }
    ]
  }
}
`,

  sqlite: `1|0|0|SCAN orders
2|0|0|SEARCH customers USING INTEGER PRIMARY KEY (rowid=?)
`,
};
