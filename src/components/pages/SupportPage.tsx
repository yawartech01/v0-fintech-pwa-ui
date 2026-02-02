import { HelpCircle, MessageCircle, Mail } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export function SupportPage() {
  const faqs = [
    {
      question: 'How long do deposits take?',
      answer:
        'USDT deposits are typically confirmed within 10-30 minutes depending on network congestion.',
    },
    {
      question: 'What is the minimum withdrawal amount?',
      answer: 'The minimum withdrawal amount is 10 USDT.',
    },
    {
      question: 'How do sell ads work?',
      answer:
        'Create a sell ad by locking USDT. Buyers will purchase at your rate, and funds are released to your INR bank account.',
    },
    {
      question: 'How do referral rewards work?',
      answer:
        'Earn 5 USDT for each friend who signs up and completes their first trade using your referral code.',
    },
  ]

  return (
    <div className="space-y-4 pb-4">
      <div className="grid grid-cols-2 gap-3">
        <Card className="cursor-pointer hover:bg-secondary/50 transition-colors">
          <CardContent className="p-6 text-center">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">Live Chat</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-secondary/50 transition-colors">
          <CardContent className="p-6 text-center">
            <Mail className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">Email Us</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary" />
          Frequently Asked Questions
        </h2>
        {faqs.map((faq, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <p className="font-medium mb-2">{faq.question}</p>
              <p className="text-sm text-muted-foreground">{faq.answer}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
