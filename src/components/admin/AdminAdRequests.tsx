import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from './AdminLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { formatNumber, formatDate } from '@/lib/utils'
import { showToast } from '@/lib/toast'
import { APIService } from '@/services/api-service'
import { CheckCircle, XCircle, Edit, Trash2, RefreshCw, Loader2 } from 'lucide-react'

export function AdminAdRequests() {
  const [editRequests, setEditRequests] = useState<any[]>([])
  const [deleteRequests, setDeleteRequests] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [activeTab, setActiveTab] = useState<'edit' | 'delete'>('edit')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      const data = await APIService.getAdminAdRequests()
      setEditRequests(data?.editRequests || [])
      setDeleteRequests(data?.deleteRequests || [])
    } catch (error) {
      showToast('Failed to load ad requests', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 10000)
    return () => clearInterval(interval)
  }, [loadData])

  const handleApprove = async (requestId: string, type: 'edit' | 'delete') => {
    const msg = type === 'edit' ? 'Approve this edit request?' : 'Approve this delete request? The ad will be removed and funds refunded.'
    if (!confirm(msg)) return
    setActionLoading(requestId)
    try {
      await APIService.approveAdRequest(requestId, type)
      showToast(`${type === 'edit' ? 'Edit' : 'Delete'} request approved`, 'success')
      loadData()
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to approve', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (requestId: string, type: 'edit' | 'delete') => {
    if (!rejectionReason.trim()) {
      showToast('Please enter a rejection reason', 'error')
      return
    }
    setActionLoading(requestId)
    try {
      await APIService.rejectAdRequest(requestId, type, rejectionReason)
      showToast(`${type === 'edit' ? 'Edit' : 'Delete'} request rejected`, 'success')
      setSelectedId(null)
      setRejectionReason('')
      loadData()
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to reject', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const renderRequestCard = (req: any, type: 'edit' | 'delete') => (
    <Card key={req.id} className="p-4">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-bold text-foreground">
                {formatNumber(parseFloat(req.amount_total_usdt || req.ad_amount || 0))} USDT Ad
              </span>
              <Badge variant={type === 'edit' ? 'default' : 'destructive'}>
                {type === 'edit' ? 'Edit Request' : 'Delete Request'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Ad Code: {req.ad_code || req.ad_id?.slice(-8)}
            </p>
            <p className="text-sm text-muted-foreground">
              User: {req.user_email || req.user_nickname || req.user_id?.slice(-8)}
            </p>
            <p className="text-sm text-muted-foreground">
              Requested: {formatDate(new Date(req.created_at))}
            </p>
          </div>
        </div>

        {type === 'edit' && req.requested_changes && (
          <div className="p-3 bg-secondary/30 rounded">
            <p className="text-sm font-medium text-foreground mb-2">Requested Changes:</p>
            <div className="space-y-1 text-sm text-muted-foreground">
              {Object.entries(typeof req.requested_changes === 'string' ? JSON.parse(req.requested_changes) : req.requested_changes).map(([key, value]: [string, any]) => (
                <p key={key}>- {key}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}</p>
              ))}
            </div>
          </div>
        )}

        {type === 'delete' && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              If approved, remaining USDT will be refunded to user's wallet
            </p>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              onClick={() => handleApprove(req.id, type)}
              size="sm"
              className="flex-1 gap-2"
              disabled={actionLoading === req.id}
            >
              {actionLoading === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Approve
            </Button>
            <Button
              onClick={() => setSelectedId(req.id)}
              size="sm"
              variant="destructive"
              className="flex-1 gap-2"
              disabled={actionLoading === req.id}
            >
              <XCircle className="w-4 h-4" />
              Reject
            </Button>
          </div>

          {selectedId === req.id && (
            <div className="space-y-2 p-3 bg-secondary/50 rounded">
              <Label>Rejection Reason</Label>
              <Textarea
                placeholder="Enter reason..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2">
                <Button onClick={() => handleReject(req.id, type)} size="sm" variant="destructive" className="flex-1" disabled={actionLoading === req.id}>
                  Confirm Reject
                </Button>
                <Button onClick={() => { setSelectedId(null); setRejectionReason('') }} size="sm" variant="outline" className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="border-b border-border bg-background px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Ad Requests</h1>
              <p className="text-sm text-muted-foreground">Review edit and delete requests</p>
            </div>
            <Button onClick={loadData} variant="outline" size="sm" className="gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-border">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('edit')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'edit'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              <Edit className="w-4 h-4 inline mr-2" />
              Edit Requests ({editRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('delete')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'delete'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              <Trash2 className="w-4 h-4 inline mr-2" />
              Delete Requests ({deleteRequests.length})
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {loading ? (
            <Card className="p-8 text-center">
              <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Loading requests...</p>
            </Card>
          ) : activeTab === 'edit' ? (
            editRequests.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No pending edit requests</p>
              </Card>
            ) : editRequests.map(r => renderRequestCard(r, 'edit'))
          ) : (
            deleteRequests.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No pending delete requests</p>
              </Card>
            ) : deleteRequests.map(r => renderRequestCard(r, 'delete'))
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
