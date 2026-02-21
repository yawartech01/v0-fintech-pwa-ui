import { useState } from 'react'
import { MessageSquare, Mail, Send, Copy, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { showToast } from '@/lib/toast'

export function SupportPage() {
  const [problemDescription, setProblemDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [copiedTelegram, setCopiedTelegram] = useState(false)

  const supportEmail = 'support@veltox.app'
  const supportTelegram = 't.me/AlexveltoX'

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(supportEmail)
    setCopiedEmail(true)
    showToast('Email copied to clipboard', 'success')
    setTimeout(() => setCopiedEmail(false), 2000)
  }

  const handleCopyTelegram = () => {
    navigator.clipboard.writeText(supportTelegram)
    setCopiedTelegram(true)
    showToast('Telegram handle copied', 'success')
    setTimeout(() => setCopiedTelegram(false), 2000)
  }

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault()

    if (!problemDescription.trim()) {
      showToast('Please describe your problem', 'error')
      return
    }

    setIsSubmitting(true)

    // Mock: Store ticket in localStorage
    setTimeout(() => {
      const tickets = JSON.parse(localStorage.getItem('veltox_support_tickets') || '[]')
      const newTicket = {
        id: `ticket_${Date.now()}`,
        message: problemDescription,
        createdAt: new Date().toISOString(),
        status: 'pending',
      }
      tickets.push(newTicket)
      localStorage.setItem('veltox_support_tickets', JSON.stringify(tickets))

      showToast('Support ticket submitted successfully', 'success')
      setProblemDescription('')
      setIsSubmitting(false)
    }, 500)
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Contact Support
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email */}
          <div className="p-4 bg-secondary/30 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Mail className="w-4 h-4" />
              <p className="text-sm font-medium">Email Support</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-mono">{supportEmail}</p>
              <Button onClick={handleCopyEmail} variant="ghost" size="sm">
                {copiedEmail ? (
                  <CheckCircle2 className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Telegram */}
          <div className="p-4 bg-secondary/30 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Send className="w-4 h-4" />
              <p className="text-sm font-medium">Telegram Support</p>
            </div>
            <div className="flex items-center justify-between">
              <a
                href={`https://${supportTelegram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-mono text-primary hover:underline"
              >
                {supportTelegram}
              </a>
              <Button onClick={handleCopyTelegram} variant="ghost" size="sm">
                {copiedTelegram ? (
                  <CheckCircle2 className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Average response time: 24 hours
          </p>
        </CardContent>
      </Card>

      {/* Report a Problem */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Report a Problem</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitTicket} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="problem-description">Describe your issue</Label>
              <Textarea
                id="problem-description"
                placeholder="Please provide details about the problem you're experiencing..."
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                rows={6}
                required
              />
              <p className="text-xs text-muted-foreground">
                Include as much detail as possible to help us resolve your issue quickly.
              </p>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground text-center">
            Our support team is available 24/7 to assist you with any issues or questions.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
