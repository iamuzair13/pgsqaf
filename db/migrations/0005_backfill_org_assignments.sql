-- 0005_backfill_org_assignments.sql
-- Frameworks created before framework_assignments existed have no rows,
-- so students can't see them (visibility is assignment-gated).
-- Backfill: treat every framework with no assignments as ORGANIZATION-wide,
-- matching the previous "all published frameworks are visible" behaviour.

INSERT INTO framework_assignments (framework_id, scope_type)
SELECT f.id, 'ORGANIZATION'
FROM frameworks f
WHERE NOT EXISTS (
    SELECT 1 FROM framework_assignments a WHERE a.framework_id = f.id
);
