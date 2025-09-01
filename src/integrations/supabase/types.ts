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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      bank_accounts: {
        Row: {
          account_holder: string
          account_name: string
          active: boolean
          bank_name: string
          bic: string | null
          country: string
          created_at: string
          currency: string
          daily_limit: number | null
          iban: string
          id: string
          is_temporary: boolean
          temp_order_number: string | null
          use_anyname: boolean
          used_for_order_id: string | null
        }
        Insert: {
          account_holder: string
          account_name: string
          active?: boolean
          bank_name: string
          bic?: string | null
          country: string
          created_at?: string
          currency?: string
          daily_limit?: number | null
          iban: string
          id?: string
          is_temporary?: boolean
          temp_order_number?: string | null
          use_anyname?: boolean
          used_for_order_id?: string | null
        }
        Update: {
          account_holder?: string
          account_name?: string
          active?: boolean
          bank_name?: string
          bic?: string | null
          country?: string
          created_at?: string
          currency?: string
          daily_limit?: number | null
          iban?: string
          id?: string
          is_temporary?: boolean
          temp_order_number?: string | null
          use_anyname?: boolean
          used_for_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_used_for_order_id_fkey"
            columns: ["used_for_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_tokens: {
        Row: {
          created_at: string
          delivery_fee: number
          expires_at: string
          liters: number
          price_per_liter: number
          product: string
          shop_id: string
          token: string
          total_amount: number
          vat_amount: number | null
          vat_rate: number | null
        }
        Insert: {
          created_at?: string
          delivery_fee?: number
          expires_at?: string
          liters: number
          price_per_liter: number
          product: string
          shop_id: string
          token: string
          total_amount: number
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Update: {
          created_at?: string
          delivery_fee?: number
          expires_at?: string
          liters?: number
          price_per_liter?: number
          product?: string
          shop_id?: string
          token?: string
          total_amount?: number
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_tokens_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount: number
          bank_details_shown: boolean
          base_price: number
          billing_city: string | null
          billing_first_name: string | null
          billing_last_name: string | null
          billing_postcode: string | null
          billing_street: string | null
          created_at: string
          customer_address: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          delivery_city: string
          delivery_fee: number
          delivery_first_name: string
          delivery_last_name: string
          delivery_phone: string | null
          delivery_postcode: string
          delivery_street: string
          hidden: boolean
          id: string
          invoice_date: string | null
          invoice_generation_date: string | null
          invoice_number: string | null
          invoice_pdf_generated: boolean
          invoice_pdf_url: string | null
          invoice_sent: boolean
          liters: number
          order_number: string
          order_token: string | null
          payment_method: string
          payment_method_id: string | null
          price_per_liter: number
          processing_mode: string | null
          product: string
          selected_bank_account_id: string | null
          shop_id: string
          status: string
          temp_order_number: string | null
          total_amount: number
          use_same_address: boolean
        }
        Insert: {
          amount: number
          bank_details_shown?: boolean
          base_price: number
          billing_city?: string | null
          billing_first_name?: string | null
          billing_last_name?: string | null
          billing_postcode?: string | null
          billing_street?: string | null
          created_at?: string
          customer_address?: string | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          delivery_city: string
          delivery_fee?: number
          delivery_first_name: string
          delivery_last_name: string
          delivery_phone?: string | null
          delivery_postcode: string
          delivery_street: string
          hidden?: boolean
          id?: string
          invoice_date?: string | null
          invoice_generation_date?: string | null
          invoice_number?: string | null
          invoice_pdf_generated?: boolean
          invoice_pdf_url?: string | null
          invoice_sent?: boolean
          liters: number
          order_number: string
          order_token?: string | null
          payment_method: string
          payment_method_id?: string | null
          price_per_liter: number
          processing_mode?: string | null
          product: string
          selected_bank_account_id?: string | null
          shop_id: string
          status?: string
          temp_order_number?: string | null
          total_amount: number
          use_same_address?: boolean
        }
        Update: {
          amount?: number
          bank_details_shown?: boolean
          base_price?: number
          billing_city?: string | null
          billing_first_name?: string | null
          billing_last_name?: string | null
          billing_postcode?: string | null
          billing_street?: string | null
          created_at?: string
          customer_address?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          delivery_city?: string
          delivery_fee?: number
          delivery_first_name?: string
          delivery_last_name?: string
          delivery_phone?: string | null
          delivery_postcode?: string
          delivery_street?: string
          hidden?: boolean
          id?: string
          invoice_date?: string | null
          invoice_generation_date?: string | null
          invoice_number?: string | null
          invoice_pdf_generated?: boolean
          invoice_pdf_url?: string | null
          invoice_sent?: boolean
          liters?: number
          order_number?: string
          order_token?: string | null
          payment_method?: string
          payment_method_id?: string | null
          price_per_liter?: number
          processing_mode?: string | null
          product?: string
          selected_bank_account_id?: string | null
          shop_id?: string
          status?: string
          temp_order_number?: string | null
          total_amount?: number
          use_same_address?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "orders_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_selected_bank_account_id_fkey"
            columns: ["selected_bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      resend_configs: {
        Row: {
          active: boolean
          config_name: string
          created_at: string
          from_email: string
          from_name: string
          id: string
          resend_api_key: string
        }
        Insert: {
          active?: boolean
          config_name: string
          created_at?: string
          from_email: string
          from_name: string
          id?: string
          resend_api_key: string
        }
        Update: {
          active?: boolean
          config_name?: string
          created_at?: string
          from_email?: string
          from_name?: string
          id?: string
          resend_api_key?: string
        }
        Relationships: []
      }
      shop_payment_methods: {
        Row: {
          active: boolean
          created_at: string
          id: string
          payment_method_id: string
          shop_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          payment_method_id: string
          shop_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          payment_method_id?: string
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_payment_methods_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_payment_methods_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          accent_color: string | null
          active: boolean
          bank_account_id: string | null
          business_owner: string | null
          checkout_mode: string
          company_address: string
          company_city: string
          company_email: string
          company_name: string
          company_phone: string | null
          company_postcode: string
          company_website: string | null
          country_code: string
          court_name: string | null
          created_at: string
          currency: string
          id: string
          language: string
          logo_url: string | null
          name: string
          registration_number: string | null
          resend_config_id: string | null
          support_phone: string | null
          vat_number: string | null
          vat_rate: number | null
        }
        Insert: {
          accent_color?: string | null
          active?: boolean
          bank_account_id?: string | null
          business_owner?: string | null
          checkout_mode?: string
          company_address: string
          company_city: string
          company_email: string
          company_name: string
          company_phone?: string | null
          company_postcode: string
          company_website?: string | null
          country_code?: string
          court_name?: string | null
          created_at?: string
          currency?: string
          id?: string
          language?: string
          logo_url?: string | null
          name: string
          registration_number?: string | null
          resend_config_id?: string | null
          support_phone?: string | null
          vat_number?: string | null
          vat_rate?: number | null
        }
        Update: {
          accent_color?: string | null
          active?: boolean
          bank_account_id?: string | null
          business_owner?: string | null
          checkout_mode?: string
          company_address?: string
          company_city?: string
          company_email?: string
          company_name?: string
          company_phone?: string | null
          company_postcode?: string
          company_website?: string | null
          country_code?: string
          court_name?: string | null
          created_at?: string
          currency?: string
          id?: string
          language?: string
          logo_url?: string | null
          name?: string
          registration_number?: string | null
          resend_config_id?: string | null
          support_phone?: string | null
          vat_number?: string | null
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shops_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shops_resend_config_id_fkey"
            columns: ["resend_config_id"]
            isOneToOne: false
            referencedRelation: "resend_configs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_tokens: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
