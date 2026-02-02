import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Plus, Pause, Play, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { dataStore } from '@/lib/data-store'
import { formatCurrency, formatNumber, formatRelativeTime } from '@/lib/utils'
import type { SellAd } from '@/types'

export function SellAdsPage() {
  const navigate = useNavigate()
  const [ads, setAds] = useState<SellAd[]>([])

  useEffect(() => {
    loadAds()
  }, [])

  const loadAds = () => {
    setAds(dataStore.getSellAds())
  }

  const handlePause = (adId: string) => {
    dataStore.pauseSellAd(adId)
    loadAds()
  }

  const handleResume = (adId: string) => {
    dataStore.resumeSellAd(adId)
    loadAds()
  }

  const handleDelete = (adId: string) => {
    if (confirm('Are you sure you want to cancel this ad?')) {
      dataStore.deleteSellAd(adId)
      loadAds()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'paused':
        return 'secondary'
      case 'completed':
        return 'outline'
      case 'cancelled':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="space-y-4 pb-4">
      <Button onClick={() => navigate('/sell-ads/create')} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Create New Sell Ad
      </Button>

      {ads.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-sm text-muted-foreground">You haven't created any sell ads yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {ads.map((ad) => (
            <Card key={ad.id}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Sell Ad #{ad.id.slice(0, 6)}
                      </p>
                      <p className="text-lg font-bold mt-1">{formatNumber(ad.totalAmount)} USDT</p>
                    </div>
                    <Badge variant={getStatusColor(ad.status)}>{ad.status}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Rate</p>
                      <p className="font-medium">{formatCurrency(ad.rate)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Sold</p>
                      <p className="font-medium">{formatNumber(ad.soldAmount)} USDT</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Remaining</p>
                      <p className="font-medium">{formatNumber(ad.remainingAmount)} USDT</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Created</p>
                      <p className="font-medium">{formatRelativeTime(ad.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {ad.status === 'active' && (
                      <Button
                        onClick={() => handlePause(ad.id)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Pause className="w-4 h-4 mr-1" />
                        Pause
                      </Button>
                    )}
                    {ad.status === 'paused' && (
                      <Button
                        onClick={() => handleResume(ad.id)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Resume
                      </Button>
                    )}
                    {(ad.status === 'active' || ad.status === 'paused') && (
                      <Button
                        onClick={() => handleDelete(ad.id)}
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
