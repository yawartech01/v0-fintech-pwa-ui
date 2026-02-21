import { useState, useEffect, useRef } from 'react'
import { AdminLayout } from './AdminLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RateService } from '@/lib/rate-service'
import { showToast } from '@/lib/toast'
import { DollarSign, Bell } from 'lucide-react'
import { APIService } from '@/services/api-service'
import { useRealAPI } from '@/config/api-mode'

export function AdminSettings() {
  const useAPI = useRealAPI()
  const [rateInput, setRateInput] = useState('')
  const [banner, setBanner] = useState('')
  const [currentRate, setCurrentRate] = useState(0)
  const [currentBanner, setCurrentBanner] = useState('')
  const initialLoadDone = useRef(false)

  useEffect(() => {
    loadSettings(true)
    const interval = setInterval(() => loadSettings(false), 5000)
    return () => clearInterval(interval)
  }, [])

  const loadSettings = async (isInitial: boolean) => {
    try {
      if (useAPI) {
        const data = await APIService.getPlatformSettings()
        const s = data?.settings || data || {}
        const rateVal = parseFloat(s.usdt_inr_rate || s.usdtInrRate || '0')
        const bannerVal = s.admin_banner || s.adminBanner || ''

        setCurrentRate(rateVal)
        setCurrentBanner(bannerVal)

        if (isInitial || !initialLoadDone.current) {
          setRateInput(rateVal.toString())
          setBanner(bannerVal)
          initialLoadDone.current = true
        }
      } else {
        const rateData = RateService.getCurrentRate()
        setCurrentRate(rateData.rate)

        const bannerData = localStorage.getItem('veltox_admin_banner')
        const bannerVal = bannerData ? JSON.parse(bannerData).message || '' : ''
        setCurrentBanner(bannerVal)

        if (isInitial || !initialLoadDone.current) {
          setRateInput(rateData.rate.toString())
          setBanner(bannerVal)
          initialLoadDone.current = true
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  const handleUpdateRate = async () => {
    const newRate = parseFloat(rateInput)
    if (isNaN(newRate) || newRate <= 0) {
      showToast('Please enter a valid rate', 'error')
      return
    }

    try {
      if (useAPI) {
        await APIService.updatePlatformSettings('usdt_inr_rate', newRate.toString())
      } else {
        // Use mock
        RateService.updateRate(newRate)
        
        // Log to audit trail
        const auditLog = JSON.parse(localStorage.getItem('veltox_audit_log') || '[]')
        auditLog.push({
          timestamp: new Date().toISOString(),
          action: 'rate_update',
          admin: 'Admin',
          details: {
            oldRate: currentRate,
            newRate: newRate,
          },
        })
        localStorage.setItem('veltox_audit_log', JSON.stringify(auditLog.slice(-1000)))

        // Trigger storage event for cross-tab sync
        window.dispatchEvent(new Event('storage'))
      }
      
      setCurrentRate(newRate)
      showToast('Exchange rate updated and synced to all users', 'success')
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to update rate'
      showToast(errorMsg, 'error')
    }
  }

  const handlePublishBanner = async () => {
    try {
      if (useAPI) {
        await APIService.updatePlatformSettings('admin_banner', banner.trim())
      } else {
        // Use mock
        const bannerData = {
          message: banner.trim(),
          publishedAt: new Date().toISOString(),
          publishedBy: 'Admin',
        }
        
        localStorage.setItem('veltox_admin_banner', JSON.stringify(bannerData))
        
        // Log to audit trail
        const auditLog = JSON.parse(localStorage.getItem('veltox_audit_log') || '[]')
        auditLog.push({
          timestamp: new Date().toISOString(),
          action: 'banner_publish',
          admin: 'Admin',
          details: {
            message: banner.trim(),
          },
        })
        localStorage.setItem('veltox_audit_log', JSON.stringify(auditLog.slice(-1000)))

        // Trigger storage event for cross-tab sync
        window.dispatchEvent(new Event('storage'))
      }

      setCurrentBanner(banner.trim())
      showToast('Banner published and synced to all users', 'success')
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to publish banner'
      showToast(errorMsg, 'error')
    }
  }

  const handleClearBanner = async () => {
    try {
      if (useAPI) {
        await APIService.updatePlatformSettings('admin_banner', '')
      } else {
        localStorage.removeItem('veltox_admin_banner')
        const auditLog = JSON.parse(localStorage.getItem('veltox_audit_log') || '[]')
        auditLog.push({
          timestamp: new Date().toISOString(),
          action: 'banner_clear',
          admin: 'Admin',
        })
        localStorage.setItem('veltox_audit_log', JSON.stringify(auditLog.slice(-1000)))
        window.dispatchEvent(new Event('storage'))
      }

      showToast('Banner cleared and synced', 'success')
      setBanner('')
      setCurrentBanner('')
    } catch (error) {
      showToast('Failed to clear banner', 'error')
    }
  }

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="border-b border-border bg-background px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Settings</h1>
              <p className="text-sm text-muted-foreground">Manage platform settings • Real-time sync enabled</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">LIVE</span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Exchange Rate */}
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <DollarSign className="w-6 h-6 text-green-500 mt-1" />
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Exchange Rate</h3>
                  <p className="text-sm text-muted-foreground">
                    Current rate: ₹{currentRate.toFixed(2)} per USDT
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rate">New Rate (INR per USDT)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="rate"
                      type="number"
                      step="0.01"
                      value={rateInput}
                      onChange={(e) => setRateInput(e.target.value)}
                      placeholder="92.45"
                    />
                    <Button onClick={handleUpdateRate} className="whitespace-nowrap">
                      Update Rate
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ✓ Instantly updates for all users creating new ads
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Banner Notification */}
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <Bell className="w-6 h-6 text-blue-500 mt-1" />
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Banner Notification</h3>
                  <p className="text-sm text-muted-foreground">
                    Publish messages that appear at the top of user home pages
                  </p>
                  {currentBanner && (
                    <div className="mt-2 p-3 bg-muted/30 rounded border border-border">
                      <p className="text-xs text-muted-foreground mb-1">Current Banner:</p>
                      <p className="text-sm text-foreground">{currentBanner}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="banner">Banner Message</Label>
                  <Textarea
                    id="banner"
                    value={banner}
                    onChange={(e) => setBanner(e.target.value)}
                    placeholder="Enter your announcement..."
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handlePublishBanner} className="flex-1">
                      Publish Banner
                    </Button>
                    <Button onClick={handleClearBanner} variant="outline" className="flex-1">
                      Clear Banner
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ✓ Shows instantly on all user home pages
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
