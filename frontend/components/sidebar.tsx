'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, LogOut, Package, FileSignature } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import UserProfileMenu from './user-profile-menu'

const baseNavItems: { name: string; href: string; icon: React.ElementType }[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Fournisseurs', href: '/suppliers', icon: Package },
  { name: 'Prestations', href: '/prestations', icon: FileSignature },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const navItems = baseNavItems

  const handleLogout = async () => {
    await logout()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex h-full w-64 shrink-0 flex-col border-r bg-white">
      {/* Logo */}
      <div className="border-b p-4 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-attached.png"
          alt="Logo"
          width={180}
          height={60}
          className="object-contain"
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement
            if (img.src.endsWith('/logo-attached.png')) {
              img.src = '/logo_slogan.png'
            }
          }}
        />
      </div>

      {/* NAV */}
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
              style={{
                backgroundColor: isActive ? '#2db34b' : 'transparent',
                color: isActive ? 'white' : '#1f2937',
              }}
            >
              <Icon
                className="h-5 w-5"
                style={{ color: isActive ? 'white' : '#e82c2a' }}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-4 space-y-2">
        <div className="text-xs text-gray-600 truncate" title={user?.identifiant}>
          {user?.identifiant}
        </div>

        <div className="flex items-center gap-2">
          <UserProfileMenu />

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex-1 justify-start gap-2"
          >
            <LogOut className="h-4 w-4 text-red-500" />
            Déconnexion
          </Button>
        </div>
      </div>
    </div>
  )
}