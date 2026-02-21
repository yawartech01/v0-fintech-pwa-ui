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
  const dim = size === 'lg' ? 64 : 48
  const fontSize = size === 'lg' ? '1.35rem' : '1rem'
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
        border: '2px solid rgba(255,255,255,0.15)',
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
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">

            {/* Avatar — tap to change */}
            <div className="relative shrink-0">
              <AvatarDisplay
                themeId={avatar}
                initials={initials}
                size="lg"
                onClick={() => setShowAvatarPicker(true)}
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-background border border-border flex items-center justify-center pointer-events-none">
                <Pencil className="w-2.5 h-2.5 text-muted-foreground" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {/* Nickname row */}
              {editingNickname ? (
                <div className="flex items-center gap-1.5 mb-1">
                  <Input
                    value={nicknameInput}
                    onChange={(e) => setNicknameInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveNickname(); if (e.key === 'Escape') setEditingNickname(false) }}
                    className="h-8 text-base font-semibold px-2"
                    maxLength={50}
                    autoFocus
                  />
                  <button onClick={handleSaveNickname} disabled={saving} className="p-1 text-green-500 hover:text-green-400">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditingNickname(false)} className="p-1 text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-lg font-semibold truncate">{nickname || 'Set nickname'}</p>
                  <button
                    onClick={() => { setNicknameInput(nickname); setEditingNickname(true) }}
                    className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                    title="Edit nickname"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* UID */}
              {formattedUID && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold text-primary tracking-wide">
                    {formattedUID}
                  </span>
                  <button onClick={handleCopyUID} className="text-muted-foreground hover:text-primary transition-colors" title="Copy UID">
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Avatar Picker Modal */}
      {showAvatarPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowAvatarPicker(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="relative z-10 w-full max-w-sm bg-background rounded-t-2xl p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold">Choose Color</h3>
              <button onClick={() => setShowAvatarPicker(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Your initials will appear on the selected color.</p>
            <div className="grid grid-cols-4 gap-3">
              {AVATAR_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleSelectAvatar(theme.id)}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${
                    avatar === theme.id
                      ? 'bg-primary/10 ring-2 ring-primary'
                      : 'hover:bg-secondary/60'
                  }`}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: '#fff',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {initials}
                  </div>
                  <span className="text-[10px] text-muted-foreground leading-none">{theme.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Admin Panel */}
      {isAdmin && (
        <Card className="cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => navigate('/admin')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-warning" />
                <span className="font-medium text-warning">Admin Panel</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Menu Items */}
      <div className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.path} className="cursor-pointer hover:bg-secondary/50 active:bg-secondary/70 transition-colors" onClick={() => navigate(item.path)}>
              <CardContent className="py-4 px-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-primary" />
                    <span className="font-medium text-[15px]">{item.label}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Logout */}
      <Button onClick={handleLogout} variant="destructive" className="w-full" size="lg">
        <LogOut className="w-5 h-5 mr-2" />
        Logout
      </Button>
    </div>
  )
}
