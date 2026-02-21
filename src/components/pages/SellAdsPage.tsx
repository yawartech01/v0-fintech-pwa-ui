import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { dataStore } from '@/lib/data-store'
import { RateService } from '@/lib/rate-service'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, X, ExternalLink, Copy, CheckCheck } from 'lucide-react'
import { formatNumber, formatDate } from '@/lib/utils'
import { showToast } from '@/lib/toast'
import { APIService } from '@/services/api-service'
import { useRealAPI } from '@/config/api-mode'
import { connectWebSocket } from '@/lib/api-client'
import type { SellAd, AdEditRequest, AdDeleteRequest } from '@/types'

// ─── Detail Modal ────────────────────────────────────────────────────────────
function AdDetailSheet({
  ad,
  todayRate,
  onClose,
  onRequestEdit,
  onRequestDelete,
}: {
  ad: SellAd
  todayRate: number
  onClose: () => void
  onRequestEdit: (ad: SellAd) => void
  onRequestDelete: (ad: SellAd) => void
}) {
  const [copied, setCopied] = useState(false)
  const isCompleted = ad.status === 'COMPLETED'
  const inrAmount = ad.amountTotalUsdt * todayRate
  const apiBase = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'

  const copyAdCode = () => {
    if (ad.adCode) {
      navigator.clipboard.writeText(ad.adCode).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Sheet */}
      <div
        className="relative z-10 w-full max-w-lg bg-card rounded-t-2xl shadow-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div>
            <h2 className="text-lg font-bold">Ad Details</h2>
            {ad.adCode && (
              <button
                onClick={copyAdCode}
                className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors mt-0.5"
              >
                <span className="font-mono font-semibold">{ad.adCode}</span>
                {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
          <Button onClick={onClose} variant="ghost" size="icon" className="shrink-0">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="px-5 py-4 space-y-4">

          {/* Status + Amount */}
          <div className="text-center py-3 rounded-xl bg-secondary/40">
            <p className="text-3xl font-bold">{formatNumber(ad.amountTotalUsdt)} USDT</p>
            <p className="text-muted-foreground text-lg mt-1">≈ ₹{formatNumber(inrAmount)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">@ ₹{formatNumber(todayRate)} per USDT</p>
            <Badge className="mt-2" variant={isCompleted ? 'secondary' : 'default'}>
              {isCompleted ? 'Completed' : 'Processing'}
            </Badge>
          </div>

          {/* Timeline */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Timeline</h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">{formatDate(ad.createdAt)}</span>
              </div>
              {isCompleted && ad.completedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {formatDate(ad.completedAt as string)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Bank Account */}
          {(ad.bankName || ad.accountNumber) && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Payout Bank Account</h3>
              <div className="p-3 rounded-lg bg-secondary/40 space-y-1 text-sm">
                {ad.bankName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bank</span>
                    <span className="font-medium">{ad.bankName}</span>
                  </div>
                )}
                {ad.accountHolderName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Holder</span>
                    <span className="font-medium">{ad.accountHolderName}</span>
                  </div>
                )}
                {ad.accountNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account</span>
                    <span className="font-mono font-semibold">
                      •••{ad.accountNumber.slice(-4)}
                    </span>
                  </div>
                )}
                {ad.ifscCode && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IFSC</span>
                    <span className="font-mono font-medium">{ad.ifscCode}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Completion & Receipt */}
          {isCompleted && (
            <div className="p-3 rounded-lg bg-secondary/40 border border-border/50 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Payment Processed
              </p>
              {ad.paymentReceipt && (
                <Button
                  onClick={() => window.open(`${apiBase}${ad.paymentReceipt}`, '_blank')}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Payment Receipt
                </Button>
              )}
            </div>
          )}

          {/* Actions for active/processing ads */}
          {!isCompleted && (
            <div className="flex gap-3 pt-1">
              <Button onClick={() => { onRequestEdit(ad); onClose() }} variant="outline" className="flex-1">
                Request Edit
              </Button>
              <Button onClick={() => { onClose(); onRequestDelete(ad) }} variant="outline" className="flex-1">
                Request Delete
              </Button>
            </div>
          )}

          {/* Ad ID footer */}
          <p className="text-center text-xs text-muted-foreground pb-2">
            Internal ID: {ad.id.slice(0, 8)}…
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function SellAdsPage() {
  const useAPI = useRealAPI()
  const navigate = useNavigate()
  const [ads, setAds] = useState<SellAd[]>([])
  const [editRequests, setEditRequests] = useState<AdEditRequest[]>([])
  const [deleteRequests, setDeleteRequests] = useState<AdDeleteRequest[]>([])
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [todayRate, setTodayRate] = useState(0)
  const [selectedAd, setSelectedAd] = useState<SellAd | null>(null)

  const userId = dataStore.getAuthState().user?.id || localStorage.getItem('user_id') || ''

  const loadData = useCallback(async () => {
    try {
      if (useAPI) {
        const [userAds, rateData] = await Promise.all([
          APIService.getSellAds(),
          APIService.getPublicSettings(),
        ])
        const rawAds: any[] = Array.isArray(userAds) ? userAds : (userAds as any)?.ads || []
        const normalizedAds: SellAd[] = rawAds.map((a: any) => ({
          id: a.id,
          adCode: a.ad_code || a.adCode,
          userId: a.user_id || a.userId,
          bankAccountId: a.bank_account_id || a.bankAccountId,
          bankName: a.bank_name || a.bankName,
          accountHolderName: a.account_holder_name || a.accountHolderName,
          accountNumber: a.account_number || a.accountNumber,
          ifscCode: a.ifsc_code || a.ifscCode,
          amountTotalUsdt: parseFloat(a.amount_total_usdt ?? a.amountTotalUsdt ?? 0),
          amountRemainingUsdt: parseFloat(a.amount_remaining_usdt ?? a.amountRemainingUsdt ?? 0),
          status: a.status,
          paymentReceipt: a.payment_receipt || a.paymentReceipt || null,
          createdAt: a.created_at || a.createdAt,
          updatedAt: a.updated_at || a.updatedAt,
          completedAt: a.completed_at || a.completedAt || null,
        }))
        setAds(normalizedAds)
        setTodayRate(parseFloat(rateData.usdtInrRate) || 0)
        setEditRequests([])
        setDeleteRequests([])

        // Refresh selected ad if open
        if (selectedAd) {
          const updated = normalizedAds.find(a => a.id === selectedAd.id)
          if (updated) setSelectedAd(updated)
        }
      } else {
        const mockUserId = dataStore.getAuthState().user?.id || ''
        if (!mockUserId) return
        const userAds = dataStore.getSellAds(mockUserId)
        const validAds = userAds.map((ad) => {
          if ((ad.status as any) === 'PAUSED') return { ...ad, status: 'ACTIVE' as const }
          return ad
        })
        setAds(validAds)
        setEditRequests(dataStore.getAdEditRequests(mockUserId))
        setDeleteRequests(dataStore.getAdDeleteRequests(mockUserId))
        setTodayRate(RateService.getCurrentRate().rate)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      showToast('Error loading ads: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error')
      setAds([])
    }
  }, [useAPI]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 15000)
    return () => clearInterval(interval)
  }, [loadData])

  useEffect(() => {
    if (!userId) return
    const socket = connectWebSocket(userId)
    const handler = () => loadData()
    socket.on('ad_updated', handler)
    socket.on('ad_created', handler)
    socket.on('wallet_updated', handler)
    return () => {
      socket.off('ad_updated', handler)
      socket.off('ad_created', handler)
      socket.off('wallet_updated', handler)
    }
  }, [userId, loadData])

  const filteredAds = ads.filter((ad) => {
    if (filter === 'all') return true
    if (filter === 'active') return ad.status === 'ACTIVE' || (ad.status as string) === 'PAUSED'
    return ad.status === 'COMPLETED'
  })

  const handleRequestEdit = (ad: SellAd) => navigate(`/sell-ads/edit/${ad.id}`)

  const handleRequestDelete = async (ad: SellAd) => {
    const uid = dataStore.getAuthState().user?.id || localStorage.getItem('user_id') || ''
    if (!uid && !useAPI) return
    if (!confirm('Request to delete this ad? It will be reviewed by the company.')) return
    try {
      if (useAPI) {
        await APIService.requestAdDelete(ad.id)
      } else {
        dataStore.requestAdDelete(uid, ad.id)
      }
      showToast('Delete request submitted for review', 'success')
      loadData()
    } catch (error: any) {
      showToast(error.response?.data?.error || (error instanceof Error ? error.message : 'Failed to submit request'), 'error')
    }
  }

  const getPendingRequestForAd = (adId: string): 'edit' | 'delete' | null => {
    if (editRequests.some((r) => r.adId === adId && r.status === 'PENDING')) return 'edit'
    if (deleteRequests.some((r) => r.adId === adId && r.status === 'PENDING')) return 'delete'
    return null
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-none border-b border-border/60 bg-card px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Sell Ads</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your USDT sell listings</p>
          </div>
          <Button onClick={() => navigate('/sell-ads/create')} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Ad
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mt-4">
          {(['all', 'active', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto py-3 space-y-3">
        {filteredAds.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              {filter === 'all' ? 'No sell ads yet' : `No ${filter} ads`}
            </p>
            {filter === 'all' && (
              <Button onClick={() => navigate('/sell-ads/create')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Ad
              </Button>
            )}
          </Card>
        ) : (
          filteredAds.map((ad) => {
            const pendingRequest = getPendingRequestForAd(ad.id)
            const inrAmount = ad.amountTotalUsdt * todayRate
            const isCompleted = ad.status === 'COMPLETED'

            return (
              <Card
                key={ad.id}
                className="p-4 cursor-pointer hover:bg-secondary/30 active:bg-secondary/40 transition-all active:scale-[0.99]"
                onClick={() => setSelectedAd(ad)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl font-bold text-foreground">
                        {formatNumber(ad.amountTotalUsdt)} USDT
                      </span>
                      <Badge variant={isCompleted ? 'secondary' : 'default'}>
                        {isCompleted ? 'Completed' : 'Processing'}
                      </Badge>
                    </div>

                    <p className="text-base text-muted-foreground">≈ ₹{formatNumber(inrAmount)}</p>

                    <div className="flex items-center gap-3 mt-1.5">
                      {ad.adCode && (
                        <span className="text-xs font-mono text-primary font-semibold">{ad.adCode}</span>
                      )}
                      <span className="text-xs text-muted-foreground">{formatDate(ad.createdAt)}</span>
                    </div>
                  </div>

                  {/* Tap to view indicator */}
                  <div className="text-xs text-muted-foreground/60 ml-2 mt-1">›</div>
                </div>

                {/* Pending Request Banner */}
                {pendingRequest && (
                  <div className="mt-2 p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      {pendingRequest === 'edit' && '⏳ Edit request pending review'}
                      {pendingRequest === 'delete' && '⏳ Delete request pending review'}
                    </p>
                  </div>
                )}

                {/* Completed confirmation */}
                {isCompleted && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Tap to view details{ad.paymentReceipt ? ' & receipt' : ''}</span>
                  </div>
                )}
              </Card>
            )
          })
        )}
      </div>

      {/* Detail Sheet */}
      {selectedAd && (
        <AdDetailSheet
          ad={selectedAd}
          todayRate={todayRate}
          onClose={() => setSelectedAd(null)}
          onRequestEdit={handleRequestEdit}
          onRequestDelete={handleRequestDelete}
        />
      )}
    </div>
  )
}
