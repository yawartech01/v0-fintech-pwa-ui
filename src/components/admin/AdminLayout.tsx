import { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { showToast } from '@/lib/toast'
import { 
  LayoutDashboard, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  ShoppingBag, 
  FileEdit, 
  Users, 
  Settings,
  Home,
  LogOut,
  Activity,
  UserCog,
  BarChart3
} from 'lucide-react'

interface AdminLayoutProps {
  children: ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/admin/users', icon: Users, label: 'All Users' },
    { path: '/admin/user-actions', icon: UserCog, label: 'Ban & Balance' },
    { path: '/admin/deposits', icon: ArrowDownToLine, label: 'Deposits' },
    { path: '/admin/withdrawals', icon: ArrowUpFromLine, label: 'Withdrawals' },
    { path: '/admin/ads', icon: ShoppingBag, label: 'Sell Ads' },
    { path: '/admin/requests', icon: FileEdit, label: 'Ad Requests' },
    { path: '/admin/activity-log', icon: Activity, label: 'Activity Log' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
  ]

  const handleExitAdmin = () => {
    navigate('/')
  }

  const handleLogout = () => {
    localStorage.removeItem('veltox_admin_token')
    localStorage.removeItem('veltox_admin_login_time')
    showToast('Logged out from admin panel', 'success')
    navigate('/admin/login')
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-card flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-bold text-foreground">VELTOX Admin</h1>
          <p className="text-xs text-muted-foreground">Management Panel</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border space-y-2">
          <Button
            onClick={handleExitAdmin}
            variant="outline"
            className="w-full justify-start gap-2"
            size="sm"
          >
            <Home className="w-4 h-4" />
            Exit to App
          </Button>
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full justify-start gap-2"
            size="sm"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  )
}
