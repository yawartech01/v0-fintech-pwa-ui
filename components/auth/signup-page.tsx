"use client"

import React from "react"

import { useState } from "react"
import { Eye, EyeOff, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

interface SignupPageProps {
  onNavigate: (page: "welcome" | "login" | "verify") => void
}

export function SignupPage({ onNavigate }: SignupPageProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [inputType, setInputType] = useState<"email" | "phone">("email")
  const [emailOrPhone, setEmailOrPhone] = useState("")
  const [password, setPassword] = useState("")
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [errors, setErrors] = useState<{
    emailOrPhone?: string
    password?: string
    terms?: string
  }>({})
  const [isLoading, setIsLoading] = useState(false)

  const isFormValid =
    emailOrPhone.trim() !== "" && password.trim() !== "" && agreedToTerms

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Basic validation
    const newErrors: {
      emailOrPhone?: string
      password?: string
      terms?: string
    } = {}

    if (!emailOrPhone.trim()) {
      newErrors.emailOrPhone =
        inputType === "email" ? "Email is required" : "Phone number is required"
    } else if (inputType === "email" && !emailOrPhone.includes("@")) {
      newErrors.emailOrPhone = "Please enter a valid email"
    }

    if (!password.trim()) {
      newErrors.password = "Password is required"
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }

    if (!agreedToTerms) {
      newErrors.terms = "You must agree to the terms"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)

    // Navigate to OTP verification
    onNavigate("verify")
  }

  const toggleInputType = () => {
    setInputType(inputType === "email" ? "phone" : "email")
    setEmailOrPhone("")
    setErrors({})
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
      <div className="flex-1 px-6 pt-4 overflow-y-auto">
        <h1 className="text-xl font-semibold text-foreground mb-1">
          Create account
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Start exchanging USDT in minutes
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email/Phone Toggle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="emailOrPhone"
                className="text-xs font-medium text-muted-foreground"
              >
                {inputType === "email" ? "Email" : "Phone Number"}
              </Label>
              <button
                type="button"
                onClick={toggleInputType}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {inputType === "email" ? "Use phone instead" : "Use email instead"}
              </button>
            </div>
            <Input
              id="emailOrPhone"
              type={inputType === "email" ? "email" : "tel"}
              placeholder={
                inputType === "email"
                  ? "Enter your email"
                  : "Enter your phone number"
              }
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              className="h-12 bg-card border-border/60 text-foreground placeholder:text-muted-foreground rounded-xl focus:border-primary/50"
              autoComplete={inputType === "email" ? "email" : "tel"}
            />
            {errors.emailOrPhone && (
              <p className="text-xs text-destructive">{errors.emailOrPhone}</p>
            )}
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-xs font-medium text-muted-foreground"
            >
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 bg-card border-border/60 text-foreground placeholder:text-muted-foreground pr-12 rounded-xl focus:border-primary/50"
                autoComplete="new-password"
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
            <p className="text-xs text-muted-foreground">
              Must be at least 8 characters
            </p>
          </div>

          {/* Terms Checkbox */}
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) =>
                  setAgreedToTerms(checked as boolean)
                }
                className="mt-0.5 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <label
                htmlFor="terms"
                className="text-xs text-muted-foreground leading-relaxed cursor-pointer"
              >
                I agree to the{" "}
                <button
                  type="button"
                  className="text-foreground hover:text-primary transition-colors"
                >
                  Terms of Service
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  className="text-foreground hover:text-primary transition-colors"
                >
                  Privacy Policy
                </button>
              </label>
            </div>
            {errors.terms && (
              <p className="text-xs text-destructive">{errors.terms}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-12 text-sm font-medium rounded-xl"
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? "Creating account..." : "Create account"}
          </Button>
        </form>
      </div>

      {/* Bottom Link */}
      <div className="flex-shrink-0 px-6 pb-10 pt-4">
        <p className="text-center text-xs text-muted-foreground">
          {"Already have an account? "}
          <button
            onClick={() => onNavigate("login")}
            className="text-foreground font-medium hover:text-primary transition-colors"
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  )
}
