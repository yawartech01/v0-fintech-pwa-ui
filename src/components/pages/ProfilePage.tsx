import { useNavigate } from 'react-router-dom'
import {
  ChevronRight,
  LogOut,
  CreditCard,
  Shield,
  HelpCircle,
  Gift,
  Settings,
  Info,
  Copy,
  Pencil,
  Check,
  X,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { dataStore } from '@/lib/data-store'
import { showToast } from '@/lib/toast'
import { useState, useEffect } from 'react'
import { APIService } from '@/services/api-service'
import { useRealAPI } from '@/config/api-mode'

interface ProfilePageProps {
  onAuthChange: (authenticated: boolean) => void
}

// Professional gradient themes for avatar
const AVATAR_THEMES: { id: string; from: string; to: string; label: string }[] = [
  { id: 'violet',   from: '#7C3AED', to: '#4F46E5', label: 'Violet'   },
  { id: 'emerald',  from: '#059669', to: '#0284C7', label: 'Emerald'  },
  { id: 'amber',    from: '#D97706', to: '#DC2626', label: 'Amber'    },
  { id: 'cyan',     from: '#0891B2', to: '#6366F1', label: 'Cyan'     },
  { id: 'rose',     from: '#E11D48', to: '#9333EA', label: 'Rose'     },
  { id: 'slate',    from: '#334155', to: '#1E40AF', label: 'Slate'    },
  { id: 'teal',     from: '#0D9488', to: '#2563EB', label: 'Teal'     },
  { id: 'gold',     from: '#B45309', to: '#92400E', label: 'Gold'     },
  { id: 'indigo',   from: '#4338CA', to: '#7C3AED', label: 'Indigo'   },
  { id: 'green',    from: '#16A34A', to: '#065F46', label: 'Green'    },
  { id: 'blue',     from: '#1D4ED8', to: '#0369A1', label: 'Blue'     },
  { id: 'crimson',  from: '#9F1239', to: '#7C2D12', label: 'Crimson'  },
]

function getTheme(id: string) {
  return AVATAR_THEMES.find(t => t.id === id) ?? AVATAR_THEMES[0]
}

function AvatarDisplay({
  themeId,
  initials,
  size = 'lg',
  onClick,
}: {
  themeId: string
  initials: string
  size?: 'sm' | 'lg'
  onClick?: () => void
}) {
  const theme = getTheme(themeId)
  const dim = size === 'lg' ? 72 : 48
  const fontSize = size === 'lg' ? '1.5rem' : '1rem'
  return (
    <button
      onClick={onClick}
      title={onClick ? 'Change avatar' : undefined}
      style={{
        width: dim,
        height: dim,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize,
        fontWeight: 700,
        color: '#fff',
        letterSpacing: '0.04em',
        border: '2px solid rgba(255,255,255,0.12)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
        flexShrink: 0,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {initials}
    </button>
  )
}

export function ProfilePage({ onAuthChange }: ProfilePageProps) {
  const navigate = useNavigate()
  const useAPI = useRealAPI()

  const [uid, setUid] = useState<number | string>('')
  const [, setEmail] = useState('')
  const [nickname, setNickname] = useState('')
  const [avatar, setAvatar] = useState('violet')
  const [isAdmin, setIsAdmin] = useState(false)

  // Edit states
  const [editingNickname, setEditingNickname] = useState(false)
  const [nicknameInput, setNicknameInput] = useState('')
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const adminFlag = localStorage.getItem('veltox_is_admin')
    setIsAdmin(adminFlag === 'true')

    if (useAPI) {
      APIService.getProfile().then((data) => {
        const u = data?.user || data
        if (u?.uid)      setUid(u.uid)
        if (u?.email)    setEmail(u.email)
        if (u?.nickname || u?.name) setNickname(u.nickname || u.name || '')
        if (u?.avatar)   setAvatar(u.avatar)
      }).catch(() => { /* silently ignore — keep defaults */ })
    } else {
      const authState = dataStore.getAuthState()
      const u = authState.user
      if (u) {
        setUid(u.uid || '')
        setEmail(u.email || '')
        setNickname(u.name || '')
      }
    }
  }, [useAPI])

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      dataStore.logout()
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_id')
      onAuthChange(false)
      navigate('/')
    }
  }

  const handleCopyUID = () => {
    const text = `VLX-${String(uid).padStart(6, '0')}`
    navigator.clipboard.writeText(text)
    showToast('UID copied', 'success')
  }

  const handleSaveNickname = async () => {
    const trimmed = nicknameInput.trim()
    if (!trimmed || trimmed.length < 2) {
      showToast('Nickname must be at least 2 characters', 'error')
      return
    }
    setSaving(true)
    try {
      if (useAPI) {
        await APIService.updateProfile({ nickname: trimmed })
      }
      setNickname(trimmed)
      setEditingNickname(false)
      showToast('Nickname updated!', 'success')
    } catch {
      showToast('Failed to save nickname', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSelectAvatar = async (themeId: string) => {
    setAvatar(themeId)
    setShowAvatarPicker(false)
    try {
      if (useAPI) await APIService.updateProfile({ avatar: themeId })
      showToast('Avatar updated!', 'success')
    } catch {
      showToast('Failed to save avatar', 'error')
    }
  }

  // derive 2-letter initials from nickname
  const initials = (() => {
    const parts = (nickname || 'U').trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return (parts[0][0] + (parts[0][1] || '')).toUpperCase()
  })()

  const menuItems = [
    { icon: Gift,      label: 'Invite & Earn',  path: '/referral' },
    { icon: CreditCard, label: 'Bank Accounts', path: '/bank-accounts' },
    { icon: Shield,    label: 'Security',        path: '/security' },
    { icon: HelpCircle, label: 'Support & FAQ',  path: '/support' },
    { icon: Info,      label: 'About',           path: '/about' },
  ]

  const formattedUID = uid ? `VLX-${String(uid).padStart(6, '0')}` : ''

  return (
    <div className="space-y-4 pb-4">

      {/* Profile Card */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Top gradient accent */}
          <div className="h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
          
          <div className="px-5 pt-5 pb-5">
            <div className="flex items-center gap-4">

              {/* Avatar -- tap to change */}
              <div className="relative shrink-0">
                <AvatarDisplay
                  themeId={avatar}
                  initials={initials}
                  size="lg"
                  onClick={() => setShowAvatarPicker(true)}
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-card border-2 border-border flex items-center justify-center pointer-events-none shadow-sm">
                  <Pencil className="w-3 h-3 text-muted-foreground" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                {/* Nickname row */}
                {editingNickname ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={nicknameInput}
                      onChange={(e) => setNicknameInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSaveNickname(); if (e.key === 'Escape') setEditingNickname(false) }}
                      className="h-10 text-base font-semibold px-3"
                      maxLength={50}
                      autoFocus
                    />
                    <button onClick={handleSaveNickname} disabled={saving} className="p-2.5 text-primary hover:text-primary/80 rounded-lg hover:bg-secondary/50 transition-colors">
                      <Check className="w-5 h-5" />
                    </button>
                    <button onClick={() => setEditingNickname(false)} className="p-2.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/50 transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold truncate leading-tight">{nickname || 'Set nickname'}</p>
                    <button
                      onClick={() => { setNicknameInput(nickname); setEditingNickname(true) }}
                      className="p-1.5 text-muted-foreground hover:text-primary hover:bg-secondary/50 rounded-md transition-colors shrink-0"
                      title="Edit nickname"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* UID */}
                {formattedUID && (
                  <button
                    onClick={handleCopyUID}
                    className="flex items-center gap-1.5 mt-1.5 group"
                    title="Copy UID"
                  >
                    <span className="text-xs font-mono font-semibold text-primary tracking-wide">
                      {formattedUID}
                    </span>
                    <Copy className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Avatar Picker Modal */}
      {showAvatarPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowAvatarPicker(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="relative z-10 w-full max-w-md bg-card rounded-t-2xl shadow-2xl safe-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>
            
            <div className="px-5 pb-6">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-semibold">Choose Avatar Color</h3>
                <button onClick={() => setShowAvatarPicker(false)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-5">Your initials will appear on the selected color.</p>
              <div className="grid grid-cols-4 gap-3">
                {AVATAR_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => handleSelectAvatar(theme.id)}
                    className={`flex flex-col items-center gap-2 p-2.5 rounded-xl transition-all ${
                      avatar === theme.id
                        ? 'bg-primary/10 ring-2 ring-primary ring-offset-1 ring-offset-card'
                        : 'hover:bg-secondary/60'
                    }`}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        color: '#fff',
                        letterSpacing: '0.04em',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      }}
                    >
                      {initials}
                    </div>
                    <span className="text-[11px] text-muted-foreground leading-none font-medium">{theme.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Menu Items */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Admin Panel - shown first if admin */}
          {isAdmin && (
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center justify-between w-full px-5 py-4 hover:bg-secondary/40 active:bg-secondary/60 transition-colors border-b border-border/50"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Settings className="w-[18px] h-[18px] text-warning" />
                </div>
                <span className="text-[15px] font-medium text-warning">Admin Panel</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground/60" />
            </button>
          )}
          
          {menuItems.map((item, index) => {
            const Icon = item.icon
            const isLast = index === menuItems.length - 1
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center justify-between w-full px-5 py-4 hover:bg-secondary/40 active:bg-secondary/60 transition-colors ${
                  !isLast ? 'border-b border-border/50' : ''
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-[18px] h-[18px] text-primary" />
                  </div>
                  <span className="text-[15px] font-medium">{item.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground/60" />
              </button>
            )
          })}
        </CardContent>
      </Card>

      {/* Logout */}
      <Button onClick={handleLogout} variant="destructive" className="w-full" size="lg">
        <LogOut className="w-5 h-5 mr-2" />
        Logout
      </Button>
    </div>
  )
}
