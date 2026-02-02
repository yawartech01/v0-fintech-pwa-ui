import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { dataStore } from '@/lib/data-store'
import { formatCurrency } from '@/lib/utils'
import type { USDTRate } from '@/types'

export function CreateAdPage() {
  const navigate = useNavigate()
  const [amount, setAmount] = useState('')
  const [rate, setRate] = useState<USDTRate | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const currentRate = dataStore.getUSDTRate()
    setRate(currentRate)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (!rate) {
      setError('Rate not available')
      return
    }

    setLoading(true)
    const result = dataStore.createSellAd({
      amount: amountNum,
      rate: rate.rate,
    })

    setLoading(false)

    if (result.success) {
      navigate('/sell-ads')
    } else {
      setError(result.message || 'Failed to create ad')
    }
  }

  const totalINR = rate && amount ? parseFloat(amount) * rate.rate : 0

  return (
    <div className="space-y-4 pb-4">
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USDT)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="50"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">Minimum: 50 USDT</p>
            </div>

            <div className="space-y-2">
              <Label>Current Rate</Label>
              <div className="text-2xl font-bold">{rate ? formatCurrency(rate.rate) : '—'}</div>
              <p className="text-xs text-muted-foreground">Rate is locked when you create the ad</p>
            </div>

            {amount && (
              <div className="p-4 bg-secondary/30 rounded-lg">
                <p className="text-sm text-muted-foreground">You will receive</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(totalINR)}</p>
              </div>
            )}

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating...' : 'Create Sell Ad'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
