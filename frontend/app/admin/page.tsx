'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import AdminUserManagement from '@/components/admin/admin-user-management'
import AdminAuditLogs from '@/components/admin/admin-audit-logs'

export default function AdminPage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated, logout } = useAuth()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.replace('/auth/login')
      return
    }
    if (user?.role !== 'admin') {
      router.replace('/dashboard')
    }
  }, [isLoading, isAuthenticated, user, router])

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  if (isLoading || !isAuthenticated || !user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Administration</h1>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Retour à la plateforme
            </Button>

            <Button variant="outline" onClick={handleLogout}>
              Déconnexion
            </Button>
          </div>
        </div>

        {/* TABS */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
          </TabsList>

          {/* USERS */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des utilisateurs</CardTitle>
              </CardHeader>
              <CardContent>
                <AdminUserManagement />
              </CardContent>
            </Card>
          </TabsContent>

          {/* AUDIT */}
          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Journal d'audit</CardTitle>
              </CardHeader>
              <CardContent>
                <AdminAuditLogs />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
