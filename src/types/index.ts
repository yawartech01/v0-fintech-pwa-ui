// Core domain types for VELTOX - TRC20-only deposit system with sweep logic

export type NetworkType = 'TRC20' | 'ERC20' | 'BEP20'
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'processing'
export type AdStatus = 'ACTIVE' | 'COMPLETED'
export type ReferralRewardStatus = 'pending' | 'eligible' | 'held' | 'paid' | 'rejected'
export type ReferralRewardLevel = 'direct' | 'upline' // L1 or L2
export type DepositStatus = 'pending' | 'confirming' | 'confirmed' | 'swept'
export type SweepJobStatus = 'queued' | 'processing' | 'completed' | 'failed'
export type WithdrawalStatus = 'under_review' | 'approved' | 'sent' | 'completed' | 'rejected'
export type AdRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

// USDT Rate (admin-controlled)
export interface USDTRate {
  rate: number // INR per USDT
  lastUpdated: Date
  change24h: number // percentage change
}

// Deposit system types
export interface DepositAddress {
  network: NetworkType
  address: string
  accumulatedUsdt: number // Total confirmed USDT on this address (before sweep)
  qrCode?: string
}

export interface Deposit {
  id: string
  userId: string
  depositAddress: string
  network: NetworkType
  amountUsdt: number
  txHash: string
  status: DepositStatus
  confirmations: number
  requiredConfirmations: number
  createdAt: Date
  confirmedAt?: Date
  sweptAt?: Date
}

export interface SweepJob {
  id: string
  depositAddress: string
  amountUsdt: number
  status: SweepJobStatus
  queuedAt: Date
  processedAt?: Date
  completedAt?: Date
  errorMessage?: string
}

export interface Treasury {
  hotWalletUsdt: number // Company float for payouts
  totalDepositAddressesUsdt: number // Sum of all unswept funds
  totalSweptUsdt: number // Lifetime swept
  lastUpdated: Date
}

// Wallet types
export interface Transaction {
  id: string
  type: 'deposit' | 'withdraw' | 'sell_ad_locked' | 'sell_ad_released' | 'sell_ad_unlocked' | 'referral_reward' | 'sweep'
  amount: number // USDT
  status: TransactionStatus | WithdrawalStatus
  network?: NetworkType
  txHash?: string
  address?: string // For withdrawals
  fee?: number // For withdrawals
  timestamp: Date
  notes?: string
}

export interface Wallet {
  usdtBalance: number // Available USDT (credited after confirmation)
  lockedUsdt: number // USDT locked in active ads or pending withdrawals
  depositAddresses: DepositAddress[]
  deposits: Deposit[]
  transactions: Transaction[]
  withdrawRequests: WithdrawRequest[]
}

export interface WithdrawRequest {
  id: string
  userId: string
  network: NetworkType
  address: string
  amount: number
  fee: number
  status: WithdrawalStatus
  createdAt: Date
  approvedAt?: Date
  sentAt?: Date
  completedAt?: Date
  rejectedAt?: Date
  rejectionReason?: string
  txHash?: string
}

// Sell Ads types
export interface SellAd {
  id: string
  adCode?: string        // Unique human-readable ID e.g. VLX-001000
  userId: string
  status: AdStatus
  amountTotalUsdt: number
  amountRemainingUsdt: number
  minPerOrderUsdt?: number
  maxPerOrderUsdt?: number
  bankAccountId: string
  // Bank account details (joined from DB)
  bankName?: string
  accountHolderName?: string
  accountNumber?: string
  ifscCode?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
  completedAt?: Date | string | null
  paymentReceipt?: string | null
  paymentReceiptUploadedAt?: Date
  paymentReceiptUploadedBy?: string
}

// Ad modification requests (require company approval)
export interface AdEditRequest {
  id: string
  adId: string
  userId: string
  status: AdRequestStatus
  requestedChanges: {
    minPerOrderUsdt?: number
    maxPerOrderUsdt?: number
    bankAccountId?: string
    notes?: string
  }
  createdAt: Date
  reviewedAt?: Date
  reviewedBy?: string
  rejectionReason?: string
}

export interface AdDeleteRequest {
  id: string
  adId: string
  userId: string
  status: AdRequestStatus
  createdAt: Date
  reviewedAt?: Date
  reviewedBy?: string
  rejectionReason?: string
}

export interface CreateSellAdRequest {
  amountTotalUsdt: number
  minPerOrderUsdt?: number
  maxPerOrderUsdt?: number
  bankAccountId: string
  notes?: string
  startActive: boolean // Whether to create as ACTIVE or PAUSED
}

// Bank Account / Payment Method types
export interface BankAccount {
  id: string
  accountHolderName: string
  accountNumber: string
  ifscCode: string
  bankName: string
  label?: string // Optional label like "Primary", "Savings"
  isDefault: boolean
  isVerified: boolean
  createdAt: Date
}

export interface CreateBankAccountRequest {
  accountHolderName: string
  accountNumber: string
  ifscCode: string
  bankName: string
  label?: string
  isDefault?: boolean
}

// Referral types - 2-level leader system
export interface ReferralProfile {
  userId: string
  leaderUserId?: string // Direct inviter (L1)
  uplineUserId?: string // Leader's leader (L2)
  joinedAt: Date
  cumulativeCompletedSellVolumeUsdt: number // Total COMPLETED sell volume
  completedPayoutCount: number // Number of completed payouts
  deviceId?: string // For anti-abuse
}

export interface ReferralCode {
  code: string
  referralLink: string
  totalReferrals: number
  totalEarnings: number // USDT
}

export interface ReferralReward {
  id: string
  referrerUserId: string // Who earns this reward
  refereeUserId: string // Who generated the volume
  level: ReferralRewardLevel // 'direct' (0.2%) or 'upline' (0.1%)
  volumeUsdt: number // The completed sell volume that triggered this
  rewardUsdt: number // The actual reward amount
  status: ReferralRewardStatus
  createdAt: Date
  holdUntil?: Date // 14-day hold period
  paidAt?: Date
  rejectedAt?: Date
  rejectionReason?: string
  sellAdId?: string // Source sell ad
}

// Referrer cap tracking
export interface ReferrerCapTracking {
  userId: string
  dailyRewardsUsdt: number
  monthlyRewardsUsdt: number
  monthlyRewardedRefereeCount: number
  lastDailyReset: Date
  lastMonthlyReset: Date
  refereeVolumeTracking: Record<string, number> // refereeUserId -> cumulative rewarded volume (max 20k)
}

// User & Auth types
export interface User {
  id: string
  uid: number // Unique numeric identifier (6-9 digits)
  email: string
  name: string
  phoneNumber?: string
  createdAt: Date
  referralCode: ReferralCode
  isBanned?: boolean
  banReason?: string
  bannedAt?: Date
  bannedBy?: string
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
}

// App State (for localStorage persistence) - Schema v3
export interface AppState {
  version: number // Schema version for migrations
  auth: AuthState
  usdtRate: USDTRate
  wallets: Record<string, Wallet> // userId -> Wallet
  sellAds: Record<string, SellAd[]> // userId -> SellAd[]
  adEditRequests: Record<string, AdEditRequest[]> // userId -> AdEditRequest[]
  adDeleteRequests: Record<string, AdDeleteRequest[]> // userId -> AdDeleteRequest[]
  bankAccounts: Record<string, BankAccount[]> // userId -> BankAccount[]
  referralCodes: Record<string, ReferralCode> // userId -> ReferralCode
  referralRewards: Record<string, ReferralReward[]> // userId -> ReferralReward[]
  referralProfiles: Record<string, ReferralProfile> // userId -> ReferralProfile
  referrerCapTracking: Record<string, ReferrerCapTracking> // userId -> cap tracking
  treasury: Treasury
  sweepJobs: SweepJob[]
  lastSweepCheck: Date
  devTimeOffset?: number // For testing: offset in milliseconds to fast-forward time
  onboardingComplete?: boolean // Tracks if user completed onboarding
}
