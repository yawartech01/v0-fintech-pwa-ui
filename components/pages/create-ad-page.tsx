"use client"

import React from "react"

import { useState } from "react"
import { ChevronDown, Info } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface CreateAdPageProps {
  onBack: () => void
}

const bankAccounts = [
  { id: "1", name: "HDFC Bank", number: "****4521" },
  { id: "2", name: "ICICI Bank", number: "****8976" },
  { id: "3", name: "SBI", number: "****3344" },
]

export function CreateAdPage({ onBack }: CreateAdPageProps) {
  const [amount, setAmount] = useState("")
  const [minOrder, setMinOrder] = useState("")
  const [maxOrder, setMaxOrder] = useState("")
  const [selectedBank, setSelectedBank] = useState("")
  const [notes, setNotes] = useState("")
  const [isActive, setIsActive] = useState(true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log({
      amount,
      minOrder,
      maxOrder,
      selectedBank,
      notes,
      isActive,
    })
    onBack()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Amount */}
      <div className="space-y-2">
        <Label htmlFor="amount" className="text-xs font-medium text-muted-foreground">
          Amount to Sell (USDT)
        </Label>
        <Input
          id="amount"
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="bg-card border-border/60 text-foreground placeholder:text-muted-foreground text-lg h-12 rounded-xl focus:border-primary/50"
        />
        <p className="text-xs text-muted-foreground">
          Available balance: 5,000 USDT
        </p>
      </div>

      {/* Order Limits */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">Order Limits (USDT)</Label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Input
              type="number"
              placeholder="Min"
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
              className="bg-card border-border/60 text-foreground placeholder:text-muted-foreground rounded-xl focus:border-primary/50"
            />
          </div>
          <div>
            <Input
              type="number"
              placeholder="Max"
              value={maxOrder}
              onChange={(e) => setMaxOrder(e.target.value)}
              className="bg-card border-border/60 text-foreground placeholder:text-muted-foreground rounded-xl focus:border-primary/50"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Set the minimum and maximum order amount buyers can place
        </p>
      </div>

      {/* Bank Account */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">Receiving Bank Account</Label>
        <Select value={selectedBank} onValueChange={setSelectedBank}>
          <SelectTrigger className="bg-card border-border/60 text-foreground h-12 rounded-xl">
            <SelectValue placeholder="Select bank account" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border/60">
            {bankAccounts.map((bank) => (
              <SelectItem
                key={bank.id}
                value={bank.id}
                className="text-foreground"
              >
                {bank.name} - {bank.number}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          + Add new bank account
        </button>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes" className="text-xs font-medium text-muted-foreground">
          Notes for Buyers (Optional)
        </Label>
        <Textarea
          id="notes"
          placeholder="Add any additional instructions or terms..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="bg-card border-border/60 text-foreground placeholder:text-muted-foreground min-h-[100px] rounded-xl focus:border-primary/50"
        />
      </div>

      {/* Active Toggle */}
      <Card className="bg-card border-border/60">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                Activate Immediately
              </p>
              <p className="text-xs text-muted-foreground">
                Make this ad visible to buyers right away
              </p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="bg-primary/5 border-primary/15">
        <CardContent className="p-3.5">
          <div className="flex gap-3">
            <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground leading-relaxed">
              <p>
                Your USDT will be locked until the ad is completed or cancelled.
                Payouts are sent to your selected bank account within 24 hours
                of order completion.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full h-12 text-sm font-medium rounded-xl"
      >
        Create Sell Ad
      </Button>
    </form>
  )
}
