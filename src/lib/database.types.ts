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
          key: string
          locale: string
          namespace: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          key: string
          locale: string
          namespace: string
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
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
