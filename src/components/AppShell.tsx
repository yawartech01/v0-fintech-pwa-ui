import { useState, useEffect, useCallback } from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { Home, Store, Wallet, User, ArrowLeft, Bell, X, CheckCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { APIService } from '@/services/api-service'
import { useRealAPI } from '@/config/api-mode'
import { connectWebSocket } from '@/lib/api-client'
import { showToast } from '@/lib/toast'
import { formatDate } from '@/lib/utils'

const tabs = [
  { id: 'home', path: '/', label: 'Home', icon: Home },
  { id: 'sell-ads', path: '/sell-ads', label: 'Sell Ads', icon: Store },
  { id: 'wallet', path: '/wallet', label: 'Wallet', icon: Wallet },
  { id: 'profile', path: '/profile', label: 'Profile', icon: User },
]

interface Notification {
  id: string
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

function NotificationPanel({
  notifications,
  unreadCount,
  onClose,
  onMarkRead,
  onMarkAllRead,
}: {
  notifications: Notification[]
  unreadCount: number
  onClose: () => void
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-14" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative z-10 w-full max-w-sm mx-4 bg-background border border-border rounded-xl shadow-2xl max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span className="font-semibold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <span className="text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 font-bold">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </button>
            )}
            <button onClick={onClose} className="p-2.5 rounded-lg hover:bg-secondary/50 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1">
          {notifications.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No notifications yet
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  'px-4 py-3 border-b border-border/50 last:border-0 cursor-pointer hover:bg-secondary/20 transition-colors',
                  !n.is_read && 'bg-primary/5'
                )}
                onClick={() => !n.is_read && onMarkRead(n.id)}
              >
                <div className="flex items-start gap-2">
                  {!n.is_read && (
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />
                  )}
                  {n.is_read && <span className="mt-1.5 w-2 h-2 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{n.message}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">{formatDate(n.created_at)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const useAPI = useRealAPI()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)

  const isMainTab = tabs.some((tab) => tab.path === location.pathname)
  const showBack = !isMainTab

  const loadNotifications = useCallback(async () => {
    if (!useAPI) return
    try {
      const data = await APIService.getNotifications()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch {
      // silently fail
    }
  }, [useAPI])

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [loadNotifications])

  // WebSocket: listen for new notifications
  useEffect(() => {
    const userId = localStorage.getItem('user_id') || ''
    if (!userId || !useAPI) return
    const socket = connectWebSocket(userId)
    const handler = (data: any) => {
      loadNotifications()
      showToast(data?.title || 'New notification', 'success')
    }
    socket.on('notification_new', handler)
    return () => { socket.off('notification_new', handler) }
  }, [useAPI, loadNotifications])

  const handleMarkRead = async (id: string) => {
    try {
      await APIService.markNotificationRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch { /* noop */ }
  }

  const handleMarkAllRead = async () => {
    try {
      await APIService.markAllNotificationsRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch { /* noop */ }
  }

  const getTitle = () => {
    if (location.pathname === '/') return 'VELTOX'
    if (location.pathname === '/sell-ads') return 'Sell Ads'
    if (location.pathname === '/sell-ads/create') return 'Create Sell Ad'
    if (location.pathname === '/wallet') return 'Wallet'
    if (location.pathname === '/profile') return 'Profile'
    if (location.pathname === '/referral') return 'Invite & Earn'
    if (location.pathname === '/bank-accounts') return 'Bank Accounts'
    if (location.pathname === '/security') return 'Security'
    if (location.pathname === '/support') return 'Support & FAQ'
    return 'VELTOX'
  }

  return (
    <div className="flex flex-col h-dvh bg-background">
      {/* Fixed Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 h-14 border-b border-border/50 bg-card safe-top">
        <div className="flex items-center gap-2">
          {showBack ? (
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : null}
          <h1 className="text-base font-bold text-foreground tracking-tight">{getTitle()}</h1>
        </div>

        {/* Notification Bell */}
        {useAPI && (
          <button
            onClick={() => setShowNotifications(true)}
            className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        )}
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="px-4 py-4">
          <Outlet />
        </div>
      </main>

      {/* Fixed Bottom Navigation - Only show on main tabs */}
      {isMainTab && (
        <nav className="flex-shrink-0 border-t border-border/50 bg-card safe-bottom">
          <div className="flex items-center justify-around h-[4.5rem]">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = location.pathname === tab.path
              return (
                <Link
                  key={tab.id}
                  to={tab.path}
                  className={cn(
                    'relative flex flex-col items-center justify-center gap-0.5 w-full h-full transition-all min-h-11',
                    isActive
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-secondary-foreground'
                  )}
                  aria-label={tab.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {isActive && (
                    <span className="absolute top-2 w-6 h-0.5 rounded-full bg-primary" />
                  )}
                  <Icon className={cn('w-6 h-6', isActive && 'text-primary')} />
                  <span
                    className={cn(
                      'text-[11px] font-medium mt-0.5',
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {tab.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </nav>
      )}

      {/* Notification Panel */}
      {showNotifications && (
        <NotificationPanel
          notifications={notifications}
          unreadCount={unreadCount}
          onClose={() => setShowNotifications(false)}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
        />
      )}
    </div>
  )
}
