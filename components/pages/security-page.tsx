"use client"

import React from "react"

import { useState } from "react"
import {
  Shield,
  Smartphone,
  Key,
  Monitor,
  LogOut,
  ChevronRight,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const mockSessions = [
  {
    id: "1",
    device: "iPhone 14 Pro",
    location: "Mumbai, India",
    lastActive: "Active now",
    isCurrent: true,
  },
  {
    id: "2",
    device: "Chrome on Windows",
    location: "Delhi, India",
    lastActive: "2 hours ago",
    isCurrent: false,
  },
  {
    id: "3",
    device: "Safari on MacBook",
    location: "Bangalore, India",
    lastActive: "3 days ago",
    isCurrent: false,
  },
]

export function SecurityPage() {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    newPassword: "",
    confirm: "",
  })

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle password change
    console.log("Password changed")
    setIsPasswordDialogOpen(false)
    setPasswordForm({ current: "", newPassword: "", confirm: "" })
  }

  const handleRevokeSession = (sessionId: string) => {
    // Handle session revocation
    console.log("Revoke session:", sessionId)
  }

  return (
    <div className="space-y-4">
      {/* 2FA Toggle */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Two-Factor Authentication
                </p>
                <p className="text-xs text-muted-foreground">
                  Add an extra layer of security
                </p>
              </div>
            </div>
            <Switch checked={is2FAEnabled} onCheckedChange={setIs2FAEnabled} />
          </div>
          {is2FAEnabled && (
            <div className="mt-4 p-3 bg-primary/5 rounded-lg">
              <p className="text-xs text-muted-foreground">
                2FA is enabled. You will need to enter a verification code from
                your authenticator app when logging in.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Dialog
            open={isPasswordDialogOpen}
            onOpenChange={setIsPasswordDialogOpen}
          >
            <DialogTrigger asChild>
              <button className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <Key className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Change Password
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Update your account password
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-sm mx-4">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  Change Password
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handlePasswordChange} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Current Password</Label>
                  <Input
                    type="password"
                    value={passwordForm.current}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        current: e.target.value,
                      })
                    }
                    className="bg-secondary border-border text-foreground"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">New Password</Label>
                  <Input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value,
                      })
                    }
                    className="bg-secondary border-border text-foreground"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Confirm New Password</Label>
                  <Input
                    type="password"
                    value={passwordForm.confirm}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirm: e.target.value,
                      })
                    }
                    className="bg-secondary border-border text-foreground"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Update Password
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Active Sessions
          </h2>
          <button className="text-xs text-destructive hover:underline">
            Log out all devices
          </button>
        </div>
        <Card className="bg-card border-border">
          <CardContent className="p-0 divide-y divide-border">
            {mockSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    {session.device.includes("iPhone") ||
                    session.device.includes("Android") ? (
                      <Smartphone className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <Monitor className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {session.device}
                      </p>
                      {session.isCurrent && (
                        <span className="text-xs text-primary">
                          (This device)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {session.location} • {session.lastActive}
                    </p>
                  </div>
                </div>
                {!session.isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleRevokeSession(session.id)}
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
