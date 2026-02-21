// WalletService: Manages TRC20-only deposits and user balances

import type { Deposit, DepositAddress, Wallet, Transaction } from '@/types'

const REQUIRED_CONFIRMATIONS = 3
// const CONFIRMATION_INTERVAL_MS = 5000 // Simulate confirmation every 5s (not used in service)

export class WalletService {
  /**
   * Get or create unique TRC20 deposit address for user
   */
  static getDepositAddress(userId: string): DepositAddress {
    // In production, this would call backend to generate/retrieve address
    // For MVP, generate deterministic mock address
    const addressSuffix = userId.slice(0, 8).toUpperCase()
    const mockAddress = `T${addressSuffix}${'x'.repeat(26)}`

    return {
      network: 'TRC20',
      address: mockAddress,
      accumulatedUsdt: 0,
    }
  }

  /**
   * List all deposits for a user
   */
  static listDeposits(wallet: Wallet): Deposit[] {
    return wallet.deposits.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  /**
   * Get user balance summary
   */
  static getBalances(wallet: Wallet) {
    return {
      available: wallet.usdtBalance,
      locked: wallet.lockedUsdt,
      total: wallet.usdtBalance + wallet.lockedUsdt,
    }
  }

  /**
   * Get total USDT held on deposit address (confirmed but not swept)
   */
  static getDepositAddressBalance(wallet: Wallet): number {
    const confirmedDeposits = wallet.deposits.filter(
      (d) => d.status === 'confirmed' && d.sweptAt === undefined
    )
    return confirmedDeposits.reduce((sum, d) => sum + d.amountUsdt, 0)
  }

  /**
   * Simulate incoming deposit
   * Returns depositId for tracking confirmation progress
   */
  static createIncomingDeposit(
    userId: string,
    depositAddress: string,
    amountUsdt: number
  ): Deposit {
    const deposit: Deposit = {
      id: `dep_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      userId,
      depositAddress,
      network: 'TRC20',
      amountUsdt,
      txHash: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
      status: 'confirming',
      confirmations: 0,
      requiredConfirmations: REQUIRED_CONFIRMATIONS,
      createdAt: new Date(),
    }

    return deposit
  }

  /**
   * Increment confirmations for pending deposit (called by simulation)
   */
  static incrementConfirmations(deposit: Deposit): Deposit {
    if (deposit.status === 'swept' || deposit.status === 'confirmed') {
      return deposit
    }

    const newConfirmations = deposit.confirmations + 1
    const isConfirmed = newConfirmations >= deposit.requiredConfirmations

    return {
      ...deposit,
      confirmations: newConfirmations,
      status: isConfirmed ? 'confirmed' : 'confirming',
      confirmedAt: isConfirmed ? new Date() : deposit.confirmedAt,
    }
  }

  /**
   * Credit user balance when deposit is confirmed
   */
  static creditDeposit(wallet: Wallet, deposit: Deposit): Wallet {
    if (deposit.status !== 'confirmed') {
      return wallet
    }

    // Check if already credited
    const alreadyCredited = wallet.transactions.some(
      (tx) => tx.type === 'deposit' && tx.txHash === deposit.txHash
    )

    if (alreadyCredited) {
      return wallet
    }

    const transaction: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      type: 'deposit',
      amount: deposit.amountUsdt,
      status: 'completed',
      network: deposit.network,
      txHash: deposit.txHash,
      timestamp: new Date(),
      notes: `Deposit confirmed (${deposit.confirmations}/${deposit.requiredConfirmations} confirmations)`,
    }

    return {
      ...wallet,
      usdtBalance: wallet.usdtBalance + deposit.amountUsdt,
      transactions: [transaction, ...wallet.transactions],
    }
  }

  /**
   * Mark deposit as swept
   */
  static markDepositSwept(deposit: Deposit): Deposit {
    return {
      ...deposit,
      status: 'swept',
      sweptAt: new Date(),
    }
  }

  /**
   * Auto-increment confirmations for all confirming deposits
   * Call this periodically in dev/simulation mode
   */
  static processConfirmations(deposits: Deposit[]): Deposit[] {
    return deposits.map((deposit) => {
      if (deposit.status === 'confirming') {
        return this.incrementConfirmations(deposit)
      }
      return deposit
    })
  }
}
