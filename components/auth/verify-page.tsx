"use client"

import React from "react"

import { useState, useEffect, useRef } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface VerifyPageProps {
  onNavigate: (page: "signup" | "app") => void
  contact?: string
}

export function VerifyPage({ onNavigate, contact = "user@example.com" }: VerifyPageProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [timer, setTimer] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const maskedContact = contact.includes("@")
    ? contact.replace(/(.{2})(.*)(@.*)/, "$1***$3")
    : contact.replace(/(\d{3})(\d*)(\d{2})/, "$1****$3")

  const isOtpComplete = otp.every((digit) => digit !== "")

  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(interval)
    } else {
      setCanResend(true)
    }
  }, [timer])

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setError("")

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").slice(0, 6)
    if (!/^\d+$/.test(pastedData)) return

    const newOtp = [...otp]
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newOtp[i] = pastedData[i]
    }
    setOtp(newOtp)

    // Focus the next empty input or the last one
    const nextEmptyIndex = newOtp.findIndex((digit) => digit === "")
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus()
    } else {
      inputRefs.current[5]?.focus()
    }
  }

  const handleResend = () => {
    setTimer(60)
    setCanResend(false)
    setOtp(["", "", "", "", "", ""])
    setError("")
    inputRefs.current[0]?.focus()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isOtpComplete) {
      setError("Please enter the complete code")
      return
    }

    setIsLoading(true)
    setError("")

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Simulate verification (any OTP works for demo)
    setIsLoading(false)
    onNavigate("app")
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex flex-col h-dvh bg-background safe-top safe-bottom">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center px-4 h-14">
        <button
          onClick={() => onNavigate("signup")}
          className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 px-6 pt-4">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Verify your account
        </h1>
        <p className="text-muted-foreground mb-8">
          We sent a 6-digit code to{" "}
          <span className="text-foreground font-medium">{maskedContact}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* OTP Input */}
          <div className="space-y-3">
            <div className="flex justify-center gap-2">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-12 h-14 text-center text-xl font-semibold bg-secondary border-border text-foreground focus:border-primary focus:ring-primary"
                  aria-label={`Digit ${index + 1}`}
                />
              ))}
            </div>
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
          </div>

          {/* Timer and Resend */}
          <div className="text-center">
            {canResend ? (
              <button
                type="button"
                onClick={handleResend}
                className="text-sm text-primary font-medium hover:underline"
              >
                Resend code
              </button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Resend code in{" "}
                <span className="text-foreground font-medium">
                  {formatTime(timer)}
                </span>
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold"
            disabled={!isOtpComplete || isLoading}
          >
            {isLoading ? "Verifying..." : "Verify"}
          </Button>
        </form>
      </div>

      {/* Bottom Spacer */}
      <div className="flex-shrink-0 h-8" />
    </div>
  )
}
