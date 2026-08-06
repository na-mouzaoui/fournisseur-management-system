'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Package, AlertTriangle, TrendingUp, PieChart } from 'lucide-react'
import { DashboardStats } from '@/lib/types'
import { apiClient } from '@/lib/api-client'

function StatutBadge({ statut }: { statut?: string }) {
  const classes =
    statut === 'actif' || statut === 'validé'
      ? 'bg-[#2db34b] text-white'
      : statut === 'rejeté' || statut === 'blacklisté'
      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
      : statut === 'suspendu'
      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  return (
    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${classes}`}>
      {statut || '—'}
    </span>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [error, setError] = useState('')
  const [selectedSector, setSelectedSector] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    apiClient
      .getDashboardStats()
      .then((data) => {
        setStats(data)
        setSelectedSector(data.repartitionSecteurs[0]?.secteur ?? '')
      })
      .catch(() => setError("Impossible de charger les statistiques du tableau de bord"))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-[#2db34b]"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-16 text-red-600 font-medium">{error}</div>
    )
  }

  if (!stats) return null

  const selectedSectorCount =
    stats.repartitionSecteurs.find((d) => d.secteur === selectedSector)?.nombre ?? 0

  const evolution = stats.nouveauxMoisEnCours - stats.supprimesMoisEnCours

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tableau de Bord</h1>
        <p className="text-muted-foreground mt-1">
          Suivi des fournisseurs
        </p>
      </div>

      {/* Tuiles principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3">
            <CardTitle className="text-sm font-semibold">
              Nombre total de fournisseurs
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2db34b]/10">
              <Package className="h-4 w-4" style={{ color: '#2db34b' }} />
            </div>
          </CardHeader>
          <CardContent className="pt-1 pb-3">
            <div className="text-4xl font-bold leading-none" style={{ color: '#2db34b' }}>
              {stats.totalOperateurs}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3">
            <CardTitle className="text-sm font-semibold">
              Fournisseurs blacklistés
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e82c2a]/10">
              <AlertTriangle className="h-4 w-4" style={{ color: '#e82c2a' }} />
            </div>
          </CardHeader>
          <CardContent className="pt-1 pb-3">
            <div className="text-4xl font-bold leading-none" style={{ color: '#e82c2a' }}>
              {stats.operateursBlacklistes}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold">
                Fournisseurs par secteur
              </CardTitle>
              <Select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="h-8 text-xs min-w-[10rem]"
              >
                {stats.repartitionSecteurs.map((d) => (
                  <option key={d.secteur} value={d.secteur}>
                    {d.secteur}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2db34b]/10">
              <PieChart className="h-4 w-4" style={{ color: '#2db34b' }} />
            </div>
          </CardHeader>
          <CardContent className="pt-1 pb-3">
            <div className="text-4xl font-bold leading-none" style={{ color: '#2db34b' }}>
              {selectedSectorCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3">
            <CardTitle className="text-sm font-semibold">
              Évolution du nombre de fournisseurs
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2db34b]/10">
              <TrendingUp className="h-4 w-4" style={{ color: '#2db34b' }} />
            </div>
          </CardHeader>
          <CardContent className="pt-1 pb-3">
            <div
              className="text-4xl font-bold leading-none"
              style={{ color: evolution >= 0 ? '#2db34b' : '#e82c2a' }}
            >
              {evolution}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Créés : {stats.nouveauxMoisEnCours} — Supprimés : {stats.supprimesMoisEnCours}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Derniers fournisseurs */}
      <Card>
        <CardHeader>
          <CardTitle>Derniers fournisseurs ajoutés</CardTitle>
          <CardDescription>
            Les 5 opérateurs économiques les plus récents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.derniersFournisseurs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun fournisseur disponible
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Raison sociale</th>
                    <th className="text-left py-3 px-4">Secteur</th>
                    <th className="text-left py-3 px-4">Statut</th>
                    <th className="text-left py-3 px-4">Date d'ajout</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.derniersFournisseurs.map((f) => (
                    <tr key={f.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 font-medium">{f.raisonSociale}</td>
                      <td className="py-3 px-4">{f.secteur || '—'}</td>
                      <td className="py-3 px-4">
                        <StatutBadge statut={f.statut} />
                      </td>
                      <td className="py-3 px-4">
                        {new Date(f.dateCreation).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
