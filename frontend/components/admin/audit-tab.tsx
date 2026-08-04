'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { AuditLog } from '@/lib/types'
import { apiClient } from '@/lib/api-client'
import { ScrollText } from 'lucide-react'

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AuditTab() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async () => {
    try {
      setIsLoading(true)
      const data = await apiClient.getAuditLogs()
      setLogs(data || [])
    } catch (err) {
      setError('Erreur lors du chargement de l\'audit')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-[#2db34b]"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 text-sm text-red-600 dark:text-red-400">
        {error}
      </div>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        {logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ScrollText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            Aucune action enregistrée pour le moment
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Date et heure</th>
                  <th className="text-left py-3 px-4">Utilisateur</th>
                  <th className="text-left py-3 px-4">Action</th>
                  <th className="text-left py-3 px-4">Élément</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      {formatDate(log.dateHeure)}
                    </td>
                    <td className="py-3 px-4">{log.utilisateurIdentifiant || '—'}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 rounded-full bg-[#2db34b]/10 text-[#2db34b] text-xs font-semibold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {log.entite}
                      {log.entiteId ? ` (n°${log.entiteId})` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}