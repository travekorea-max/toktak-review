export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'client' | 'reviewer'
export type UserStatus = 'active' | 'suspended' | 'withdrawn'
export type Platform = 'naver' | 'coupang' | 'both'
export type ShopPlatform = 'smartstore' | 'coupang' | 'own' | 'etc'
export type ClientGrade = 'new' | 'regular' | 'premium'
export type SelectionType = 'manual' | 'auto_fcfs' | 'auto_random'
export type CampaignStatus = 'draft' | 'pending' | 'recruiting' | 'closed' | 'in_progress' | 'reviewing' | 'completed' | 'cancelled'
export type ApplicationStatus = 'applied' | 'selected' | 'settled' | 'rejected' | 'cancelled'
export type VerificationStatus = 'pending' | 'approved' | 'rejected'
export type ReviewStatus = 'pending' | 'ai_passed' | 'needs_review' | 'approved' | 'revision_requested' | 'rejected'
export type PointTransactionType = 'earn' | 'withdraw' | 'cancel'
export type ReferenceType = 'review' | 'withdrawal' | 'adjustment'
export type WithdrawalStatus = 'pending' | 'approved' | 'completed' | 'rejected'
export type DepositType = 'deposit' | 'refund' | 'payment'
export type PaymentStatus = 'pending' | 'paid' | 'cancelled' | 'refunded'
export type PaymentMethod = 'card' | 'bank_transfer' | 'virtual_account'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: UserRole
          status: UserStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          role: UserRole
          status?: UserStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: UserRole
          status?: UserStatus
          created_at?: string
          updated_at?: string
        }
      }
      reviewer_profiles: {
        Row: {
          id: string
          user_id: string
          name: string
          phone: string
          phone_verified: boolean
          address_zipcode: string | null
          address_main: string | null
          address_detail: string | null
          bank_name: string | null
          bank_account: string | null
          bank_holder: string | null
          naver_id: string | null
          coupang_id: string | null
          instagram_url: string | null
          blog_url: string | null
          rating: number
          review_count: number
          point_balance: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          phone: string
          phone_verified?: boolean
          address_zipcode?: string | null
          address_main?: string | null
          address_detail?: string | null
          bank_name?: string | null
          bank_account?: string | null
          bank_holder?: string | null
          naver_id?: string | null
          coupang_id?: string | null
          instagram_url?: string | null
          blog_url?: string | null
          rating?: number
          review_count?: number
          point_balance?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          phone?: string
          phone_verified?: boolean
          address_zipcode?: string | null
          address_main?: string | null
          address_detail?: string | null
          bank_name?: string | null
          bank_account?: string | null
          bank_holder?: string | null
          naver_id?: string | null
          coupang_id?: string | null
          instagram_url?: string | null
          blog_url?: string | null
          rating?: number
          review_count?: number
          point_balance?: number
          created_at?: string
        }
      }
      client_profiles: {
        Row: {
          id: string
          user_id: string
          company_name: string
          business_number: string
          business_type: string | null
          business_category: string | null
          representative_name: string
          phone: string
          address_zipcode: string | null
          address_main: string | null
          address_detail: string | null
          shop_url: string
          shop_platform: ShopPlatform
          bank_name: string | null
          bank_account: string | null
          bank_holder: string | null
          tax_email: string | null
          grade: ClientGrade
          approved_at: string | null
          approved_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_name: string
          business_number: string
          business_type?: string | null
          business_category?: string | null
          representative_name: string
          phone: string
          address_zipcode?: string | null
          address_main?: string | null
          address_detail?: string | null
          shop_url: string
          shop_platform: ShopPlatform
          bank_name?: string | null
          bank_account?: string | null
          bank_holder?: string | null
          tax_email?: string | null
          grade?: ClientGrade
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_name?: string
          business_number?: string
          business_type?: string | null
          business_category?: string | null
          representative_name?: string
          phone?: string
          address_zipcode?: string | null
          address_main?: string | null
          address_detail?: string | null
          shop_url?: string
          shop_platform?: ShopPlatform
          bank_name?: string | null
          bank_account?: string | null
          bank_holder?: string | null
          tax_email?: string | null
          grade?: ClientGrade
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
        }
      }
      campaigns: {
        Row: {
          id: string
          client_id: string
          title: string
          product_name: string
          product_description: string | null
          product_price: number
          product_images?: string[] | null
          product_url_naver: string | null
          product_url_coupang: string | null
          platform: Platform
          recruit_count_naver: number
          recruit_count_coupang: number
          review_fee_naver: number
          review_fee_coupang: number
          product_payback_naver: number
          product_payback_coupang: number
          additional_point_naver: number
          additional_point_coupang: number
          is_empty_box: boolean
          recruit_start_date: string
          recruit_end_date: string
          announce_date: string
          review_deadline: string
          selection_type: SelectionType
          conditions: Json | null
          review_guide: Json | null
          min_text_length: number
          min_photo_count: number
          required_keywords: string[] | null
          status: CampaignStatus
          approved_at: string | null
          approved_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          title: string
          product_name: string
          product_description?: string | null
          product_price: number
          product_images?: string[] | null
          product_url_naver?: string | null
          product_url_coupang?: string | null
          platform: Platform
          recruit_count_naver?: number
          recruit_count_coupang?: number
          review_fee_naver?: number
          review_fee_coupang?: number
          product_payback_naver?: number
          product_payback_coupang?: number
          additional_point_naver?: number
          additional_point_coupang?: number
          is_empty_box?: boolean
          recruit_start_date: string
          recruit_end_date: string
          announce_date: string
          review_deadline: string
          selection_type?: SelectionType
          conditions?: Json | null
          review_guide?: Json | null
          min_text_length?: number
          min_photo_count?: number
          required_keywords?: string[] | null
          status?: CampaignStatus
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          title?: string
          product_name?: string
          product_description?: string | null
          product_price?: number
          product_images?: string[] | null
          product_url_naver?: string | null
          product_url_coupang?: string | null
          platform?: Platform
          recruit_count_naver?: number
          recruit_count_coupang?: number
          review_fee_naver?: number
          review_fee_coupang?: number
          product_payback_naver?: number
          product_payback_coupang?: number
          additional_point_naver?: number
          additional_point_coupang?: number
          is_empty_box?: boolean
          recruit_start_date?: string
          recruit_end_date?: string
          announce_date?: string
          review_deadline?: string
          selection_type?: SelectionType
          conditions?: Json | null
          review_guide?: Json | null
          min_text_length?: number
          min_photo_count?: number
          required_keywords?: string[] | null
          status?: CampaignStatus
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      campaign_images: {
        Row: {
          id: string
          campaign_id: string
          image_url: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          image_url: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          image_url?: string
          sort_order?: number
          created_at?: string
        }
      }
      applications: {
        Row: {
          id: string
          campaign_id: string
          reviewer_id: string
          platform: Platform
          message: string | null
          status: ApplicationStatus
          selected_at: string | null
          settled_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          reviewer_id: string
          platform: Platform
          message?: string | null
          status?: ApplicationStatus
          selected_at?: string | null
          settled_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          reviewer_id?: string
          platform?: Platform
          message?: string | null
          status?: ApplicationStatus
          selected_at?: string | null
          settled_at?: string | null
          created_at?: string
        }
      }
      purchase_verifications: {
        Row: {
          id: string
          application_id: string
          order_number: string
          image_url: string
          wishlist_image_url: string | null
          cart_image_url: string | null
          purchase_image_url: string | null
          platform: Platform
          status: VerificationStatus
          verified_at: string | null
          verified_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          application_id: string
          order_number: string
          image_url: string
          wishlist_image_url?: string | null
          cart_image_url?: string | null
          purchase_image_url?: string | null
          platform: Platform
          status?: VerificationStatus
          verified_at?: string | null
          verified_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          order_number?: string
          image_url?: string
          wishlist_image_url?: string | null
          cart_image_url?: string | null
          purchase_image_url?: string | null
          platform?: Platform
          status?: VerificationStatus
          verified_at?: string | null
          verified_by?: string | null
          created_at?: string
        }
      }
      review_submissions: {
        Row: {
          id: string
          application_id: string
          review_url: string
          image_url: string
          platform: Platform
          ai_check_result: Json | null
          manual_check_result: Json | null
          status: ReviewStatus
          revision_comment: string | null
          checked_at: string | null
          checked_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          application_id: string
          review_url: string
          image_url: string
          platform: Platform
          ai_check_result?: Json | null
          manual_check_result?: Json | null
          status?: ReviewStatus
          revision_comment?: string | null
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          review_url?: string
          image_url?: string
          platform?: Platform
          ai_check_result?: Json | null
          manual_check_result?: Json | null
          status?: ReviewStatus
          revision_comment?: string | null
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string
        }
      }
      point_transactions: {
        Row: {
          id: string
          reviewer_id: string
          type: PointTransactionType
          amount: number
          balance_after: number
          reference_type: ReferenceType
          reference_id: string | null
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          reviewer_id: string
          type: PointTransactionType
          amount: number
          balance_after: number
          reference_type: ReferenceType
          reference_id?: string | null
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          reviewer_id?: string
          type?: PointTransactionType
          amount?: number
          balance_after?: number
          reference_type?: ReferenceType
          reference_id?: string | null
          description?: string
          created_at?: string
        }
      }
      withdrawal_requests: {
        Row: {
          id: string
          reviewer_id: string
          amount: number
          fee: number
          net_amount: number
          bank_name: string
          bank_account: string
          bank_holder: string
          status: WithdrawalStatus
          scheduled_date: string
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          reviewer_id: string
          amount: number
          fee: number
          net_amount: number
          bank_name: string
          bank_account: string
          bank_holder: string
          status?: WithdrawalStatus
          scheduled_date: string
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          reviewer_id?: string
          amount?: number
          fee?: number
          net_amount?: number
          bank_name?: string
          bank_account?: string
          bank_holder?: string
          status?: WithdrawalStatus
          scheduled_date?: string
          completed_at?: string | null
          created_at?: string
        }
      }
      client_deposits: {
        Row: {
          id: string
          client_id: string
          campaign_id: string | null
          type: DepositType
          amount: number
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          campaign_id?: string | null
          type: DepositType
          amount: number
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          campaign_id?: string | null
          type?: DepositType
          amount?: number
          description?: string
          created_at?: string
        }
      }
      campaign_payments: {
        Row: {
          id: string
          campaign_id: string
          client_id: string
          recruit_count: number
          reward_point_total: number
          agency_fee_total: number
          supply_price: number
          vat_amount: number
          total_amount: number
          payment_method: PaymentMethod
          payment_status: PaymentStatus
          tax_invoice_number: string | null
          tax_invoice_issued_at: string | null
          tax_invoice_email: string | null
          pg_provider: string | null
          pg_transaction_id: string | null
          pg_approved_at: string | null
          virtual_bank_name: string | null
          virtual_account_number: string | null
          virtual_account_holder: string | null
          virtual_account_due_date: string | null
          paid_at: string | null
          cancelled_at: string | null
          refunded_at: string | null
          refund_amount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          client_id: string
          recruit_count: number
          reward_point_total: number
          agency_fee_total: number
          supply_price: number
          vat_amount: number
          total_amount: number
          payment_method?: PaymentMethod
          payment_status?: PaymentStatus
          tax_invoice_number?: string | null
          tax_invoice_issued_at?: string | null
          tax_invoice_email?: string | null
          pg_provider?: string | null
          pg_transaction_id?: string | null
          pg_approved_at?: string | null
          virtual_bank_name?: string | null
          virtual_account_number?: string | null
          virtual_account_holder?: string | null
          virtual_account_due_date?: string | null
          paid_at?: string | null
          cancelled_at?: string | null
          refunded_at?: string | null
          refund_amount?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          client_id?: string
          recruit_count?: number
          reward_point_total?: number
          agency_fee_total?: number
          supply_price?: number
          vat_amount?: number
          total_amount?: number
          payment_method?: PaymentMethod
          payment_status?: PaymentStatus
          tax_invoice_number?: string | null
          tax_invoice_issued_at?: string | null
          tax_invoice_email?: string | null
          pg_provider?: string | null
          pg_transaction_id?: string | null
          pg_approved_at?: string | null
          virtual_bank_name?: string | null
          virtual_account_number?: string | null
          virtual_account_holder?: string | null
          virtual_account_due_date?: string | null
          paid_at?: string | null
          cancelled_at?: string | null
          refunded_at?: string | null
          refund_amount?: number
          created_at?: string
          updated_at?: string
        }
      }
      reviewer_tax_info: {
        Row: {
          id: string
          user_id: string
          encrypted_rrn: string
          rrn_hash: string
          legal_name: string
          verified_at: string | null
          verification_method: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          encrypted_rrn: string
          rrn_hash: string
          legal_name: string
          verified_at?: string | null
          verification_method?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          encrypted_rrn?: string
          rrn_hash?: string
          legal_name?: string
          verified_at?: string | null
          verification_method?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          data: Json | null
          is_read: boolean
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          data?: Json | null
          is_read?: boolean
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          data?: Json | null
          is_read?: boolean
          read_at?: string | null
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          sort_order?: number
          created_at?: string
        }
      }
      settings: {
        Row: {
          key: string
          value: Json
          updated_at: string
        }
        Insert: {
          key: string
          value: Json
          updated_at?: string
        }
        Update: {
          key?: string
          value?: Json
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: UserRole
      user_status: UserStatus
      platform: Platform
      shop_platform: ShopPlatform
      client_grade: ClientGrade
      selection_type: SelectionType
      campaign_status: CampaignStatus
      application_status: ApplicationStatus
      verification_status: VerificationStatus
      review_status: ReviewStatus
      point_transaction_type: PointTransactionType
      reference_type: ReferenceType
      withdrawal_status: WithdrawalStatus
      deposit_type: DepositType
      payment_status: PaymentStatus
      payment_method: PaymentMethod
    }
  }
}
