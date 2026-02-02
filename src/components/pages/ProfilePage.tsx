import { useNavigate } from 'react-router-dom'
import {
  ChevronRight,
  LogOut,
  User as UserIcon,
  CreditCard,
  Shield,
  HelpCircle,
  Gift,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { dataStore } from '@/lib/data-store'
import { useState, useEffect } from 'react'
import type { User } from '@/types'

interface ProfilePageProps {
  onAuthChange: (authenticated: boolean) => void
}

export function ProfilePage({ onAuthChange }: ProfilePageProps) {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const authState = dataStore.getAuthState()
    setUser(authState.user)
  }, [])

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      dataStore.logout()
      onAuthChange(false)
      navigate('/')
    }
  }

  const menuItems = [
    {
      icon: Gift,
      label: 'Invite & Earn',
      path: '/referral',
    },
    {
      icon: CreditCard,
      label: 'Bank Accounts',
      path: '/bank-accounts',
    },
    {
      icon: Shield,
      label: 'Security',
      path: '/security',
    },
    {
      icon: HelpCircle,
      label: 'Support & FAQ',
      path: '/support',
    },
  ]

  return (
    <div className="space-y-4 pb-4">
      {/* User Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold">{user?.name || 'User'}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Menu Items */}
      <div className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <Card
              key={item.path}
              className="cursor-pointer hover:bg-secondary/50 transition-colors"
              onClick={() => navigate(item.path)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-primary" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Logout Button */}
      <Button onClick={handleLogout} variant="destructive" className="w-full">
        <LogOut className="w-4 h-4 mr-2" />
        Logout
      </Button>
    </div>
  )
}
