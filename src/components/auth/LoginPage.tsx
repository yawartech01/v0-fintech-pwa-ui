import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { dataStore } from '@/lib/data-store'
import { APIService } from '@/services/api-service'
import { connectWebSocket } from '@/lib/api-client'
import { useRealAPI } from '@/config/api-mode'
import { showToast } from '@/lib/toast'

interface LoginPageProps {
  onAuthChange: (authenticated: boolean) => void
}

export function LoginPage({ onAuthChange }: LoginPageProps) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const useAPI = useRealAPI()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // #region agent log
    fetch('http://localhost:7585/ingest/21d26861-f749-47b4-a8b9-9a94fd0fa5f3',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'9bcb79'},body:JSON.stringify({sessionId:'9bcb79',location:'LoginPage.tsx:submit',message:'Login attempt',data:{email,passwordLength:password.length,useAPI},timestamp:Date.now(),hypothesisId:'H-CRED'})}).catch(()=>{});
    // #endregion

    try {
      if (useAPI) {
        // Real API login
        const { token, user } = await APIService.login({ 
          email, 
          password 
        })
        
        // Store auth data
        localStorage.setItem('auth_token', token)
        localStorage.setItem('user_id', user.id)
        
        // Connect WebSocket for real-time updates
        connectWebSocket(user.id)
        
        showToast('Login successful!', 'success')
        onAuthChange(true)
        navigate('/')
      } else {
        // Mock mode - localStorage
        dataStore.login(email, password)
        showToast('Login successful! (Demo mode)', 'success')
        onAuthChange(true)
        navigate('/')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      // #region agent log
      fetch('http://localhost:7585/ingest/21d26861-f749-47b4-a8b9-9a94fd0fa5f3',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'9bcb79'},body:JSON.stringify({sessionId:'9bcb79',location:'LoginPage.tsx:catch',message:'Login failed',data:{errorMsg:error?.response?.data?.error,status:error?.response?.status,message:error?.message},timestamp:Date.now(),hypothesisId:'H-CRED'})}).catch(()=>{});
      // #endregion
      const errorMsg = error.response?.data?.error || 'Login failed. Please check your credentials.'
      showToast(errorMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground">Login to your VELTOX account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full h-12" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        <div className="text-center space-y-3">
          <button
            onClick={() => navigate('/forgot-password')}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Forgot password?
          </button>
          
          <div>
            <button
              onClick={() => navigate('/signup')}
              className="text-sm text-primary hover:underline"
            >
              Don't have an account? Sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
