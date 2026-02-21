import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Check, Building2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { dataStore } from '@/lib/data-store'
import { APIService } from '@/services/api-service'
import { useRealAPI } from '@/config/api-mode'
import { showToast } from '@/lib/toast'
import type { BankAccount, CreateBankAccountRequest } from '@/types'

export function BankAccountsPage() {
  const useAPI = useRealAPI()
  const [userId, setUserId] = useState<string>('')
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<CreateBankAccountRequest>({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    label: '',
    isDefault: false,
  })

  useEffect(() => {
    const authState = dataStore.getAuthState()
    const uid = authState.user?.id || localStorage.getItem('user_id') || ''
    setUserId(uid)
    loadAccounts(uid)
  }, [])

  const loadAccounts = async (uid: string) => {
    setLoading(true)
    try {
      if (useAPI) {
        const data = await APIService.getBankAccounts()
        const raw: any[] = data?.bankAccounts || data || []
        const mapped: BankAccount[] = raw.map((a: any) => ({
          id: a.id,
          bankName: a.bank_name || a.bankName,
          accountHolderName: a.account_holder_name || a.accountHolderName,
          accountNumber: a.account_number || a.accountNumber,
          ifscCode: a.ifsc_code || a.ifscCode,
          label: a.label || '',
          isDefault: a.is_default ?? a.isDefault ?? false,
          isVerified: true,
          createdAt: new Date(a.created_at || a.createdAt || Date.now()),
        }))
        setAccounts(mapped)
      } else {
        setAccounts(dataStore.getBankAccounts(uid))
      }
    } catch (err: any) {
      showToast('Failed to load accounts: ' + (err?.response?.data?.error || err?.message), 'error')
    } finally {
      setLoading(false)
    }
  }

  const validateIFSC = (ifsc: string): boolean => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.toUpperCase())

  const validateForm = (): boolean => {
    if (!formData.accountHolderName.trim()) { showToast('Account holder name is required', 'error'); return false }
    if (!formData.accountNumber.trim() || formData.accountNumber.length < 9) { showToast('Valid account number is required (min 9 digits)', 'error'); return false }
    if (!validateIFSC(formData.ifscCode)) { showToast('Invalid IFSC code (format: ABCD0123456)', 'error'); return false }
    if (!formData.bankName.trim()) { showToast('Bank name is required', 'error'); return false }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setSubmitting(true)
    try {
      if (useAPI) {
        if (editingAccount) {
          await APIService.updateBankAccount(editingAccount.id, {
            bankName: formData.bankName,
            accountHolderName: formData.accountHolderName,
            ifscCode: formData.ifscCode.toUpperCase(),
            label: formData.label,
            isDefault: formData.isDefault,
          })
          showToast('Bank account updated', 'success')
        } else {
          await APIService.addBankAccount({
            bankName: formData.bankName,
            accountHolderName: formData.accountHolderName,
            accountNumber: formData.accountNumber,
            ifscCode: formData.ifscCode.toUpperCase(),
            label: formData.label,
            isDefault: formData.isDefault,
          })
          showToast('Bank account added', 'success')
        }
      } else {
        if (editingAccount) {
          dataStore.updateBankAccount(userId, editingAccount.id, {
            accountHolderName: formData.accountHolderName,
            bankName: formData.bankName,
            ifscCode: formData.ifscCode.toUpperCase(),
            label: formData.label,
            isDefault: formData.isDefault,
          })
          showToast('Bank account updated', 'success')
        } else {
          dataStore.addBankAccount(userId, { ...formData, ifscCode: formData.ifscCode.toUpperCase() })
          showToast('Bank account added', 'success')
        }
      }
      await loadAccounts(userId)
      resetForm()
    } catch (err: any) {
      const msg = err?.response?.data?.errors?.[0]?.msg || err?.response?.data?.error || err?.message || 'Failed to save account'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (account: BankAccount) => {
    setEditingAccount(account)
    setFormData({
      accountHolderName: account.accountHolderName,
      accountNumber: account.accountNumber,
      ifscCode: account.ifscCode,
      bankName: account.bankName,
      label: account.label || '',
      isDefault: account.isDefault,
    })
    setShowForm(true)
  }

  const handleDelete = async (accountId: string) => {
    try {
      if (useAPI) {
        await APIService.deleteBankAccount(accountId)
      } else {
        dataStore.deleteBankAccount(userId, accountId)
      }
      showToast('Bank account deleted', 'success')
      await loadAccounts(userId)
      setShowDeleteConfirm(null)
    } catch (err: any) {
      showToast(err?.response?.data?.error || err?.message || 'Failed to delete', 'error')
    }
  }

  const handleSetDefault = async (accountId: string) => {
    try {
      if (useAPI) {
        await APIService.setDefaultBankAccount(accountId)
        await loadAccounts(userId)
      }
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Failed to set default', 'error')
    }
  }

  const resetForm = () => {
    setFormData({ accountHolderName: '', accountNumber: '', ifscCode: '', bankName: '', label: '', isDefault: false })
    setShowForm(false)
    setEditingAccount(null)
  }

  const maskAccountNumber = (n: string) => n.length <= 4 ? n : '••••' + n.slice(-4)

  if (showForm) {
    return (
      <div className="space-y-3 pb-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {editingAccount ? 'Edit Bank Account' : 'Add Bank Account'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name *</Label>
                <Input id="bankName" placeholder="e.g., HDFC Bank" value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountHolderName">Account Holder Name *</Label>
                <Input id="accountHolderName" placeholder="Full name as per bank" value={formData.accountHolderName}
                  onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number *</Label>
                <Input id="accountNumber" type="text" placeholder="Enter account number" value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  disabled={!!editingAccount} required />
                {editingAccount && <p className="text-xs text-muted-foreground">Account number cannot be edited.</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="ifscCode">IFSC Code *</Label>
                <Input id="ifscCode" placeholder="e.g., HDFC0001234" value={formData.ifscCode}
                  onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })} required />
                <p className="text-xs text-muted-foreground">Format: 4 letters + 0 + 6 alphanumeric (e.g., HDFC0001234)</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="label">Label (Optional)</Label>
                <Input id="label" placeholder="e.g., Primary, Savings" value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })} />
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Set as default</p>
                  <p className="text-xs text-muted-foreground">Use this account for sell ads by default</p>
                </div>
                <Switch checked={formData.isDefault} onCheckedChange={(c) => setFormData({ ...formData, isDefault: c })} />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1" size="lg">Cancel</Button>
                <Button type="submit" className="flex-1" size="lg" disabled={submitting}>
                  {submitting ? 'Saving...' : editingAccount ? 'Update Account' : 'Add Account'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-3 pb-4">
      <div className="flex items-center justify-between px-4">
        <div>
          <h1 className="text-base font-bold">Bank Accounts</h1>
          <p className="text-xs text-muted-foreground">Manage your payment methods</p>
        </div>
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus className="w-4 h-4 mr-1.5" />Add
        </Button>
      </div>

      {loading ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground" />
            <div>
              <p className="font-medium mb-1">No bank accounts yet</p>
              <p className="text-sm text-muted-foreground mb-4">Add a bank account to create sell ads and receive payments</p>
              <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" />Add Bank Account</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => (
            <Card key={account.id} className={account.isDefault ? 'border-primary' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{account.bankName}</p>
                      {account.isDefault && <Badge variant="default" className="text-xs"><Check className="w-3 h-3 mr-1" />Default</Badge>}
                      {account.label && <Badge variant="secondary" className="text-xs">{account.label}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{account.accountHolderName}</p>
                  </div>
                </div>
                <div className="space-y-1 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account:</span>
                    <span className="font-mono">{maskAccountNumber(account.accountNumber)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IFSC:</span>
                    <span className="font-mono">{account.ifscCode}</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  {!account.isDefault && useAPI && (
                    <Button onClick={() => handleSetDefault(account.id)} variant="outline" size="sm" className="flex-1 text-xs">
                      <Check className="w-3.5 h-3.5 mr-1" />Default
                    </Button>
                  )}
                  <Button onClick={() => handleEdit(account)} variant="outline" size="sm" className="flex-1 text-xs">
                    <Edit2 className="w-3.5 h-3.5 mr-1" />Edit
                  </Button>
                  <Button onClick={() => setShowDeleteConfirm(account.id)} variant="destructive" size="sm" className="flex-1 text-xs">
                    <Trash2 className="w-3.5 h-3.5 mr-1" />Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-destructive" />Delete Bank Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Are you sure? This cannot be undone.</p>
              <div className="flex gap-3">
                <Button onClick={() => setShowDeleteConfirm(null)} variant="outline" className="flex-1" size="lg">Cancel</Button>
                <Button onClick={() => handleDelete(showDeleteConfirm)} variant="destructive" className="flex-1" size="lg">Delete</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
