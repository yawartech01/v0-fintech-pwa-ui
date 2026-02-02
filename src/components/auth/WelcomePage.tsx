import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

interface WelcomePageProps {
  onAuthChange: (authenticated: boolean) => void
}

export function WelcomePage({ onAuthChange: _onAuthChange }: WelcomePageProps) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-primary">VELTOX</h1>
          <p className="text-lg text-muted-foreground">Premium USDT to INR Exchange</p>
        </div>

        <div className="space-y-3 pt-8">
          <Button onClick={() => navigate('/login')} className="w-full h-12" size="lg">
            Login
          </Button>
          <Button
            onClick={() => navigate('/signup')}
            variant="outline"
            className="w-full h-12"
            size="lg"
          >
            Create Account
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground pt-4">Secure. Fast. Reliable.</p>
      </div>
    </div>
  )
}
