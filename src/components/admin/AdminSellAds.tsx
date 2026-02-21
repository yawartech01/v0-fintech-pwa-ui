import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from './AdminLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatNumber, formatDate } from '@/lib/utils'
import { showToast } from '@/lib/toast'
import { APIService } from '@/services/api-service'
import { CheckCircle, Building, User } from 'lucide-react'

export function AdminSellAds() {
  const [ads, setAds] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [todayRate, setTodayRate] = useState(0)
  const [selectedAd, setSelectedAd] = useState<any>(null)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const loadAds = useCallback(async () => {
    try {
      setLoading(true)
      const [adsData, settingsData] = await Promise.all([
        APIService.getAdminSellAds(),
        APIService.getPlatformSettings(),
      ])
      const rawAds = Array.isArray(adsData) ? adsData : adsData?.ads || []
      setAds(rawAds)
      const settings = settingsData?.settings || settingsData || {}
      setTodayRate(parseFloat(settings.usdt_inr_rate || settings.usdtInrRate || '90'))
    } catch (err: any) {
      showToast('Failed to load ads: ' + (err?.response?.data?.error || err?.message), 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAds()
    const interval = setInterval(loadAds, 10000)
    return () => clearInterval(interval)
  }, [loadAds])

  const filteredAds = ads.filter((item) => {
    if (filter === 'all') return true
    if (filter === 'active') return item.status === 'ACTIVE' || item.status === 'PAUSED'
    return item.status === 'COMPLETED'
  })

  const handleConfirmPayment = async (ad: any) => {
    if (!confirm(`Mark this ad as PAID?\n\n${formatNumber(parseFloat(ad.amount_total_usdt || ad.amountTotalUsdt))} USDT → ₹${formatNumber(parseFloat(ad.amount_total_usdt || ad.amountTotalUsdt) * todayRate)}`)) return

    try {
      setSubmitting(true)
      if (receiptFile) {
        await APIService.uploadReceipt(ad.id, receiptFile)
      }
      await APIService.completeAd(ad.id)
      showToast('Ad marked as completed!', 'success')
      setSelectedAd(null)
      setReceiptFile(null)
      loadAds()
    } catch (err: any) {
      showToast('Failed: ' + (err?.response?.data?.error || err?.message), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="border-b border-border bg-background px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Sell Ads Management</h1>
              <p className="text-sm text-muted-foreground">Process payments and mark ads as completed</p>
            </div>
            <button onClick={loadAds} className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded border border-border">
              ↻ Refresh
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-border flex gap-2">
          {(['all', 'active', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                filter === f ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Completed'}
            </button>
          ))}
        </div>

        <div className="p-6">
        {loading && ads.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">Loading ads...</Card>
        ) : filteredAds.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">No sell ads yet</Card>
        ) : (
          <div className="space-y-4">
            {filteredAds.map((ad) => {
              const amountUsdt = parseFloat(ad.amount_total_usdt || ad.amountTotalUsdt || 0)
              const inrAmount = amountUsdt * todayRate
              const isCompleted = ad.status === 'COMPLETED'
              const isExpanded = selectedAd?.id === ad.id

              return (
                <Card key={ad.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold">{formatNumber(amountUsdt)} USDT</span>
                          <Badge variant={isCompleted ? 'secondary' : 'default'}>
                            {isCompleted ? 'Completed' : 'Processing'}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">≈ ₹{formatNumber(inrAmount)} @ ₹{formatNumber(todayRate)}/USDT</p>
                        <p className="text-xs text-muted-foreground mt-1">Created: {formatDate(ad.created_at || ad.createdAt)}</p>
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="flex items-start gap-3 p-3 bg-secondary/30 rounded">
                      <User className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">User Details</p>
                        <p className="text-sm text-muted-foreground">{ad.user_email || ad.email || '—'}</p>
                        <p className="text-xs text-muted-foreground">UID: {ad.uid || ad.user_uid || '—'}</p>
                      </div>
                    </div>

                    {/* Bank Account — full number for admin */}
                    {(ad.bank_name || ad.bankName) && (
                      <div className="flex items-start gap-3 p-3 bg-secondary/30 rounded">
                        <Building className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Bank Account</p>
                          <p className="text-sm text-muted-foreground">{ad.bank_name || ad.bankName}</p>
                          <p className="text-sm text-muted-foreground">{ad.account_holder_name || ad.accountHolderName}</p>
                          <p className="text-sm font-mono font-semibold text-foreground">
                            A/c: {ad.account_number || ad.accountNumber}
                          </p>
                          <p className="text-sm text-muted-foreground">IFSC: {ad.ifsc_code || ad.ifscCode}</p>
                        </div>
                      </div>
                    )}

                    {/* Action area */}
                    {!isCompleted && (
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-3">
                        <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-3">
                          ⚠️ Action Required: Process INR payment to user's bank account
                        </p>
                        {isExpanded ? (
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-medium mb-1 block">
                                Upload Payment Receipt <span className="text-muted-foreground">(Optional)</span>
                              </label>
                              <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                                className="w-full text-sm text-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground"
                              />
                              {receiptFile && <p className="text-xs text-green-600 mt-1">✓ {receiptFile.name}</p>}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleConfirmPayment(ad)}
                                className="flex-1 gap-2"
                                size="sm"
                                disabled={submitting}
                              >
                                <CheckCircle className="w-4 h-4" />
                                {submitting ? 'Processing...' : 'Confirm Payment & Complete'}
                              </Button>
                              <Button
                                onClick={() => { setSelectedAd(null); setReceiptFile(null) }}
                                variant="outline"
                                size="sm"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button onClick={() => setSelectedAd(ad)} className="w-full gap-2" size="sm">
                            <CheckCircle className="w-4 h-4" />
                            Process Payment
                          </Button>
                        )}
                      </div>
                    )}

                    {isCompleted && (
                      <div className="p-2 bg-green-500/10 border border-green-500/20 rounded text-center">
                        <p className="text-sm text-green-600 dark:text-green-400">✓ Payment Processed & Completed</p>
                        {(ad.payment_receipt || ad.paymentReceipt) && (
                          <button
                            onClick={() => window.open(`/uploads/${ad.payment_receipt || ad.paymentReceipt}`, '_blank')}
                            className="text-xs text-primary hover:underline mt-1 block"
                          >
                            📄 View Receipt
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
        </div>
      </div>
    </AdminLayout>
  )
}
