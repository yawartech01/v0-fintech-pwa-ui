import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, DollarSign, ArrowUpDown, Lock } from 'lucide-react'
import { APIService } from '@/services/api-service'
import { useRealAPI } from '@/config/api-mode'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import type { BankAccount, CreateSellAdRequest } from '@/types'

function safeRound(value: number, dp: number): number {
  const factor = Math.pow(10, dp)
  return Math.round(value * factor) / factor
}

export function CreateAdPage() {
  const navigate = useNavigate()
  const useAPI = useRealAPI()
  const [availableUsdt, setAvailableUsdt] = useState(0)
  const [todayRate, setTodayRate] = useState(0)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(false)

  const [usdtAmount, setUsdtAmount] = useState('')
  const [inrAmount, setInrAmount] = useState('')

  const [bankAccountId, setBankAccountId] = useState('')

  useEffect(() => {
    const loadData = async () => {
      const authState = dataStore.getAuthState()

      if (useAPI) {
        try {
          const [walletData, bankData, settingsData] = await Promise.all([
            APIService.getWallet(),
            APIService.getBankAccounts(),
            APIService.getPublicSettings(),
          ])
          const walletInfo = walletData?.wallet || walletData
          const available = parseFloat(walletInfo?.available_usdt || walletInfo?.availableBalance || '0')
          setAvailableUsdt(available)
          setTodayRate(parseFloat(settingsData?.usdtInrRate || '0'))
          const rawAccounts: any[] = bankData?.bankAccounts || bankData || []
          const accounts: BankAccount[] = rawAccounts.map((a: any) => ({
            id: a.id,
            bankName: a.bank_name || a.bankName,
            accountHolderName: a.account_holder_name || a.accountHolderName,
            accountNumber: a.account_number || a.accountNumber,
            ifscCode: a.ifsc_code || a.ifscCode,
            label: a.label,
            isDefault: a.is_default ?? a.isDefault ?? false,
            isVerified: true,
            createdAt: new Date(a.created_at || a.createdAt || Date.now()),
          }))
          setBankAccounts(accounts)
          if (accounts.length > 0) setBankAccountId(accounts[0].id)
        } catch (err: any) {
          showToast('Failed to load data: ' + (err?.message || 'Unknown error'), 'error')
        }
      } else {
        if (authState.user) {
          const uid = authState.user.id
          const balances = dataStore.getBalances(uid)
          setAvailableUsdt(balances.available)
          const rate = dataStore.getUSDTRate()
          setTodayRate(rate.rate)
          const accounts = dataStore.getBankAccounts(uid)
          setBankAccounts(accounts)
          if (accounts.length > 0) setBankAccountId(accounts[0].id)
        }
      }
    }
    loadData()
  }, [])

  const handleUsdtChange = (val: string) => {
    setUsdtAmount(val)
    if (val && !isNaN(parseFloat(val)) && todayRate > 0) {
      setInrAmount(safeRound(parseFloat(val) * todayRate, 2).toFixed(2))
    } else {
      setInrAmount('')
    }
  }

  const handleInrChange = (val: string) => {
    setInrAmount(val)
    if (val && !isNaN(parseFloat(val)) && todayRate > 0) {
      setUsdtAmount(safeRound(parseFloat(val) / todayRate, 6).toFixed(6))
    } else {
      setUsdtAmount('')
    }
  }

  const lockAmount = usdtAmount && !isNaN(parseFloat(usdtAmount)) && parseFloat(usdtAmount) > 0
    ? safeRound(parseFloat(usdtAmount), 6)
    : 0

  const insufficientBalance = lockAmount > 0 && lockAmount > availableUsdt

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (loading) return

    if (lockAmount <= 0) {
      showToast('Please enter a valid amount', 'error')
      return
    }

    if (lockAmount < 10) {
      showToast('Minimum amount is 10 USDT', 'error')
      return
    }

    if (insufficientBalance) {
      showToast(`Insufficient balance. Available: ${availableUsdt.toFixed(6)} USDT`, 'error')
      return
    }

    if (!bankAccountId) {
      showToast('Please select a bank account', 'error')
      return
    }

    try {
      setLoading(true)
      const request: CreateSellAdRequest = {
        amountTotalUsdt: lockAmount,
        bankAccountId,
        startActive: true,
      }

      if (useAPI) {
        await APIService.createSellAd(request)
      } else {
        const uid = dataStore.getAuthState().user?.id || localStorage.getItem('user_id') || ''
        dataStore.createSellAd(uid, request)
      }

      showToast('Sell ad created successfully', 'success')
      navigate('/sell-ads')
    } catch (error: any) {
      const msg = error?.response?.data?.error || (error instanceof Error ? error.message : 'Failed to create ad')
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const getBankAccountLabel = (account: BankAccount) => {
    return `${account.bankName} - ${account.accountHolderName} (•••${account.accountNumber.slice(-4)})`
  }

  return (
    <div className="space-y-3 pb-4">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4">
        <Button onClick={() => navigate('/sell-ads')} variant="ghost" size="icon-sm">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-base font-bold">Create Sell Ad</h1>
      </div>

      {/* Today's Rate Card */}
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Today's Rate</p>
            <p className="text-2xl font-bold">₹{formatNumber(todayRate)}</p>
            <p className="text-xs text-muted-foreground">per USDT (fixed by company)</p>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ad Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Bidirectional Amount Inputs */}
            <div className="space-y-2">
              <Label htmlFor="usdt-amount">Amount to Sell (USDT) *</Label>
              <Input
                id="usdt-amount"
                type="number"
                step="0.000001"
                min="10"
                placeholder="0.000000"
                value={usdtAmount}
                onChange={(e) => handleUsdtChange(e.target.value)}
              />
              {availableUsdt > 0 && (
                <p className="text-xs text-muted-foreground">
                  Available: {formatNumber(availableUsdt)} USDT
                </p>
              )}
            </div>

            {/* Swap icon */}
            <div className="flex items-center justify-center py-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ArrowUpDown className="w-4 h-4" />
                <span className="text-xs">Enter either amount — auto-calculates</span>
              </div>
            </div>

            {/* INR Input — editable, auto-calculates USDT */}
            <div className="space-y-2">
              <Label htmlFor="inr-amount">You will receive (INR)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">₹</span>
                <Input
                  id="inr-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={inrAmount}
                  onChange={(e) => handleInrChange(e.target.value)}
                  className="pl-7"
                />
              </div>
              {usdtAmount && inrAmount && parseFloat(usdtAmount) > 0 && (
                <p className="text-xs text-muted-foreground">
                  {lockAmount.toFixed(6)} USDT × ₹{formatNumber(todayRate)} = ₹{safeRound(lockAmount * todayRate, 2).toFixed(2)}
                </p>
              )}
            </div>

            {/* Lock confirmation */}
            {lockAmount >= 10 && (
              <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border ${
                insufficientBalance
                  ? 'bg-destructive/5 border-destructive/30'
                  : 'bg-primary/5 border-primary/20'
              }`}>
                <Lock className={`w-4 h-4 shrink-0 ${insufficientBalance ? 'text-destructive' : 'text-primary'}`} />
                <div className="text-sm">
                  <p>
                    <span className="text-muted-foreground">Will lock: </span>
                    <span className="font-mono font-semibold text-foreground">{lockAmount.toFixed(6)} USDT</span>
                  </p>
                  {insufficientBalance && (
                    <p className="text-destructive text-xs mt-0.5">
                      Exceeds available balance ({availableUsdt.toFixed(6)} USDT)
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Bank Account Selector */}
            <div className="space-y-2">
              <Label htmlFor="bank-account">Bank Account for Payout *</Label>
              {bankAccounts.length === 0 ? (
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground mb-3">No bank accounts found</p>
                  <Button type="button" onClick={() => navigate('/bank-accounts')} variant="outline">
                    Add Bank Account
                  </Button>
                </div>
              ) : (
                <Select value={bankAccountId} onValueChange={setBankAccountId}>
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

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full text-base"
              size="lg"
              disabled={bankAccounts.length === 0 || loading || !usdtAmount || lockAmount < 10 || insufficientBalance}
            >
              <DollarSign className="w-5 h-5 mr-2" />
              {loading ? 'Locking funds...' : 'Create Sell Ad'}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
