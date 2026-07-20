export type FrameworkStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type UserRole = "SUPER_ADMIN" | "ADMIN";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: boolean;
}

export interface Framework {
  id: number;
  title: string;
  description: string;
  status: FrameworkStatus;
  version: string;
  created_by: number;
  created_by_name?: string;
  criteria_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Criteria {
  id: number;
  framework_id: number;
  title: string;
  domain: string;
  measure: string;
  total_weight: number;
  display_order: number;
  indicators_count?: number;
}

export interface Indicator {
  id: number;
  criteria_id: number;
  question: string;
  weight: number;
  require_attachment: boolean;
  display_order: number;
}

export interface RubricDescriptor {
  id: number;
  name: string;
}

export interface Rubric {
  id: number;
  criteria_id: number;
  score: number;
  descriptor_id: number;
  descriptor_name?: string;
  performance_standard: string;
  display_order: number;
}

export interface CriteriaQuantification {
  id: number;
  criteria_id: number;
  assigned_score: number;
  weight_factor: number;
  weighted_score: number;
}

export interface Evidence {
  id: number;
  criteria_id: number;
  title: string;
  description: string;
  require_attachment: boolean;
  file_path: string;
}

/* ------------------------------------------------------------------ */
/*  Organization Hierarchy                                            */
/* ------------------------------------------------------------------ */

export interface Faculty {
  id: number;
  name: string;
  code: string;
  dean: string | null;
  description: string | null;
  status: boolean;
  department_count?: number;
  program_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Department {
  id: number;
  faculty_id: number;
  faculty_name?: string;
  name: string;
  code: string;
  head: string | null;
  description: string | null;
  status: boolean;
  program_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Program {
  id: number;
  department_id: number;
  department_name?: string;
  faculty_name?: string;
  name: string;
  code: string;
  level: string;
  duration_years: number;
  description: string | null;
  status: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface OrganizationTree {
  faculty: Faculty;
  departments: Array<{
    department: Department;
    programs: Program[];
  }>;
}

/* ------------------------------------------------------------------ */
/*  Framework Assignments                                             */
/* ------------------------------------------------------------------ */

export type AssignmentScope = "ORGANIZATION" | "FACULTY" | "DEPARTMENT" | "PROGRAM";

export interface FrameworkAssignment {
  id: number;
  framework_id: number;
  scope_type: AssignmentScope;
  faculty_id: number | null;
  department_id: number | null;
  program_id: number | null;
  faculty_name?: string;
  department_name?: string;
  program_name?: string;
  created_at?: string;
}
