import api from '@/lib/api-client'

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export class APIService {
  // ========== AUTHENTICATION ==========
  
  static async signup(data: {
    email: string
    password: string
    name: string
    phone?: string
    referralCode?: string
  }): Promise<{ token: string; user: any }> {
    const response = await api.post('/auth/signup', data)
    return response.data
  }

  static async login(data: { email: string; password: string }): Promise<{ token: string; user: any }> {
    const response = await api.post('/auth/login', data)
    return response.data
  }

  static async adminLogin(password: string): Promise<{ token: string }> {
    const response = await api.post('/auth/admin/login', { password })
    return response.data
  }

  // ========== USER ==========
  
  static async getProfile() {
    const response = await api.get('/users/me')
    return response.data
  }

  static async updateProfile(data: { nickname?: string; avatar?: string }) {
    const response = await api.patch('/users/me', data)
    return response.data
  }

  static async getReferralStats() {
    const response = await api.get('/users/referral-stats')
    return response.data
  }

  // ========== WALLET ==========
  
  static async getWallet() {
    const response = await api.get('/wallet')
    return response.data
  }

  static async getDepositAddress() {
    const response = await api.get('/wallet/deposit-address')
    return response.data
  }

  static async getDeposits() {
    const response = await api.get('/wallet/deposits')
    return response.data
  }

  static async submitDeposit(txHash: string) {
    const response = await api.post('/wallet/deposit', { txHash })
    return response.data
  }

  static async checkDepositStatus(txHash: string) {
    const response = await api.get(`/wallet/deposit/${txHash}/status`)
    return response.data
  }

  static async requestWithdrawal(data: { network: string; address: string; amount: number }) {
    const response = await api.post('/wallet/withdraw', data)
    return response.data
  }

  static async getWithdrawals() {
    const response = await api.get('/wallet/withdrawals')
    return response.data
  }

  // ========== SELL ADS ==========
  
  static async getSellAds() {
    const response = await api.get('/ads')
    return response.data
  }

  static async createSellAd(data: { 
    amountTotalUsdt: number
    bankAccountId: string
    startActive: boolean
  }) {
    const response = await api.post('/ads', data)
    return response.data
  }

  static async updateAdStatus(adId: string, status: 'ACTIVE' | 'PAUSED') {
    const response = await api.patch(`/ads/${adId}/status`, { status })
    return response.data
  }

  static async requestAdEdit(adId: string, requestedChanges: any) {
    const response = await api.post(`/ads/${adId}/edit-request`, { requestedChanges })
    return response.data
  }

  static async requestAdDelete(adId: string) {
    const response = await api.post(`/ads/${adId}/delete-request`)
    return response.data
  }

  // ========== BANK ACCOUNTS ==========
  
  static async getBankAccounts() {
    const response = await api.get('/bank-accounts')
    return response.data
  }

  static async addBankAccount(data: {
    bankName: string
    accountHolderName: string
    accountNumber: string
    ifscCode: string
    label?: string
    isDefault?: boolean
  }) {
    const response = await api.post('/bank-accounts', data)
    return response.data
  }

  static async updateBankAccount(id: string, data: any) {
    const response = await api.put(`/bank-accounts/${id}`, data)
    return response.data
  }

  static async setDefaultBankAccount(id: string) {
    const response = await api.patch(`/bank-accounts/${id}/set-default`)
    return response.data
  }

  static async deleteBankAccount(id: string) {
    const response = await api.delete(`/bank-accounts/${id}`)
    return response.data
  }

  // ========== ADMIN ==========
  
  static async getAdminStats() {
    const response = await api.get('/admin/stats')
    return response.data
  }

  static async getAllUsers() {
    const response = await api.get('/admin/users')
    return response.data
  }

  static async banUser(userId: string, reason: string) {
    const response = await api.post(`/admin/users/${userId}/ban`, { reason })
    return response.data
  }

  static async unbanUser(userId: string) {
    const response = await api.post(`/admin/users/${userId}/unban`)
    return response.data
  }

  static async adjustBalance(userId: string, data: { 
    amount: number
    operation: 'add' | 'deduct'
    reason: string
  }) {
    const response = await api.post(`/admin/users/${userId}/adjust-balance`, data)
    return response.data
  }

  static async getAdminWithdrawals(status?: string) {
    const response = await api.get('/admin/withdrawals', { params: { status } })
    return response.data
  }

  static async getAdminDeposits(status?: string) {
    const response = await api.get('/admin/deposits', { params: { status } })
    return response.data
  }

  static async approveWithdrawal(withdrawalId: string) {
    const response = await api.post(`/admin/withdrawals/${withdrawalId}/approve`)
    return response.data
  }

  static async rejectWithdrawal(withdrawalId: string, reason: string) {
    const response = await api.post(`/admin/withdrawals/${withdrawalId}/reject`, { reason })
    return response.data
  }

  static async getAdminSellAds(status?: string) {
    const response = await api.get('/admin/ads', { params: { status } })
    return response.data
  }

  static async completeAd(adId: string) {
    const response = await api.post(`/admin/ads/${adId}/complete`)
    return response.data
  }

  static async uploadReceipt(adId: string, file: File) {
    const formData = new FormData()
    formData.append('receipt', file)
    const response = await api.post(`/admin/ads/${adId}/upload-receipt`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  }

  static async getAdminAdRequests() {
    const response = await api.get('/admin/ad-requests')
    return response.data
  }

  static async approveAdRequest(requestId: string, type: 'edit' | 'delete') {
    const response = await api.post(`/admin/ad-requests/${requestId}/approve`, { type })
    return response.data
  }

  static async rejectAdRequest(requestId: string, type: 'edit' | 'delete', reason: string) {
    const response = await api.post(`/admin/ad-requests/${requestId}/reject`, { type, reason })
    return response.data
  }

  static async getPlatformSettings() {
    const response = await api.get('/admin/settings')
    return response.data
  }

  static async getPublicSettings() {
    const response = await api.get('/users/platform-settings')
    return response.data
  }

  static async updatePlatformSettings(key: string, value: string) {
    const response = await api.put('/admin/settings', { key, value })
    return response.data
  }

  static async getAuditLog(action?: string, limit: number = 100) {
    const response = await api.get('/admin/audit-log', { params: { action, limit } })
    return response.data
  }

  // Notifications
  static async getNotifications() {
    const response = await api.get('/notifications')
    return response.data
  }

  static async markNotificationRead(id: string) {
    const response = await api.patch(`/notifications/${id}/read`)
    return response.data
  }

  static async markAllNotificationsRead() {
    const response = await api.patch('/notifications/read-all')
    return response.data
  }
}
