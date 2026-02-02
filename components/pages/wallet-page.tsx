"use client"

import { useState } from "react"
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Copy,
  Check,
  QrCode,
  Clock,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface WalletPageProps {
  onNavigate: (page: string) => void
}

type WalletTab = "deposit" | "withdraw" | "history"

const mockBalance = {
  available: 5000,
  locked: 3500,
  total: 8500,
}

const mockTransactions = [
  {
    id: "1",
    type: "deposit",
    amount: 500,
    network: "TRC20",
    status: "completed",
    date: "Jan 30, 2026 14:32",
    txHash: "TYD...x8Kp",
  },
  {
    id: "2",
    type: "withdrawal",
    amount: 200,
    network: "ERC20",
    status: "pending",
    date: "Jan 29, 2026 10:15",
    txHash: "0x8f...2a3b",
  },
  {
    id: "3",
    type: "deposit",
    amount: 1000,
    network: "BEP20",
    status: "completed",
    date: "Jan 28, 2026 09:45",
    txHash: "0x3c...9d1e",
  },
]

export function WalletPage({ onNavigate }: WalletPageProps) {
  const [activeTab, setActiveTab] = useState<WalletTab>("deposit")

  return (
    <div className="space-y-4">
      {/* Balance Header */}
      <Card className="bg-card border-border/60 overflow-hidden">
        <CardContent className="p-0">
          <div className="relative p-5">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-primary/4 to-transparent" />
            <div className="relative">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">USDT Balance</p>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-semibold text-foreground tracking-tight">
                  {mockBalance.total.toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground">USDT</span>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border/60">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Available</p>
                  <p className="text-sm font-medium text-foreground">
                    {mockBalance.available.toLocaleString()} USDT
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Locked in Ads</p>
                  <p className="text-sm font-medium text-foreground">
                    {mockBalance.locked.toLocaleString()} USDT
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Buttons */}
      <div className="grid grid-cols-3 gap-1.5 bg-secondary/50 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab("deposit")}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === "deposit"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-secondary-foreground"
          }`}
        >
          <ArrowDownToLine className="w-4 h-4" />
          Deposit
        </button>
        <button
          onClick={() => setActiveTab("withdraw")}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === "withdraw"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-secondary-foreground"
          }`}
        >
          <ArrowUpFromLine className="w-4 h-4" />
          Withdraw
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === "history"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-secondary-foreground"
          }`}
        >
          <Clock className="w-4 h-4" />
          History
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "deposit" && <DepositTab />}
      {activeTab === "withdraw" && <WithdrawTab />}
      {activeTab === "history" && <HistoryTab transactions={mockTransactions} />}
    </div>
  )
}

function DepositTab() {
  const [copied, setCopied] = useState(false)
  const depositAddress = "TYD8kXE5cBrHvQx8KpL2mNz9fGwJ3eRtY"

  const handleCopy = () => {
    navigator.clipboard.writeText(depositAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Network Info */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-muted-foreground">Network</span>
        <span className="text-xs font-medium text-foreground">TRC20 (Tron)</span>
      </div>

      {/* Deposit Address */}
      <Card className="bg-card border-border/60">
        <CardContent className="p-4 space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">
              Your USDT Deposit Address
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs text-foreground bg-secondary/50 px-3 py-2.5 rounded-lg truncate font-mono">
                {depositAddress}
              </code>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopy}
                className="shrink-0 h-9 w-9 p-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-primary" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* QR Code Placeholder */}
          <div className="flex justify-center py-2">
            <div className="w-40 h-40 bg-secondary/50 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <QrCode className="w-10 h-10 text-muted-foreground mx-auto mb-1.5" />
                <p className="text-[10px] text-muted-foreground">Scan to deposit</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warning */}
      <Card className="bg-warning/5 border-warning/15">
        <CardContent className="p-3.5">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-medium text-warning">Important:</span> Only send USDT via TRC20 network. Sending other tokens or using wrong network may result in permanent loss.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function WithdrawTab() {
  const [address, setAddress] = useState("")
  const [amount, setAmount] = useState("")

  const fee = 1 // TRC20 fee
  const receiveAmount = Number(amount) > 0 ? Number(amount) - fee : 0

  return (
    <div className="space-y-4">
      {/* Network Info */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-muted-foreground">Network</span>
        <span className="text-xs font-medium text-foreground">TRC20 (Tron)</span>
      </div>

      {/* Withdrawal Address */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">
          Withdrawal Address
        </label>
        <input
          type="text"
          placeholder="Enter TRC20 address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full bg-card border border-border/60 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
        />
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-muted-foreground">Amount</label>
          <button className="text-xs text-primary hover:text-primary/80 transition-colors">
            Max: 5,000 USDT
          </button>
        </div>
        <input
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full bg-card border border-border/60 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors text-lg"
        />
      </div>

      {/* Fee Breakdown */}
      <Card className="bg-card border-border/60">
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Network Fee (TRC20)</span>
            <span className="text-secondary-foreground">{fee} USDT</span>
          </div>
          <div className="border-t border-border/60 pt-3 flex justify-between items-baseline">
            <span className="text-xs text-muted-foreground">
              You will receive
            </span>
            <span className="text-base font-semibold text-foreground">
              {receiveAmount > 0 ? receiveAmount.toFixed(2) : "0.00"} USDT
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Withdraw Button */}
      <Button className="w-full h-12 text-sm font-medium rounded-xl">
        Withdraw USDT
      </Button>
    </div>
  )
}

function HistoryTab({
  transactions,
}: {
  transactions: typeof mockTransactions
}) {
  return (
    <div className="space-y-3">
      {transactions.map((tx) => (
        <Card key={tx.id} className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {tx.type === "deposit" ? (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <ArrowDownToLine className="w-4 h-4 text-primary" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center">
                    <ArrowUpFromLine className="w-4 h-4 text-warning" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-foreground capitalize">
                    {tx.type}
                  </p>
                  <p className="text-xs text-muted-foreground">{tx.network}</p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`text-sm font-semibold ${
                    tx.type === "deposit" ? "text-primary" : "text-foreground"
                  }`}
                >
                  {tx.type === "deposit" ? "+" : "-"}
                  {tx.amount} USDT
                </p>
                <Badge
                  className={`text-xs border-0 ${
                    tx.status === "completed"
                      ? "bg-primary/10 text-primary"
                      : "bg-warning/10 text-warning"
                  }`}
                >
                  {tx.status}
                </Badge>
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t border-border">
              <span>{tx.date}</span>
              <span className="font-mono">{tx.txHash}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
