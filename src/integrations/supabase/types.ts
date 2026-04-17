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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      assets: {
        Row: {
          assigned_to: string | null
          created_at: string
          daily_spend_limit: number | null
          id: string
          name: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          daily_spend_limit?: number | null
          id?: string
          name: string
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          daily_spend_limit?: number | null
          id?: string
          name?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_title: string | null
          target_type: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_title?: string | null
          target_type: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_title?: string | null
          target_type?: string
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author: string
          category: string
          content: string | null
          created_at: string
          excerpt: string | null
          featured_image: string | null
          focus_keyword: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          read_time: string | null
          slug: string
          status: string
          title: string
          user_id: string | null
        }
        Insert: {
          author?: string
          category?: string
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          focus_keyword?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          read_time?: string | null
          slug: string
          status?: string
          title: string
          user_id?: string | null
        }
        Update: {
          author?: string
          category?: string
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          focus_keyword?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          read_time?: string | null
          slug?: string
          status?: string
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role?: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          admin_typing: boolean
          created_at: string
          id: string
          status: string
          updated_at: string
          visitor_email: string | null
          visitor_name: string
          visitor_phone: string | null
        }
        Insert: {
          admin_typing?: boolean
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          visitor_email?: string | null
          visitor_name: string
          visitor_phone?: string | null
        }
        Update: {
          admin_typing?: boolean
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          visitor_email?: string | null
          visitor_name?: string
          visitor_phone?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          author_email: string
          author_name: string
          content: string
          created_at: string
          id: string
          parent_id: string | null
          post_id: string
          status: string
        }
        Insert: {
          author_email: string
          author_name: string
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id: string
          status?: string
        }
        Update: {
          author_email?: string
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          subject?: string
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          created_at: string
          faq_group: string
          id: string
          question: string
          sort_order: number | null
        }
        Insert: {
          answer: string
          created_at?: string
          faq_group?: string
          id?: string
          question: string
          sort_order?: number | null
        }
        Update: {
          answer?: string
          created_at?: string
          faq_group?: string
          id?: string
          question?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      media_files: {
        Row: {
          alt_text: string | null
          caption: string | null
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number
          height: number | null
          id: string
          mime_type: string
          url: string
          url_slug: string | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number
          height?: number | null
          id?: string
          mime_type?: string
          url: string
          url_slug?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          height?: number | null
          id?: string
          mime_type?: string
          url?: string
          url_slug?: string | null
          width?: number | null
        }
        Relationships: []
      }
      menus: {
        Row: {
          created_at: string
          icon: string | null
          icon_name: string | null
          id: string
          label: string
          position: string
          sort_order: number
          url: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          icon_name?: string | null
          id?: string
          label: string
          position?: string
          sort_order?: number
          url: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          icon_name?: string | null
          id?: string
          label?: string
          position?: string
          sort_order?: number
          url?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          status?: string
        }
        Relationships: []
      }
      newsletters: {
        Row: {
          content: string
          id: string
          recipient_count: number
          sent_at: string
          sent_by: string | null
          subject: string
          target_audience: string
        }
        Insert: {
          content: string
          id?: string
          recipient_count?: number
          sent_at?: string
          sent_by?: string | null
          subject: string
          target_audience?: string
        }
        Update: {
          content?: string
          id?: string
          recipient_count?: number
          sent_at?: string
          sent_by?: string | null
          subject?: string
          target_audience?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          product_title: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          product_title: string
          quantity?: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          product_title?: string
          quantity?: number
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
      orders: {
        Row: {
          admin_notes: string | null
          created_at: string
          cryptomus_invoice_id: string | null
          currency: string
          customer_email: string
          customer_name: string
          id: string
          paid_at: string | null
          payment_method: string
          proof_image_url: string | null
          proof_uploaded_at: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          cryptomus_invoice_id?: string | null
          currency?: string
          customer_email: string
          customer_name: string
          id?: string
          paid_at?: string | null
          payment_method: string
          proof_image_url?: string | null
          proof_uploaded_at?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          cryptomus_invoice_id?: string | null
          currency?: string
          customer_email?: string
          customer_name?: string
          id?: string
          paid_at?: string | null
          payment_method?: string
          proof_image_url?: string | null
          proof_uploaded_at?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      pages: {
        Row: {
          components: Json | null
          content: string | null
          created_at: string
          focus_keyword: string | null
          hero_image: string | null
          hero_overlay: number | null
          id: string
          meta_description: string | null
          meta_title: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          components?: Json | null
          content?: string | null
          created_at?: string
          focus_keyword?: string | null
          hero_image?: string | null
          hero_overlay?: number | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          components?: Json | null
          content?: string | null
          created_at?: string
          focus_keyword?: string | null
          hero_image?: string | null
          hero_overlay?: number | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          config: Json | null
          created_at: string
          custom_note: string | null
          description: string | null
          icon: string | null
          id: string
          instructions: string | null
          is_active: boolean
          name: string
          slug: string
          sort_order: number | null
          type: string
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          custom_note?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number | null
          type?: string
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          custom_note?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_reviews: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          rating: number
          review_text: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          rating?: number
          review_text: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          rating?: number
          review_text?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          attributes: Json | null
          badge: string | null
          category: string
          created_at: string
          description: string | null
          focus_keyword: string | null
          gallery_images: string[] | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          meta_description: string | null
          meta_title: string | null
          price: number
          rating: number | null
          sale_price: number | null
          short_description: string | null
          sku: string | null
          slug: string
          sort_order: number | null
          stock_quantity: number
          stock_status: string
          title: string
        }
        Insert: {
          attributes?: Json | null
          badge?: string | null
          category?: string
          created_at?: string
          description?: string | null
          focus_keyword?: string | null
          gallery_images?: string[] | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          price: number
          rating?: number | null
          sale_price?: number | null
          short_description?: string | null
          sku?: string | null
          slug: string
          sort_order?: number | null
          stock_quantity?: number
          stock_status?: string
          title: string
        }
        Update: {
          attributes?: Json | null
          badge?: string | null
          category?: string
          created_at?: string
          description?: string | null
          focus_keyword?: string | null
          gallery_images?: string[] | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          price?: number
          rating?: number | null
          sale_price?: number | null
          short_description?: string | null
          sku?: string | null
          slug?: string
          sort_order?: number | null
          stock_quantity?: number
          stock_status?: string
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          last_login: string | null
          provider: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          is_active?: boolean
          last_login?: string | null
          provider?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          last_login?: string | null
          provider?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_notices: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          message: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          message: string
          type?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          message?: string
          type?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assignee: string | null
          created_at: string
          description: string | null
          id: string
          priority: string
          source: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          source?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          source?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          avatar_url: string | null
          client_name: string
          created_at: string
          id: string
          job_title: string | null
          rating: number
          review_id: string | null
          sort_order: number | null
          status: string
          testimonial_text: string
        }
        Insert: {
          avatar_url?: string | null
          client_name: string
          created_at?: string
          id?: string
          job_title?: string | null
          rating?: number
          review_id?: string | null
          sort_order?: number | null
          status?: string
          testimonial_text: string
        }
        Update: {
          avatar_url?: string | null
          client_name?: string
          created_at?: string
          id?: string
          job_title?: string | null
          rating?: number
          review_id?: string | null
          sort_order?: number | null
          status?: string
          testimonial_text?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      work_logs: {
        Row: {
          created_at: string
          hours: number
          id: string
          log_date: string
          member: string
          notes: string | null
        }
        Insert: {
          created_at?: string
          hours?: number
          id?: string
          log_date?: string
          member: string
          notes?: string | null
        }
        Update: {
          created_at?: string
          hours?: number
          id?: string
          log_date?: string
          member?: string
          notes?: string | null
        }
        Relationships: []
      }
      work_samples: {
        Row: {
          category: string
          client_name: string | null
          created_at: string
          id: string
          image_url: string | null
          is_featured: boolean
          link: string | null
          sort_order: number | null
          title: string
        }
        Insert: {
          category?: string
          client_name?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_featured?: boolean
          link?: string | null
          sort_order?: number | null
          title: string
        }
        Update: {
          category?: string
          client_name?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_featured?: boolean
          link?: string | null
          sort_order?: number | null
          title?: string
        }
        Relationships: []
      }
    }
    Views: {
      comments_public: {
        Row: {
          author_name: string | null
          content: string | null
          created_at: string | null
          id: string | null
          parent_id: string | null
          post_id: string | null
          status: string | null
        }
        Insert: {
          author_name?: string | null
          content?: string | null
          created_at?: string | null
          id?: string | null
          parent_id?: string | null
          post_id?: string | null
          status?: string | null
        }
        Update: {
          author_name?: string | null
          content?: string | null
          created_at?: string | null
          id?: string | null
          parent_id?: string | null
          post_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_setting: { Args: { setting_key: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "editor" | "author"
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
      app_role: ["admin", "editor", "author"],
    },
  },
} as const
