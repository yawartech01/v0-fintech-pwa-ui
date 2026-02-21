import { useState } from 'react'
import { Lock, Eye, EyeOff, Smartphone } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { showToast } from '@/lib/toast'
import { dataStore } from '@/lib/data-store'

export function SecurityPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [isChanging, setIsChanging] = useState(false)

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters', 'error')
      return
    }

    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error')
      return
    }

    if (!currentPassword) {
      showToast('Current password is required', 'error')
      return
    }

    setIsChanging(true)

    // Mock password change - store hash placeholder
    setTimeout(() => {
      localStorage.setItem('veltox_password_set', 'true')
      localStorage.setItem('veltox_password_hash', btoa(newPassword)) // Mock hash
      showToast('Password changed successfully', 'success')

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setIsChanging(false)
    }, 500)
  }

  const handleSignOutOtherSessions = () => {
    // Mock: just clear a placeholder sessions list
    localStorage.removeItem('veltox_other_sessions')
    showToast('Other sessions signed out successfully', 'success')
  }

  const deviceId = dataStore.getOrCreateDeviceId()
  const lastActive = new Date().toLocaleString()

  return (
    <div className="space-y-4 pb-4">
      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showPasswords ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type={showPasswords ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 8 chars)"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type={showPasswords ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowPasswords(!showPasswords)}
              >
                {showPasswords ? (
                  <EyeOff className="w-4 h-4 mr-2" />
                ) : (
                  <Eye className="w-4 h-4 mr-2" />
                )}
                {showPasswords ? 'Hide' : 'Show'} Passwords
              </Button>
            </div>

            <Button type="submit" disabled={isChanging} className="w-full">
              {isChanging ? 'Changing...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Device Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" />
            Device Sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-secondary/40 rounded-lg space-y-2.5 border border-border/40">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Current Session</p>
              <Badge variant="default" className="text-xs">
                Active
              </Badge>
            </div>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <p className="font-mono">Device: {deviceId.slice(0, 20)}...</p>
              <p>Last Active: {lastActive}</p>
            </div>
          </div>

          <Button onClick={handleSignOutOtherSessions} variant="outline" className="w-full">
            Sign Out Other Sessions
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            This will log you out from all other devices
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
