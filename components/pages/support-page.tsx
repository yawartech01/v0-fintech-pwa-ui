"use client"

import { useState } from "react"
import {
  MessageCircle,
  Mail,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const faqs = [
  {
    id: "1",
    question: "How do I create a sell ad?",
    answer:
      "Navigate to the Sell Ads tab and tap 'New Ad'. Enter the amount of USDT you want to sell, set your order limits, select a bank account for receiving payments, and activate your ad.",
  },
  {
    id: "2",
    question: "How long do payouts take?",
    answer:
      "Payouts are processed within 24 hours of order completion. The INR will be credited directly to your linked bank account.",
  },
  {
    id: "3",
    question: "What networks are supported for deposits?",
    answer:
      "We support USDT deposits via TRC20 (Tron), ERC20 (Ethereum), and BEP20 (BSC) networks. TRC20 is recommended for lower fees.",
  },
  {
    id: "4",
    question: "How do I earn referral rewards?",
    answer:
      "Share your unique referral code with friends. When they sign up and complete their first trade, both you and your friend will receive 250 INR as a reward.",
  },
  {
    id: "5",
    question: "What are the withdrawal fees?",
    answer:
      "Withdrawal fees vary by network: TRC20 - 1 USDT, BEP20 - 0.5 USDT, ERC20 - 5 USDT. We recommend using TRC20 or BEP20 for lower fees.",
  },
  {
    id: "6",
    question: "How do I enable 2FA?",
    answer:
      "Go to Profile > Security and toggle on Two-Factor Authentication. You'll need an authenticator app like Google Authenticator or Authy to scan the QR code.",
  },
]

export function SupportPage() {
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)

  const toggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id)
  }

  return (
    <div className="space-y-6">
      {/* Contact Options */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Get in Touch
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">Live Chat</p>
              <p className="text-xs text-muted-foreground mb-3">
                Available 24/7
              </p>
              <Button
                size="sm"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Start Chat
              </Button>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mx-auto mb-2">
                <Mail className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Email</p>
              <p className="text-xs text-muted-foreground mb-3">
                Response in 24h
              </p>
              <Button
                size="sm"
                variant="secondary"
                className="w-full"
              >
                Send Email
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Frequently Asked Questions
        </h2>
        <Card className="bg-card border-border">
          <CardContent className="p-0 divide-y divide-border">
            {faqs.map((faq) => (
              <div key={faq.id}>
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/50 transition-colors"
                >
                  <span className="text-sm font-medium text-foreground pr-4">
                    {faq.question}
                  </span>
                  {expandedFaq === faq.id ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                  )}
                </button>
                {expandedFaq === faq.id && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-muted-foreground">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Help Center Link */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <button className="w-full flex items-center justify-between hover:opacity-80 transition-opacity">
            <div>
              <p className="text-sm font-medium text-foreground">
                Visit Help Center
              </p>
              <p className="text-xs text-muted-foreground">
                Browse all articles and guides
              </p>
            </div>
            <ExternalLink className="w-5 h-5 text-muted-foreground" />
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
