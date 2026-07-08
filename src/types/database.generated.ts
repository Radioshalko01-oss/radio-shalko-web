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
      banners: {
        Row: {
          active: boolean
          created_at: string
          cta_href: string | null
          cta_label: string | null
          id: string
          image_url: string | null
          sort_order: number
          subtitle: string | null
          title: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          cta_href?: string | null
          cta_label?: string | null
          id?: string
          image_url?: string | null
          sort_order?: number
          subtitle?: string | null
          title: string
        }
        Update: {
          active?: boolean
          created_at?: string
          cta_href?: string | null
          cta_label?: string | null
          id?: string
          image_url?: string | null
          sort_order?: number
          subtitle?: string | null
          title?: string
        }
        Relationships: []
      }
      branches: {
        Row: {
          address: string | null
          created_at: string
          display_name: string
          id: string
          is_active: boolean
          name: string
          phone_display: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          address?: string | null
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean
          name: string
          phone_display?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          address?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean
          name?: string
          phone_display?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      brands: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      customer_addresses: {
        Row: {
          city: string
          country: string
          created_at: string
          exterior_number: string
          full_name: string
          id: string
          interior_number: string | null
          neighborhood: string
          order_id: string
          phone: string
          postal_code: string
          references_note: string | null
          state: string
          street: string
          type: string
        }
        Insert: {
          city: string
          country?: string
          created_at?: string
          exterior_number: string
          full_name: string
          id?: string
          interior_number?: string | null
          neighborhood: string
          order_id: string
          phone: string
          postal_code: string
          references_note?: string | null
          state: string
          street: string
          type: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          exterior_number?: string
          full_name?: string
          id?: string
          interior_number?: string | null
          neighborhood?: string
          order_id?: string
          phone?: string
          postal_code?: string
          references_note?: string | null
          state?: string
          street?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_notifications: {
        Row: {
          created_at: string
          href: string | null
          id: string
          message: string
          metadata: Json
          order_id: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          href?: string | null
          id?: string
          message: string
          metadata?: Json
          order_id?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          href?: string | null
          id?: string
          message?: string
          metadata?: Json
          order_id?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          brand_name: string | null
          created_at: string
          id: string
          order_id: string
          product_id: string
          product_sku: string | null
          product_title: string
          quantity: number
          subtotal: number
          unit_price: number
        }
        Insert: {
          brand_name?: string | null
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          product_sku?: string | null
          product_title: string
          quantity: number
          subtotal: number
          unit_price: number
        }
        Update: {
          brand_name?: string | null
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          product_sku?: string | null
          product_title?: string
          quantity?: number
          subtotal?: number
          unit_price?: number
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
      order_status_history: {
        Row: {
          actor_id: string | null
          created_at: string
          from_status: string | null
          id: string
          note: string | null
          order_id: string
          to_status: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          order_id: string
          to_status: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          order_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          admin_internal_note: string | null
          availability_decision: string | null
          branch_id: string | null
          created_at: string
          currency: string
          customer_email: string
          customer_message: string | null
          customer_name: string
          customer_phone: string
          delivery_method: string
          delivered_at: string | null
          fulfillment_status: string
          fulfillment_updated_by: string | null
          id: string
          notes: string | null
          order_number: string
          payment_method: string
          payment_provider: string | null
          payment_requested_at: string | null
          payment_requested_by: string | null
          payment_status: string
          pickup_available_date: string | null
          pickup_ready_estimate: string | null
          pickup_ready_message: string | null
          prepared_at: string | null
          ready_for_pickup_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          shipping_cost: number
          status: string
          stripe_checkout_session_id: string | null
          stripe_paid_at: string | null
          stripe_payment_created_at: string | null
          stripe_payment_intent_id: string | null
          stripe_payment_url: string | null
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_internal_note?: string | null
          availability_decision?: string | null
          branch_id?: string | null
          created_at?: string
          currency?: string
          customer_email: string
          customer_message?: string | null
          customer_name: string
          customer_phone: string
          delivery_method: string
          delivered_at?: string | null
          fulfillment_status?: string
          fulfillment_updated_by?: string | null
          id?: string
          notes?: string | null
          order_number: string
          payment_method?: string
          payment_provider?: string | null
          payment_requested_at?: string | null
          payment_requested_by?: string | null
          payment_status?: string
          pickup_available_date?: string | null
          pickup_ready_estimate?: string | null
          pickup_ready_message?: string | null
          prepared_at?: string | null
          ready_for_pickup_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shipping_cost?: number
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_paid_at?: string | null
          stripe_payment_created_at?: string | null
          stripe_payment_intent_id?: string | null
          stripe_payment_url?: string | null
          subtotal: number
          total: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_internal_note?: string | null
          availability_decision?: string | null
          branch_id?: string | null
          created_at?: string
          currency?: string
          customer_email?: string
          customer_message?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_method?: string
          delivered_at?: string | null
          fulfillment_status?: string
          fulfillment_updated_by?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: string
          payment_provider?: string | null
          payment_requested_at?: string | null
          payment_requested_by?: string | null
          payment_status?: string
          pickup_available_date?: string | null
          pickup_ready_estimate?: string | null
          pickup_ready_message?: string | null
          prepared_at?: string | null
          ready_for_pickup_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shipping_cost?: number
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_paid_at?: string | null
          stripe_payment_created_at?: string | null
          stripe_payment_intent_id?: string | null
          stripe_payment_url?: string | null
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          note: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          note?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          note?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quote_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          quote_id: string
          unit_price: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          quote_id: string
          unit_price?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          quote_id?: string
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity: string | null
          entity_id: string | null
          id: string
          ip: string | null
          metadata: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          ip?: string | null
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          ip?: string | null
          metadata?: Json | null
        }
        Relationships: []
      }
      shared_carts: {
        Row: {
          branch_name: string | null
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          sale_label: string | null
          token: string
        }
        Insert: {
          branch_name?: string | null
          created_at?: string
          created_by?: string | null
          expires_at: string
          id?: string
          sale_label?: string | null
          token: string
        }
        Update: {
          branch_name?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          sale_label?: string | null
          token?: string
        }
        Relationships: []
      }
      shared_cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          shared_cart_id: string
          sort_order: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity: number
          shared_cart_id: string
          sort_order?: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          shared_cart_id?: string
          sort_order?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "shared_cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_cart_items_shared_cart_id_fkey"
            columns: ["shared_cart_id"]
            isOneToOne: false
            referencedRelation: "shared_carts"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          product_id: string
          sort_order: number
          url: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          product_id: string
          sort_order?: number
          url: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          product_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_inventory: {
        Row: {
          branch_id: string
          product_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          branch_id: string
          product_id: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          branch_id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_inventory_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_specs: {
        Row: {
          created_at: string
          id: string
          label: string
          product_id: string
          sort_order: number
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          product_id: string
          sort_order?: number
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          product_id?: string
          sort_order?: number
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_specs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand_id: string | null
          category_id: string | null
          created_at: string
          description: string | null
          features: string | null
          id: string
          includes: string | null
          is_new: boolean
          is_published: boolean
          price: number
          sku: string | null
          slug: string
          specifications: string | null
          subcategory_id: string | null
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          features?: string | null
          id?: string
          includes?: string | null
          is_new?: boolean
          is_published?: boolean
          price?: number
          sku?: string | null
          slug: string
          specifications?: string | null
          subcategory_id?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          features?: string | null
          id?: string
          includes?: string | null
          is_new?: boolean
          is_published?: boolean
          price?: number
          sku?: string | null
          slug?: string
          specifications?: string | null
          subcategory_id?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      related_products: {
        Row: {
          product_id: string
          related_product_id: string
        }
        Insert: {
          product_id: string
          related_product_id: string
        }
        Update: {
          product_id?: string
          related_product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "related_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "related_products_related_product_id_fkey"
            columns: ["related_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          id: string
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      subcategories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_order_from_checkout: {
        Args: { p_payload: Json }
        Returns: Json
      }
      is_admin: { Args: never; Returns: boolean }
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
