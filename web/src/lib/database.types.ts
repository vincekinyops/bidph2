export type UserRole = 'bidder' | 'seller' | 'admin'
export type KycStatus = 'unverified' | 'pending' | 'approved' | 'rejected'
export type AuctionStatus = 'draft' | 'active' | 'ended' | 'cancelled'

export interface User {
  id: string
  role: UserRole
  kyc_status: KycStatus
  email: string
  full_legal_name: string | null
  current_address: string | null
  date_of_birth: string | null
  gcash_mobile: string | null
  created_at: string
  updated_at: string
}

export interface Wallet {
  id: string
  user_id: string
  idle_balance: number
  bidding_balance: number
  currency: string
  created_at: string
  updated_at: string
}

export interface WalletTransaction {
  id: string
  wallet_id: string
  type: string
  amount: number
  status: string
  reference_id: string | null
  metadata: Record<string, unknown>
  idle_after: number | null
  bidding_after: number | null
  created_at: string
}

export interface Auction {
  id: string
  seller_id: string
  title: string
  description: string | null
  starting_price: number
  current_price: number
  min_increment: number
  status: AuctionStatus
  start_time: string | null
  end_time: string
  winner_id: string | null
  winning_bid_id: string | null
  settled_at: string | null
  created_at: string
  updated_at: string
}

export interface AuctionImage {
  id: string
  auction_id: string
  storage_path: string
  sort_order: number
}

export interface Bid {
  id: string
  auction_id: string
  user_id: string
  amount: number
  created_at: string
}

export interface KycSubmission {
  id: string
  user_id: string
  government_id_path: string
  selfie_path: string
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
  submitted_at: string
  reviewed_at: string | null
}
