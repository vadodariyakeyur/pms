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
      bus_driver_assignments: {
        Row: {
          assignment_date: string
          bus_id: number
          driver_id: number
          id: number
        }
        Insert: {
          assignment_date?: string
          bus_id: number
          driver_id: number
          id?: number
        }
        Update: {
          assignment_date?: string
          bus_id?: number
          driver_id?: number
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "bus_driver_assignments_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bus_driver_assignments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      buses: {
        Row: {
          id: number
          registration_no: string
        }
        Insert: {
          id?: number
          registration_no: string
        }
        Update: {
          id?: number
          registration_no?: string
        }
        Relationships: []
      }
      cities: {
        Row: {
          id: number
          is_default_from: boolean | null
          is_default_to: boolean | null
          name: string
        }
        Insert: {
          id?: number
          is_default_from?: boolean | null
          is_default_to?: boolean | null
          name: string
        }
        Update: {
          id?: number
          is_default_from?: boolean | null
          is_default_to?: boolean | null
          name?: string
        }
        Relationships: []
      }
      drivers: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      offices: {
        Row: {
          created_at: string
          id: number
          name: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      parcels: {
        Row: {
          amount: number
          amount_given: number
          amount_remaining: number
          bill_no: number
          bus_id: number
          created_at: string | null
          description: string | null
          driver_id: number
          from_city_id: number
          id: number
          office_id: number
          parcel_date: string
          qty: number
          receiver_mobile_no: string
          receiver_name: string
          remark: string | null
          sender_mobile_no: string
          sender_name: string
          to_city_id: number
        }
        Insert: {
          amount: number
          amount_given: number
          amount_remaining: number
          bill_no: number
          bus_id: number
          created_at?: string | null
          description?: string | null
          driver_id: number
          from_city_id: number
          id?: number
          office_id: number
          parcel_date?: string
          qty: number
          receiver_mobile_no: string
          receiver_name: string
          remark?: string | null
          sender_mobile_no: string
          sender_name: string
          to_city_id: number
        }
        Update: {
          amount?: number
          amount_given?: number
          amount_remaining?: number
          bill_no?: number
          bus_id?: number
          created_at?: string | null
          description?: string | null
          driver_id?: number
          from_city_id?: number | null
          id?: number
          office_id?: number
          parcel_date?: string
          qty?: number | null
          receiver_mobile_no?: string
          receiver_name?: string
          remark?: string | null
          sender_mobile_no?: string
          sender_name?: string
          to_city_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "parcels_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parcels_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parcels_from_city_id_fkey"
            columns: ["from_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parcels_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parcels_to_city_id_fkey"
            columns: ["to_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_latest_customer_contacts: {
        Args: Record<PropertyKey, never>
        Returns: {
          customer_name: string
          mobile_no: string
        }[]
      }
      get_next_bill_no: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_parcel_details_by_bill_no: {
        Args: { bill_number: number }
        Returns: {
          amount: number
          amount_given: number
          bill_no: number
          bus_registration: string
          created_at: string
          description: string
          from_city_name: string
          parcel_date: string
          qty: number
          receiver_mobile_no: string
          receiver_name: string
          remark: string
          sender_mobile_no: string
          sender_name: string
          to_city_name: string
        }[]
      }
      get_parcels_aggregated_by_date: {
        Args: {
          p_bus_id: number
          p_end_date: string
          p_from_city_id: number
          p_start_date: string
          p_to_city_id: number
        }
        Returns: {
          parcel_date: string
          record_count: number
          total_amount_given: number
          total_amount_remaining: number
          total_qty: number
        }[]
      }
      get_unique_descriptions_and_remarks: {
        Args: Record<PropertyKey, never>
        Returns: {
          descriptions: string[],
          remarks: string[]
        }
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
