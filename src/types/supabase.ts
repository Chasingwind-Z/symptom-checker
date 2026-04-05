export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          birth_year: number | null;
          gender: string | null;
          city: string | null;
          medical_notes: string | null;
          emergency_contact: Json;
          consent_version: string | null;
          locale: string;
          preferred_language: string;
          created_at: string;
          updated_at: string;
          last_seen_at: string | null;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          birth_year?: number | null;
          gender?: string | null;
          city?: string | null;
          medical_notes?: string | null;
          emergency_contact?: Json;
          consent_version?: string | null;
          locale?: string;
          preferred_language?: string;
          created_at?: string;
          updated_at?: string;
          last_seen_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      cases: {
        Row: {
          id: string;
          user_id: string | null;
          profile_id: string | null;
          status: 'active' | 'closed' | 'archived';
          channel: string;
          is_anonymous: boolean;
          chief_complaint: string;
          structured_summary: Json;
          triage_level: 'green' | 'yellow' | 'orange' | 'red' | null;
          triage_reason: string | null;
          recommendation: string | null;
          location_context: Json;
          created_at: string;
          updated_at: string;
          closed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          profile_id?: string | null;
          status?: 'active' | 'closed' | 'archived';
          channel?: string;
          is_anonymous?: boolean;
          chief_complaint: string;
          structured_summary?: Json;
          triage_level?: 'green' | 'yellow' | 'orange' | 'red' | null;
          triage_reason?: string | null;
          recommendation?: string | null;
          location_context?: Json;
          created_at?: string;
          updated_at?: string;
          closed_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['cases']['Insert']>;
      };
      case_messages: {
        Row: {
          id: string;
          case_id: string;
          role: 'system' | 'user' | 'assistant' | 'tool';
          content: string;
          tool_name: string | null;
          sequence_no: number;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          role: 'system' | 'user' | 'assistant' | 'tool';
          content: string;
          tool_name?: string | null;
          sequence_no: number;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['case_messages']['Insert']>;
      };
      followups: {
        Row: {
          id: string;
          case_id: string;
          user_id: string | null;
          status: 'pending' | 'sent' | 'completed' | 'dismissed';
          reminder_channel: string;
          summary: string | null;
          scheduled_for: string;
          sent_at: string | null;
          completed_at: string | null;
          response_label: string | null;
          response_payload: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          user_id?: string | null;
          status?: 'pending' | 'sent' | 'completed' | 'dismissed';
          reminder_channel?: string;
          summary?: string | null;
          scheduled_for: string;
          sent_at?: string | null;
          completed_at?: string | null;
          response_label?: string | null;
          response_payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['followups']['Insert']>;
      };
      anonymous_reports: {
        Row: {
          id: string;
          case_id: string | null;
          district: string | null;
          age_band: string | null;
          risk_level: 'green' | 'yellow' | 'orange' | 'red' | null;
          symptom_tags: string[];
          report_payload: Json;
          reported_at: string;
        };
        Insert: {
          id?: string;
          case_id?: string | null;
          district?: string | null;
          age_band?: string | null;
          risk_level?: 'green' | 'yellow' | 'orange' | 'red' | null;
          symptom_tags?: string[];
          report_payload?: Json;
          reported_at?: string;
        };
        Update: Partial<Database['public']['Tables']['anonymous_reports']['Insert']>;
      };
      evidence_sources: {
        Row: {
          id: string;
          case_id: string | null;
          source_type: 'knowledge_base' | 'guideline' | 'web' | 'manual_review';
          title: string;
          source_url: string | null;
          publisher: string | null;
          published_at: string | null;
          summary: string | null;
          citation_snippet: string | null;
          confidence: number | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          case_id?: string | null;
          source_type: 'knowledge_base' | 'guideline' | 'web' | 'manual_review';
          title: string;
          source_url?: string | null;
          publisher?: string | null;
          published_at?: string | null;
          summary?: string | null;
          citation_snippet?: string | null;
          confidence?: number | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['evidence_sources']['Insert']>;
      };
      medical_knowledge_documents: {
        Row: {
          id: string;
          locale: string;
          title: string;
          category:
            | 'symptom_guidance'
            | 'danger_signs'
            | 'department_guidance'
            | 'population_guidance'
            | 'self_care';
          audience: '通用' | '儿童' | '老年人' | '慢病患者' | '孕产妇';
          triage_level: 'green' | 'yellow' | 'orange' | 'red';
          summary: string;
          guidance: string[];
          danger_signs: string[];
          departments: string[];
          tags: string[];
          keywords: string[];
          source_label: string;
          source_url: string | null;
          version: string | null;
          search_text: string | null;
          metadata: Json;
          is_active: boolean;
          is_seeded: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          locale?: string;
          title: string;
          category:
            | 'symptom_guidance'
            | 'danger_signs'
            | 'department_guidance'
            | 'population_guidance'
            | 'self_care';
          audience: '通用' | '儿童' | '老年人' | '慢病患者' | '孕产妇';
          triage_level: 'green' | 'yellow' | 'orange' | 'red';
          summary: string;
          guidance?: string[];
          danger_signs?: string[];
          departments?: string[];
          tags?: string[];
          keywords?: string[];
          source_label?: string;
          source_url?: string | null;
          version?: string | null;
          search_text?: string | null;
          metadata?: Json;
          is_active?: boolean;
          is_seeded?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['medical_knowledge_documents']['Insert']>;
      };
      medical_knowledge_chunks: {
        Row: {
          id: string;
          document_id: string;
          chunk_index: number;
          heading: string | null;
          content: string;
          token_count: number | null;
          search_terms: string[];
          semantic_text: string | null;
          embedding_model: string | null;
          embedding_status: string;
          embedding_updated_at: string | null;
          embedding_dimensions: number | null;
          embedding: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          chunk_index: number;
          heading?: string | null;
          content: string;
          token_count?: number | null;
          search_terms?: string[];
          semantic_text?: string | null;
          embedding_model?: string | null;
          embedding_status?: string;
          embedding_updated_at?: string | null;
          embedding_dimensions?: number | null;
          embedding?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['medical_knowledge_chunks']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      match_medical_knowledge_chunks: {
        Args: {
          query_text: string;
          match_count?: number;
        };
        Returns: Array<{
          chunk_id: string;
          document_id: string;
          chunk_index: number;
          heading: string | null;
          content: string;
          lexical_rank: number;
          vector_score: number | null;
        }>;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
