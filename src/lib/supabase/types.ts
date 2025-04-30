export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          operationName?: string;
          query?: string;
          variables?: Json;
          extensions?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      bus_driver_assignments: {
        Row: {
          assignment_date: string;
          bus_id: number | null;
          driver_id: number | null;
          id: number;
        };
        Insert: {
          assignment_date?: string;
          bus_id?: number | null;
          driver_id?: number | null;
          id?: number;
        };
        Update: {
          assignment_date?: string;
          bus_id?: number | null;
          driver_id?: number | null;
          id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "bus_driver_assignments_bus_id_fkey";
            columns: ["bus_id"];
            isOneToOne: false;
            referencedRelation: "buses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bus_driver_assignments_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          }
        ];
      };
      buses: {
        Row: {
          id: number;
          registration_no: string;
        };
        Insert: {
          id?: number;
          registration_no: string;
        };
        Update: {
          id?: number;
          registration_no?: string;
        };
        Relationships: [];
      };
      cities: {
        Row: {
          id: number;
          is_default_from: boolean | null;
          is_default_to: boolean | null;
          name: string;
        };
        Insert: {
          id?: number;
          is_default_from?: boolean | null;
          is_default_to?: boolean | null;
          name: string;
        };
        Update: {
          id?: number;
          is_default_from?: boolean | null;
          is_default_to?: boolean | null;
          name?: string;
        };
        Relationships: [];
      };
      drivers: {
        Row: {
          id: number;
          name: string;
        };
        Insert: {
          id?: number;
          name: string;
        };
        Update: {
          id?: number;
          name?: string;
        };
        Relationships: [];
      };
      parcels: {
        Row: {
          amount: number | null;
          amount_given: number;
          amount_remaining: number;
          bill_no: number;
          bus_id: number | null;
          created_at: string | null;
          description: string | null;
          driver_id: number | null;
          from_city_id: number | null;
          id: number;
          parcel_date: string;
          qty: number | null;
          receiver_mobile_no: string;
          receiver_name: string;
          remark: string | null;
          sender_mobile_no: string;
          sender_name: string;
          to_city_id: number | null;
        };
        Insert: {
          amount?: number | null;
          amount_given: number;
          amount_remaining: number;
          bill_no?: number;
          bus_id?: number | null;
          created_at?: string | null;
          description?: string | null;
          driver_id?: number | null;
          from_city_id?: number | null;
          id?: number;
          parcel_date?: string;
          qty?: number | null;
          receiver_mobile_no: string;
          receiver_name: string;
          remark?: string | null;
          sender_mobile_no: string;
          sender_name: string;
          to_city_id?: number | null;
        };
        Update: {
          amount?: number | null;
          amount_given?: number;
          amount_remaining?: number;
          bill_no?: number;
          bus_id?: number | null;
          created_at?: string | null;
          description?: string | null;
          driver_id?: number | null;
          from_city_id?: number | null;
          id?: number;
          parcel_date?: string;
          qty?: number | null;
          receiver_mobile_no?: string;
          receiver_name?: string;
          remark?: string | null;
          sender_mobile_no?: string;
          sender_name?: string;
          to_city_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "parcels_bus_id_fkey";
            columns: ["bus_id"];
            isOneToOne: false;
            referencedRelation: "buses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "parcels_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "parcels_from_city_id_fkey";
            columns: ["from_city_id"];
            isOneToOne: false;
            referencedRelation: "cities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "parcels_to_city_id_fkey";
            columns: ["to_city_id"];
            isOneToOne: false;
            referencedRelation: "cities";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
