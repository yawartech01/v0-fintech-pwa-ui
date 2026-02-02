import { Shield, Lock, Key } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export function SecurityPage() {
  return (
    <div className="space-y-4 pb-4">
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-primary" />
              <div>
                <Label htmlFor="2fa" className="font-medium">
                  Two-Factor Authentication
                </Label>
                <p className="text-xs text-muted-foreground">Add extra security to your account</p>
              </div>
            </div>
            <Switch id="2fa" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-primary" />
              <div>
                <Label htmlFor="biometric" className="font-medium">
                  Biometric Login
                </Label>
                <p className="text-xs text-muted-foreground">Use fingerprint or face ID</p>
              </div>
            </div>
            <Switch id="biometric" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <Button variant="outline" className="w-full justify-start">
            <Shield className="w-5 h-5 mr-3 text-primary" />
            Change Password
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
