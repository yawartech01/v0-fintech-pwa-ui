// Rate Service - Manages USDT to INR exchange rate
import type { USDTRate } from '@/types'

export class RateService {
  /**
   * Get current USDT rate from storage
   */
  static getCurrentRate(): USDTRate {
    const stored = localStorage.getItem('veltox_app_state_v3')
    if (stored) {
      const state = JSON.parse(stored)
      return {
        ...state.usdtRate,
        lastUpdated: new Date(state.usdtRate.lastUpdated),
      }
    }

    return {
      rate: 92.45,
      lastUpdated: new Date(),
      change24h: 0.32,
    }
  }

  /**
   * Update USDT rate (admin only)
   */
  static updateRate(newRate: number, change24h: number = 0): USDTRate {
    const stored = localStorage.getItem('veltox_app_state_v3')
    if (stored) {
      const state = JSON.parse(stored)
      state.usdtRate = {
        rate: newRate,
        lastUpdated: new Date().toISOString(),
        change24h,
      }
      localStorage.setItem('veltox_app_state_v3', JSON.stringify(state))

      return {
        rate: newRate,
        lastUpdated: new Date(),
        change24h,
      }
    }

    return RateService.getCurrentRate()
  }

  /**
   * Format rate with currency symbol
   */
  static formatRate(rate: USDTRate): string {
    return `₹${rate.rate.toFixed(2)}`
  }

  /**
   * Get relative time string for last updated
   */
  static getLastUpdatedText(lastUpdated: Date | string): string {
    const dateObj = lastUpdated instanceof Date ? lastUpdated : new Date(lastUpdated)
    const now = new Date()
    const diffMs = now.getTime() - dateObj.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`

    return dateObj.toLocaleDateString()
  }
}
