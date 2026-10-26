-- 0006_applicant_columns.sql
-- Appraisals are now filled by faculty members (SAP empinfoSet, keyed by
-- email) rather than students. Rename the identity snapshot columns so
-- the schema reads correctly; erp_id now stores the applicant's email.

ALTER TABLE submissions RENAME COLUMN student_name  TO applicant_name;
ALTER TABLE submissions RENAME COLUMN student_email TO applicant_email;
