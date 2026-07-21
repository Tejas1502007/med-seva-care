// Auto-generated types matching supabase/schema.sql
// Regenerate with: npx supabase gen types typescript --project-id YOUR_PROJECT_ID

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type UserRole = "patient" | "doctor" | "admin" | "caregiver";
export type GenderType = "Male" | "Female" | "Other";
export type RiskLevelDB = "HIGH" | "MODERATE" | "STABLE";
export type MedStatus = "Taken" | "Pending" | "Missed";
export type ReportStatus = "Analyzing" | "Analyzed" | "Flagged";
export type DocStatus = "pending_review" | "approved" | "rejected";
export type AppointmentStatus = "pending" | "approved" | "rejected" | "cancelled" | "completed";
export type AppointmentMode = "online" | "offline";
export type VitalType = "blood_sugar" | "blood_pressure" | "heart_rate" | "steps" | "weight" | "spo2";
export type AlertSeverity = "MODERATE" | "HIGH" | "CRITICAL";
export type CheckinStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "ESCALATED" | "MISSED";
export type EligibilityStatus = "ELIGIBLE" | "LIKELY_ELIGIBLE" | "NOT_ELIGIBLE";
export type VaultCategory = "lab_report" | "discharge" | "prescription" | "scan" | "vaccination" | "insurance" | "govt_card" | "other";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      patient_profiles: {
        Row: {
          id: string;
          age: number | null;
          dob: string | null;
          gender: GenderType | null;
          blood_group: string | null;
          height: number | null;
          weight: number | null;
          language_pref: string;
          conditions: string[];
          allergies: string[];
          addictions: string[];
          risk_level: RiskLevelDB;
          risk_score: number | null;
          emergency_contact: Json | null;
          alternate_phone: string | null;
          address: string | null;
          assigned_doctor_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["patient_profiles"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["patient_profiles"]["Insert"]>;
      };
      doctor_profiles: {
        Row: {
          id: string;
          dob: string | null;
          gender: string | null;
          registration_number: string;
          qualification: string;
          specialization: string;
          years_of_experience: number | null;
          hospital_clinic: string | null;
          hospital_address: string | null;
          consultation_fee: number | null;
          consultation_type: "online" | "offline" | "both" | null;
          license_file_url: string | null;
          degree_certificate_url: string | null;
          government_id_url: string | null;
          profile_completed: boolean;
          verification_status: DocStatus;
          verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["doctor_profiles"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["doctor_profiles"]["Insert"]>;
      };
      medications: {
        Row: {
          id: string;
          patient_id: string;
          name: string;
          dose: string;
          frequency: string;
          time: string | null;
          times: string[] | null;
          unit: string | null;
          quantity: number | null;
          notes: string | null;
          streak: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["medications"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["medications"]["Insert"]>;
      };
      medication_logs: {
        Row: {
          id: string;
          medication_id: string;
          patient_id: string;
          status: MedStatus;
          logged_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["medication_logs"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["medication_logs"]["Insert"]>;
      };
      vitals: {
        Row: {
          id: string;
          patient_id: string;
          type: VitalType;
          value: number;
          unit: string;
          notes: string | null;
          recorded_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["vitals"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["vitals"]["Insert"]>;
      };
      health_reports: {
        Row: {
          id: string;
          patient_id: string;
          doctor_id: string | null;
          name: string;
          file_url: string | null;
          status: ReportStatus;
          lab_values: Json | null;
          ai_summary: string | null;
          report_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["health_reports"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["health_reports"]["Insert"]>;
      };
      consultations: {
        Row: {
          id: string;
          patient_id: string;
          doctor_id: string;
          note: string;
          consulted_at: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["consultations"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["consultations"]["Insert"]>;
      };
      care_plans: {
        Row: {
          id: string;
          patient_id: string;
          basis: string | null;
          meals: Json | null;
          lifestyle: Json | null;
          generated_at: string;
          valid_until: string | null;
          is_active: boolean;
        };
        Insert: Omit<Database["public"]["Tables"]["care_plans"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["care_plans"]["Insert"]>;
      };
      chat_messages: {
        Row: {
          id: string;
          patient_id: string;
          role: "user" | "assistant";
          content: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["chat_messages"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["chat_messages"]["Insert"]>;
      };
      health_vault: {
        Row: {
          id: string;
          user_id: string;
          file_name: string;
          file_url: string;
          category: VaultCategory;
          document_date: string | null;
          uploaded_by: "self" | "doctor" | "hospital";
          tags: string[] | null;
          ai_summary: Json | null;
          file_size: number | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["health_vault"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["health_vault"]["Insert"]>;
      };
      discharge_protocols: {
        Row: {
          id: string;
          user_id: string;
          health_vault_id: string | null;
          raw_text: string | null;
          parsed_data: Json;
          activated: boolean;
          activated_at: string | null;
          protocol_end_date: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["discharge_protocols"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["discharge_protocols"]["Insert"]>;
      };
      aara_scheduled_checkins: {
        Row: {
          id: string;
          user_id: string;
          protocol_id: string | null;
          day_number: number;
          scheduled_date: string;
          priority: "HIGH" | "ROUTINE";
          questions: Json;
          escalate_if: string;
          status: CheckinStatus;
          response_data: Json | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["aara_scheduled_checkins"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["aara_scheduled_checkins"]["Insert"]>;
      };
      alert_escalations: {
        Row: {
          id: string;
          user_id: string;
          trigger_type: string;
          trigger_value: string;
          severity: AlertSeverity;
          steps: Json;
          current_step: number;
          resolved: boolean;
          resolved_by: "patient" | "doctor" | "caregiver" | "auto" | null;
          resolved_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["alert_escalations"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["alert_escalations"]["Insert"]>;
      };
      drug_interaction_checks: {
        Row: {
          id: string;
          user_id: string;
          drugs_checked: Json;
          interactions_found: Json | null;
          checked_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["drug_interaction_checks"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["drug_interaction_checks"]["Insert"]>;
      };
      scheme_applications: {
        Row: {
          id: string;
          user_id: string;
          scheme_name: string;
          eligibility_status: EligibilityStatus;
          applied: boolean;
          applied_at: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["scheme_applications"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["scheme_applications"]["Insert"]>;
      };
      record_shares: {
        Row: {
          id: string;
          patient_id: string;
          token: string;
          doctor_name: string | null;
          doctor_contact: string | null;
          share_categories: Json;
          expires_at: string | null;
          accessed_at: string | null;
          access_count: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["record_shares"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["record_shares"]["Insert"]>;
      };
      caregivers: {
        Row: {
          id: string;
          caregiver_id: string;
          patient_id: string;
          relationship: string | null;
          is_active: boolean;
          linked_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["caregivers"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["caregivers"]["Insert"]>;
      };
      caregiver_observations: {
        Row: {
          id: string;
          caregiver_id: string;
          patient_id: string;
          observation_date: string;
          mood: "good" | "okay" | "poor" | null;
          appetite: "good" | "reduced" | "very_poor" | null;
          energy: "normal" | "low" | "very_low" | null;
          pain_level: number | null;
          confusion_noted: boolean;
          free_text: string | null;
          ai_flag: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["caregiver_observations"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["caregiver_observations"]["Insert"]>;
      };
      appointments: {
        Row: {
          id: string;
          patient_id: string;
          doctor_id: string;
          appointment_date: string;   // ISO date string "YYYY-MM-DD"
          appointment_time: string;   // "HH:MM:SS"
          mode: AppointmentMode;
          reason: string | null;
          rejection_reason: string | null;
          status: AppointmentStatus;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["appointments"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["appointments"]["Insert"]>;
      };
    };
  };
}
