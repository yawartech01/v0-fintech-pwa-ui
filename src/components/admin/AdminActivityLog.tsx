import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from './AdminLayout'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { showToast } from '@/lib/toast'
import { APIService } from '@/services/api-service'
import { Search, Download, RefreshCw, Loader2 } from 'lucide-react'

export function AdminActivityLog() {
  const [logs, setLogs] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [loading, setLoading] = useState(true)

  const loadLogs = useCallback(async () => {
    try {
      const actionParam = filterType === 'all' ? undefined : filterType
      const data = await APIService.getAuditLog(actionParam, 200)
      setLogs(data?.logs || [])
    } catch (error) {
      showToast('Failed to load audit log', 'error')
    } finally {
      setLoading(false)
    }
  }, [filterType])

  useEffect(() => {
    loadLogs()
    const interval = setInterval(loadLogs, 15000)
    return () => clearInterval(interval)
  }, [loadLogs])

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      (log.action || '').toLowerCase().includes(term) ||
      (log.user_id || '').toLowerCase().includes(term) ||
      (log.admin_id || '').toLowerCase().includes(term) ||
      JSON.stringify(log.details || {}).toLowerCase().includes(term)
    )
  })

  const getActionColor = (action: string) => {
    if (action?.includes('approve')) return 'text-green-500'
    if (action?.includes('reject')) return 'text-red-500'
    if (action?.includes('adjust') || action?.includes('balance')) return 'text-blue-500'
    if (action?.includes('update') || action?.includes('setting')) return 'text-yellow-500'
    if (action?.includes('ban')) return 'text-red-500'
    if (action?.includes('deposit')) return 'text-green-500'
    if (action?.includes('complete')) return 'text-green-500'
    return 'text-gray-500'
  }

  const exportLogs = () => {
    const data = JSON.stringify(filteredLogs, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${Date.now()}.json`
    a.click()
  }

  const actionTypes = [...new Set(logs.map(l => l.action).filter(Boolean))]

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="border-b border-border bg-background px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Activity Log</h1>
              <p className="text-sm text-muted-foreground">Audit trail of all admin actions</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={loadLogs} variant="outline" size="sm" className="gap-2">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button onClick={exportLogs} variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 rounded border border-border bg-background text-foreground text-sm"
            >
              <option value="all">All Actions</option>
              {actionTypes.map(type => (
                <option key={type} value={type}>{(type || '').replace(/_/g, ' ').toUpperCase()}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <Card className="p-8 text-center">
              <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Loading audit log...</p>
            </Card>
          ) : filteredLogs.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No activity logs found</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log, index) => (
                <Card key={log.id || index} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`font-semibold text-sm ${getActionColor(log.action)}`}>
                          {(log.action || 'unknown').replace(/_/g, ' ').toUpperCase()}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {log.admin_id ? `Admin` : 'System'}
                        </Badge>
                      </div>

                      <div className="text-sm text-muted-foreground space-y-1">
                        {log.target_user_id && (
                          <p>Target user: {log.target_user_id.slice(-8)}</p>
                        )}
                        {log.details && typeof log.details === 'object' && (
                          <div className="text-xs">
                            {Object.entries(log.details).map(([key, value]: [string, any]) => (
                              <p key={key}>
                                <span className="text-muted-foreground">{key}:</span>{' '}
                                <span className="text-foreground">
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </span>
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-4">
                      <p className="text-xs text-muted-foreground">
                        {formatDate(new Date(log.created_at || log.timestamp))}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
