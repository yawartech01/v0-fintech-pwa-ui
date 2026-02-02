"use client"

import React from "react"

import { useState } from "react"
import { Eye, EyeOff, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface LoginPageProps {
  onNavigate: (page: "welcome" | "signup" | "verify" | "app") => void
}

export function LoginPage({ onNavigate }: LoginPageProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [isLoading, setIsLoading] = useState(false)

  const isFormValid = email.trim() !== "" && password.trim() !== ""

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Basic validation
    const newErrors: { email?: string; password?: string } = {}
    if (!email.trim()) {
      newErrors.email = "Email or phone is required"
    }
    if (!password.trim()) {
      newErrors.password = "Password is required"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)

    // Navigate to app (or verify if 2FA is enabled)
    onNavigate("app")
  }

  return (
    <div className="flex flex-col h-dvh bg-background safe-top safe-bottom">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center px-4 h-14">
        <button
          onClick={() => onNavigate("welcome")}
          className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 px-6 pt-4">
        <h1 className="text-xl font-semibold text-foreground mb-1">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Log in to your VeltoX account
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email/Phone Input */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">
              Email or Phone
            </Label>
            <Input
              id="email"
              type="text"
              placeholder="Enter email or phone"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 bg-card border-border/60 text-foreground placeholder:text-muted-foreground rounded-xl focus:border-primary/50"
              autoComplete="email"
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 bg-card border-border/60 text-foreground placeholder:text-muted-foreground pr-12 rounded-xl focus:border-primary/50"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password}</p>
            )}
          </div>

          {/* Forgot Password */}
          <div className="flex justify-end">
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-12 text-sm font-medium rounded-xl"
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? "Logging in..." : "Log in"}
          </Button>
        </form>
      </div>

      {/* Bottom Link */}
      <div className="flex-shrink-0 px-6 pb-10 pt-4">
        <p className="text-center text-xs text-muted-foreground">
          {"New here? "}
          <button
            onClick={() => onNavigate("signup")}
            className="text-foreground font-medium hover:text-primary transition-colors"
          >
            Create account
          </button>
        </p>
      </div>
    </div>
  )
}
