-- 0004_performance_indexes.sql — composite indexes for the hot query paths
-- (student's own submissions, framework-scoped reads).

CREATE INDEX IF NOT EXISTS idx_submissions_erp_status
    ON submissions (erp_id, status);

CREATE INDEX IF NOT EXISTS idx_assignment_framework_scope
    ON framework_assignments (framework_id, scope_type);

CREATE INDEX IF NOT EXISTS idx_answers_submission_indicator
    ON submission_answers (submission_id, indicator_id);
