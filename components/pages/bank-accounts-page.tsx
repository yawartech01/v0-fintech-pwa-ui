"use client"

import React from "react"

import { useState } from "react"
import { Plus, MoreVertical, Pencil, Trash2, Building2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface BankAccount {
  id: string
  bankName: string
  accountNumber: string
  ifscCode: string
  holderName: string
  isDefault: boolean
}

const mockAccounts: BankAccount[] = [
  {
    id: "1",
    bankName: "HDFC Bank",
    accountNumber: "****4521",
    ifscCode: "HDFC0001234",
    holderName: "John Doe",
    isDefault: true,
  },
  {
    id: "2",
    bankName: "ICICI Bank",
    accountNumber: "****8976",
    ifscCode: "ICIC0005678",
    holderName: "John Doe",
    isDefault: false,
  },
  {
    id: "3",
    bankName: "State Bank of India",
    accountNumber: "****3344",
    ifscCode: "SBIN0009999",
    holderName: "John Doe",
    isDefault: false,
  },
]

export function BankAccountsPage() {
  const [accounts, setAccounts] = useState(mockAccounts)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    holderName: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newAccount: BankAccount = {
      id: Date.now().toString(),
      ...formData,
      accountNumber: `****${formData.accountNumber.slice(-4)}`,
      isDefault: accounts.length === 0,
    }
    setAccounts([...accounts, newAccount])
    setFormData({ bankName: "", accountNumber: "", ifscCode: "", holderName: "" })
    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    setAccounts(accounts.filter((acc) => acc.id !== id))
  }

  const handleSetDefault = (id: string) => {
    setAccounts(
      accounts.map((acc) => ({
        ...acc,
        isDefault: acc.id === id,
      }))
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {accounts.length} bank account{accounts.length !== 1 ? "s" : ""} linked
        </p>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Bank
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-sm mx-4">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                Add Bank Account
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-foreground">Bank Name</Label>
                <Input
                  placeholder="e.g., HDFC Bank"
                  value={formData.bankName}
                  onChange={(e) =>
                    setFormData({ ...formData, bankName: e.target.value })
                  }
                  className="bg-secondary border-border text-foreground"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Account Number</Label>
                <Input
                  placeholder="Enter account number"
                  value={formData.accountNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, accountNumber: e.target.value })
                  }
                  className="bg-secondary border-border text-foreground"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">IFSC Code</Label>
                <Input
                  placeholder="e.g., HDFC0001234"
                  value={formData.ifscCode}
                  onChange={(e) =>
                    setFormData({ ...formData, ifscCode: e.target.value })
                  }
                  className="bg-secondary border-border text-foreground"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Account Holder Name</Label>
                <Input
                  placeholder="Name as per bank records"
                  value={formData.holderName}
                  onChange={(e) =>
                    setFormData({ ...formData, holderName: e.target.value })
                  }
                  className="bg-secondary border-border text-foreground"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Add Bank Account
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Bank Accounts List */}
      <div className="space-y-3">
        {accounts.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-2">No bank accounts added</p>
              <Button
                variant="link"
                className="text-primary"
                onClick={() => setIsDialogOpen(true)}
              >
                Add your first bank account
              </Button>
            </CardContent>
          </Card>
        ) : (
          accounts.map((account) => (
            <Card key={account.id} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {account.bankName}
                        </p>
                        {account.isDefault && (
                          <Badge className="bg-primary/10 text-primary border-0 text-xs">
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {account.accountNumber}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-card border-border"
                    >
                      {!account.isDefault && (
                        <DropdownMenuItem
                          className="text-foreground"
                          onClick={() => handleSetDefault(account.id)}
                        >
                          Set as Default
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(account.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">IFSC: </span>
                    <span className="text-foreground font-mono">
                      {account.ifscCode}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Holder: </span>
                    <span className="text-foreground">{account.holderName}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
