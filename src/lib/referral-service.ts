// ReferralService: 2-level leader referral system with volume-based rewards
// Business rules:
// - Direct (L1): 0.2% of referee's COMPLETED sell volume
// - Upline (L2): 0.1% of referee's COMPLETED sell volume
// - Only two levels (leader and upline)
// - 14-day hold period before rewards become Paid
// - Eligibility gates: account age >= 14 days, >= 2 completed payouts, >= 2000 USDT completed sell volume
// - Anti-abuse checks: bank account overlap, deviceId match, phone/email match
// - Caps: 20k USDT per referee, 50 USDT/day per referrer, 500 USDT/month per referrer, max 10 rewarded referees/month

import type { ReferralProfile, ReferralReward, ReferrerCapTracking, BankAccount } from '@/types'

// Constants
export const DIRECT_REWARD_PCT = 0.002 // 0.2%
export const UPLINE_REWARD_PCT = 0.001 // 0.1%
export const ELIGIBILITY_MIN_ACCOUNT_AGE_DAYS = 14
export const ELIGIBILITY_MIN_COMPLETED_PAYOUTS = 2
export const ELIGIBILITY_MIN_TOTAL_VOLUME_USDT = 2000
export const REWARD_HOLD_PERIOD_DAYS = 14
export const MAX_VOLUME_PER_REFEREE_USDT = 20000
export const MAX_DAILY_REWARDS_PER_REFERRER_USDT = 50
export const MAX_MONTHLY_REWARDS_PER_REFERRER_USDT = 500
export const MAX_REWARDED_REFEREES_PER_MONTH = 10

/**
 * Get current timestamp with optional dev time offset
 */
export function getCurrentTimestamp(devTimeOffset?: number): Date {
  return new Date(Date.now() + (devTimeOffset || 0))
}

/**
 * Check if referee meets eligibility gates
 */
export function checkEligibility(
  profile: ReferralProfile,
  devTimeOffset?: number
): { eligible: boolean; reason?: string } {
  const now = getCurrentTimestamp(devTimeOffset)
  const accountAgeDays =
    (now.getTime() - new Date(profile.joinedAt).getTime()) / (1000 * 60 * 60 * 24)

  if (accountAgeDays < ELIGIBILITY_MIN_ACCOUNT_AGE_DAYS) {
    return {
      eligible: false,
      reason: `Account age ${accountAgeDays.toFixed(1)}d < ${ELIGIBILITY_MIN_ACCOUNT_AGE_DAYS}d`,
    }
  }

  if (profile.completedPayoutCount < ELIGIBILITY_MIN_COMPLETED_PAYOUTS) {
    return {
      eligible: false,
      reason: `Completed payouts ${profile.completedPayoutCount} < ${ELIGIBILITY_MIN_COMPLETED_PAYOUTS}`,
    }
  }

  if (profile.cumulativeCompletedSellVolumeUsdt < ELIGIBILITY_MIN_TOTAL_VOLUME_USDT) {
    return {
      eligible: false,
      reason: `Total volume ${profile.cumulativeCompletedSellVolumeUsdt} USDT < ${ELIGIBILITY_MIN_TOTAL_VOLUME_USDT} USDT`,
    }
  }

  return { eligible: true }
}

/**
 * Check for bank account overlap (anti-abuse)
 */
export function checkBankAccountOverlap(
  refereeAccounts: BankAccount[],
  referrerAccounts: BankAccount[]
): { hasOverlap: boolean; matchedAccount?: BankAccount } {
  for (const refAccount of refereeAccounts) {
    for (const rerAccount of referrerAccounts) {
      if (
        refAccount.accountNumber === rerAccount.accountNumber &&
        refAccount.ifscCode === rerAccount.ifscCode
      ) {
        return { hasOverlap: true, matchedAccount: refAccount }
      }
    }
  }
  return { hasOverlap: false }
}

/**
 * Check for deviceId match (anti-abuse)
 */
export function checkDeviceIdMatch(
  refereeDeviceId: string | undefined,
  referrerDeviceId: string | undefined
): boolean {
  if (!refereeDeviceId || !referrerDeviceId) return false
  return refereeDeviceId === referrerDeviceId
}

/**
 * Check for phone/email match (anti-abuse)
 */
export function checkContactMatch(
  refereeEmail: string,
  refereePhone: string | undefined,
  referrerEmail: string,
  referrerPhone: string | undefined
): boolean {
  if (refereeEmail === referrerEmail) return true
  if (refereePhone && referrerPhone && refereePhone === referrerPhone) return true
  return false
}

/**
 * Initialize referrer cap tracking
 */
export function initCapTracking(userId: string): ReferrerCapTracking {
  return {
    userId,
    dailyRewardsUsdt: 0,
    monthlyRewardsUsdt: 0,
    monthlyRewardedRefereeCount: 0,
    lastDailyReset: new Date(),
    lastMonthlyReset: new Date(),
    refereeVolumeTracking: {},
  }
}

/**
 * Reset caps if needed (daily/monthly)
 */
export function resetCapsIfNeeded(
  tracking: ReferrerCapTracking,
  devTimeOffset?: number
): ReferrerCapTracking {
  const now = getCurrentTimestamp(devTimeOffset)
  const updated = { ...tracking }

  // Reset daily
  const daysSinceLastDaily =
    (now.getTime() - new Date(tracking.lastDailyReset).getTime()) / (1000 * 60 * 60 * 24)
  if (daysSinceLastDaily >= 1) {
    updated.dailyRewardsUsdt = 0
    updated.lastDailyReset = now
  }

  // Reset monthly
  const daysSinceLastMonthly =
    (now.getTime() - new Date(tracking.lastMonthlyReset).getTime()) / (1000 * 60 * 60 * 24)
  if (daysSinceLastMonthly >= 30) {
    updated.monthlyRewardsUsdt = 0
    updated.monthlyRewardedRefereeCount = 0
    updated.lastMonthlyReset = now
  }

  return updated
}

/**
 * Check if referrer can receive rewards (caps)
 */
export function checkReferrerCaps(
  tracking: ReferrerCapTracking,
  refereeUserId: string,
  newRewardUsdt: number
): { canReceive: boolean; reason?: string } {
  // Check per-referee volume cap
  const refereeVolume = tracking.refereeVolumeTracking[refereeUserId] || 0
  if (refereeVolume >= MAX_VOLUME_PER_REFEREE_USDT) {
    return {
      canReceive: false,
      reason: `Referee ${refereeUserId} has reached max volume cap (${MAX_VOLUME_PER_REFEREE_USDT} USDT)`,
    }
  }

  // Check daily cap
  if (tracking.dailyRewardsUsdt + newRewardUsdt > MAX_DAILY_REWARDS_PER_REFERRER_USDT) {
    return {
      canReceive: false,
      reason: `Daily cap reached (${MAX_DAILY_REWARDS_PER_REFERRER_USDT} USDT)`,
    }
  }

  // Check monthly cap
  if (tracking.monthlyRewardsUsdt + newRewardUsdt > MAX_MONTHLY_REWARDS_PER_REFERRER_USDT) {
    return {
      canReceive: false,
      reason: `Monthly cap reached (${MAX_MONTHLY_REWARDS_PER_REFERRER_USDT} USDT)`,
    }
  }

  // Check monthly referee count
  const isNewRefereeThisMonth = !(refereeUserId in tracking.refereeVolumeTracking)
  if (
    isNewRefereeThisMonth &&
    tracking.monthlyRewardedRefereeCount >= MAX_REWARDED_REFEREES_PER_MONTH
  ) {
    return {
      canReceive: false,
      reason: `Max rewarded referees per month reached (${MAX_REWARDED_REFEREES_PER_MONTH})`,
    }
  }

  return { canReceive: true }
}

/**
 * Update referrer cap tracking after reward creation
 */
export function updateCapTracking(
  tracking: ReferrerCapTracking,
  refereeUserId: string,
  volumeUsdt: number,
  rewardUsdt: number
): ReferrerCapTracking {
  const isNewReferee = !(refereeUserId in tracking.refereeVolumeTracking)

  return {
    ...tracking,
    dailyRewardsUsdt: tracking.dailyRewardsUsdt + rewardUsdt,
    monthlyRewardsUsdt: tracking.monthlyRewardsUsdt + rewardUsdt,
    monthlyRewardedRefereeCount: isNewReferee
      ? tracking.monthlyRewardedRefereeCount + 1
      : tracking.monthlyRewardedRefereeCount,
    refereeVolumeTracking: {
      ...tracking.refereeVolumeTracking,
      [refereeUserId]: (tracking.refereeVolumeTracking[refereeUserId] || 0) + volumeUsdt,
    },
  }
}

/**
 * Compute reward amount with per-referee cap
 */
export function computeRewardAmount(
  volumeUsdt: number,
  rewardPct: number,
  refereeUserId: string,
  tracking: ReferrerCapTracking
): number {
  const currentRefereeVolume = tracking.refereeVolumeTracking[refereeUserId] || 0
  const remainingCap = MAX_VOLUME_PER_REFEREE_USDT - currentRefereeVolume

  if (remainingCap <= 0) return 0

  const eligibleVolume = Math.min(volumeUsdt, remainingCap)
  return eligibleVolume * rewardPct
}

/**
 * Create a reward entry
 */
export function createReward(
  referrerUserId: string,
  refereeUserId: string,
  level: 'direct' | 'upline',
  volumeUsdt: number,
  rewardUsdt: number,
  status: 'pending' | 'eligible' | 'held' | 'rejected',
  sellAdId: string,
  devTimeOffset?: number,
  rejectionReason?: string
): ReferralReward {
  const now = getCurrentTimestamp(devTimeOffset)
  const holdUntil =
    status === 'eligible'
      ? new Date(now.getTime() + REWARD_HOLD_PERIOD_DAYS * 24 * 60 * 60 * 1000)
      : undefined

  return {
    id: `reward_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    referrerUserId,
    refereeUserId,
    level,
    volumeUsdt,
    rewardUsdt,
    status,
    createdAt: now,
    holdUntil,
    sellAdId,
    rejectionReason,
  }
}

/**
 * Process rewards that have passed their hold period
 */
export function processHeldRewards(
  rewards: ReferralReward[],
  devTimeOffset?: number
): ReferralReward[] {
  const now = getCurrentTimestamp(devTimeOffset)

  return rewards.map((reward) => {
    if (reward.status === 'eligible' && reward.holdUntil) {
      const holdUntilDate = new Date(reward.holdUntil)
      if (now >= holdUntilDate) {
        return {
          ...reward,
          status: 'paid',
          paidAt: now,
        }
      }
    }
    return reward
  })
}
