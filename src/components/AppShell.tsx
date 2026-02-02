import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { Home, Store, Wallet, User, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { id: 'home', path: '/', label: 'Home', icon: Home },
  { id: 'sell-ads', path: '/sell-ads', label: 'Sell Ads', icon: Store },
  { id: 'wallet', path: '/wallet', label: 'Wallet', icon: Wallet },
  { id: 'profile', path: '/profile', label: 'Profile', icon: User },
]

export function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()

  const isMainTab = tabs.some((tab) => tab.path === location.pathname)
  const showBack = !isMainTab

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
      <header className="flex-shrink-0 flex items-center justify-between px-4 h-14 border-b border-border/60 bg-card safe-top">
        <div className="flex items-center gap-3">
          {showBack ? (
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 -ml-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors min-h-11 min-w-11"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : null}
          <h1 className="text-base font-semibold text-foreground">{getTitle()}</h1>
        </div>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="px-4 py-4">
          <Outlet />
        </div>
      </main>

      {/* Fixed Bottom Navigation - Only show on main tabs */}
      {isMainTab && (
        <nav className="flex-shrink-0 border-t border-border/60 bg-card safe-bottom">
          <div className="flex items-center justify-around h-16">
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
                  <Icon className={cn('w-5 h-5', isActive && 'text-primary')} />
                  <span
                    className={cn(
                      'text-[10px] font-medium mt-0.5',
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
    </div>
  )
}
