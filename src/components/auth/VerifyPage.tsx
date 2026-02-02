import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

interface VerifyPageProps {
  onAuthChange: (authenticated: boolean) => void
}

export function VerifyPage({ onAuthChange }: VerifyPageProps) {
  const navigate = useNavigate()

  const handleVerify = () => {
    onAuthChange(true)
    navigate('/')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-background px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Verify your email</h1>
          <p className="text-muted-foreground">We've sent a verification code to your email</p>
        </div>

        <Button onClick={handleVerify} className="w-full h-12">
          Continue to App
        </Button>
      </div>
    </div>
  )
}
