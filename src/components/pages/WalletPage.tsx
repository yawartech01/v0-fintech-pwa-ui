import { useState, useEffect } from 'react'
import { Copy, CheckCircle2, Download, Upload } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { dataStore } from '@/lib/data-store'
import { formatNumber, formatRelativeTime, shortenAddress } from '@/lib/utils'
import type { Wallet, NetworkType } from '@/types'

export function WalletPage() {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'history'>('deposit')
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkType>('TRC20')
  const [withdrawAddress, setWithdrawAddress] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [copiedAddress, setCopiedAddress] = useState(false)

  useEffect(() => {
    setWallet(dataStore.getWallet())
  }, [])

  const handleCopyAddress = () => {
    const address = wallet?.depositAddresses.find((a) => a.network === selectedNetwork)?.address
    if (address) {
      navigator.clipboard.writeText(address)
      setCopiedAddress(true)
      setTimeout(() => setCopiedAddress(false), 2000)
    }
  }

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(withdrawAmount)
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    const result = dataStore.requestWithdraw({
      network: selectedNetwork,
      address: withdrawAddress,
      amount,
    })

    if (result.success) {
      alert('Withdrawal request submitted successfully')
      setWithdrawAddress('')
      setWithdrawAmount('')
      setWallet(dataStore.getWallet())
    } else {
      alert(result.message)
    }
  }

  const depositAddress = wallet?.depositAddresses.find((a) => a.network === selectedNetwork)

  return (
    <div className="space-y-4 pb-4">
      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Total Balance</p>
          <p className="text-4xl font-bold">
            {wallet ? formatNumber(wallet.balance) : '0.00'} USDT
          </p>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('deposit')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'deposit'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground'
          }`}
        >
          <Download className="w-4 h-4 inline mr-1" />
          Deposit
        </button>
        <button
          onClick={() => setActiveTab('withdraw')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'withdraw'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground'
          }`}
        >
          <Upload className="w-4 h-4 inline mr-1" />
          Withdraw
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground'
          }`}
        >
          History
        </button>
      </div>

      {/* Deposit Tab */}
      {activeTab === 'deposit' && (
        <div className="space-y-4">
          <div>
            <Label>Network</Label>
            <Select
              value={selectedNetwork}
              onValueChange={(v) => setSelectedNetwork(v as NetworkType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TRC20">TRC20 (Tron)</SelectItem>
                <SelectItem value="ERC20">ERC20 (Ethereum)</SelectItem>
                <SelectItem value="BEP20">BEP20 (BSC)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Deposit Address</Label>
                <div className="flex gap-2">
                  <Input
                    value={depositAddress?.address || ''}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    onClick={handleCopyAddress}
                    variant="outline"
                    size="icon"
                    className="flex-shrink-0"
                  >
                    {copiedAddress ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                <p className="text-xs text-warning-foreground">
                  ⚠️ Only send USDT on {selectedNetwork} network to this address
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Withdraw Tab */}
      {activeTab === 'withdraw' && (
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <Label>Network</Label>
                <Select
                  value={selectedNetwork}
                  onValueChange={(v) => setSelectedNetwork(v as NetworkType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRC20">TRC20 (Tron)</SelectItem>
                    <SelectItem value="ERC20">ERC20 (Ethereum)</SelectItem>
                    <SelectItem value="BEP20">BEP20 (BSC)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="withdraw-address">Withdraw Address</Label>
                <Input
                  id="withdraw-address"
                  placeholder="Enter USDT address"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="withdraw-amount">Amount (USDT)</Label>
                <Input
                  id="withdraw-amount"
                  type="number"
                  step="0.01"
                  min="10"
                  placeholder="Enter amount"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Available: {wallet ? formatNumber(wallet.balance) : '0.00'} USDT
                  <br />
                  Minimum: 10 USDT
                </p>
              </div>

              <Button type="submit" className="w-full">
                Submit Withdrawal Request
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {!wallet || wallet.transactions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-sm text-muted-foreground">No transaction history</p>
              </CardContent>
            </Card>
          ) : (
            wallet.transactions.map((tx) => (
              <Card key={tx.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium capitalize">{tx.type.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(tx.timestamp)}
                      </p>
                      {tx.network && (
                        <Badge variant="outline" className="text-xs">
                          {tx.network}
                        </Badge>
                      )}
                      {tx.txHash && (
                        <p className="text-xs font-mono text-muted-foreground">
                          {shortenAddress(tx.txHash)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatNumber(tx.amount)} USDT</p>
                      <Badge
                        variant={tx.status === 'completed' ? 'default' : 'secondary'}
                        className="text-xs mt-1"
                      >
                        {tx.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
