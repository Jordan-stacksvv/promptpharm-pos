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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      condition_medicines: {
        Row: {
          condition_id: string | null
          id: string
          medicine_id: string | null
          notes: string | null
        }
        Insert: {
          condition_id?: string | null
          id?: string
          medicine_id?: string | null
          notes?: string | null
        }
        Update: {
          condition_id?: string | null
          id?: string
          medicine_id?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "condition_medicines_condition_id_fkey"
            columns: ["condition_id"]
            isOneToOne: false
            referencedRelation: "conditions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "condition_medicines_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      conditions: {
        Row: {
          description: string | null
          id: string
          name: string
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          allergies: string[] | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          id: string
          insurance_info: string | null
          last_visit: string | null
          medical_conditions: string[] | null
          name: string
          phone: string | null
          total_purchases: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          allergies?: string[] | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          id?: string
          insurance_info?: string | null
          last_visit?: string | null
          medical_conditions?: string[] | null
          name: string
          phone?: string | null
          total_purchases?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          allergies?: string[] | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          id?: string
          insurance_info?: string | null
          last_visit?: string | null
          medical_conditions?: string[] | null
          name?: string
          phone?: string | null
          total_purchases?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      daily_reports: {
        Row: {
          created_at: string | null
          date: string
          id: string
          items_count: number
          sales_count: number
          total: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          items_count: number
          sales_count: number
          total: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          items_count?: number
          sales_count?: number
          total?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      medicines: {
        Row: {
          barcode: string | null
          batch_number: string
          brand: string
          buying_price: number
          category: string
          created_at: string
          dosage: string | null
          expiry_date: string
          form: string
          id: string
          margin_percentage: number | null
          min_stock_level: number
          name: string
          selling_price: number
          stock_quantity: number
          supplier: string | null
        }
        Insert: {
          barcode?: string | null
          batch_number: string
          brand: string
          buying_price?: number
          category?: string
          created_at?: string
          dosage?: string | null
          expiry_date: string
          form?: string
          id?: string
          margin_percentage?: number | null
          min_stock_level?: number
          name: string
          selling_price?: number
          stock_quantity?: number
          supplier?: string | null
        }
        Update: {
          barcode?: string | null
          batch_number?: string
          brand?: string
          buying_price?: number
          category?: string
          created_at?: string
          dosage?: string | null
          expiry_date?: string
          form?: string
          id?: string
          margin_percentage?: number | null
          min_stock_level?: number
          name?: string
          selling_price?: number
          stock_quantity?: number
          supplier?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          join_date: string
          last_login: string | null
          permissions: string[] | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["user_status"]
          total_sales: number | null
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          join_date?: string
          last_login?: string | null
          permissions?: string[] | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          total_sales?: number | null
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          join_date?: string
          last_login?: string | null
          permissions?: string[] | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          total_sales?: number | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      purchase_items: {
        Row: {
          created_at: string
          id: string
          medicine_id: string | null
          medicine_name: string
          purchase_order_id: string
          quantity: number
          received_quantity: number | null
          total_cost: number
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          medicine_id?: string | null
          medicine_name: string
          purchase_order_id: string
          quantity: number
          received_quantity?: number | null
          total_cost: number
          unit_cost: number
        }
        Update: {
          created_at?: string
          id?: string
          medicine_id?: string | null
          medicine_name?: string
          purchase_order_id?: string
          quantity?: number
          received_quantity?: number | null
          total_cost?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          expected_date: string | null
          id: string
          notes: string | null
          order_date: string
          order_number: string
          ordered_by: string
          received_date: string | null
          status: Database["public"]["Enums"]["purchase_status"]
          supplier_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number: string
          ordered_by: string
          received_date?: string | null
          status?: Database["public"]["Enums"]["purchase_status"]
          supplier_id: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number?: string
          ordered_by?: string
          received_date?: string | null
          status?: Database["public"]["Enums"]["purchase_status"]
          supplier_id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_ordered_by_fkey"
            columns: ["ordered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string | null
          date: string
          id: string
          items_count: number
          payment_method: string | null
          sale_id: string | null
          total: number
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          items_count: number
          payment_method?: string | null
          sale_id?: string | null
          total: number
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          items_count?: number
          payment_method?: string | null
          sale_id?: string | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "reports_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          created_at: string
          discount: number | null
          id: string
          medicine_id: string
          quantity: number
          sale_id: string
          total_price: number
          unit_price: number
          verified_via_barcode: boolean | null
        }
        Insert: {
          created_at?: string
          discount?: number | null
          id?: string
          medicine_id: string
          quantity: number
          sale_id: string
          total_price: number
          unit_price: number
          verified_via_barcode?: boolean | null
        }
        Update: {
          created_at?: string
          discount?: number | null
          id?: string
          medicine_id?: string
          quantity?: number
          sale_id?: string
          total_price?: number
          unit_price?: number
          verified_via_barcode?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          cashier_id: string
          condition_noted: string | null
          created_at: string
          customer_id: string | null
          discount_amount: number | null
          id: string
          notes: string | null
          payment_method: string
          receipt_number: string
          sale_date: string
          status: Database["public"]["Enums"]["sale_status"]
          tax_amount: number | null
          total_amount: number
        }
        Insert: {
          cashier_id: string
          condition_noted?: string | null
          created_at?: string
          customer_id?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          payment_method?: string
          receipt_number: string
          sale_date?: string
          status?: Database["public"]["Enums"]["sale_status"]
          tax_amount?: number | null
          total_amount: number
        }
        Update: {
          cashier_id?: string
          condition_noted?: string | null
          created_at?: string
          customer_id?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          payment_method?: string
          receipt_number?: string
          sale_date?: string
          status?: Database["public"]["Enums"]["sale_status"]
          tax_amount?: number | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_cashier_id_fkey"
            columns: ["cashier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_logs: {
        Row: {
          barcode: string
          context: string
          created_at: string
          id: string
          medicine_id: string | null
          medicine_name: string
          quantity: number
          scanned_at: string
          scanned_by: string | null
        }
        Insert: {
          barcode: string
          context: string
          created_at?: string
          id?: string
          medicine_id?: string | null
          medicine_name: string
          quantity?: number
          scanned_at?: string
          scanned_by?: string | null
        }
        Update: {
          barcode?: string
          context?: string
          created_at?: string
          id?: string
          medicine_id?: string | null
          medicine_name?: string
          quantity?: number
          scanned_at?: string
          scanned_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scan_logs_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      scanned_barcodes: {
        Row: {
          barcode: string
          id: string
          scanned_at: string | null
          session_id: string
        }
        Insert: {
          barcode: string
          id?: string
          scanned_at?: string | null
          session_id: string
        }
        Update: {
          barcode?: string
          id?: string
          scanned_at?: string | null
          session_id?: string
        }
        Relationships: []
      }
      scanned_items: {
        Row: {
          barcode: string
          created_at: string | null
          id: string
          medicine_id: string | null
          session_id: string | null
          status: string | null
        }
        Insert: {
          barcode: string
          created_at?: string | null
          id?: string
          medicine_id?: string | null
          session_id?: string | null
          status?: string | null
        }
        Update: {
          barcode?: string
          created_at?: string | null
          id?: string
          medicine_id?: string | null
          session_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scanned_items_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scanned_items_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "scanner_sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
      scanner_sessions: {
        Row: {
          cashier_id: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          session_id: string
          status: string | null
        }
        Insert: {
          cashier_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          session_id: string
          status?: string | null
        }
        Update: {
          cashier_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          session_id?: string
          status?: string | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_activities: {
        Row: {
          action: string
          created_at: string
          details: string | null
          id: string
          ip_address: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          id?: string
          ip_address?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: { Args: never; Returns: string }
    }
    Enums: {
      medicine_category:
        | "prescription"
        | "over_counter"
        | "supplement"
        | "medical_device"
      purchase_status: "pending" | "received" | "cancelled"
      sale_status: "completed" | "pending" | "cancelled" | "returned"
      user_role: "admin" | "manager" | "pharmacist" | "cashier"
      user_status: "active" | "inactive" | "suspended"
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
      medicine_category: [
        "prescription",
        "over_counter",
        "supplement",
        "medical_device",
      ],
      purchase_status: ["pending", "received", "cancelled"],
      sale_status: ["completed", "pending", "cancelled", "returned"],
      user_role: ["admin", "manager", "pharmacist", "cashier"],
      user_status: ["active", "inactive", "suspended"],
    },
  },
} as const
