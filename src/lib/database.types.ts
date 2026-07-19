// Auto-generated types matching supabase/schema.sql
// Regenerate with: npx supabase gen types typescript --project-id YOUR_PROJECT_ID

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type UserRole = "patient" | "doctor" | "admin";
export type GenderType = "Male" | "Female" | "Other";
export type RiskLevelDB = "HIGH" | "MODERATE" | "STABLE";
export type MedStatus = "Taken" | "Pending" | "Missed";
export type ReportStatus = "Analyzing" | "Analyzed" | "Flagged";
export type DocStatus = "pending_review" | "approved" | "rejected";
export type VitalType = "blood_sugar" | "blood_pressure" | "heart_rate" | "steps" | "weight" | "spo2";

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
    };
  };
}
