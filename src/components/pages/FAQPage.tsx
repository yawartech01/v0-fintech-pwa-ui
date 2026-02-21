import { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface FAQItem {
  question: string
  answer: string
}

export function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs: FAQItem[] = [
    {
      question: 'How do TRC20 deposits work?',
      answer:
        'Each user receives a unique TRC20 deposit address. Send USDT (TRC20) to your deposit address. After 3 confirmations on the blockchain, funds are credited to your available balance. Deposits of 1000 USDT or more trigger an automatic sweep to our treasury for security.',
    },
    {
      question: 'What is the withdrawal review process?',
      answer:
        'When you request a withdrawal, the amount is moved from your available balance to locked balance. Our team reviews the request (typically within 24 hours) for security. Once approved, the transaction is sent to the blockchain and marked as completed. If rejected, funds are refunded to your available balance.',
    },
    {
      question: 'How does sell ad balance locking work?',
      answer:
        'When you create an ACTIVE sell ad, the total USDT amount is locked from your available balance. If you pause the ad, the remaining amount is unlocked and returns to available. When you resume, funds are locked again. When the ad is marked as sold (completed), the locked funds are deducted as you receive INR payout.',
    },
    {
      question: 'When do referral rewards pay out?',
      answer:
        'Referral rewards are generated when your referees (team members) complete sell transactions. Rewards become eligible after a 14-day hold period for anti-fraud checks. Direct (L1) rewards are 0.2% of completed volume, and upline (L2) rewards are 0.1%. Rewards must meet minimum account age (14 days), completed payouts (2+), and total volume (2000+ USDT) requirements.',
    },
    {
      question: 'How is the daily USDT rate determined?',
      answer:
        'The platform sets a competitive daily USDT to INR rate based on market conditions and liquidity. The rate is updated regularly and displayed on the Home screen and when creating sell ads. All sell ads use the platform rate at the time of sale completion.',
    },
    {
      question: 'What is my UID used for?',
      answer:
        'Your UID (User ID) is a unique numeric identifier (6-9 digits) assigned to your account. It can be used for support inquiries, account verification, and referencing your account in communications with our team. Your UID is permanent and never changes.',
    },
    {
      question: 'Can I have multiple bank accounts?',
      answer:
        'Yes! You can add multiple bank accounts to your profile. Set one as your default account for quick sell ad creation. You can edit account details (except account number) or delete accounts at any time. If you delete your default account, the system automatically assigns a new default.',
    },
    {
      question: 'How do I link a referral code?',
      answer:
        'During signup, you can enter a leader referral code on the "Join a Team" screen. This links you to a leader (L1) and potentially an upline (L2). If you skipped this step, you can link a code later by going to Profile → "Link a Leader Code". You can only link a code once.',
    },
  ]

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
      </Card>

      {/* FAQ Accordion */}
      <div className="space-y-2">
        {faqs.map((faq, index) => (
          <Card key={index} className="overflow-hidden">
            <button
              onClick={() => toggleAccordion(index)}
              className="w-full text-left px-4 py-4 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-[15px] pr-4 leading-snug">{faq.question}</p>
                <ChevronDown
                  className={`w-5 h-5 text-muted-foreground transition-transform flex-shrink-0 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>
            {openIndex === index && (
              <CardContent className="px-4 pb-4 pt-0">
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Help Footer */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Can't find what you're looking for?{' '}
            <a href="/support" className="text-primary font-medium hover:underline">
              Contact Support
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
