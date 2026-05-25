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
  public: {
    Tables: {
      lesson_progress: {
        Row: {
          completed_at: string | null
          id: string
          last_position_seconds: number | null
          lesson_id: string
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          last_position_seconds?: number | null
          lesson_id: string
          started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          last_position_seconds?: number | null
          lesson_id?: string
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          body_md: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          is_preview: boolean
          module_id: string
          slug: string
          sort_order: number
          summary: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          body_md?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_preview?: boolean
          module_id: string
          slug: string
          sort_order?: number
          summary?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          body_md?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_preview?: boolean
          module_id?: string
          slug?: string
          sort_order?: number
          summary?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          created_at: string
          id: string
          product_id: string
          sort_order: number
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          sort_order?: number
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          sort_order?: number
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          line_total_cents: number
          order_id: string
          product_id: string
          product_title: string
          quantity: number
          unit_price_cents: number
        }
        Insert: {
          created_at?: string
          id?: string
          line_total_cents: number
          order_id: string
          product_id: string
          product_title: string
          quantity?: number
          unit_price_cents: number
        }
        Update: {
          created_at?: string
          id?: string
          line_total_cents?: number
          order_id?: string
          product_id?: string
          product_title?: string
          quantity?: number
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          currency: string
          customer_name: string | null
          customer_phone: string | null
          email: string
          id: string
          metadata: Json | null
          provider: string
          provider_reference: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal_cents: number
          total_cents: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_name?: string | null
          customer_phone?: string | null
          email: string
          id?: string
          metadata?: Json | null
          provider?: string
          provider_reference?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_cents?: number
          total_cents?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          customer_name?: string | null
          customer_phone?: string | null
          email?: string
          id?: string
          metadata?: Json | null
          provider?: string
          provider_reference?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_cents?: number
          total_cents?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_cents: number | null
          created_at: string
          currency: string | null
          event_type: string | null
          gateway_response: string | null
          id: string
          order_id: string | null
          paid_at: string | null
          provider: string
          provider_reference: string
          raw_payload: Json | null
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount_cents?: number | null
          created_at?: string
          currency?: string | null
          event_type?: string | null
          gateway_response?: string | null
          id?: string
          order_id?: string | null
          paid_at?: string | null
          provider?: string
          provider_reference: string
          raw_payload?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount_cents?: number | null
          created_at?: string
          currency?: string | null
          event_type?: string | null
          gateway_response?: string | null
          id?: string
          order_id?: string | null
          paid_at?: string | null
          provider?: string
          provider_reference?: string
          raw_payload?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_grants: {
        Row: {
          granted_at: string
          id: string
          order_id: string | null
          product_id: string
          revoked_at: string | null
          subscriber_id: string | null
          user_id: string | null
        }
        Insert: {
          granted_at?: string
          id?: string
          order_id?: string | null
          product_id: string
          revoked_at?: string | null
          subscriber_id?: string | null
          user_id?: string | null
        }
        Update: {
          granted_at?: string
          id?: string
          order_id?: string | null
          product_id?: string
          revoked_at?: string | null
          subscriber_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_grants_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_grants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_grants_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          cohort_capacity: number | null
          cover_image_url: string | null
          created_at: string
          currency: string
          description: string | null
          format: string | null
          garden: Database["public"]["Enums"]["product_garden"] | null
          id: string
          is_free: boolean
          price_cents: number
          requires_application: boolean
          scripture_root: string | null
          seed_to_product_id: string | null
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["product_status"]
          tagline: string | null
          target_audience: string | null
          title: string
          updated_at: string
        }
        Insert: {
          cohort_capacity?: number | null
          cover_image_url?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          format?: string | null
          garden?: Database["public"]["Enums"]["product_garden"] | null
          id?: string
          is_free?: boolean
          price_cents?: number
          requires_application?: boolean
          scripture_root?: string | null
          seed_to_product_id?: string | null
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["product_status"]
          tagline?: string | null
          target_audience?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          cohort_capacity?: number | null
          cover_image_url?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          format?: string | null
          garden?: Database["public"]["Enums"]["product_garden"] | null
          id?: string
          is_free?: boolean
          price_cents?: number
          requires_application?: boolean
          scripture_root?: string | null
          seed_to_product_id?: string | null
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["product_status"]
          tagline?: string | null
          target_audience?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_seed_to_product_id_fkey"
            columns: ["seed_to_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriber_tags: {
        Row: {
          applied_by: string | null
          created_at: string
          id: string
          subscriber_id: string
          tag_id: string
        }
        Insert: {
          applied_by?: string | null
          created_at?: string
          id?: string
          subscriber_id: string
          tag_id: string
        }
        Update: {
          applied_by?: string | null
          created_at?: string
          id?: string
          subscriber_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriber_tags_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriber_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          raw_data: Json | null
          source: string
          status: Database["public"]["Enums"]["subscriber_status"]
          unsubscribed_at: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          raw_data?: Json | null
          source?: string
          status?: Database["public"]["Enums"]["subscriber_status"]
          unsubscribed_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          raw_data?: Json | null
          source?: string
          status?: Database["public"]["Enums"]["subscriber_status"]
          unsubscribed_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "student"
      order_status: "pending" | "paid" | "failed" | "refunded" | "cancelled"
      payment_status:
        | "initialized"
        | "success"
        | "failed"
        | "abandoned"
        | "reversed"
      product_garden: "deshe" | "esev" | "etz_pri" | "devarim"
      product_status: "draft" | "published" | "archived"
      subscriber_status: "active" | "unsubscribed" | "bounced" | "complained"
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
  public: {
    Enums: {
      app_role: ["admin", "student"],
      order_status: ["pending", "paid", "failed", "refunded", "cancelled"],
      payment_status: [
        "initialized",
        "success",
        "failed",
        "abandoned",
        "reversed",
      ],
      product_garden: ["deshe", "esev", "etz_pri", "devarim"],
      product_status: ["draft", "published", "archived"],
      subscriber_status: ["active", "unsubscribed", "bounced", "complained"],
    },
  },
} as const
