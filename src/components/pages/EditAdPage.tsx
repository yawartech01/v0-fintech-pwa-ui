import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { dataStore } from '@/lib/data-store'
import { showToast } from '@/lib/toast'
import { formatNumber } from '@/lib/utils'
import type { SellAd, BankAccount } from '@/types'

export function EditAdPage() {
  const navigate = useNavigate()
  const { adId } = useParams<{ adId: string }>()
  const [userId, setUserId] = useState('')
  const [ad, setAd] = useState<SellAd | null>(null)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])

  const [minPerOrder, setMinPerOrder] = useState('')
  const [maxPerOrder, setMaxPerOrder] = useState('')
  const [bankAccountId, setBankAccountId] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const authState = dataStore.getAuthState()
    if (authState.user && adId) {
      const uid = authState.user.id
      setUserId(uid)

      // Load ad
      const ads = dataStore.getSellAds(uid)
      const foundAd = ads.find((a) => a.id === adId)
      if (!foundAd) {
        showToast('Ad not found', 'error')
        navigate('/sell-ads')
        return
      }

      setAd(foundAd)
      setMinPerOrder(foundAd.minPerOrderUsdt?.toString() || '')
      setMaxPerOrder(foundAd.maxPerOrderUsdt?.toString() || '')
      setBankAccountId(foundAd.bankAccountId)
      setNotes(foundAd.notes || '')

      // Load bank accounts
      const accounts = dataStore.getBankAccounts(uid)
      setBankAccounts(accounts)
    }
  }, [adId, navigate])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!userId || !adId || !ad) {
      showToast('Invalid state', 'error')
      return
    }

    const minPerOrderUsdt = minPerOrder ? parseFloat(minPerOrder) : undefined
    const maxPerOrderUsdt = maxPerOrder ? parseFloat(maxPerOrder) : undefined

    // Validations
    if (minPerOrderUsdt && maxPerOrderUsdt && minPerOrderUsdt > maxPerOrderUsdt) {
      showToast('Minimum cannot exceed maximum per order', 'error')
      return
    }

    if (!bankAccountId) {
      showToast('Please select a bank account', 'error')
      return
    }

    try {
      dataStore.updateSellAd(userId, adId, {
        minPerOrderUsdt,
        maxPerOrderUsdt,
        bankAccountId,
        notes: notes.trim() || undefined,
      })

      showToast('Ad updated successfully', 'success')
      navigate('/sell-ads')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update ad', 'error')
    }
  }

  const getBankAccountLabel = (account: BankAccount) => {
    return `${account.bankName} - ${account.accountHolderName} (•••${account.accountNumber.slice(-4)})`
  }

  if (!ad) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 pb-4">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4">
        <Button onClick={() => navigate('/sell-ads')} variant="ghost" size="icon-sm">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-base font-bold">Edit Sell Ad</h1>
      </div>

      {/* Ad Summary (read-only) */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Total Amount</p>
              <p className="font-bold text-base">{formatNumber(ad.amountTotalUsdt)} USDT</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className="font-bold text-base">{formatNumber(ad.amountRemainingUsdt)} USDT</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Note: Total amount cannot be changed after creation
          </p>
        </CardContent>
      </Card>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Editable Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Min Per Order */}
            <div className="space-y-2">
              <Label htmlFor="min-per-order">
                Minimum Per Order (USDT)
                <span className="text-muted-foreground ml-1">(optional)</span>
              </Label>
              <Input
                id="min-per-order"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={minPerOrder}
                onChange={(e) => setMinPerOrder(e.target.value)}
              />
            </div>

            {/* Max Per Order */}
            <div className="space-y-2">
              <Label htmlFor="max-per-order">
                Maximum Per Order (USDT)
                <span className="text-muted-foreground ml-1">(optional)</span>
              </Label>
              <Input
                id="max-per-order"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={maxPerOrder}
                onChange={(e) => setMaxPerOrder(e.target.value)}
              />
            </div>

            {/* Bank Account Selector */}
            <div className="space-y-2">
              <Label htmlFor="bank-account">Bank Account for Payout *</Label>
              {bankAccounts.length === 0 ? (
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground mb-3">No bank accounts found</p>
                  <Button
                    type="button"
                    onClick={() => navigate('/bank-accounts')}
                    variant="outline"
                  >
                    Add Bank Account
                  </Button>
                </div>
              ) : (
                <Select value={bankAccountId} onValueChange={setBankAccountId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select bank account" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {getBankAccountLabel(account)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">
                Notes <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="notes"
                placeholder="Any special instructions or notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" size="lg" disabled={bankAccounts.length === 0}>
              <Save className="w-5 h-5 mr-2" />
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
