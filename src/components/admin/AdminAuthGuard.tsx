import { ReactNode, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface AdminAuthGuardProps {
  children: ReactNode
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('veltox_admin_token')
    const loginTime = localStorage.getItem('veltox_admin_login_time')

    if (!token || !loginTime) {
      navigate('/admin/login')
      return
    }

    // Check if session expired (24 hours)
    const loginDate = new Date(loginTime)
    const now = new Date()
    const hoursSinceLogin = (now.getTime() - loginDate.getTime()) / (1000 * 60 * 60)

    if (hoursSinceLogin > 24) {
      localStorage.removeItem('veltox_admin_token')
      localStorage.removeItem('veltox_admin_login_time')
      navigate('/admin/login')
    }
  }, [navigate])

  const token = localStorage.getItem('veltox_admin_token')
  if (!token) {
    return null
  }

  return <>{children}</>
}
