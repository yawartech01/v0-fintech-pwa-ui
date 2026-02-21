import { useEffect, useRef } from 'react'
import { Socket } from 'socket.io-client'
import { connectWebSocket, getWebSocket } from '@/lib/api-client'

export interface WebSocketEvents {
  onWalletUpdated?: () => void
  onDepositConfirmed?: () => void
  onWithdrawalUpdated?: (data: { id: string; status: string }) => void
  onAdCreated?: () => void
  onAdUpdated?: (data: { id: string; status: string }) => void
  onRateUpdated?: (data: { rate: number }) => void
  onBannerUpdated?: (data: { message: string }) => void
}

export const useWebSocket = (userId: string | null, events: WebSocketEvents = {}) => {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!userId) return

    // Connect WebSocket
    socketRef.current = connectWebSocket(userId)

    // Register event listeners
    if (events.onWalletUpdated) {
      socketRef.current.on('wallet_updated', events.onWalletUpdated)
    }
    if (events.onDepositConfirmed) {
      socketRef.current.on('deposit_confirmed', events.onDepositConfirmed)
    }
    if (events.onWithdrawalUpdated) {
      socketRef.current.on('withdrawal_updated', events.onWithdrawalUpdated)
    }
    if (events.onAdCreated) {
      socketRef.current.on('ad_created', events.onAdCreated)
    }
    if (events.onAdUpdated) {
      socketRef.current.on('ad_updated', events.onAdUpdated)
    }
    if (events.onRateUpdated) {
      socketRef.current.on('rate_updated', events.onRateUpdated)
    }
    if (events.onBannerUpdated) {
      socketRef.current.on('banner_updated', events.onBannerUpdated)
    }

    return () => {
      // Cleanup listeners
      if (socketRef.current) {
        Object.keys(events).forEach(key => {
          const eventName = key.replace('on', '').replace(/([A-Z])/g, '_$1').toLowerCase().substring(1)
          socketRef.current?.off(eventName)
        })
      }
    }
  }, [userId, events])

  return socketRef.current
}

export const useGlobalWebSocket = () => {
  return getWebSocket()
}
