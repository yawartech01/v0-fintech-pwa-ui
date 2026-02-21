import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

interface WelcomePageProps {
  onAuthChange: (authenticated: boolean) => void
}

export function WelcomePage({ onAuthChange: _onAuthChange }: WelcomePageProps) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-background px-6">
      <div className="w-full max-w-sm space-y-10">
        {/* Brand */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-2">
            <span className="text-2xl font-black text-primary tracking-tight">V</span>
          </div>
          <h1 className="text-4xl font-black text-foreground tracking-tight">VELTOX</h1>
          <p className="text-base text-muted-foreground leading-relaxed">Premium USDT to INR Exchange</p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button onClick={() => navigate('/login')} className="w-full text-base" size="lg">
            Login
          </Button>
          <Button
            onClick={() => navigate('/signup')}
            variant="outline"
            className="w-full text-base"
            size="lg"
          >
            Create Account
          </Button>
        </div>

        {/* Tagline */}
        <p className="text-center text-sm text-muted-foreground">Secure. Fast. Reliable.</p>
      </div>
    </div>
  )
}
