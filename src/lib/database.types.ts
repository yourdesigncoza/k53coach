export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      attempts: {
        Row: {
          chosen_index: number
          correct: boolean
          created_at: string
          id: string
          question_id: string
          topic: string
          user_id: string
        }
        Insert: {
          chosen_index: number
          correct: boolean
          created_at?: string
          id?: string
          question_id: string
          topic: string
          user_id: string
        }
        Update: {
          chosen_index?: number
          correct?: boolean
          created_at?: string
          id?: string
          question_id?: string
          topic?: string
          user_id?: string
        }
        Relationships: []
      }
      coach_conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          locale: string
          message_count: number
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          locale?: string
          message_count?: number
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          locale?: string
          message_count?: number
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      coach_messages: {
        Row: {
          body: string
          conversation_id: string
          corpus_revision: string | null
          created_at: string
          evidence: Json
          id: string
          model: string | null
          prompt_version: number | null
          role: string
          status: string | null
          tokens_in: number | null
          tokens_out: number | null
          user_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          corpus_revision?: string | null
          created_at?: string
          evidence?: Json
          id?: string
          model?: string | null
          prompt_version?: number | null
          role: string
          status?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
          user_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          corpus_revision?: string | null
          created_at?: string
          evidence?: Json
          id?: string
          model?: string | null
          prompt_version?: number | null
          role?: string
          status?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "coach_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_usage: {
        Row: {
          created_at: string
          day: string
          entitlement_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day: string
          entitlement_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day?: string
          entitlement_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      entitlements: {
        Row: {
          expires_at: string
          granted_at: string
          granted_by: string | null
          id: string
          product: string
          reference: string | null
          source: string
          user_id: string
        }
        Insert: {
          expires_at: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          product?: string
          reference?: string | null
          source: string
          user_id: string
        }
        Update: {
          expires_at?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          product?: string
          reference?: string | null
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      exam_attempts: {
        Row: {
          answers: Json
          assessment: Json | null
          auto_submitted: boolean
          created_at: string
          duration_seconds: number | null
          finished_at: string | null
          format: Json
          id: string
          overall: number | null
          passed: boolean | null
          sections: Json
          started_at: string
          timer_enabled: boolean
          user_id: string
          vehicle_code: string
        }
        Insert: {
          answers?: Json
          assessment?: Json | null
          auto_submitted?: boolean
          created_at?: string
          duration_seconds?: number | null
          finished_at?: string | null
          format: Json
          id?: string
          overall?: number | null
          passed?: boolean | null
          sections?: Json
          started_at: string
          timer_enabled?: boolean
          user_id: string
          vehicle_code?: string
        }
        Update: {
          answers?: Json
          assessment?: Json | null
          auto_submitted?: boolean
          created_at?: string
          duration_seconds?: number | null
          finished_at?: string | null
          format?: Json
          id?: string
          overall?: number | null
          passed?: boolean | null
          sections?: Json
          started_at?: string
          timer_enabled?: boolean
          user_id?: string
          vehicle_code?: string
        }
        Relationships: []
      }
      feedback_reports: {
        Row: {
          admin_note: string | null
          ai_priority: string | null
          ai_title: string | null
          body: string
          chosen_index: number | null
          context: Json
          created_at: string
          id: string
          keyed_index: number | null
          kind: string
          linear_identifier: string | null
          linear_issue_id: string | null
          linear_issue_url: string | null
          objective_code: string | null
          question_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          sign_code: string | null
          status: string
          updated_at: string
          user_email: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          ai_priority?: string | null
          ai_title?: string | null
          body: string
          chosen_index?: number | null
          context?: Json
          created_at?: string
          id?: string
          keyed_index?: number | null
          kind: string
          linear_identifier?: string | null
          linear_issue_id?: string | null
          linear_issue_url?: string | null
          objective_code?: string | null
          question_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          sign_code?: string | null
          status?: string
          updated_at?: string
          user_email: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          ai_priority?: string | null
          ai_title?: string | null
          body?: string
          chosen_index?: number | null
          context?: Json
          created_at?: string
          id?: string
          keyed_index?: number | null
          kind?: string
          linear_identifier?: string | null
          linear_issue_id?: string | null
          linear_issue_url?: string | null
          objective_code?: string | null
          question_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          sign_code?: string | null
          status?: string
          updated_at?: string
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          is_minor: boolean
          locale: string
          parent_consent: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          is_minor?: boolean
          locale?: string
          parent_consent?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          is_minor?: boolean
          locale?: string
          parent_consent?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          answer: number
          approved_by: string | null
          created_at: string
          difficulty: number
          exam_likelihood: string
          explanation: string
          generated_by: string | null
          id: string
          in_exam: boolean
          in_readiness: boolean
          objective_code: string | null
          options: Json
          prompt: string
          review_status: string
          sign_code: string | null
          sort_order: number
          source_basis: string | null
          source_citation: string | null
          topic: string
          topic_tag: string | null
          updated_at: string
          updated_by: string | null
          vehicle_codes: string[]
          verified_at: string | null
        }
        Insert: {
          answer?: number
          approved_by?: string | null
          created_at?: string
          difficulty?: number
          exam_likelihood?: string
          explanation?: string
          generated_by?: string | null
          id: string
          in_exam?: boolean
          in_readiness?: boolean
          objective_code?: string | null
          options?: Json
          prompt?: string
          review_status?: string
          sign_code?: string | null
          sort_order?: number
          source_basis?: string | null
          source_citation?: string | null
          topic: string
          topic_tag?: string | null
          updated_at?: string
          updated_by?: string | null
          vehicle_codes?: string[]
          verified_at?: string | null
        }
        Update: {
          answer?: number
          approved_by?: string | null
          created_at?: string
          difficulty?: number
          exam_likelihood?: string
          explanation?: string
          generated_by?: string | null
          id?: string
          in_exam?: boolean
          in_readiness?: boolean
          objective_code?: string | null
          options?: Json
          prompt?: string
          review_status?: string
          sign_code?: string | null
          sort_order?: number
          source_basis?: string | null
          source_citation?: string | null
          topic?: string
          topic_tag?: string | null
          updated_at?: string
          updated_by?: string | null
          vehicle_codes?: string[]
          verified_at?: string | null
        }
        Relationships: []
      }
      readiness_assessment_grants: {
        Row: {
          created_at: string
          token_hash: string
        }
        Insert: {
          created_at?: string
          token_hash: string
        }
        Update: {
          created_at?: string
          token_hash?: string
        }
        Relationships: []
      }
      readiness_results: {
        Row: {
          band: string
          by_topic: Json
          id: string
          overall: number
          taken_at: string
          user_id: string
        }
        Insert: {
          band: string
          by_topic?: Json
          id?: string
          overall: number
          taken_at?: string
          user_id: string
        }
        Update: {
          band?: string
          by_topic?: Json
          id?: string
          overall?: number
          taken_at?: string
          user_id?: string
        }
        Relationships: []
      }
      road_signs: {
        Row: {
          alignment: string
          approved_by: string | null
          asset_status: string
          attribution_required: boolean
          category: string
          chart_match: Json | null
          code: string
          content: Json
          created_at: string
          in_official_chart: boolean
          licence: string | null
          name: string
          related_codes: string[]
          review_status: string
          sa_relevant: boolean | null
          sign_id: string
          source: string | null
          source_rev: string | null
          source_url: string | null
          subcategory: string | null
          svg_file: string | null
          svg_hash: string | null
          temporary: boolean
          updated_at: string
          verification: Json | null
          verified_at: string | null
        }
        Insert: {
          alignment?: string
          approved_by?: string | null
          asset_status?: string
          attribution_required?: boolean
          category: string
          chart_match?: Json | null
          code: string
          content?: Json
          created_at?: string
          in_official_chart?: boolean
          licence?: string | null
          name: string
          related_codes?: string[]
          review_status?: string
          sa_relevant?: boolean | null
          sign_id?: string
          source?: string | null
          source_rev?: string | null
          source_url?: string | null
          subcategory?: string | null
          svg_file?: string | null
          svg_hash?: string | null
          temporary?: boolean
          updated_at?: string
          verification?: Json | null
          verified_at?: string | null
        }
        Update: {
          alignment?: string
          approved_by?: string | null
          asset_status?: string
          attribution_required?: boolean
          category?: string
          chart_match?: Json | null
          code?: string
          content?: Json
          created_at?: string
          in_official_chart?: boolean
          licence?: string | null
          name?: string
          related_codes?: string[]
          review_status?: string
          sa_relevant?: boolean | null
          sign_id?: string
          source?: string | null
          source_rev?: string | null
          source_url?: string | null
          subcategory?: string | null
          svg_file?: string | null
          svg_hash?: string | null
          temporary?: boolean
          updated_at?: string
          verification?: Json | null
          verified_at?: string | null
        }
        Relationships: []
      }
      ui_translations: {
        Row: {
          default_hash: string | null
          key: string
          locale: string
          namespace: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          default_hash?: string | null
          key: string
          locale: string
          namespace: string
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          default_hash?: string | null
          key?: string
          locale?: string
          namespace?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
    }
    Views: {
      ui_translations_public: {
        Row: {
          key: string | null
          locale: string | null
          namespace: string | null
          value: string | null
        }
        Insert: {
          key?: string | null
          locale?: string | null
          namespace?: string | null
          value?: string | null
        }
        Update: {
          key?: string | null
          locale?: string | null
          namespace?: string | null
          value?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      coach_append_assistant: {
        Args: {
          p_body: string
          p_conversation_id: string
          p_corpus_revision: string
          p_evidence: Json
          p_model: string
          p_prompt_version: number
          p_status: string
          p_tokens_in: number
          p_tokens_out: number
        }
        Returns: string
      }
      coach_claim: {
        Args: {
          p_daily_cap: number
          p_entitlement_id: string
          p_global_cap: number
          p_period_cap: number
        }
        Returns: {
          outcome: string
          reservation_id: string
          used_period: number
          used_today: number
        }[]
      }
      coach_purge_expired_bodies: { Args: { p_days?: number }; Returns: number }
      coach_release: { Args: { p_reservation_id: string }; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      user_role: "learner" | "parent" | "school" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      user_role: ["learner", "parent", "school", "admin"],
    },
  },
} as const
