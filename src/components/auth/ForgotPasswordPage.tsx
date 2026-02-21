import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { showToast } from '@/lib/toast'

type Step = 'enter_email' | 'verify' | 'reset' | 'success'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('enter_email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [mockOtp] = useState('123456')

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    setTimeout(() => {
      showToast(`Verification code sent to ${email}`, 'success')
      setLoading(false)
      setStep('verify')
    }, 1000)
  }

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    setTimeout(() => {
      if (otp === mockOtp) {
        showToast('Code verified successfully', 'success')
        setLoading(false)
        setStep('reset')
      } else {
        showToast('Invalid verification code. Try: 123456', 'error')
        setLoading(false)
      }
    }, 1000)
  }

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters', 'error')
      return
    }

    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error')
      return
    }

    setLoading(true)

    setTimeout(() => {
      showToast('Password reset successful', 'success')
      setLoading(false)
      setStep('success')
    }, 1000)
  }

  const handleResendCode = () => {
    setLoading(true)
    setTimeout(() => {
      showToast(`Code resent to ${email}`, 'success')
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Back Button */}
        <button
          onClick={() => (step === 'enter_email' ? navigate('/login') : setStep('enter_email'))}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Email Entry Step */}
        {step === 'enter_email' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold">Forgot Password?</h1>
              <p className="text-muted-foreground">
                Enter your email to receive a verification code
              </p>
            </div>

            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  We'll send a verification code to this email
                </p>
              </div>

              <Button type="submit" className="w-full h-12" disabled={loading}>
                {loading ? 'Sending code...' : 'Send Verification Code'}
              </Button>
            </form>
          </div>
        )}

        {/* OTP Verification Step */}
        {step === 'verify' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold">Enter Code</h1>
              <p className="text-muted-foreground">
                We sent a verification code to
                <br />
                <span className="font-medium text-foreground">{email}</span>
              </p>
            </div>

            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                />
                <p className="text-xs text-muted-foreground text-center">
                  For testing, use code: <span className="font-mono font-bold">123456</span>
                </p>
              </div>

              <Button type="submit" className="w-full h-12" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify Code'}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading}
                  className="text-sm text-primary hover:underline disabled:opacity-50"
                >
                  Didn't receive code? Resend
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reset Password Step */}
        {step === 'reset' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold">New Password</h1>
              <p className="text-muted-foreground">
                Create a strong password for your account
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 8 characters required
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full h-12" disabled={loading}>
                {loading ? 'Resetting password...' : 'Reset Password'}
              </Button>
            </form>
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <div className="space-y-6 text-center">
            <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto">
              <svg
                className="w-10 h-10 text-success"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Password Reset!</h1>
              <p className="text-muted-foreground">
                Your password has been successfully reset.
                <br />
                You can now login with your new password.
              </p>
            </div>

            <Button onClick={() => navigate('/login')} className="w-full h-12">
              Go to Login
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
