export * from './database'

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Pagination
export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Auth types
export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterReviewerData {
  email: string
  password: string
  name: string
  phone: string
  address_zipcode?: string
  address_main?: string
  address_detail?: string
  naver_id: string
  coupang_id: string
  instagram_url?: string
  blog_url?: string
}

export interface RegisterClientData {
  email: string
  password: string
  company_name: string
  business_number: string
  business_type?: string
  business_category?: string
  representative_name: string
  phone: string
  address_zipcode?: string
  address_main?: string
  address_detail?: string
  shop_url: string
  shop_platform: 'smartstore' | 'coupang' | 'own' | 'etc'
  tax_email?: string
}

// Campaign types
export interface CampaignWithImages {
  id: string
  client_id: string
  title: string
  product_name: string
  product_description: string | null
  product_price: number
  product_url_naver: string | null
  product_url_coupang: string | null
  platform: 'naver' | 'coupang' | 'both'
  recruit_count_naver: number
  recruit_count_coupang: number
  review_fee_naver: number
  review_fee_coupang: number
  recruit_start_date: string
  recruit_end_date: string
  announce_date: string
  review_deadline: string
  selection_type: 'manual' | 'auto_fcfs' | 'auto_random'
  conditions: Record<string, unknown> | null
  review_guide: Record<string, unknown> | null
  min_text_length: number
  min_photo_count: number
  required_keywords: string[] | null
  status: string
  approved_at: string | null
  approved_by: string | null
  created_at: string
  updated_at: string
  images: {
    id: string
    image_url: string
    sort_order: number
  }[]
  application_count?: number
  client?: {
    company_name: string
  }
}

export interface CampaignFormData {
  title: string
  product_name: string
  product_description?: string
  product_price: number
  product_url_naver?: string
  product_url_coupang?: string
  platform: 'naver' | 'coupang' | 'both'
  recruit_count_naver: number
  recruit_count_coupang: number
  review_fee_naver: number
  review_fee_coupang: number
  recruit_start_date: string
  recruit_end_date: string
  announce_date: string
  review_deadline: string
  selection_type: 'manual' | 'auto_fcfs' | 'auto_random'
  conditions?: Record<string, unknown>
  review_guide?: Record<string, unknown>
  min_text_length: number
  min_photo_count: number
  required_keywords?: string[]
  images?: File[]
}

// Application types
export interface ApplicationWithDetails {
  id: string
  campaign_id: string
  reviewer_id: string
  platform: 'naver' | 'coupang' | 'both'
  message: string | null
  status: string
  selected_at: string | null
  created_at: string
  reviewer: {
    id: string
    name: string
    rating: number
    review_count: number
    address_main: string | null
  }
  campaign?: {
    title: string
    product_name: string
  }
  purchase_verification?: {
    id: string
    status: string
  }
  review_submission?: {
    id: string
    status: string
  }
}

// Point types
export interface PointSummary {
  total_earned: number
  total_withdrawn: number
  current_balance: number
  pending_withdrawal: number
}

// Statistics types
export interface DashboardStats {
  total_campaigns: number
  active_campaigns: number
  pending_reviews: number
  completed_reviews: number
  total_points_distributed: number
}

export interface AdminDashboardStats {
  total_users: number
  total_reviewers: number
  total_clients: number
  pending_clients: number
  total_campaigns: number
  active_campaigns: number
  pending_campaigns: number
  pending_reviews: number
  pending_withdrawals: number
  total_points_distributed: number
}
