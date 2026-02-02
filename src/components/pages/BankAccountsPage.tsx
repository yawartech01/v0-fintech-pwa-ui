import { useState, useEffect } from 'react'
import { Plus, Star, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { dataStore } from '@/lib/data-store'
import type { BankAccount } from '@/types'

export function BankAccountsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [formData, setFormData] = useState({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
  })

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = () => {
    setAccounts(dataStore.getBankAccounts())
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    dataStore.addBankAccount(formData)
    setFormData({
      accountHolderName: '',
      accountNumber: '',
      ifscCode: '',
      bankName: '',
    })
    setShowDialog(false)
    loadAccounts()
  }

  const handleSetPrimary = (accountId: string) => {
    dataStore.setPrimaryBankAccount(accountId)
    loadAccounts()
  }

  const handleDelete = (accountId: string) => {
    if (confirm('Are you sure you want to delete this bank account?')) {
      dataStore.deleteBankAccount(accountId)
      loadAccounts()
    }
  }

  return (
    <div className="space-y-4 pb-4">
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Bank Account
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Bank Account</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="holder-name">Account Holder Name</Label>
              <Input
                id="holder-name"
                value={formData.accountHolderName}
                onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-number">Account Number</Label>
              <Input
                id="account-number"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ifsc">IFSC Code</Label>
              <Input
                id="ifsc"
                value={formData.ifscCode}
                onChange={(e) =>
                  setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank-name">Bank Name</Label>
              <Input
                id="bank-name"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Add Account
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No bank accounts added yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{account.bankName}</p>
                        {account.isPrimary && (
                          <Star className="w-4 h-4 fill-primary text-primary" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{account.accountHolderName}</p>
                    </div>
                    <Badge variant={account.isVerified ? 'default' : 'secondary'}>
                      {account.isVerified ? 'Verified' : 'Pending'}
                    </Badge>
                  </div>

                  <div className="text-sm space-y-1">
                    <p>
                      <span className="text-muted-foreground">A/C: </span>
                      <span className="font-mono">
                        {account.accountNumber.slice(0, 4)}
                        ****
                        {account.accountNumber.slice(-4)}
                      </span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">IFSC: </span>
                      <span className="font-mono">{account.ifscCode}</span>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {!account.isPrimary && (
                      <Button
                        onClick={() => handleSetPrimary(account.id)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        Set as Primary
                      </Button>
                    )}
                    <Button
                      onClick={() => handleDelete(account.id)}
                      variant="destructive"
                      size="sm"
                      className={account.isPrimary ? 'w-full' : 'flex-1'}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
