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

interface SignupPageProps {
  onAuthChange: (authenticated: boolean) => void
}

export function SignupPage({ onAuthChange }: SignupPageProps) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const useAPI = useRealAPI()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (useAPI) {
        // Real API signup
        const { token, user } = await APIService.signup({
          email,
          password,
          name,
          referralCode: referralCode || undefined,
        })
        
        // Store auth data
        localStorage.setItem('auth_token', token)
        localStorage.setItem('user_id', user.id)
        
        // Connect WebSocket for real-time updates
        connectWebSocket(user.id)
        
        showToast('Account created successfully!', 'success')
        onAuthChange(true)
        navigate('/')
      } else {
        // Mock mode - localStorage
        dataStore.login(email, password, referralCode || undefined)
        showToast('Account created! (Demo mode)', 'success')
        onAuthChange(true)
        navigate('/')
      }
    } catch (error: any) {
      console.error('Signup error:', error)
      const errorMsg = error.response?.data?.error || 'Signup failed. Please try again.'
      showToast(errorMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Create account</h1>
          <p className="text-muted-foreground">Join VELTOX today</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

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
                minLength={8}
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
            <p className="text-xs text-muted-foreground">
              Minimum 8 characters required
            </p>
          </div>

          {/* Referral Code Input - Optional */}
          <div className="space-y-2">
            <Label htmlFor="referralCode">
              Referral Code <span className="text-muted-foreground text-xs">(Optional)</span>
            </Label>
            <Input
              id="referralCode"
              type="text"
              placeholder="Enter referral code"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Have a referral code? Enter it to join a team
            </p>
          </div>

          <Button type="submit" className="w-full h-12" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign up'}
          </Button>
        </form>

        <div className="text-center">
          <button
            onClick={() => navigate('/login')}
            className="block w-full py-3 text-sm text-primary hover:underline"
          >
            Already have an account? Login
          </button>
        </div>
      </div>
    </div>
  )
}
