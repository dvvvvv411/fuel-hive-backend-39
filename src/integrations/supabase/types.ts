export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          iban: string
          id: string
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
          iban: string
          id?: string
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
          iban?: string
          id?: string
        }
        Relationships: []
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
          id: string
          invoice_date: string | null
          invoice_generation_date: string | null
          invoice_number: string | null
          invoice_pdf_generated: boolean
          invoice_pdf_url: string | null
          invoice_sent: boolean
          liters: number
          order_number: string
          payment_method: string
          price_per_liter: number
          processing_mode: string | null
          product: string
          shop_id: string
          status: string
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
          id?: string
          invoice_date?: string | null
          invoice_generation_date?: string | null
          invoice_number?: string | null
          invoice_pdf_generated?: boolean
          invoice_pdf_url?: string | null
          invoice_sent?: boolean
          liters: number
          order_number: string
          payment_method: string
          price_per_liter: number
          processing_mode?: string | null
          product: string
          shop_id: string
          status?: string
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
          id?: string
          invoice_date?: string | null
          invoice_generation_date?: string | null
          invoice_number?: string | null
          invoice_pdf_generated?: boolean
          invoice_pdf_url?: string | null
          invoice_sent?: boolean
          liters?: number
          order_number?: string
          payment_method?: string
          price_per_liter?: number
          processing_mode?: string | null
          product?: string
          shop_id?: string
          status?: string
          total_amount?: number
          use_same_address?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "orders_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
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
      shops: {
        Row: {
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
          name: string
          registration_number: string | null
          resend_config_id: string | null
          vat_number: string | null
        }
        Insert: {
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
          name: string
          registration_number?: string | null
          resend_config_id?: string | null
          vat_number?: string | null
        }
        Update: {
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
          name?: string
          registration_number?: string | null
          resend_config_id?: string | null
          vat_number?: string | null
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
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
