import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { showToast } from '@/lib/toast'
import { ShieldCheck, Lock } from 'lucide-react'
import { APIService } from '@/services/api-service'
import { useRealAPI } from '@/config/api-mode'

const ADMIN_PASSWORD = 'veltox2026'

export function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const useAPI = useRealAPI()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (useAPI) {
        // Real API admin login
        const { token } = await APIService.adminLogin(password)
        localStorage.setItem('veltox_admin_token', token)
        localStorage.setItem('veltox_admin_login_time', new Date().toISOString())
        showToast('Admin access granted', 'success')
        navigate('/admin')
      } else {
        // Mock mode - simple password check
        if (password === ADMIN_PASSWORD) {
          localStorage.setItem('veltox_admin_token', `admin_${Date.now()}`)
          localStorage.setItem('veltox_admin_login_time', new Date().toISOString())
          showToast('Admin access granted (Demo mode)', 'success')
          navigate('/admin')
        } else {
          showToast('Invalid password', 'error')
          setPassword('')
        }
      }
    } catch (error: any) {
      console.error('Admin login error:', error)
      const errorMsg = error.response?.data?.error || 'Invalid admin password'
      showToast(errorMsg, 'error')
      setPassword('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">VELTOX Admin</CardTitle>
          <CardDescription>Enter password to access admin panel</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Admin Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="pl-10"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Verifying...' : 'Access Admin Panel'}
            </Button>

            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← Back to App
              </button>
            </div>
          </form>

        </CardContent>
      </Card>
    </div>
  )
}
