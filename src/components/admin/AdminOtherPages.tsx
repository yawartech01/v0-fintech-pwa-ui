import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from './AdminLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatNumber, formatDate, shortenAddress } from '@/lib/utils'
import { showToast } from '@/lib/toast'
import { APIService } from '@/services/api-service'
import { RefreshCw, Loader2, ArrowDownCircle, ExternalLink, Copy } from 'lucide-react'

export function AdminDeposits() {
  const [deposits, setDeposits] = useState<any[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const statusParam = filter === 'all' ? undefined : filter
      const data = await APIService.getAdminDeposits(statusParam)
      setDeposits(data?.deposits || [])
    } catch (error) {
      showToast('Failed to load deposits', 'error')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 15000)
    return () => clearInterval(interval)
  }, [loadData])

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text)
    showToast('Copied', 'success')
  }

  const getStatusBadge = (status: string) => {
    const map: Record<string, { variant: 'default' | 'secondary' | 'destructive'; label: string }> = {
      pending: { variant: 'secondary', label: 'PENDING' },
      confirmed: { variant: 'default', label: 'CONFIRMED' },
      failed: { variant: 'destructive', label: 'FAILED' },
    }
    const s = map[status] || { variant: 'secondary' as const, label: status.toUpperCase() }
    return <Badge variant={s.variant}>{s.label}</Badge>
  }

  const totalConfirmed = deposits
    .filter(d => d.status === 'confirmed')
    .reduce((sum, d) => sum + parseFloat(d.amount_usdt || '0'), 0)

  const pendingCount = deposits.filter(d => d.status === 'pending').length

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="border-b border-border bg-background px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Deposits</h1>
              <p className="text-sm text-muted-foreground">
                {pendingCount > 0 ? `${pendingCount} pending | ` : ''}
                Total confirmed: {formatNumber(totalConfirmed)} USDT
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
            {['all', 'pending', 'confirmed', 'failed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-4">
          {loading ? (
            <Card className="p-8 text-center">
              <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Loading deposits...</p>
            </Card>
          ) : deposits.length === 0 ? (
            <Card className="p-8 text-center">
              <ArrowDownCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No deposits found</p>
            </Card>
          ) : (
            deposits.map((d) => (
              <Card key={d.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl font-bold text-foreground">
                        {formatNumber(parseFloat(d.amount_usdt || '0'))} USDT
                      </span>
                      {getStatusBadge(d.status)}
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">
                        User: {d.user_email || d.user_nickname || d.user_id?.slice(-8)}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-muted-foreground font-mono text-xs">
                          TxHash: {shortenAddress(d.tx_hash)}
                        </p>
                        <button onClick={() => copyText(d.tx_hash)} className="text-primary hover:text-primary/80">
                          <Copy className="w-3 h-3" />
                        </button>
                        <a
                          href={`https://tronscan.org/#/transaction/${d.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      {d.from_address && d.from_address !== 'pending' && (
                        <p className="text-muted-foreground text-xs">
                          From: {shortenAddress(d.from_address)}
                        </p>
                      )}
                      <p className="text-muted-foreground">Network: {d.network || 'TRC20'}</p>
                      <p className="text-muted-foreground">
                        Submitted: {formatDate(new Date(d.created_at))}
                      </p>
                      {d.confirmed_at && (
                        <p className="text-muted-foreground">
                          Confirmed: {formatDate(new Date(d.confirmed_at))}
                        </p>
                      )}
                      {d.status === 'pending' && (
                        <p className="text-xs text-blue-500">
                          Confirmations: {d.confirmations || 0}/{d.required_confirmations || 19}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
