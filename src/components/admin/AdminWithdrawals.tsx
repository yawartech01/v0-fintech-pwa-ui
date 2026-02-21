import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from './AdminLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatNumber, formatDate, shortenAddress } from '@/lib/utils'
import { showToast } from '@/lib/toast'
import { APIService } from '@/services/api-service'
import { CheckCircle, XCircle, Copy, RefreshCw, Loader2 } from 'lucide-react'

export function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      const statusParam = filter === 'all' ? undefined : filter
      const data = await APIService.getAdminWithdrawals(statusParam)
      setWithdrawals(data?.withdrawals || [])
    } catch (error) {
      showToast('Failed to load withdrawals', 'error')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 10000)
    return () => clearInterval(interval)
  }, [loadData])

  const handleApprove = async (id: string) => {
    if (!confirm('Approve this withdrawal? USDT will be sent to the user.')) return
    setActionLoading(id)
    try {
      await APIService.approveWithdrawal(id)
      showToast('Withdrawal approved', 'success')
      loadData()
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to approve', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id: string) => {
    if (!rejectionReason.trim()) {
      showToast('Please enter a rejection reason', 'error')
      return
    }
    setActionLoading(id)
    try {
      await APIService.rejectWithdrawal(id, rejectionReason)
      showToast('Withdrawal rejected, funds refunded', 'success')
      setSelectedId(null)
      setRejectionReason('')
      loadData()
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to reject', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
    showToast('Address copied', 'success')
  }

  const getStatusBadge = (status: string) => {
    const map: Record<string, { variant: 'default' | 'secondary' | 'destructive'; label: string }> = {
      under_review: { variant: 'secondary', label: 'UNDER REVIEW' },
      completed: { variant: 'default', label: 'COMPLETED' },
      rejected: { variant: 'destructive', label: 'REJECTED' },
    }
    const s = map[status] || { variant: 'secondary' as const, label: status.toUpperCase() }
    return <Badge variant={s.variant}>{s.label}</Badge>
  }

  const pendingCount = withdrawals.filter(w => w.status === 'under_review').length

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="border-b border-border bg-background px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Withdrawal Requests</h1>
              <p className="text-sm text-muted-foreground">
                {pendingCount > 0 ? `${pendingCount} pending` : 'No pending requests'}
              </p>
            </div>
            <Button onClick={loadData} variant="outline" size="sm" className="gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-border">
          <div className="flex gap-2 flex-wrap">
            {['all', 'under_review', 'completed', 'rejected'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {f === 'under_review' ? 'Pending' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-4">
          {loading ? (
            <Card className="p-8 text-center">
              <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Loading withdrawals...</p>
            </Card>
          ) : withdrawals.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No withdrawal requests found</p>
            </Card>
          ) : (
            withdrawals.map((w) => (
              <Card key={w.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl font-bold text-foreground">
                        {formatNumber(parseFloat(w.amount_usdt))} USDT
                      </span>
                      {getStatusBadge(w.status)}
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">
                        User: {w.user_email || w.user_nickname || w.user_id?.slice(-8)}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-muted-foreground font-mono text-xs">
                          To: {shortenAddress(w.address)}
                        </p>
                        <button onClick={() => copyAddress(w.address)} className="text-primary hover:text-primary/80">
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-muted-foreground">Network: {w.network}</p>
                      <p className="text-muted-foreground">Fee: {formatNumber(parseFloat(w.fee_usdt || '1'))} USDT</p>
                      <p className="text-muted-foreground">Created: {formatDate(new Date(w.created_at))}</p>
                      {w.rejection_reason && (
                        <p className="text-red-500 text-xs">Reason: {w.rejection_reason}</p>
                      )}
                      {w.tx_hash && (
                        <p className="text-xs text-muted-foreground">TxHash: {shortenAddress(w.tx_hash)}</p>
                      )}
                    </div>
                  </div>
                </div>

                {w.status === 'under_review' && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprove(w.id)}
                        size="sm"
                        className="flex-1 gap-2"
                        disabled={actionLoading === w.id}
                      >
                        {actionLoading === w.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        Approve & Send
                      </Button>
                      <Button
                        onClick={() => setSelectedId(w.id)}
                        size="sm"
                        variant="destructive"
                        className="flex-1 gap-2"
                        disabled={actionLoading === w.id}
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </Button>
                    </div>

                    {selectedId === w.id && (
                      <div className="space-y-2 p-3 bg-secondary/50 rounded">
                        <Label>Rejection Reason</Label>
                        <Textarea
                          placeholder="Enter reason for rejection..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button onClick={() => handleReject(w.id)} size="sm" variant="destructive" className="flex-1" disabled={actionLoading === w.id}>
                            Confirm Reject
                          </Button>
                          <Button onClick={() => { setSelectedId(null); setRejectionReason('') }} size="sm" variant="outline" className="flex-1">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {w.status === 'completed' && (
                  <div className="text-center p-2 bg-green-500/10 border border-green-500/20 rounded">
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Completed {w.tx_hash ? `- TxHash: ${shortenAddress(w.tx_hash)}` : ''}
                    </p>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
