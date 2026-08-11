'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/sidebar'

export default function PrestationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted || isLoading) return
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, isMounted, router])

  if (!isMounted || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-[#2db34b] mx-auto"></div>
          <p className="mt-4 text-black font-medium">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="h-screen w-full overflow-hidden bg-white flex">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 transition-all duration-300">
        {children}
      </main>
    </div>
  )
}
