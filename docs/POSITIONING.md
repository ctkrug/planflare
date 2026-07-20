# Planflare: positioning brief

Planflare is for backend developers who need to diagnose a slow SQL query
without manually tracing an engine-specific EXPLAIN dump. It removes the work
of finding the expensive operation and comparing estimated rows with actual
rows by turning PostgreSQL, MySQL, and SQLite plans into one cost tree. The
core benefit is immediate: see which plan node is consuming the runtime.

## Product name

**Planflare**

The name pairs the query plan with the signal flare that marks its hotspot. It
is short, pronounceable, and specific enough for a developer tool. The former
working title, Planscope, collides with active products in other categories.

## Tagline

**Postgres EXPLAIN ANALYZE visualizer for faster fixes**

## Copy voice

Write for a developer who already knows what EXPLAIN is. Lead with the slow
node, self-time, or row-estimate mismatch they can identify. Use database and
output names when they matter, keep claims measurable, and avoid teaching SQL
basics or sounding like a database vendor.
