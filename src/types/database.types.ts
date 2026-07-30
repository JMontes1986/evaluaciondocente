export type AppRole = "SUPER_ADMIN" | "ADMIN" | "RECTOR" | "DIRECTIVO" | "COORDINADOR" | "DOCENTE";

export interface Database {
  public: {
    Tables: {
      profiles: { Row: { id: string; full_name: string; role: AppRole; active: boolean; created_at: string; updated_at: string }; Insert: { id: string; full_name: string; role?: AppRole; active?: boolean }; Update: { full_name?: string; role?: AppRole; active?: boolean }; Relationships: [] };
      academic_years: { Row: { id: string; name: string; active: boolean; created_at: string; updated_at: string }; Insert: { id?: string; name: string; active?: boolean }; Update: { name?: string; active?: boolean }; Relationships: [] };
      grades: { Row: { id: string; name: string; order_number: number; active: boolean; created_at: string; updated_at: string }; Insert: { id?: string; name: string; order_number: number; active?: boolean }; Update: { name?: string; order_number?: number; active?: boolean }; Relationships: [] };
      subjects: { Row: { id: string; name: string; active: boolean; created_at: string; updated_at: string }; Insert: { id?: string; name: string; active?: boolean }; Update: { name?: string; active?: boolean }; Relationships: [] };
      teachers: { Row: { id: string; document_number: string | null; full_name: string; email: string | null; photo_url: string | null; active: boolean; created_at: string; updated_at: string }; Insert: { id?: string; document_number?: string | null; full_name: string; email?: string | null; photo_url?: string | null; active?: boolean }; Update: { document_number?: string | null; full_name?: string; email?: string | null; photo_url?: string | null; active?: boolean }; Relationships: [] };
      students: { Row: { id: string; code: string; full_name: string; grade_id: string; academic_year_id: string; active: boolean; created_at: string; updated_at: string }; Insert: { id?: string; code: string; full_name: string; grade_id: string; academic_year_id: string; active?: boolean }; Update: { code?: string; full_name?: string; grade_id?: string; academic_year_id?: string; active?: boolean }; Relationships: [] };
      teacher_assignments: { Row: { id: string; teacher_id: string; grade_id: string; subject_id: string; academic_year_id: string; active: boolean; created_at: string }; Insert: { id?: string; teacher_id: string; grade_id: string; subject_id: string; academic_year_id: string; active?: boolean }; Update: { active?: boolean }; Relationships: [] };
      evaluation_periods: { Row: { id: string; name: string; academic_year_id: string; start_date: string; end_date: string; active: boolean; allow_feedback: boolean; created_at: string; updated_at: string }; Insert: { id?: string; name: string; academic_year_id: string; start_date: string; end_date: string; active?: boolean; allow_feedback?: boolean }; Update: { name?: string; start_date?: string; end_date?: string; active?: boolean; allow_feedback?: boolean }; Relationships: [] };
      evaluation_questions: { Row: { id: string; text: string; category: string | null; order_number: number; active: boolean; created_at: string; updated_at: string }; Insert: { id?: string; text: string; category?: string | null; order_number: number; active?: boolean }; Update: { text?: string; category?: string | null; order_number?: number; active?: boolean }; Relationships: [] };
      evaluations: { Row: { id: string; teacher_id: string; student_id: string; grade_id: string; evaluation_period_id: string; assignment_id: string | null; feedback: string | null; submitted_at: string; created_at: string }; Insert: never; Update: never; Relationships: [] };
      evaluation_answers: { Row: { id: string; evaluation_id: string; question_id: string; score: number; created_at: string }; Insert: never; Update: never; Relationships: [] };
      student_sessions: { Row: { id: string; student_id: string; token_hash: string; expires_at: string; created_at: string; revoked_at: string | null }; Insert: { id?: string; student_id: string; token_hash: string; expires_at: string; revoked_at?: string | null }; Update: { revoked_at?: string | null }; Relationships: [] };
      report_links: { Row: { id: string; teacher_id: string; evaluation_period_id: string; token_hash: string; expires_at: string | null; revoked_at: string | null; created_by: string | null; created_at: string }; Insert: { teacher_id: string; evaluation_period_id: string; token_hash: string; expires_at?: string | null; created_by?: string | null }; Update: { revoked_at?: string | null }; Relationships: [] };
      audit_logs: { Row: { id: string; user_id: string | null; action: string; entity: string; entity_id: string | null; metadata: Record<string, unknown>; created_at: string }; Insert: { user_id?: string | null; action: string; entity: string; entity_id?: string | null; metadata?: Record<string, unknown> }; Update: never; Relationships: [] };
      system_settings: { Row: { id: number; min_responses: number; student_session_minutes: number; updated_by: string | null; updated_at: string }; Insert: { id?: number; min_responses?: number; student_session_minutes?: number; updated_by?: string | null }; Update: { min_responses?: number; student_session_minutes?: number; updated_by?: string | null }; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: {
      get_dashboard_statistics: { Args: { p_period_id?: string | null }; Returns: Record<string, number> };
      submit_teacher_evaluation: { Args: { p_student_id: string; p_teacher_id: string; p_assignment_id: string; p_period_id: string; p_answers: { question_id: string; score: number }[]; p_feedback?: string | null }; Returns: string };
      get_teacher_report: { Args: { p_teacher_id: string; p_period_id: string; p_min_responses?: number }; Returns: Record<string, unknown> };
    };
    Enums: { app_role: AppRole };
    CompositeTypes: Record<string, never>;
  };
}
