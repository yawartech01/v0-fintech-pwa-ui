// Data Store - Schema v3 with 2-level referral system
import type {
  AppState,
  User,
  Wallet,
  SellAd,
  BankAccount,
  SweepJob,
  Transaction,
  WithdrawRequest,
  NetworkType,
  CreateSellAdRequest,
  CreateBankAccountRequest,
  ReferralProfile,
  ReferralReward,
  AdEditRequest,
  AdDeleteRequest,
} from '@/types'
import { WalletService } from './wallet-service'
import { TreasuryService } from './treasury-service'
import { SweeperService } from './sweeper-service'
import { AdsService } from './ads-service'
import * as ReferralService from './referral-service'

const STORAGE_KEY = 'veltox_app_state_v3'
const SCHEMA_VERSION = 3

// Get default state
const getDefaultState = (): AppState => ({
  version: SCHEMA_VERSION,
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
  wallets: {},
  sellAds: {},
  adEditRequests: {},
  adDeleteRequests: {},
  bankAccounts: {},
  referralCodes: {},
  referralRewards: {},
  referralProfiles: {},
  referrerCapTracking: {},
  treasury: TreasuryService.initialize(),
  sweepJobs: [],
  lastSweepCheck: new Date(),
  devTimeOffset: 0,
  onboardingComplete: false,
})

// Save state to localStorage
const saveState = (state: AppState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('Failed to save state:', error)
  }
}

// Load state from localStorage with migrations
const loadState = (): AppState => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY)
    if (!serialized) return getDefaultState()

    const parsed = JSON.parse(serialized)

    // Handle schema migrations
    if (parsed.version !== SCHEMA_VERSION) {
      console.log(`Migrating from v${parsed.version} to v${SCHEMA_VERSION}`)
      return getDefaultState() // For now, reset on schema change
    }

    // Ensure new fields exist (for existing v3 data before ad requests were added)
    if (!parsed.adEditRequests) {
      parsed.adEditRequests = {}
    }
    if (!parsed.adDeleteRequests) {
      parsed.adDeleteRequests = {}
    }

    // Convert date strings back to Date objects
    return {
      ...parsed,
      usdtRate: {
        ...parsed.usdtRate,
        lastUpdated: new Date(parsed.usdtRate.lastUpdated),
      },
      treasury: {
        ...parsed.treasury,
        lastUpdated: new Date(parsed.treasury.lastUpdated),
      },
      lastSweepCheck: new Date(parsed.lastSweepCheck),
      sweepJobs: parsed.sweepJobs.map((job: SweepJob) => ({
        ...job,
        queuedAt: new Date(job.queuedAt),
        processedAt: job.processedAt ? new Date(job.processedAt) : undefined,
        completedAt: job.completedAt ? new Date(job.completedAt) : undefined,
      })),
      // Convert sell ad dates
      sellAds: Object.fromEntries(
        Object.entries(parsed.sellAds || {}).map(([userId, ads]) => [
          userId,
          (ads as any[]).map((ad: any) => ({
            ...ad,
            createdAt: new Date(ad.createdAt),
            updatedAt: new Date(ad.updatedAt),
          })),
        ])
      ),
      // Convert ad request dates
      adEditRequests: Object.fromEntries(
        Object.entries(parsed.adEditRequests || {}).map(([userId, reqs]) => [
          userId,
          (reqs as any[]).map((req: any) => ({
            ...req,
            createdAt: new Date(req.createdAt),
            reviewedAt: req.reviewedAt ? new Date(req.reviewedAt) : undefined,
          })),
        ])
      ),
      adDeleteRequests: Object.fromEntries(
        Object.entries(parsed.adDeleteRequests || {}).map(([userId, reqs]) => [
          userId,
          (reqs as any[]).map((req: any) => ({
            ...req,
            createdAt: new Date(req.createdAt),
            reviewedAt: req.reviewedAt ? new Date(req.reviewedAt) : undefined,
          })),
        ])
      ),
    }
  } catch (error) {
    console.error('Failed to load state:', error)
    return getDefaultState()
  }
}

// DataStore class
export class DataStore {
  private state: AppState

  constructor() {
    this.state = loadState()
    this.startBackgroundTasks()
  }

  // === Auth methods ===

  generateUID(): number {
    // Generate 6-9 digit unique numeric ID
    return Math.floor(100000 + Math.random() * 999000000)
  }

  login(email: string, _password: string, referralCode?: string): User {
    const userId = `user_${Date.now()}`
    const uid = this.generateUID()
    const deviceId = this.getOrCreateDeviceId()
    const user: User = {
      id: userId,
      uid,
      email,
      name: email.split('@')[0],
      createdAt: new Date(),
      referralCode: {
        code: `REF${userId.slice(-6).toUpperCase()}`,
        referralLink: `https://veltox.app/ref/${userId}`,
        totalReferrals: 0,
        totalEarnings: 0,
      },
    }

    // Initialize user wallet with TRC20 deposit address
    const depositAddress = WalletService.getDepositAddress(userId)
    this.state.wallets[userId] = {
      usdtBalance: 1000, // Start with 1000 USDT for testing
      lockedUsdt: 0,
      depositAddresses: [depositAddress],
      deposits: [],
      transactions: [],
      withdrawRequests: [],
    }

    this.state.sellAds[userId] = []
    this.state.adEditRequests[userId] = []
    this.state.adDeleteRequests[userId] = []
    this.state.bankAccounts[userId] = []
    this.state.referralCodes[userId] = user.referralCode
    this.state.referralRewards[userId] = []

    // Initialize referral profile
    const profile: ReferralProfile = {
      userId,
      joinedAt: new Date(),
      cumulativeCompletedSellVolumeUsdt: 0,
      completedPayoutCount: 0,
      deviceId,
    }

    // Apply referral code if provided
    if (referralCode) {
      const leaderId = this.findUserIdByReferralCode(referralCode)
      if (leaderId) {
        profile.leaderUserId = leaderId
        const leaderProfile = this.state.referralProfiles[leaderId]
        if (leaderProfile?.leaderUserId) {
          profile.uplineUserId = leaderProfile.leaderUserId
        }
        // Update leader's total referrals
        this.state.referralCodes[leaderId].totalReferrals += 1
      }
    }

    this.state.referralProfiles[userId] = profile

    this.state.auth = {
      isAuthenticated: true,
      user,
      token: `token_${userId}`,
    }

    saveState(this.state)
    return user
  }

  logout() {
    this.state.auth = {
      isAuthenticated: false,
      user: null,
      token: null,
    }
    saveState(this.state)
  }

  getUserById(userId: string): User | undefined {
    if (this.state.auth.user?.id === userId) {
      return this.state.auth.user
    }
    // For MVP, create a minimal user object from stored data
    const referralCode = this.state.referralCodes[userId]
    if (referralCode) {
      return {
        id: userId,
        uid: 0, // Not stored separately in MVP
        email: 'user@example.com', // Not stored
        name: 'User',
        createdAt: new Date(),
        referralCode,
      }
    }
    return undefined
  }

  getAuthState() {
    return this.state.auth
  }

  // Public method to get state safely for admin panel
  getAllWallets() {
    return this.state.wallets
  }

  getAllSellAds() {
    return this.state.sellAds
  }

  getAllAdEditRequests() {
    return this.state.adEditRequests
  }

  getAllAdDeleteRequests() {
    return this.state.adDeleteRequests
  }

  // === USDT Rate methods ===

  getUSDTRate() {
    return this.state.usdtRate
  }

  // === Wallet methods ===

  getWallet(userId: string): Wallet {
    if (!this.state.wallets[userId]) {
      const depositAddress = WalletService.getDepositAddress(userId)
      this.state.wallets[userId] = {
        usdtBalance: 0,
        lockedUsdt: 0,
        depositAddresses: [depositAddress],
        deposits: [],
        transactions: [],
        withdrawRequests: [],
      }
      saveState(this.state)
    }
    return this.state.wallets[userId]
  }

  getDepositAddress(userId: string) {
    const wallet = this.getWallet(userId)
    return wallet.depositAddresses[0] // TRC20 only
  }

  listDeposits(userId: string) {
    const wallet = this.getWallet(userId)
    return WalletService.listDeposits(wallet)
  }

  getBalances(userId: string) {
    const wallet = this.getWallet(userId)
    return WalletService.getBalances(wallet)
  }

  // Simulate incoming deposit
  simulateDeposit(userId: string, amountUsdt: number) {
    const wallet = this.getWallet(userId)
    const depositAddress = wallet.depositAddresses[0].address

    const deposit = WalletService.createIncomingDeposit(userId, depositAddress, amountUsdt)

    wallet.deposits.push(deposit)
    this.state.wallets[userId] = wallet
    saveState(this.state)

    return deposit
  }

  // === Sell Ads methods ===

  getSellAds(userId: string): SellAd[] {
    return this.state.sellAds[userId] || []
  }

  createSellAd(userId: string, request: CreateSellAdRequest): SellAd {
    const wallet = this.getWallet(userId)

    // Validate request
    AdsService.validateCreateAd(request, wallet.usdtBalance)

    // Create the ad
    const ad = AdsService.createAd(userId, request)

    // Apply wallet accounting if starting ACTIVE
    if (ad.status === 'ACTIVE') {
      // Lock funds
      wallet.usdtBalance -= ad.amountTotalUsdt
      wallet.lockedUsdt += ad.amountTotalUsdt

      // Add transaction
      const transaction: Transaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        type: 'sell_ad_locked',
        amount: ad.amountTotalUsdt,
        status: 'completed',
        timestamp: new Date(),
        notes: `Locked for sell ad ${ad.id}`,
      }
      wallet.transactions.push(transaction)
    }

    // Save ad and wallet
    if (!this.state.sellAds[userId]) {
      this.state.sellAds[userId] = []
    }
    this.state.sellAds[userId].push(ad)
    this.state.wallets[userId] = wallet
    saveState(this.state)

    return ad
  }

  updateSellAd(
    userId: string,
    adId: string,
    updates: Partial<
      Pick<SellAd, 'minPerOrderUsdt' | 'maxPerOrderUsdt' | 'notes' | 'bankAccountId'>
    >
  ): SellAd {
    const ads = this.getSellAds(userId)
    const adIndex = ads.findIndex((a) => a.id === adId)
    if (adIndex === -1) {
      throw new Error('Ad not found')
    }

    const ad = ads[adIndex]
    AdsService.validateUpdateAd(updates)

    const updatedAd = AdsService.updateAd(ad, updates)

    // Save
    this.state.sellAds[userId][adIndex] = updatedAd
    saveState(this.state)

    return updatedAd
  }

  markAdAsSold(userId: string, adId: string): SellAd {
    const ads = this.getSellAds(userId)
    const adIndex = ads.findIndex((a) => a.id === adId)
    if (adIndex === -1) {
      throw new Error('Ad not found')
    }

    const ad = ads[adIndex]
    AdsService.validateMarkAsSold(ad)

    // Update ad status
    const updatedAd = AdsService.markAsSold(ad)

    // Deduct from locked funds (funds leave wallet - user receives INR)
    const wallet = this.getWallet(userId)
    wallet.lockedUsdt -= ad.amountRemainingUsdt

    // Add transaction
    const transaction: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      type: 'sell_ad_released',
      amount: ad.amountRemainingUsdt,
      status: 'completed',
      timestamp: new Date(),
      notes: `Sold ${ad.amountRemainingUsdt} USDT via ad ${ad.id}`,
    }
    wallet.transactions.push(transaction)

    // Save
    this.state.sellAds[userId][adIndex] = updatedAd
    this.state.wallets[userId] = wallet

    // Trigger referral rewards if eligible
    this.recordCompletedSell(userId, ad.amountRemainingUsdt, ad.id)

    saveState(this.state)

    return updatedAd
  }

  // === Ad Edit/Delete Requests (require company approval) ===

  requestAdEdit(
    userId: string,
    adId: string,
    changes: Partial<Pick<SellAd, 'minPerOrderUsdt' | 'maxPerOrderUsdt' | 'notes' | 'bankAccountId'>>
  ): AdEditRequest {
    const ad = this.getSellAds(userId).find((a) => a.id === adId)
    if (!ad) {
      throw new Error('Ad not found')
    }

    if (ad.status !== 'ACTIVE') {
      throw new Error('Can only edit ACTIVE ads')
    }

    const request: AdEditRequest = {
      id: `edit_req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      adId,
      userId,
      status: 'PENDING',
      requestedChanges: changes,
      createdAt: new Date(),
    }

    if (!this.state.adEditRequests[userId]) {
      this.state.adEditRequests[userId] = []
    }
    this.state.adEditRequests[userId].push(request)
    saveState(this.state)

    return request
  }

  requestAdDelete(userId: string, adId: string): AdDeleteRequest {
    const ad = this.getSellAds(userId).find((a) => a.id === adId)
    if (!ad) {
      throw new Error('Ad not found')
    }

    if (ad.status !== 'ACTIVE') {
      throw new Error('Can only delete ACTIVE ads')
    }

    const request: AdDeleteRequest = {
      id: `del_req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      adId,
      userId,
      status: 'PENDING',
      createdAt: new Date(),
    }

    if (!this.state.adDeleteRequests[userId]) {
      this.state.adDeleteRequests[userId] = []
    }
    this.state.adDeleteRequests[userId].push(request)
    saveState(this.state)

    return request
  }

  getAdEditRequests(userId: string): AdEditRequest[] {
    return this.state.adEditRequests[userId] || []
  }

  getAdDeleteRequests(userId: string): AdDeleteRequest[] {
    return this.state.adDeleteRequests[userId] || []
  }

  getAllPendingEditRequests(): { request: AdEditRequest; user: User; ad: SellAd }[] {
    const results: { request: AdEditRequest; user: User; ad: SellAd }[] = []

    for (const [userId, requests] of Object.entries(this.state.adEditRequests)) {
      const user = this.getUserById(userId)
      if (!user) continue

      for (const request of requests) {
        if (request.status === 'PENDING') {
          const ad = this.getSellAds(userId).find((a) => a.id === request.adId)
          if (ad) {
            results.push({ request, user, ad })
          }
        }
      }
    }

    return results
  }

  getAllPendingDeleteRequests(): { request: AdDeleteRequest; user: User; ad: SellAd }[] {
    const results: { request: AdDeleteRequest; user: User; ad: SellAd }[] = []

    for (const [userId, requests] of Object.entries(this.state.adDeleteRequests)) {
      const user = this.getUserById(userId)
      if (!user) continue

      for (const request of requests) {
        if (request.status === 'PENDING') {
          const ad = this.getSellAds(userId).find((a) => a.id === request.adId)
          if (ad) {
            results.push({ request, user, ad })
          }
        }
      }
    }

    return results
  }

  approveAdEditRequest(requestId: string): void {
    let found = false

    for (const [userId, requests] of Object.entries(this.state.adEditRequests)) {
      const reqIndex = requests.findIndex((r) => r.id === requestId)
      if (reqIndex !== -1) {
        const request = requests[reqIndex]
        if (request.status !== 'PENDING') {
          throw new Error('Request already processed')
        }

        // Update request status
        request.status = 'APPROVED'
        request.reviewedAt = new Date()
        request.reviewedBy = 'admin'

        // Apply changes to ad
        this.updateSellAd(userId, request.adId, request.requestedChanges)

        this.state.adEditRequests[userId][reqIndex] = request
        found = true
        break
      }
    }

    if (!found) {
      throw new Error('Edit request not found')
    }

    saveState(this.state)
  }

  rejectAdEditRequest(requestId: string, reason: string): void {
    let found = false

    for (const [userId, requests] of Object.entries(this.state.adEditRequests)) {
      const reqIndex = requests.findIndex((r) => r.id === requestId)
      if (reqIndex !== -1) {
        const request = requests[reqIndex]
        if (request.status !== 'PENDING') {
          throw new Error('Request already processed')
        }

        request.status = 'REJECTED'
        request.reviewedAt = new Date()
        request.reviewedBy = 'admin'
        request.rejectionReason = reason

        this.state.adEditRequests[userId][reqIndex] = request
        found = true
        break
      }
    }

    if (!found) {
      throw new Error('Edit request not found')
    }

    saveState(this.state)
  }

  approveAdDeleteRequest(requestId: string): void {
    let found = false

    for (const [userId, requests] of Object.entries(this.state.adDeleteRequests)) {
      const reqIndex = requests.findIndex((r) => r.id === requestId)
      if (reqIndex !== -1) {
        const request = requests[reqIndex]
        if (request.status !== 'PENDING') {
          throw new Error('Request already processed')
        }

        // Find the ad
        const ad = this.getSellAds(userId).find((a) => a.id === request.adId)
        if (!ad) {
          throw new Error('Ad not found')
        }

        // Update request status
        request.status = 'APPROVED'
        request.reviewedAt = new Date()
        request.reviewedBy = 'admin'

        // Refund locked funds
        const wallet = this.getWallet(userId)
        wallet.lockedUsdt -= ad.amountRemainingUsdt
        wallet.usdtBalance += ad.amountRemainingUsdt

        // Add transaction
        const transaction: Transaction = {
          id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          type: 'sell_ad_unlocked',
          amount: ad.amountRemainingUsdt,
          status: 'completed',
          timestamp: new Date(),
          notes: `Refunded from deleted ad ${ad.id}`,
        }
        wallet.transactions.push(transaction)

        // Delete the ad
        const ads = this.state.sellAds[userId]
        const adIndex = ads.findIndex((a) => a.id === request.adId)
        if (adIndex !== -1) {
          ads.splice(adIndex, 1)
        }

        this.state.adDeleteRequests[userId][reqIndex] = request
        this.state.wallets[userId] = wallet
        found = true
        break
      }
    }

    if (!found) {
      throw new Error('Delete request not found')
    }

    saveState(this.state)
  }

  rejectAdDeleteRequest(requestId: string, reason: string): void {
    let found = false

    for (const [userId, requests] of Object.entries(this.state.adDeleteRequests)) {
      const reqIndex = requests.findIndex((r) => r.id === requestId)
      if (reqIndex !== -1) {
        const request = requests[reqIndex]
        if (request.status !== 'PENDING') {
          throw new Error('Request already processed')
        }

        request.status = 'REJECTED'
        request.reviewedAt = new Date()
        request.reviewedBy = 'admin'
        request.rejectionReason = reason

        this.state.adDeleteRequests[userId][reqIndex] = request
        found = true
        break
      }
    }

    if (!found) {
      throw new Error('Delete request not found')
    }

    saveState(this.state)
  }

  // === Bank Account methods ===

  addBankAccount(userId: string, request: CreateBankAccountRequest): BankAccount {
    const accounts = this.state.bankAccounts[userId] || []
    const isFirstAccount = accounts.length === 0
    const shouldBeDefault = request.isDefault ?? isFirstAccount

    // If setting as default, unset other defaults
    if (shouldBeDefault) {
      accounts.forEach((acc) => (acc.isDefault = false))
    }

    const account: BankAccount = {
      id: `bank_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      accountHolderName: request.accountHolderName,
      accountNumber: request.accountNumber,
      ifscCode: request.ifscCode,
      bankName: request.bankName,
      label: request.label,
      isDefault: shouldBeDefault,
      isVerified: true,
      createdAt: new Date(),
    }

    this.state.bankAccounts[userId] = [...accounts, account]
    saveState(this.state)
    return account
  }

  getBankAccounts(userId: string): BankAccount[] {
    return this.state.bankAccounts[userId] || []
  }

  updateBankAccount(
    userId: string,
    accountId: string,
    updates: Partial<
      Pick<BankAccount, 'bankName' | 'accountHolderName' | 'ifscCode' | 'label' | 'isDefault'>
    >
  ): BankAccount {
    const accounts = this.getBankAccounts(userId)
    const index = accounts.findIndex((a) => a.id === accountId)
    if (index === -1) {
      throw new Error('Bank account not found')
    }

    // If setting as default, unset other defaults
    if (updates.isDefault) {
      accounts.forEach((acc) => (acc.isDefault = false))
    }

    const updatedAccount = { ...accounts[index], ...updates }
    this.state.bankAccounts[userId][index] = updatedAccount
    saveState(this.state)
    return updatedAccount
  }

  deleteBankAccount(userId: string, accountId: string): void {
    const accounts = this.getBankAccounts(userId)
    const index = accounts.findIndex((a) => a.id === accountId)
    if (index === -1) {
      throw new Error('Bank account not found')
    }

    const wasDefault = accounts[index].isDefault

    // Remove account
    accounts.splice(index, 1)

    // If deleted account was default and accounts remain, assign new default
    if (wasDefault && accounts.length > 0) {
      // Assign newest (last) as new default
      accounts[accounts.length - 1].isDefault = true
    }

    this.state.bankAccounts[userId] = accounts
    saveState(this.state)
  }

  getDefaultBankAccount(userId: string): BankAccount | undefined {
    const accounts = this.getBankAccounts(userId)
    return accounts.find((a) => a.isDefault)
  }

  // Withdraw USDT
  // Withdraw USDT - Request based (approval required)
  requestWithdraw(
    userId: string,
    request: { network: NetworkType; address: string; amount: number }
  ) {
    const wallet = this.getWallet(userId)

    // Validate address format (basic TRC20 check)
    if (!request.address || request.address.length !== 34 || !request.address.startsWith('T')) {
      throw new Error('Invalid TRC20 address format')
    }

    // Minimum withdrawal amount
    const MIN_WITHDRAWAL = 10
    if (request.amount < MIN_WITHDRAWAL) {
      throw new Error(`Minimum withdrawal amount is ${MIN_WITHDRAWAL} USDT`)
    }

    if (wallet.usdtBalance < request.amount) {
      throw new Error('Insufficient available balance')
    }

    const fee = 1.0 // Fixed 1 USDT fee for TRC20

    // Create withdrawal request with "under_review" status
    const withdrawal: WithdrawRequest = {
      id: `withdraw_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      userId,
      network: request.network,
      address: request.address,
      amount: request.amount,
      fee,
      status: 'under_review',
      createdAt: new Date(),
    }

    // Move amount from available to locked
    wallet.usdtBalance -= request.amount
    wallet.lockedUsdt += request.amount

    // Add to withdraw requests
    wallet.withdrawRequests.push(withdrawal)

    // Add transaction to history
    const transaction: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      type: 'withdraw',
      amount: request.amount,
      status: 'under_review',
      network: request.network,
      address: request.address,
      fee,
      timestamp: new Date(),
      notes: `Withdrawal request to ${request.address.slice(0, 8)}...`,
    }

    wallet.transactions.push(transaction)
    this.state.wallets[userId] = wallet
    saveState(this.state)

    return withdrawal
  }

  // Admin: Approve withdrawal
  approveWithdrawal(targetUserId: string, withdrawalId: string) {
    // Find the withdrawal request
    let withdrawal: WithdrawRequest | undefined
    let foundUserId: string | undefined

    Object.keys(this.state.wallets).forEach((uid) => {
      const wallet = this.state.wallets[uid]
      const wr = wallet.withdrawRequests.find((w) => w.id === withdrawalId)
      if (wr) {
        withdrawal = wr
        foundUserId = uid
      }
    })

    if (!withdrawal || !foundUserId) {
      throw new Error('Withdrawal request not found')
    }

    if (withdrawal.status !== 'under_review') {
      throw new Error('Withdrawal is not under review')
    }

    // Update status to approved
    withdrawal.status = 'approved'
    withdrawal.approvedAt = new Date()

    // Simulate sending transaction (instant for MVP)
    withdrawal.status = 'sent'
    withdrawal.sentAt = new Date()
    withdrawal.txHash = `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`

    // Complete immediately
    withdrawal.status = 'completed'
    withdrawal.completedAt = new Date()

    // Decrease locked USDT (funds leave permanently)
    const wallet = this.state.wallets[foundUserId]
    wallet.lockedUsdt -= withdrawal.amount

    // Update transaction in history
    const txIndex = wallet.transactions.findIndex(
      (tx) =>
        tx.type === 'withdraw' &&
        tx.address === withdrawal!.address &&
        tx.amount === withdrawal!.amount &&
        tx.status === 'under_review'
    )
    if (txIndex !== -1) {
      wallet.transactions[txIndex].status = 'completed'
      wallet.transactions[txIndex].txHash = withdrawal.txHash
      wallet.transactions[txIndex].notes =
        `Withdrawal completed to ${withdrawal.address.slice(0, 8)}...`
    }

    this.state.wallets[foundUserId] = wallet
    saveState(this.state)

    return withdrawal
  }

  // Admin: Reject withdrawal
  rejectWithdrawal(targetUserId: string, withdrawalId: string, reason: string) {
    // Find the withdrawal request
    let withdrawal: WithdrawRequest | undefined
    let foundUserId: string | undefined

    Object.keys(this.state.wallets).forEach((uid) => {
      const wallet = this.state.wallets[uid]
      const wr = wallet.withdrawRequests.find((w) => w.id === withdrawalId)
      if (wr) {
        withdrawal = wr
        foundUserId = uid
      }
    })

    if (!withdrawal || !foundUserId) {
      throw new Error('Withdrawal request not found')
    }

    if (withdrawal.status !== 'under_review') {
      throw new Error('Withdrawal is not under review')
    }

    // Update status to rejected
    withdrawal.status = 'rejected'
    withdrawal.rejectedAt = new Date()
    withdrawal.rejectionReason = reason

    // Refund: move locked back to available
    const wallet = this.state.wallets[foundUserId]
    wallet.lockedUsdt -= withdrawal.amount
    wallet.usdtBalance += withdrawal.amount

    // Update transaction in history
    const txIndex = wallet.transactions.findIndex(
      (tx) =>
        tx.type === 'withdraw' &&
        tx.address === withdrawal!.address &&
        tx.amount === withdrawal!.amount &&
        tx.status === 'under_review'
    )
    if (txIndex !== -1) {
      wallet.transactions[txIndex].status = 'rejected'
      wallet.transactions[txIndex].notes = `Withdrawal rejected: ${reason}`
    }

    this.state.wallets[foundUserId] = wallet
    saveState(this.state)

    return withdrawal
  }

  // Get all pending withdrawals (for admin panel)
  getAllPendingWithdrawals(): WithdrawRequest[] {
    const pending: WithdrawRequest[] = []
    Object.keys(this.state.wallets).forEach((userId) => {
      const wallet = this.state.wallets[userId]
      wallet.withdrawRequests.forEach((wr) => {
        if (wr.status === 'under_review') {
          pending.push(wr)
        }
      })
    })
    return pending
  }

  // Get all withdrawals (for admin panel history)
  getAllWithdrawals(): WithdrawRequest[] {
    const all: WithdrawRequest[] = []
    Object.keys(this.state.wallets).forEach((userId) => {
      const wallet = this.state.wallets[userId]
      all.push(...wallet.withdrawRequests)
    })
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  getReferralCode(userId: string) {
    return this.state.referralCodes[userId]
  }

  getReferralRewards(userId: string) {
    return this.state.referralRewards[userId] || []
  }

  // === Referral System Methods ===

  getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem('veltox_device_id')
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
      localStorage.setItem('veltox_device_id', deviceId)
    }
    return deviceId
  }

  findUserIdByReferralCode(code: string): string | undefined {
    return Object.keys(this.state.referralCodes).find(
      (userId) => this.state.referralCodes[userId].code === code
    )
  }

  getReferralProfile(userId: string): ReferralProfile | undefined {
    return this.state.referralProfiles[userId]
  }

  getLeaderInfo(userId: string): { leader?: User; upline?: User } {
    const profile = this.getReferralProfile(userId)
    if (!profile) return {}

    let leader: User | undefined
    let upline: User | undefined

    if (profile.leaderUserId) {
      const leaderAuth =
        this.state.auth.user?.id === profile.leaderUserId ? this.state.auth.user : undefined
      // In a real app, we'd fetch user data. For MVP, construct minimal user
      if (leaderAuth) {
        leader = leaderAuth
      } else {
        leader = {
          id: profile.leaderUserId,
          uid: Math.floor(100000 + Math.random() * 900000),
          email: `user_${profile.leaderUserId.slice(-6)}@example.com`,
          name: `User ${profile.leaderUserId.slice(-6)}`,
          createdAt: new Date(),
          referralCode: this.state.referralCodes[profile.leaderUserId],
        }
      }
    }

    if (profile.uplineUserId) {
      const uplineAuth =
        this.state.auth.user?.id === profile.uplineUserId ? this.state.auth.user : undefined
      if (uplineAuth) {
        upline = uplineAuth
      } else {
        upline = {
          id: profile.uplineUserId,
          uid: Math.floor(100000 + Math.random() * 900000),
          email: `user_${profile.uplineUserId.slice(-6)}@example.com`,
          name: `User ${profile.uplineUserId.slice(-6)}`,
          createdAt: new Date(),
          referralCode: this.state.referralCodes[profile.uplineUserId],
        }
      }
    }

    return { leader, upline }
  }

  getTeamMembers(userId: string): { direct: ReferralProfile[]; indirect: ReferralProfile[] } {
    const direct = Object.values(this.state.referralProfiles).filter(
      (p) => p.leaderUserId === userId
    )
    const indirect = Object.values(this.state.referralProfiles).filter(
      (p) => p.uplineUserId === userId
    )
    return { direct, indirect }
  }

  // Record completed sell and generate referral rewards
  recordCompletedSell(refereeUserId: string, volumeUsdt: number, sellAdId: string) {
    const profile = this.state.referralProfiles[refereeUserId]
    if (!profile) return

    // Update referee's cumulative volume and payout count
    profile.cumulativeCompletedSellVolumeUsdt += volumeUsdt
    profile.completedPayoutCount += 1
    this.state.referralProfiles[refereeUserId] = profile

    // Check eligibility
    const eligibility = ReferralService.checkEligibility(profile, this.state.devTimeOffset)
    if (!eligibility.eligible) {
      console.log(`Referee ${refereeUserId} not eligible: ${eligibility.reason}`)
      return
    }

    // Get referee bank accounts and contact info
    const refereeBankAccounts = this.getBankAccounts(refereeUserId)
    const refereeEmail = profile.userId // Using userId as email for simplicity
    const refereePhone = undefined // Not tracked in MVP
    const refereeDeviceId = profile.deviceId

    // Process direct (L1) rewards
    if (profile.leaderUserId) {
      this.createReferralReward(
        profile.leaderUserId,
        refereeUserId,
        'direct',
        volumeUsdt,
        sellAdId,
        refereeBankAccounts,
        refereeEmail,
        refereePhone,
        refereeDeviceId
      )
    }

    // Process upline (L2) rewards
    if (profile.uplineUserId) {
      this.createReferralReward(
        profile.uplineUserId,
        refereeUserId,
        'upline',
        volumeUsdt,
        sellAdId,
        refereeBankAccounts,
        refereeEmail,
        refereePhone,
        refereeDeviceId
      )
    }

    saveState(this.state)
  }

  private createReferralReward(
    referrerUserId: string,
    refereeUserId: string,
    level: 'direct' | 'upline',
    volumeUsdt: number,
    sellAdId: string,
    refereeBankAccounts: BankAccount[],
    refereeEmail: string,
    refereePhone: string | undefined,
    refereeDeviceId: string | undefined
  ) {
    // Get referrer data
    const referrerProfile = this.state.referralProfiles[referrerUserId]
    if (!referrerProfile) return

    const referrerBankAccounts = this.getBankAccounts(referrerUserId)
    const referrerEmail = referrerProfile.userId
    const referrerPhone = undefined
    const referrerDeviceId = referrerProfile.deviceId

    // Anti-abuse checks
    // 1. Bank account overlap
    const bankOverlap = ReferralService.checkBankAccountOverlap(
      refereeBankAccounts,
      referrerBankAccounts
    )
    if (bankOverlap.hasOverlap) {
      const reward = ReferralService.createReward(
        referrerUserId,
        refereeUserId,
        level,
        volumeUsdt,
        0,
        'rejected',
        sellAdId,
        this.state.devTimeOffset,
        'Bank account overlap detected'
      )
      if (!this.state.referralRewards[referrerUserId]) {
        this.state.referralRewards[referrerUserId] = []
      }
      this.state.referralRewards[referrerUserId].push(reward)
      return
    }

    // 2. Contact match (email/phone)
    const contactMatch = ReferralService.checkContactMatch(
      refereeEmail,
      refereePhone,
      referrerEmail,
      referrerPhone
    )
    if (contactMatch) {
      const reward = ReferralService.createReward(
        referrerUserId,
        refereeUserId,
        level,
        volumeUsdt,
        0,
        'rejected',
        sellAdId,
        this.state.devTimeOffset,
        'Contact information overlap detected'
      )
      if (!this.state.referralRewards[referrerUserId]) {
        this.state.referralRewards[referrerUserId] = []
      }
      this.state.referralRewards[referrerUserId].push(reward)
      return
    }

    // 3. Device ID match
    const deviceMatch = ReferralService.checkDeviceIdMatch(refereeDeviceId, referrerDeviceId)
    if (deviceMatch) {
      const reward = ReferralService.createReward(
        referrerUserId,
        refereeUserId,
        level,
        volumeUsdt,
        0,
        'held',
        sellAdId,
        this.state.devTimeOffset,
        'Device ID match - held for review'
      )
      if (!this.state.referralRewards[referrerUserId]) {
        this.state.referralRewards[referrerUserId] = []
      }
      this.state.referralRewards[referrerUserId].push(reward)
      return
    }

    // Initialize cap tracking if needed
    if (!this.state.referrerCapTracking[referrerUserId]) {
      this.state.referrerCapTracking[referrerUserId] =
        ReferralService.initCapTracking(referrerUserId)
    }

    // Reset caps if needed
    this.state.referrerCapTracking[referrerUserId] = ReferralService.resetCapsIfNeeded(
      this.state.referrerCapTracking[referrerUserId],
      this.state.devTimeOffset
    )

    const tracking = this.state.referrerCapTracking[referrerUserId]

    // Compute reward amount with per-referee cap
    const rewardPct =
      level === 'direct' ? ReferralService.DIRECT_REWARD_PCT : ReferralService.UPLINE_REWARD_PCT
    const rewardUsdt = ReferralService.computeRewardAmount(
      volumeUsdt,
      rewardPct,
      refereeUserId,
      tracking
    )

    if (rewardUsdt === 0) {
      console.log(`No reward for ${referrerUserId}: per-referee cap reached`)
      return
    }

    // Check caps
    const canReceive = ReferralService.checkReferrerCaps(tracking, refereeUserId, rewardUsdt)
    if (!canReceive.canReceive) {
      const reward = ReferralService.createReward(
        referrerUserId,
        refereeUserId,
        level,
        volumeUsdt,
        rewardUsdt,
        'rejected',
        sellAdId,
        this.state.devTimeOffset,
        canReceive.reason
      )
      if (!this.state.referralRewards[referrerUserId]) {
        this.state.referralRewards[referrerUserId] = []
      }
      this.state.referralRewards[referrerUserId].push(reward)
      return
    }

    // Create eligible reward (with 14-day hold)
    const reward = ReferralService.createReward(
      referrerUserId,
      refereeUserId,
      level,
      volumeUsdt,
      rewardUsdt,
      'eligible',
      sellAdId,
      this.state.devTimeOffset
    )

    if (!this.state.referralRewards[referrerUserId]) {
      this.state.referralRewards[referrerUserId] = []
    }
    this.state.referralRewards[referrerUserId].push(reward)

    // Update cap tracking
    this.state.referrerCapTracking[referrerUserId] = ReferralService.updateCapTracking(
      tracking,
      refereeUserId,
      volumeUsdt,
      rewardUsdt
    )

    // Update referral code total earnings
    this.state.referralCodes[referrerUserId].totalEarnings += rewardUsdt
  }

  // Process held rewards (check if hold period passed)
  processHeldRewards() {
    Object.keys(this.state.referralRewards).forEach((userId) => {
      const rewards = this.state.referralRewards[userId]
      this.state.referralRewards[userId] = ReferralService.processHeldRewards(
        rewards,
        this.state.devTimeOffset
      )

      // Credit paid rewards to wallet
      this.state.referralRewards[userId].forEach((reward) => {
        if (reward.status === 'paid' && reward.paidAt) {
          const wallet = this.getWallet(userId)
          const alreadyCredited = wallet.transactions.some((tx) => tx.notes?.includes(reward.id))
          if (!alreadyCredited) {
            wallet.usdtBalance += reward.rewardUsdt
            const transaction: Transaction = {
              id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
              type: 'referral_reward',
              amount: reward.rewardUsdt,
              status: 'completed',
              timestamp: reward.paidAt,
              notes: `${reward.level === 'direct' ? 'L1' : 'L2'} referral reward from ${reward.refereeUserId} (${reward.id})`,
            }
            wallet.transactions.push(transaction)
            this.state.wallets[userId] = wallet
          }
        }
      })
    })
    saveState(this.state)
  }

  // Admin: Get all held rewards
  getAllHeldRewards(): ReferralReward[] {
    const held: ReferralReward[] = []
    Object.keys(this.state.referralRewards).forEach((userId) => {
      this.state.referralRewards[userId].forEach((reward) => {
        if (reward.status === 'held') {
          held.push(reward)
        }
      })
    })
    return held
  }

  // Admin: Approve held reward
  approveHeldReward(rewardId: string) {
    Object.keys(this.state.referralRewards).forEach((userId) => {
      const rewardIndex = this.state.referralRewards[userId].findIndex((r) => r.id === rewardId)
      if (rewardIndex !== -1) {
        const reward = this.state.referralRewards[userId][rewardIndex]
        if (reward.status === 'held') {
          reward.status = 'eligible'
          reward.holdUntil = new Date(
            Date.now() +
              (this.state.devTimeOffset || 0) +
              ReferralService.REWARD_HOLD_PERIOD_DAYS * 24 * 60 * 60 * 1000
          )
          reward.rejectionReason = undefined
          this.state.referralRewards[userId][rewardIndex] = reward
        }
      }
    })
    saveState(this.state)
  }

  // Admin: Reject held reward
  rejectHeldReward(rewardId: string, reason: string) {
    Object.keys(this.state.referralRewards).forEach((userId) => {
      const rewardIndex = this.state.referralRewards[userId].findIndex((r) => r.id === rewardId)
      if (rewardIndex !== -1) {
        const reward = this.state.referralRewards[userId][rewardIndex]
        if (reward.status === 'held') {
          reward.status = 'rejected'
          reward.rejectedAt = new Date(Date.now() + (this.state.devTimeOffset || 0))
          reward.rejectionReason = reason
          this.state.referralRewards[userId][rewardIndex] = reward
        }
      }
    })
    saveState(this.state)
  }

  // Dev helper: Fast-forward time
  setDevTimeOffset(offsetMs: number) {
    this.state.devTimeOffset = offsetMs
    saveState(this.state)
  }

  getDevTimeOffset(): number {
    return this.state.devTimeOffset || 0
  }

  // === Onboarding methods ===

  isOnboardingComplete(): boolean {
    return this.state.onboardingComplete || false
  }

  completeOnboarding() {
    this.state.onboardingComplete = true
    saveState(this.state)
  }

  resetOnboarding() {
    this.state.onboardingComplete = false
    saveState(this.state)
  }

  applyReferralCode(code: string): { success: boolean; error?: string } {
    const authState = this.state.auth
    if (!authState.user) {
      return { success: false, error: 'User not authenticated' }
    }

    const currentUserId = authState.user.id

    // Find leader by referral code
    const leaderId = this.findUserIdByReferralCode(code)

    if (!leaderId) {
      return { success: false, error: 'Invalid referral code' }
    }

    if (leaderId === currentUserId) {
      return { success: false, error: "You can't use your own referral code" }
    }

    // Get current user's profile
    const profile = this.state.referralProfiles[currentUserId]
    if (!profile) {
      return { success: false, error: 'User profile not found' }
    }

    // Check if user already has a leader
    if (profile.leaderUserId) {
      return { success: false, error: 'You already have a leader linked' }
    }

    // Set leader
    profile.leaderUserId = leaderId

    // Set upline (leader's leader)
    const leaderProfile = this.state.referralProfiles[leaderId]
    if (leaderProfile?.leaderUserId) {
      profile.uplineUserId = leaderProfile.leaderUserId
    }

    // Update leader's total referrals
    if (this.state.referralCodes[leaderId]) {
      this.state.referralCodes[leaderId].totalReferrals += 1
    }

    this.state.referralProfiles[currentUserId] = profile
    saveState(this.state)

    return { success: true }
  }

  // === Treasury & Sweep methods ===

  getTreasury() {
    return this.state.treasury
  }

  getSweepJobs() {
    return this.state.sweepJobs
  }

  // Background task: Process confirmations and sweep jobs
  private startBackgroundTasks() {
    // Process confirmations every 5 seconds
    setInterval(() => {
      let changed = false

      Object.keys(this.state.wallets).forEach((userId) => {
        const wallet = this.state.wallets[userId]
        const originalDeposits = [...wallet.deposits]

        wallet.deposits = WalletService.processConfirmations(wallet.deposits)

        // Credit newly confirmed deposits
        wallet.deposits.forEach((deposit) => {
          if (deposit.status === 'confirmed') {
            const wasConfirmed = originalDeposits.find(
              (d) => d.id === deposit.id && d.status === 'confirmed'
            )
            if (!wasConfirmed) {
              this.state.wallets[userId] = WalletService.creditDeposit(wallet, deposit)
              changed = true
            }
          }
        })
      })

      if (changed) {
        saveState(this.state)
      }
    }, 5000)

    // Process sweep jobs every 30 seconds
    setInterval(() => {
      const allDeposits = Object.values(this.state.wallets).flatMap((w) => w.deposits)

      // Queue new sweep jobs
      this.state.sweepJobs = SweeperService.queueSweepJobs(allDeposits, this.state.sweepJobs)

      // Execute queued jobs
      const result = SweeperService.processQueuedJobs(
        this.state.sweepJobs,
        allDeposits,
        this.state.treasury
      )

      this.state.sweepJobs = result.updatedJobs
      this.state.treasury = result.updatedTreasury

      // Update deposits in wallets
      Object.keys(this.state.wallets).forEach((userId) => {
        const wallet = this.state.wallets[userId]
        wallet.deposits = wallet.deposits.map((d) => {
          const updated = result.updatedDeposits.find((ud) => ud.id === d.id)
          return updated || d
        })
      })

      // Update deposit addresses accumulated totals
      Object.keys(this.state.wallets).forEach((userId) => {
        const wallet = this.state.wallets[userId]
        wallet.depositAddresses = wallet.depositAddresses.map((da) => ({
          ...da,
          accumulatedUsdt: wallet.deposits
            .filter(
              (d) => d.depositAddress === da.address && d.status === 'confirmed' && !d.sweptAt
            )
            .reduce((sum, d) => sum + d.amountUsdt, 0),
        }))
      })

      // Update treasury total deposit addresses balance
      const totalDepositAddressesUsdt = Object.values(this.state.wallets)
        .flatMap((w) => w.depositAddresses)
        .reduce((sum, da) => sum + da.accumulatedUsdt, 0)

      this.state.treasury = TreasuryService.updateDepositAddressesTotal(
        this.state.treasury,
        totalDepositAddressesUsdt
      )

      this.state.lastSweepCheck = new Date()
      saveState(this.state)
    }, 30000)

    // Process held referral rewards every 60 seconds
    setInterval(() => {
      this.processHeldRewards()
    }, 60000)
  }
}

export const dataStore = new DataStore()
