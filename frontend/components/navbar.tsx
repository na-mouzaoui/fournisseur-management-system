'use client'

import { useAuth } from '@/lib/auth-context'
import { getFullName } from '@/lib/types'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { LogOut, LayoutDashboard, Package, Settings } from 'lucide-react'
import { Button } from './ui/button'

export default function Navbar() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  const isActive = (path: string) => pathname === path

  return (
    <nav className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-xl font-bold text-primary">
            Fournisseurs
          </Link>
          <div className="flex gap-4 items-center">
            <Link
              href="/dashboard"
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                isActive('/dashboard')
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              <LayoutDashboard size={18} />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <Link
              href="/suppliers"
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                isActive('/suppliers')
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              <Package size={18} />
              <span className="hidden sm:inline">Fournisseurs</span>
            </Link>
            {user?.role === 'admin' && (
              <Link
                href="/admin"
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  isActive('/admin')
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <Settings size={18} />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {getFullName(user) || user?.identifiant}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Déconnexion</span>
          </Button>
        </div>
      </div>
    </nav>
  )
}
