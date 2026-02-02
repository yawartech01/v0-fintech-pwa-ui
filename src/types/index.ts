// Core domain types for VELTOX

export type NetworkType = 'TRC20' | 'ERC20' | 'BEP20'

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'processing'

export type AdStatus = 'active' | 'paused' | 'completed' | 'cancelled'

export type ReferralRewardStatus = 'pending' | 'paid'

// USDT Rate (admin-controlled)
export interface USDTRate {
  rate: number // INR per USDT
  lastUpdated: Date
  change24h: number // percentage change
}

// Wallet types
export interface DepositAddress {
  network: NetworkType
  address: string
  qrCode?: string
}

export interface Transaction {
  id: string
  type: 'deposit' | 'withdraw' | 'sell_ad_locked' | 'sell_ad_released' | 'referral_reward'
  amount: number // USDT
  status: TransactionStatus
  network?: NetworkType
  txHash?: string
  timestamp: Date
  notes?: string
}

export interface Wallet {
  balance: number // USDT
  depositAddresses: DepositAddress[]
  transactions: Transaction[]
}

export interface WithdrawRequest {
  network: NetworkType
  address: string
  amount: number
  otp?: string
}

// Sell Ads types
export interface SellAd {
  id: string
  totalAmount: number // USDT
  soldAmount: number // USDT sold so far
  remainingAmount: number // computed: totalAmount - soldAmount
  rate: number // INR per USDT (locked at creation)
  status: AdStatus
  createdAt: Date
  updatedAt: Date
}

export interface CreateSellAdRequest {
  amount: number // USDT
  rate: number // INR per USDT
}

// Bank Account / Payment Method types
export interface BankAccount {
  id: string
  accountHolderName: string
  accountNumber: string
  ifscCode: string
  bankName: string
  isPrimary: boolean
  isVerified: boolean
  createdAt: Date
}

export interface CreateBankAccountRequest {
  accountHolderName: string
  accountNumber: string
  ifscCode: string
  bankName: string
}

// Referral types
export interface ReferralCode {
  code: string
  referralLink: string
  totalReferrals: number
  totalEarnings: number // USDT
}

export interface ReferralReward {
  id: string
  fromUserId: string
  fromUserName: string
  amount: number // USDT
  status: ReferralRewardStatus
  earnedAt: Date
  paidAt?: Date
}

// User & Auth types
export interface User {
  id: string
  email: string
  name: string
  phoneNumber?: string
  createdAt: Date
  referralCode: ReferralCode
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
}

// App State (for localStorage persistence)
export interface AppState {
  auth: AuthState
  usdtRate: USDTRate
  wallet: Wallet
  sellAds: SellAd[]
  bankAccounts: BankAccount[]
  referralRewards: ReferralReward[]
}
