import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, ChevronRight, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { dataStore } from '@/lib/data-store'
import { showToast } from '@/lib/toast'

export function JoinTeamPage() {
  const navigate = useNavigate()
  const [referralCode, setReferralCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const validateCode = (code: string): boolean => {
    // Format: REF followed by 6 uppercase alphanumeric characters
    const regex = /^REF[A-Z0-9]{6}$/
    return regex.test(code.toUpperCase())
  }

  const handleContinue = async () => {
    setError('')

    if (!referralCode.trim()) {
      setError('Please enter a referral code')
      return
    }

    const normalizedCode = referralCode.toUpperCase().trim()

    if (!validateCode(normalizedCode)) {
      setError('Invalid code format. Code should be like REF123456')
      showToast('Invalid referral code format', 'error')
      return
    }

    setIsLoading(true)

    try {
      const result = dataStore.applyReferralCode(normalizedCode)

      if (!result.success) {
        setError(result.error || 'Invalid referral code')
        showToast(result.error || 'Invalid referral code', 'error')
        setIsLoading(false)
        return
      }

      // Mark onboarding as complete
      dataStore.completeOnboarding()

      showToast('Successfully joined team!', 'success')
      navigate('/')
    } catch (err) {
      setError('An error occurred. Please try again.')
      showToast('An error occurred. Please try again.', 'error')
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    // Mark onboarding as complete without referral
    dataStore.completeOnboarding()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Join a Team</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter a leader code to link your account and earn rewards together. You can skip this
            step.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Info Card */}
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg space-y-2">
            <p className="text-sm font-medium">What is a leader code?</p>
            <p className="text-xs text-muted-foreground">
              When you join using a leader's code, you'll become part of their team. Both you and
              your leader can earn rewards when you complete transactions.
            </p>
          </div>

          {/* Input */}
          <div className="space-y-2">
            <Label htmlFor="referral-code">Leader Referral Code</Label>
            <Input
              id="referral-code"
              type="text"
              placeholder="Enter code (e.g., REF123456)"
              value={referralCode}
              onChange={(e) => {
                setReferralCode(e.target.value)
                setError('')
              }}
              className={error ? 'border-destructive' : ''}
              disabled={isLoading}
            />
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleContinue}
              disabled={isLoading || !referralCode.trim()}
              className="w-full"
              size="lg"
            >
              Continue
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>

            <Button
              onClick={handleSkip}
              variant="ghost"
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              Skip for now
            </Button>
          </div>

          {/* Help Text */}
          <p className="text-xs text-center text-muted-foreground">
            Don't have a code? You can always link one later from your profile.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
