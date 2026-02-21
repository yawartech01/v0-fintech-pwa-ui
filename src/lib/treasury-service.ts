// TreasuryService: Manages company hot wallet float

import type { Treasury } from '@/types'

const INITIAL_HOT_WALLET_USDT = 50000 // Start with 50k USDT float

export class TreasuryService {
  /**
   * Initialize treasury with default values
   */
  static initialize(): Treasury {
    return {
      hotWalletUsdt: INITIAL_HOT_WALLET_USDT,
      totalDepositAddressesUsdt: 0,
      totalSweptUsdt: 0,
      lastUpdated: new Date(),
    }
  }

  /**
   * Add swept funds to hot wallet
   */
  static addSweptFunds(treasury: Treasury, amountUsdt: number): Treasury {
    return {
      ...treasury,
      hotWalletUsdt: treasury.hotWalletUsdt + amountUsdt,
      totalSweptUsdt: treasury.totalSweptUsdt + amountUsdt,
      lastUpdated: new Date(),
    }
  }

  /**
   * Deduct from hot wallet (for payouts)
   */
  static deductPayout(treasury: Treasury, amountUsdt: number): Treasury {
    if (treasury.hotWalletUsdt < amountUsdt) {
      throw new Error('Insufficient hot wallet balance')
    }

    return {
      ...treasury,
      hotWalletUsdt: treasury.hotWalletUsdt - amountUsdt,
      lastUpdated: new Date(),
    }
  }

  /**
   * Update total held in deposit addresses
   */
  static updateDepositAddressesTotal(treasury: Treasury, totalUsdt: number): Treasury {
    return {
      ...treasury,
      totalDepositAddressesUsdt: totalUsdt,
      lastUpdated: new Date(),
    }
  }

  /**
   * Get treasury health status
   */
  static getHealthStatus(treasury: Treasury): {
    status: 'healthy' | 'warning' | 'critical'
    message: string
  } {
    const hotWalletPercent =
      (treasury.hotWalletUsdt / (treasury.hotWalletUsdt + treasury.totalDepositAddressesUsdt)) * 100

    if (treasury.hotWalletUsdt < 5000) {
      return { status: 'critical', message: 'Hot wallet critically low' }
    }

    if (treasury.hotWalletUsdt < 10000) {
      return { status: 'warning', message: 'Hot wallet running low' }
    }

    if (hotWalletPercent < 20) {
      return { status: 'warning', message: 'Consider sweeping more funds' }
    }

    return { status: 'healthy', message: 'Treasury healthy' }
  }
}
