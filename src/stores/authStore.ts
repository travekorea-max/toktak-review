import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Database } from '@/types/database'

type User = Database['public']['Tables']['users']['Row']
type ReviewerProfile = Database['public']['Tables']['reviewer_profiles']['Row']
type ClientProfile = Database['public']['Tables']['client_profiles']['Row']

interface AuthState {
  user: User | null
  reviewerProfile: ReviewerProfile | null
  clientProfile: ClientProfile | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setReviewerProfile: (profile: ReviewerProfile | null) => void
  setClientProfile: (profile: ClientProfile | null) => void
  setIsLoading: (isLoading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      reviewerProfile: null,
      clientProfile: null,
      isLoading: true,
      setUser: (user) => set({ user }),
      setReviewerProfile: (reviewerProfile) => set({ reviewerProfile }),
      setClientProfile: (clientProfile) => set({ clientProfile }),
      setIsLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ user: null, reviewerProfile: null, clientProfile: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        reviewerProfile: state.reviewerProfile,
        clientProfile: state.clientProfile,
      }),
    }
  )
)
