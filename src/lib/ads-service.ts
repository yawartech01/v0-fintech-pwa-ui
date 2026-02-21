import type { SellAd, CreateSellAdRequest, AdStatus } from '@/types'

export class AdsService {
  // Validate create ad request
  static validateCreateAd(request: CreateSellAdRequest, availableUsdt: number): void {
    if (request.amountTotalUsdt <= 0) {
      throw new Error('Amount must be greater than 0')
    }

    if (request.amountTotalUsdt > availableUsdt) {
      throw new Error('Insufficient available balance')
    }

    if (request.minPerOrderUsdt && request.maxPerOrderUsdt) {
      if (request.minPerOrderUsdt > request.maxPerOrderUsdt) {
        throw new Error('Minimum per order cannot exceed maximum per order')
      }
    }

    if (!request.bankAccountId) {
      throw new Error('Bank account is required')
    }
  }

  // Create a new sell ad
  static createAd(userId: string, request: CreateSellAdRequest): SellAd {
    const now = new Date()
    const ad: SellAd = {
      id: `ad_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      userId,
      status: 'ACTIVE', // Always starts ACTIVE
      amountTotalUsdt: request.amountTotalUsdt,
      amountRemainingUsdt: request.amountTotalUsdt,
      minPerOrderUsdt: request.minPerOrderUsdt,
      maxPerOrderUsdt: request.maxPerOrderUsdt,
      bankAccountId: request.bankAccountId,
      notes: request.notes,
      createdAt: now,
      updatedAt: now,
    }

    return ad
  }

  // Validate update ad
  static validateUpdateAd(
    updates: Partial<
      Pick<SellAd, 'minPerOrderUsdt' | 'maxPerOrderUsdt' | 'notes' | 'bankAccountId'>
    >
  ): void {
    if (updates.minPerOrderUsdt !== undefined && updates.maxPerOrderUsdt !== undefined) {
      if (updates.minPerOrderUsdt > updates.maxPerOrderUsdt) {
        throw new Error('Minimum per order cannot exceed maximum per order')
      }
    }

    if (updates.bankAccountId !== undefined && !updates.bankAccountId) {
      throw new Error('Bank account is required')
    }
  }

  // Update ad (returns updated ad)
  static updateAd(
    ad: SellAd,
    updates: Partial<
      Pick<SellAd, 'minPerOrderUsdt' | 'maxPerOrderUsdt' | 'notes' | 'bankAccountId'>
    >
  ): SellAd {
    return {
      ...ad,
      ...updates,
      updatedAt: new Date(),
    }
  }

  // Validate mark as sold
  static validateMarkAsSold(ad: SellAd): void {
    if (ad.status !== 'ACTIVE') {
      throw new Error('Only ACTIVE ads can be marked as sold')
    }

    if (ad.amountRemainingUsdt <= 0) {
      throw new Error('Ad has no remaining amount to sell')
    }
  }

  // Mark ad as sold (returns updated ad)
  static markAsSold(ad: SellAd): SellAd {
    return {
      ...ad,
      status: 'COMPLETED',
      amountRemainingUsdt: 0,
      updatedAt: new Date(),
    }
  }

  // Filter ads by status
  static filterAdsByStatus(ads: SellAd[], status?: AdStatus): SellAd[] {
    if (!status) {
      return ads
    }
    return ads.filter((ad) => ad.status === status)
  }

  // Sort ads by date (newest first)
  static sortAdsByDate(ads: SellAd[]): SellAd[] {
    return [...ads].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }
}
