import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Copy,
  CheckCircle2,
  Clock,
  Shield,
  AlertCircle,
  DollarSign,
  ArrowDownCircle,
  ArrowUpCircle,
  Filter,
  Search,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { dataStore } from '@/lib/data-store'
import { showToast } from '@/lib/toast'
import { formatNumber, formatRelativeTime, shortenAddress } from '@/lib/utils'
import { SweeperService } from '@/lib/sweeper-service'
import { APIService } from '@/services/api-service'
import { useRealAPI } from '@/config/api-mode'
import { useWebSocket } from '@/hooks/useWebSocket'
import type { Deposit, Transaction } from '@/types'

const SWEEP_THRESHOLD = SweeperService.getSweepThreshold()

type TabType = 'overview' | 'deposit' | 'withdraw' | 'history'
type HistoryFilter = 'all' | 'deposits' | 'withdrawals' | 'sweeps'

export function WalletPage() {
  const useAPI = useRealAPI()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [userId, setUserId] = useState('')
  const [balances, setBalances] = useState({
    available: 0,
    locked: 0,
    total: 0,
  })
  const [depositAddress, setDepositAddress] = useState('')
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [copiedAddress, setCopiedAddress] = useState(false)
  const [depositAddressBalance, setDepositAddressBalance] = useState(0)
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all')

  // Deposit submission state
  const [txHashInput, setTxHashInput] = useState('')
  const [depositSubmitting, setDepositSubmitting] = useState(false)
  const [depositStatus, setDepositStatus] = useState<'idle' | 'pending' | 'confirmed' | 'failed'>('idle')
  const [depositMessage, setDepositMessage] = useState('')
  const depositPollRef = useRef<NodeJS.Timeout | null>(null)

  // Withdraw form state
  const [withdrawAddress, setWithdrawAddress] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawStep, setWithdrawStep] = useState<'form' | 'confirm'>('form')

  // WebSocket for real-time updates
  useWebSocket(userId, {
    onWalletUpdated: () => refresh(userId),
    onDepositConfirmed: () => {
      refresh(userId)
      showToast('Deposit confirmed!', 'success')
    },
    onWithdrawalUpdated: () => refresh(userId),
  })

  const stopDepositPolling = useCallback(() => {
    if (depositPollRef.current) {
      clearInterval(depositPollRef.current)
      depositPollRef.current = null
    }
  }, [])

  const startDepositPolling = useCallback((txHash: string) => {
    stopDepositPolling()
    depositPollRef.current = setInterval(async () => {
      try {
        const result = await APIService.checkDepositStatus(txHash)
        const dep = result?.deposit
        if (dep?.status === 'confirmed') {
          setDepositStatus('confirmed')
          setDepositMessage(`Deposit of ${parseFloat(dep.amount_usdt).toFixed(2)} USDT confirmed and credited!`)
          stopDepositPolling()
          showToast('Deposit confirmed and credited!', 'success')
          if (userId) refresh(userId)
        } else if (dep?.status === 'failed') {
          setDepositStatus('failed')
          setDepositMessage('Transaction not found or failed. Please verify the TxID.')
          stopDepositPolling()
        }
      } catch {
        // keep polling
      }
    }, 10000)
  }, [stopDepositPolling, userId])

  const handleDepositSubmit = async () => {
    const hash = txHashInput.trim().toLowerCase()
    if (!hash || hash.length !== 64 || !/^[a-f0-9]{64}$/.test(hash)) {
      showToast('Invalid Transaction ID. Must be 64 hex characters.', 'error')
      return
    }

    setDepositSubmitting(true)
    setDepositStatus('idle')
    setDepositMessage('')

    try {
      const result = await APIService.submitDeposit(hash)
      const dep = result?.deposit

      if (dep?.status === 'confirmed' || result?.message?.includes('confirmed')) {
        setDepositStatus('confirmed')
        setDepositMessage(result.message || 'Deposit confirmed and credited!')
        showToast('Deposit confirmed and credited!', 'success')
        if (userId) refresh(userId)
      } else {
        setDepositStatus('pending')
        setDepositMessage(result.message || 'Transaction submitted. Tracking on blockchain...')
        startDepositPolling(hash)
      }
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Failed to submit deposit'
      setDepositStatus('failed')
      setDepositMessage(msg)
      showToast(msg, 'error')
    } finally {
      setDepositSubmitting(false)
    }
  }

  useEffect(() => {
    const uid = dataStore.getAuthState().user?.id || localStorage.getItem('user_id') || ''
    if (uid) {
      setUserId(uid)
      refresh(uid)
    }

    const interval = setInterval(() => {
      const uid2 = dataStore.getAuthState().user?.id || localStorage.getItem('user_id') || ''
      if (uid2) refresh(uid2)
    }, 15000)

    return () => {
      clearInterval(interval)
      stopDepositPolling()
    }
  }, [])

  const refresh = async (uid: string) => {
    try {
      if (useAPI) {
        const [walletData, depositAddressData, depositsRaw, withdrawalsRaw] = await Promise.all([
          APIService.getWallet(),
          APIService.getDepositAddress(),
          APIService.getDeposits(),
          APIService.getWithdrawals(),
        ])

        // Backend: { wallet: { available_usdt, locked_usdt, total_usdt } }
        const w = walletData?.wallet || walletData || {}
        const available = parseFloat(w.available_usdt ?? w.availableBalance ?? 0)
        const locked = parseFloat(w.locked_usdt ?? w.lockedBalance ?? 0)
        setBalances({ available, locked, total: available + locked })

        // Backend: { address, network, memo }
        setDepositAddress(depositAddressData?.address || '')
        setDepositAddressBalance(0)

        // Backend: { deposits: [...] }
        const depositsArr: any[] = depositsRaw?.deposits || depositsRaw || []
        setDeposits(depositsArr)

        // Backend: { withdrawals: [...] }
        const withdrawalsArr: any[] = withdrawalsRaw?.withdrawals || withdrawalsRaw || []

        setTransactions([
          ...depositsArr.map((d: any) => ({
            id: d.id,
            type: 'deposit' as const,
            amount: parseFloat(d.amount_usdt ?? d.amount ?? 0),
            status: d.status,
            timestamp: new Date(d.created_at || d.createdAt || Date.now()),
            createdAt: new Date(d.created_at || d.createdAt || Date.now()),
          })),
          ...withdrawalsArr.map((w: any) => ({
            id: w.id,
            type: 'withdrawal' as const,
            amount: parseFloat(w.amount_usdt ?? w.amount ?? 0),
            status: w.status,
            timestamp: new Date(w.created_at || w.createdAt || Date.now()),
            createdAt: new Date(w.created_at || w.createdAt || Date.now()),
          })),
        ] as Transaction[])
      } else {
        // Use mock data
        const balancesData = dataStore.getBalances(uid)
        setBalances(balancesData)

        const address = dataStore.getDepositAddress(uid)
        setDepositAddress(address?.address || '')

        const depositsData = dataStore.listDeposits(uid)
        setDeposits(depositsData || [])

        const wallet = dataStore.getWallet(uid)
        const accumulatedBalance = wallet?.depositAddresses?.[0]?.accumulatedUsdt || 0
        setDepositAddressBalance(accumulatedBalance)

        setTransactions(wallet?.transactions || [])

      }
    } catch (error) {
      console.error('Error refreshing wallet data:', error)
      showToast('Error loading wallet data', 'error')
    }
  }

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(depositAddress)
    setCopiedAddress(true)
    showToast('Address copied to clipboard', 'success')
    setTimeout(() => setCopiedAddress(false), 2000)
  }

  const handleWithdrawSubmit = () => {
    const amount = parseFloat(withdrawAmount)
    if (!withdrawAddress || isNaN(amount) || amount <= 0) {
      showToast('Please enter valid address and amount', 'error')
      return
    }

    if (!withdrawAddress.startsWith('T') || withdrawAddress.length !== 34) {
      showToast('Invalid TRC20 address format', 'error')
      return
    }

    if (amount > balances.available) {
      showToast('Insufficient available balance', 'error')
      return
    }

    const fee = 1.0
    if (amount + fee > balances.available) {
      showToast(`Insufficient balance (need ${amount + fee} USDT including fee)`, 'error')
      return
    }

    setWithdrawStep('confirm')
  }

  const handleWithdrawConfirm = async () => {
    if (!userId) return

    try {
      const amount = parseFloat(withdrawAmount)
      
      if (useAPI) {
        // Use real API
        await APIService.requestWithdrawal({
          network: 'TRC20',
          address: withdrawAddress,
          amount,
        })
      } else {
        // Use mock
        dataStore.requestWithdraw(userId, {
          network: 'TRC20',
          address: withdrawAddress,
          amount,
        })
      }

      showToast('Withdrawal request submitted successfully', 'success')
      setWithdrawAddress('')
      setWithdrawAmount('')
      setWithdrawStep('form')
      setActiveTab('history')
      refresh(userId)
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || (error instanceof Error ? error.message : 'Withdrawal failed')
      showToast(errorMsg, 'error')
    }
  }

  const getDepositStatusBadge = (deposit: Deposit) => {
    if (deposit.status === 'swept') {
      return (
        <Badge variant="default" className="bg-success">
          Swept
        </Badge>
      )
    }
    if (deposit.status === 'confirmed') {
      return (
        <Badge variant="default" className="bg-primary">
          Confirmed
        </Badge>
      )
    }
    return (
      <Badge variant="secondary">
        {deposit.confirmations}/{deposit.requiredConfirmations} Confirmations
      </Badge>
    )
  }

  const getTransactionStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="default" className="bg-success">
            Completed
          </Badge>
        )
      case 'under_review':
        return (
          <Badge variant="secondary" className="bg-warning/20 text-warning">
            Under Review
          </Badge>
        )
      case 'approved':
        return (
          <Badge variant="default" className="bg-primary">
            Approved
          </Badge>
        )
      case 'sent':
        return (
          <Badge variant="default" className="bg-primary">
            Sent
          </Badge>
        )
      case 'rejected':
        return (
          <Badge variant="default" className="bg-destructive">
            Rejected
          </Badge>
        )
      case 'pending':
      case 'processing':
        return <Badge variant="secondary">Pending</Badge>
      case 'failed':
        return (
          <Badge variant="default" className="bg-destructive">
            Failed
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownCircle className="w-5 h-5 text-success" />
      case 'withdraw':
        return <ArrowUpCircle className="w-5 h-5 text-destructive" />
      case 'sweep':
        return <Shield className="w-5 h-5 text-primary" />
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />
    }
  }

  const filteredTransactions = transactions.filter((tx) => {
    if (historyFilter === 'all') return true
    if (historyFilter === 'deposits') return tx.type === 'deposit'
    if (historyFilter === 'withdrawals') return tx.type === 'withdraw'
    if (historyFilter === 'sweeps') return tx.type === 'sweep'
    return true
  })

  void (depositAddressBalance >= SWEEP_THRESHOLD) // sweep threshold check

  return (
    <div className="space-y-3 pb-4">
      {/* Tabs */}
      <div className="flex border-b border-border/60 bg-card overflow-hidden">
        {[
          { id: 'overview' as const, label: 'Overview' },
          { id: 'deposit' as const, label: 'Deposit' },
          { id: 'withdraw' as const, label: 'Withdraw' },
          { id: 'history' as const, label: 'History' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-2 py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-3">
          {/* Balance Card */}
          <Card>
            <CardContent className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">USDT Balance</p>
              <p className="text-3xl font-bold tracking-tight leading-tight">
                {formatNumber(balances.total)}
                <span className="text-sm font-medium text-muted-foreground ml-1.5">USDT</span>
              </p>
              <div className="border-t border-border/50 mt-3 pt-3 flex">
                <div className="flex-1">
                  <p className="text-[11px] text-muted-foreground mb-0.5">Available</p>
                  <p className="text-sm font-bold">{formatNumber(balances.available)} <span className="text-[11px] font-medium text-muted-foreground">USDT</span></p>
                </div>
                <div className="flex-1">
                  <p className="text-[11px] text-muted-foreground mb-0.5">Locked in Ads</p>
                  <p className="text-sm font-bold">{formatNumber(balances.locked)} <span className="text-[11px] font-medium text-muted-foreground">USDT</span></p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2.5 px-4">
            <Button onClick={() => setActiveTab('deposit')} className="w-full" size="default">
              <ArrowDownCircle className="w-4 h-4 mr-1.5" />
              Deposit
            </Button>
            <Button onClick={() => setActiveTab('withdraw')} variant="outline" className="w-full" size="default">
              <ArrowUpCircle className="w-4 h-4 mr-1.5" />
              Withdraw
            </Button>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No transactions yet
                </p>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(tx.type)}
                        <div>
                          <p className="text-sm font-medium capitalize">{tx.type}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(tx.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {tx.type === 'withdraw' ? '-' : '+'}
                          {formatNumber(tx.amount)} USDT
                        </p>
                        {getTransactionStatusBadge(tx.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {transactions.length > 5 && (
                <Button
                  onClick={() => setActiveTab('history')}
                  variant="ghost"
                  className="w-full mt-3"
                  size="sm"
                >
                  View All
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Deposit Tab */}
      {activeTab === 'deposit' && (
        <div className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Deposit USDT (TRC20)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Warning */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  Only send <strong>USDT (TRC20/Tron)</strong> to this address. Other tokens or networks will be lost permanently.
                </p>
              </div>

              {/* QR Code */}
              {depositAddress && (
                <div className="flex flex-col items-center gap-3 py-2">
                  <div className="p-4 bg-white rounded-xl shadow-sm">
                    <QRCodeSVG
                      value={depositAddress}
                      size={180}
                      bgColor="#ffffff"
                      fgColor="#000000"
                      level="M"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 font-semibold border border-green-500/20">
                      TRC20
                    </span>
                    <span>Tron Network</span>
                  </div>
                </div>
              )}

              {/* Address */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Deposit Address</p>
                <div className="flex items-center gap-2 bg-muted p-3 rounded-lg">
                  <code className="text-sm break-all flex-1 select-all">{depositAddress}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyAddress}
                    className="shrink-0"
                  >
                    {copiedAddress ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Send USDT (TRC20) to this address. After sending, paste the Transaction ID below to track your deposit.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Submit TxID */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="w-5 h-5 text-primary" />
                Track Your Deposit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="tx-hash">Transaction ID (TxID)</Label>
                <Input
                  id="tx-hash"
                  placeholder="Paste your 64-character transaction hash..."
                  value={txHashInput}
                  onChange={(e) => setTxHashInput(e.target.value.trim())}
                  className="font-mono text-xs"
                  maxLength={64}
                  disabled={depositSubmitting || depositStatus === 'pending'}
                />
                <p className="text-xs text-muted-foreground">
                  Find this in your external wallet's transaction history after sending USDT.
                </p>
              </div>

              <Button
                onClick={handleDepositSubmit}
                disabled={depositSubmitting || depositStatus === 'pending' || txHashInput.length !== 64}
                className="w-full"
              >
                {depositSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : depositStatus === 'pending' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Tracking...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Submit & Track Deposit
                  </>
                )}
              </Button>

              {/* Live Status Display */}
              {depositStatus !== 'idle' && (
                <div className={`p-3 rounded-lg border ${
                  depositStatus === 'confirmed'
                    ? 'bg-green-500/10 border-green-500/30'
                    : depositStatus === 'failed'
                      ? 'bg-red-500/10 border-red-500/30'
                      : 'bg-blue-500/10 border-blue-500/30'
                }`}>
                  <div className="flex items-start gap-2">
                    {depositStatus === 'confirmed' && (
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    )}
                    {depositStatus === 'pending' && (
                      <Loader2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5 animate-spin" />
                    )}
                    {depositStatus === 'failed' && (
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${
                        depositStatus === 'confirmed' ? 'text-green-600 dark:text-green-400'
                        : depositStatus === 'failed' ? 'text-red-600 dark:text-red-400'
                        : 'text-blue-600 dark:text-blue-400'
                      }`}>
                        {depositStatus === 'confirmed' ? 'Deposit Confirmed' 
                         : depositStatus === 'pending' ? 'Waiting for Confirmation...'
                         : 'Deposit Failed'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{depositMessage}</p>
                      {depositStatus === 'pending' && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Auto-checking every 10 seconds. You can leave this page — your deposit will still be tracked.
                        </p>
                      )}
                      {txHashInput && (
                        <a
                          href={`https://tronscan.org/#/transaction/${txHashInput}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary mt-2 hover:underline"
                        >
                          View on TronScan <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {depositStatus === 'confirmed' && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setTxHashInput('')
                    setDepositStatus('idle')
                    setDepositMessage('')
                  }}
                >
                  Track Another Deposit
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Recent Deposits */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Deposits</CardTitle>
            </CardHeader>
            <CardContent>
              {deposits.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No deposits yet</p>
              ) : (
                <div className="space-y-3">
                  {deposits.map((deposit: any) => (
                    <div
                      key={deposit.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">
                            {formatNumber(parseFloat(deposit.amount_usdt ?? deposit.amountUsdt ?? 0))} USDT
                          </p>
                          {getDepositStatusBadge(deposit)}
                        </div>
                        <a
                          href={`https://tronscan.org/#/transaction/${deposit.tx_hash || deposit.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                        >
                          {shortenAddress(deposit.tx_hash || deposit.txHash)}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(deposit.created_at || deposit.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      )}

      {/* Withdraw Tab */}
      {activeTab === 'withdraw' && (
        <div className="space-y-4">
          {withdrawStep === 'form' ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Withdraw USDT (TRC20)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="withdraw-address">TRC20 Address</Label>
                  <Input
                    id="withdraw-address"
                    placeholder="T..."
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter destination TRC20 address (starts with T, 34 characters)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="withdraw-amount">Amount (USDT)</Label>
                  <Input
                    id="withdraw-amount"
                    type="number"
                    step="0.01"
                    min="10"
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Minimum: 10 USDT</span>
                    <span>Available: {formatNumber(balances.available)} USDT</span>
                  </div>
                </div>

                <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Network Fee:</span>
                    <span className="font-medium">1.00 USDT</span>
                  </div>
                  {withdrawAmount && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">You will receive:</span>
                        <span className="font-medium">
                          {formatNumber(parseFloat(withdrawAmount) || 0)} USDT
                        </span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Total deducted:</span>
                        <span>{formatNumber((parseFloat(withdrawAmount) || 0) + 1)} USDT</span>
                      </div>
                    </>
                  )}
                </div>

                <Button onClick={handleWithdrawSubmit} className="w-full">
                  Continue
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Confirm Withdrawal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Destination Address</p>
                    <p className="text-sm font-mono break-all">{withdrawAddress}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Network</p>
                    <p className="text-sm font-medium">TRC20 (TRON)</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Amount</p>
                      <p className="text-sm font-medium">
                        {formatNumber(parseFloat(withdrawAmount))} USDT
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Fee</p>
                      <p className="text-sm font-medium">1.00 USDT</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total</span>
                      <span className="text-sm font-bold">
                        {formatNumber((parseFloat(withdrawAmount) || 0) + 1)} USDT
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
                  <p className="text-xs text-warning-foreground">
                    <AlertCircle className="w-3 h-3 inline mr-1" />
                    Please verify the address carefully. Transactions cannot be reversed.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setWithdrawStep('form')}
                    variant="outline"
                    className="flex-1"
                    size="lg"
                  >
                    Back
                  </Button>
                  <Button onClick={handleWithdrawConfirm} className="flex-1" size="lg">
                    Confirm Withdrawal
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 overflow-x-auto">
                <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                {[
                  { id: 'all' as const, label: 'All' },
                  { id: 'deposits' as const, label: 'Deposits' },
                  { id: 'withdrawals' as const, label: 'Withdrawals' },
                  { id: 'sweeps' as const, label: 'Sweeps' },
                ].map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setHistoryFilter(filter.id)}
                    className={`px-4 py-2 text-sm rounded-full whitespace-nowrap transition-colors ${
                      historyFilter === filter.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Transaction List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {historyFilter === 'all'
                  ? 'All Transactions'
                  : historyFilter === 'deposits'
                    ? 'Deposits'
                    : historyFilter === 'withdrawals'
                      ? 'Withdrawals'
                      : 'Sweeps'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No {historyFilter !== 'all' ? historyFilter : 'transactions'} yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-start justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {getTransactionIcon(tx.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium capitalize">{tx.type}</p>
                            {getTransactionStatusBadge(tx.status)}
                          </div>
                          {tx.notes && (
                            <p className="text-xs text-muted-foreground mb-1">{tx.notes}</p>
                          )}
                          {tx.address && (
                            <p className="text-xs text-muted-foreground font-mono">
                              {shortenAddress(tx.address)}
                            </p>
                          )}
                          {tx.txHash && (
                            <p className="text-xs text-muted-foreground font-mono">
                              {shortenAddress(tx.txHash)}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatRelativeTime(tx.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p
                          className={`text-sm font-medium ${
                            tx.type === 'withdraw' ? 'text-destructive' : 'text-success'
                          }`}
                        >
                          {tx.type === 'withdraw' ? '-' : '+'}
                          {formatNumber(tx.amount)}
                        </p>
                        {tx.fee && (
                          <p className="text-xs text-muted-foreground">
                            Fee: {formatNumber(tx.fee)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
