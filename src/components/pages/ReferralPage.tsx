import { useState, useEffect } from 'react'
import { Copy, CheckCircle2, Share2, Gift } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { dataStore } from '@/lib/data-store'
import { formatNumber, formatRelativeTime } from '@/lib/utils'
import type { ReferralReward } from '@/types'

export function ReferralPage() {
  const [referralData, setReferralData] = useState<{
    code: string
    link: string
    totalReferrals: number
    totalEarnings: number
  } | null>(null)
  const [rewards, setRewards] = useState<ReferralReward[]>([])
  const [copiedCode, setCopiedCode] = useState(false)

  useEffect(() => {
    setReferralData(dataStore.getReferralCode())
    setRewards(dataStore.getReferralRewards())
  }, [])

  const handleCopyCode = () => {
    if (referralData) {
      navigator.clipboard.writeText(referralData.code)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  const handleCopyLink = () => {
    if (referralData) {
      navigator.clipboard.writeText(referralData.link)
    }
  }

  const handleShare = async () => {
    if (referralData && navigator.share) {
      try {
        await navigator.share({
          title: 'Join VELTOX',
          text: `Join VELTOX using my referral code: ${referralData.code}`,
          url: referralData.link,
        })
      } catch (err) {
        console.error('Share failed:', err)
      }
    } else {
      handleCopyLink()
    }
  }

  // Demo function to add a reward
  const handleAddDemoReward = () => {
    dataStore.addReferralReward()
    setReferralData(dataStore.getReferralCode())
    setRewards(dataStore.getReferralRewards())
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Total Referrals</p>
            <p className="text-2xl font-bold">{referralData?.totalReferrals || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Total Earned</p>
            <p className="text-2xl font-bold">
              {formatNumber(referralData?.totalEarnings || 0)} USDT
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Code Card */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="text-center space-y-2">
            <Gift className="w-12 h-12 mx-auto text-primary" />
            <h2 className="text-lg font-semibold">Your Referral Code</h2>
            <p className="text-sm text-muted-foreground">
              Earn 5 USDT for each friend who joins using your code
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                value={referralData?.code || ''}
                readOnly
                className="flex-1 px-4 py-3 bg-secondary rounded-lg font-mono text-lg text-center"
              />
              <Button
                onClick={handleCopyCode}
                variant="outline"
                size="icon"
                className="flex-shrink-0"
              >
                {copiedCode ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCopyLink} variant="outline" className="flex-1">
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
              <Button onClick={handleShare} className="flex-1">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Button */}
      <Button onClick={handleAddDemoReward} variant="outline" className="w-full">
        Add Demo Referral Reward
      </Button>

      {/* Rewards History */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">Rewards History</h2>
        {rewards.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No rewards yet. Share your referral code to start earning!
              </p>
            </CardContent>
          </Card>
        ) : (
          rewards.map((reward) => (
            <Card key={reward.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Referred {reward.fromUserName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(reward.earnedAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">+{formatNumber(reward.amount)} USDT</p>
                    <Badge
                      variant={reward.status === 'paid' ? 'default' : 'secondary'}
                      className="text-xs mt-1"
                    >
                      {reward.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
