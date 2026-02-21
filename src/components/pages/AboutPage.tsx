import { Info, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function AboutPage() {
  const appVersion = '1.0.0'
  const buildDate = 'February 2026'

  return (
    <div className="space-y-3 pb-4">
      {/* App Info */}
      <Card>
        <CardHeader className="text-center">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-1.5">
            <Info className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-lg">VELTOX</CardTitle>
          <p className="text-xs text-muted-foreground">Premium USDT to INR Exchange Platform</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center px-4 py-3 bg-secondary/30 rounded-lg border border-border/30">
              <span className="text-muted-foreground">Version</span>
              <span className="font-mono font-medium">{appVersion}</span>
            </div>
            <div className="flex justify-between items-center px-4 py-3 bg-secondary/30 rounded-lg border border-border/30">
              <span className="text-muted-foreground">Build Date</span>
              <span className="font-medium">{buildDate}</span>
            </div>
            <div className="flex justify-between items-center px-4 py-3 bg-secondary/30 rounded-lg border border-border/30">
              <span className="text-muted-foreground">Network</span>
              <span className="font-medium">TRC20 Only</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Key Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>TRC20 USDT deposits with auto-sweep</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Secure approval-based withdrawals</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Create and manage sell ads</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>2-level referral rewards system</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Multiple payment methods</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Real-time transaction history</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Legal Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Legal & Privacy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <button className="w-full flex items-center justify-between px-4 py-3.5 bg-secondary/30 rounded-lg hover:bg-secondary/50 active:bg-secondary/60 transition-colors text-left border border-border/30">
            <span className="text-sm font-medium">Terms of Service</span>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </button>
          <button className="w-full flex items-center justify-between px-4 py-3.5 bg-secondary/30 rounded-lg hover:bg-secondary/50 active:bg-secondary/60 transition-colors text-left border border-border/30">
            <span className="text-sm font-medium">Privacy Policy</span>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </button>
          <button className="w-full flex items-center justify-between px-4 py-3.5 bg-secondary/30 rounded-lg hover:bg-secondary/50 active:bg-secondary/60 transition-colors text-left border border-border/30">
            <span className="text-sm font-medium">Cookie Policy</span>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </button>
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="text-xs text-center text-muted-foreground px-4">
        © 2026 VELTOX. All rights reserved.
        <br />
        Premium USDT Exchange Platform
      </p>
    </div>
  )
}
