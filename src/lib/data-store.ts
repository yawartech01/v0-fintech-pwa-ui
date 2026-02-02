import type {
  AppState,
  USDTRate,
  Wallet,
  SellAd,
  BankAccount,
  ReferralReward,
  AuthState,
  User,
  CreateSellAdRequest,
  CreateBankAccountRequest,
  WithdrawRequest,
  Transaction,
} from '@/types'

const STORAGE_KEY = 'veltox_app_state'

// Default/initial state
const getDefaultState = (): AppState => ({
  auth: {
    isAuthenticated: false,
    user: null,
    token: null,
  },
  usdtRate: {
    rate: 92.45,
    lastUpdated: new Date(),
    change24h: 0.32,
  },
  wallet: {
    balance: 0,
    depositAddresses: [
      {
        network: 'TRC20',
        address: 'TExampleTRC20Address1234567890',
      },
      {
        network: 'ERC20',
        address: '0xExampleERC20Address1234567890',
      },
      {
        network: 'BEP20',
        address: '0xExampleBEP20Address1234567890',
      },
    ],
    transactions: [],
  },
  sellAds: [],
  bankAccounts: [],
  referralRewards: [],
})

// Load state from localStorage
export const loadState = (): AppState => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY)
    if (!serialized) return getDefaultState()

    const parsed = JSON.parse(serialized)
    // Convert date strings back to Date objects
    return {
      ...parsed,
      usdtRate: {
        ...parsed.usdtRate,
        lastUpdated: new Date(parsed.usdtRate.lastUpdated),
      },
      wallet: {
        ...parsed.wallet,
        transactions: parsed.wallet.transactions.map((tx: Transaction) => ({
          ...tx,
          timestamp: new Date(tx.timestamp),
        })),
      },
      sellAds: parsed.sellAds.map((ad: SellAd) => ({
        ...ad,
        createdAt: new Date(ad.createdAt),
        updatedAt: new Date(ad.updatedAt),
      })),
      bankAccounts: parsed.bankAccounts.map((acc: BankAccount) => ({
        ...acc,
        createdAt: new Date(acc.createdAt),
      })),
      referralRewards: parsed.referralRewards.map((reward: ReferralReward) => ({
        ...reward,
        earnedAt: new Date(reward.earnedAt),
        paidAt: reward.paidAt ? new Date(reward.paidAt) : undefined,
      })),
      auth: {
        ...parsed.auth,
        user: parsed.auth.user
          ? {
              ...parsed.auth.user,
              createdAt: new Date(parsed.auth.user.createdAt),
            }
          : null,
      },
    }
  } catch (error) {
    console.error('Failed to load state from localStorage:', error)
    return getDefaultState()
  }
}

// Save state to localStorage
export const saveState = (state: AppState): void => {
  try {
    const serialized = JSON.stringify(state)
    localStorage.setItem(STORAGE_KEY, serialized)
  } catch (error) {
    console.error('Failed to save state to localStorage:', error)
  }
}

// Data access layer
class DataStore {
  private state: AppState

  constructor() {
    this.state = loadState()
  }

  private persist() {
    saveState(this.state)
  }

  // Auth methods
  login(email: string, _password: string): { success: boolean; user?: User; token?: string } {
    // Mock login - in production, this would call an API
    const user: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name: email.split('@')[0],
      createdAt: new Date(),
      referralCode: {
        code: Math.random().toString(36).substr(2, 8).toUpperCase(),
        referralLink: `https://veltox.app/ref/${Math.random().toString(36).substr(2, 8)}`,
        totalReferrals: 0,
        totalEarnings: 0,
      },
    }

    this.state.auth = {
      isAuthenticated: true,
      user,
      token: 'mock_token_' + Math.random().toString(36).substr(2, 9),
    }

    // Initialize some demo data for new users
    if (this.state.wallet.balance === 0) {
      this.state.wallet.balance = 1000 // Demo balance
    }

    this.persist()
    return { success: true, user, token: this.state.auth.token || undefined }
  }

  signup(email: string, password: string, _name: string): { success: boolean; user?: User } {
    // Mock signup
    return this.login(email, password)
  }

  logout(): void {
    this.state.auth = {
      isAuthenticated: false,
      user: null,
      token: null,
    }
    this.persist()
  }

  getAuthState(): AuthState {
    return this.state.auth
  }

  // USDT Rate methods
  getUSDTRate(): USDTRate {
    return this.state.usdtRate
  }

  updateUSDTRate(rate: number): void {
    this.state.usdtRate = {
      rate,
      lastUpdated: new Date(),
      change24h: ((rate - this.state.usdtRate.rate) / this.state.usdtRate.rate) * 100,
    }
    this.persist()
  }

  // Wallet methods
  getWallet(): Wallet {
    return this.state.wallet
  }

  addTransaction(transaction: Omit<Transaction, 'id' | 'timestamp'>): Transaction {
    const newTx: Transaction = {
      ...transaction,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    }

    this.state.wallet.transactions.unshift(newTx)

    // Update balance based on transaction type
    if (transaction.type === 'deposit' && transaction.status === 'completed') {
      this.state.wallet.balance += transaction.amount
    } else if (transaction.type === 'withdraw' && transaction.status === 'completed') {
      this.state.wallet.balance -= transaction.amount
    }

    this.persist()
    return newTx
  }

  requestWithdraw(request: WithdrawRequest): { success: boolean; message: string } {
    if (request.amount > this.state.wallet.balance) {
      return { success: false, message: 'Insufficient balance' }
    }

    if (request.amount < 10) {
      return { success: false, message: 'Minimum withdrawal is 10 USDT' }
    }

    this.addTransaction({
      type: 'withdraw',
      amount: request.amount,
      status: 'pending',
      network: request.network,
      notes: `Withdraw to ${request.address}`,
    })

    return { success: true, message: 'Withdrawal request submitted' }
  }

  // Sell Ads methods
  getSellAds(): SellAd[] {
    // Update remaining amounts
    return this.state.sellAds.map((ad) => ({
      ...ad,
      remainingAmount: ad.totalAmount - ad.soldAmount,
    }))
  }

  createSellAd(request: CreateSellAdRequest): { success: boolean; ad?: SellAd; message?: string } {
    if (request.amount > this.state.wallet.balance) {
      return { success: false, message: 'Insufficient balance' }
    }

    if (request.amount < 50) {
      return { success: false, message: 'Minimum sell ad amount is 50 USDT' }
    }

    const newAd: SellAd = {
      id: Math.random().toString(36).substr(2, 9),
      totalAmount: request.amount,
      soldAmount: 0,
      remainingAmount: request.amount,
      rate: request.rate,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.state.sellAds.unshift(newAd)

    // Lock funds
    this.addTransaction({
      type: 'sell_ad_locked',
      amount: request.amount,
      status: 'completed',
      notes: `Funds locked for sell ad #${newAd.id}`,
    })

    this.persist()
    return { success: true, ad: newAd }
  }

  pauseSellAd(adId: string): boolean {
    const ad = this.state.sellAds.find((a) => a.id === adId)
    if (!ad || ad.status !== 'active') return false

    ad.status = 'paused'
    ad.updatedAt = new Date()
    this.persist()
    return true
  }

  resumeSellAd(adId: string): boolean {
    const ad = this.state.sellAds.find((a) => a.id === adId)
    if (!ad || ad.status !== 'paused') return false

    ad.status = 'active'
    ad.updatedAt = new Date()
    this.persist()
    return true
  }

  deleteSellAd(adId: string): boolean {
    const adIndex = this.state.sellAds.findIndex((a) => a.id === adId)
    if (adIndex === -1) return false

    const ad = this.state.sellAds[adIndex]

    // Release funds if any remaining
    if (ad.remainingAmount > 0) {
      this.addTransaction({
        type: 'sell_ad_released',
        amount: ad.remainingAmount,
        status: 'completed',
        notes: `Funds released from cancelled ad #${ad.id}`,
      })
    }

    this.state.sellAds.splice(adIndex, 1)
    this.persist()
    return true
  }

  // Bank Account methods
  getBankAccounts(): BankAccount[] {
    return this.state.bankAccounts
  }

  addBankAccount(request: CreateBankAccountRequest): BankAccount {
    const newAccount: BankAccount = {
      ...request,
      id: Math.random().toString(36).substr(2, 9),
      isPrimary: this.state.bankAccounts.length === 0,
      isVerified: false,
      createdAt: new Date(),
    }

    this.state.bankAccounts.push(newAccount)
    this.persist()
    return newAccount
  }

  updateBankAccount(accountId: string, updates: Partial<BankAccount>): boolean {
    const account = this.state.bankAccounts.find((a) => a.id === accountId)
    if (!account) return false

    Object.assign(account, updates)
    this.persist()
    return true
  }

  deleteBankAccount(accountId: string): boolean {
    const index = this.state.bankAccounts.findIndex((a) => a.id === accountId)
    if (index === -1) return false

    this.state.bankAccounts.splice(index, 1)
    this.persist()
    return true
  }

  setPrimaryBankAccount(accountId: string): boolean {
    const account = this.state.bankAccounts.find((a) => a.id === accountId)
    if (!account) return false

    // Remove primary from all others
    this.state.bankAccounts.forEach((a) => {
      a.isPrimary = a.id === accountId
    })

    this.persist()
    return true
  }

  // Referral methods
  getReferralCode(): {
    code: string
    link: string
    totalReferrals: number
    totalEarnings: number
  } | null {
    if (!this.state.auth.user) return null
    const { code, referralLink, totalReferrals, totalEarnings } = this.state.auth.user.referralCode
    return { code, link: referralLink, totalReferrals, totalEarnings }
  }

  getReferralRewards(): ReferralReward[] {
    return this.state.referralRewards
  }

  // Demo: add a referral reward
  addReferralReward(): void {
    const reward: ReferralReward = {
      id: Math.random().toString(36).substr(2, 9),
      fromUserId: Math.random().toString(36).substr(2, 9),
      fromUserName: 'user_' + Math.random().toString(36).substr(2, 5),
      amount: 5,
      status: 'pending',
      earnedAt: new Date(),
    }

    this.state.referralRewards.unshift(reward)

    if (this.state.auth.user) {
      this.state.auth.user.referralCode.totalReferrals += 1
      this.state.auth.user.referralCode.totalEarnings += reward.amount
    }

    this.persist()
  }
}

// Export singleton instance
export const dataStore = new DataStore()
