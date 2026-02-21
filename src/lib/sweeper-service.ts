// SweeperService: Manages sweep jobs and threshold logic

import type { Deposit, SweepJob, Treasury } from '@/types'

const SWEEP_THRESHOLD_USDT = 1000 // Only sweep when >= 1000 USDT
const SWEEP_INTERVAL_MS = 30000 // Check every 30 seconds in dev mode

export class SweeperService {
  /**
   * Check if a deposit address is eligible for sweeping
   */
  static computeSweepEligible(
    depositAddress: string,
    deposits: Deposit[]
  ): {
    eligible: boolean
    confirmedTotal: number
    unsweptDeposits: Deposit[]
  } {
    // Get all confirmed, unswept deposits for this address
    const unsweptDeposits = deposits.filter(
      (d) => d.depositAddress === depositAddress && d.status === 'confirmed' && !d.sweptAt
    )

    const confirmedTotal = unsweptDeposits.reduce((sum, d) => sum + d.amountUsdt, 0)

    const eligible = confirmedTotal >= SWEEP_THRESHOLD_USDT

    return {
      eligible,
      confirmedTotal,
      unsweptDeposits,
    }
  }

  /**
   * Queue sweep jobs for all eligible addresses
   */
  static queueSweepJobs(allDeposits: Deposit[], existingJobs: SweepJob[]): SweepJob[] {
    const newJobs: SweepJob[] = []

    // Group deposits by address
    const addressMap = new Map<string, Deposit[]>()
    allDeposits.forEach((deposit) => {
      if (!addressMap.has(deposit.depositAddress)) {
        addressMap.set(deposit.depositAddress, [])
      }
      addressMap.get(deposit.depositAddress)!.push(deposit)
    })

    // Check each address for sweep eligibility
    addressMap.forEach((deposits, address) => {
      const { eligible, confirmedTotal } = this.computeSweepEligible(address, deposits)

      if (!eligible) {
        return
      }

      // Check if already has a queued/processing job for this address
      const hasActiveJob = existingJobs.some(
        (job) =>
          job.depositAddress === address && (job.status === 'queued' || job.status === 'processing')
      )

      if (hasActiveJob) {
        return
      }

      // Create new sweep job
      const job: SweepJob = {
        id: `sweep_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        depositAddress: address,
        amountUsdt: confirmedTotal,
        status: 'queued',
        queuedAt: new Date(),
      }

      newJobs.push(job)
    })

    return [...existingJobs, ...newJobs]
  }

  /**
   * Execute a single sweep job
   * Moves funds from deposit address to treasury hot wallet
   */
  static executeSweep(
    job: SweepJob,
    deposits: Deposit[],
    treasury: Treasury
  ): {
    updatedJob: SweepJob
    updatedDeposits: Deposit[]
    updatedTreasury: Treasury
  } {
    if (job.status !== 'queued') {
      throw new Error(`Job ${job.id} is not in queued state`)
    }

    // Mark job as processing
    let updatedJob: SweepJob = {
      ...job,
      status: 'processing',
      processedAt: new Date(),
    }

    try {
      // Find all unswept deposits for this address
      const { unsweptDeposits } = this.computeSweepEligible(job.depositAddress, deposits)

      // Mark deposits as swept
      const updatedDeposits = deposits.map((d) => {
        if (unsweptDeposits.find((ud) => ud.id === d.id)) {
          return {
            ...d,
            status: 'swept' as const,
            sweptAt: new Date(),
          }
        }
        return d
      })

      // Add to treasury hot wallet
      const updatedTreasury: Treasury = {
        ...treasury,
        hotWalletUsdt: treasury.hotWalletUsdt + job.amountUsdt,
        totalSweptUsdt: treasury.totalSweptUsdt + job.amountUsdt,
        lastUpdated: new Date(),
      }

      // Mark job as completed
      updatedJob = {
        ...updatedJob,
        status: 'completed',
        completedAt: new Date(),
      }

      return {
        updatedJob,
        updatedDeposits,
        updatedTreasury,
      }
    } catch (error) {
      // Mark job as failed
      updatedJob = {
        ...updatedJob,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      }

      return {
        updatedJob,
        updatedDeposits: deposits,
        updatedTreasury: treasury,
      }
    }
  }

  /**
   * Process all queued sweep jobs
   */
  static processQueuedJobs(
    jobs: SweepJob[],
    deposits: Deposit[],
    treasury: Treasury
  ): {
    updatedJobs: SweepJob[]
    updatedDeposits: Deposit[]
    updatedTreasury: Treasury
  } {
    let currentDeposits = deposits
    let currentTreasury = treasury
    const updatedJobs = [...jobs]

    // Process only queued jobs
    const queuedJobs = jobs.filter((j) => j.status === 'queued')

    queuedJobs.forEach((job) => {
      const jobIndex = updatedJobs.findIndex((j) => j.id === job.id)

      const result = this.executeSweep(job, currentDeposits, currentTreasury)

      updatedJobs[jobIndex] = result.updatedJob
      currentDeposits = result.updatedDeposits
      currentTreasury = result.updatedTreasury
    })

    return {
      updatedJobs,
      updatedDeposits: currentDeposits,
      updatedTreasury: currentTreasury,
    }
  }

  /**
   * Get sweep threshold
   */
  static getSweepThreshold(): number {
    return SWEEP_THRESHOLD_USDT
  }

  /**
   * Get recommended sweep interval
   */
  static getSweepInterval(): number {
    return SWEEP_INTERVAL_MS
  }
}
