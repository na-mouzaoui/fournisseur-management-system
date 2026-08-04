'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { OperateurEconomique, CreateOperateurRequest, UpdateOperateurRequest, PaginatedResponse } from '@/lib/types'
import { apiClient } from '@/lib/api-client'
import OperateurModal from '@/components/operateur-modal'
import {
  Plus,
  Trash2,
  Edit2,
  Search,
} from 'lucide-react'

const PAGE_SIZE = 10

export default function SuppliersPage() {
  const [operateurs, setOperateurs] = useState<OperateurEconomique[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [statutFilter, setStatutFilter] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedOperateur, setSelectedOperateur] = useState<OperateurEconomique | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [page, setPage] = useState(1)

  const loadOperateurs = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.getOperateurs(page, PAGE_SIZE, appliedSearch || undefined)
      setOperateurs(response.data || [])
      setTotal(response.total || 0)
    } catch (err) {
      setError("Erreur lors du chargement des opérateurs")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [page, appliedSearch])

  useEffect(() => {
    loadOperateurs()
  }, [loadOperateurs])

  const filteredOperateurs = operateurs.filter((op) => {
    if (statutFilter === 'all') return true
    return op.statutLibelle === statutFilter
  })

  const handleAddNew = () => {
    setSelectedOperateur(undefined)
    setIsModalOpen(true)
  }

  const handleEdit = (operateur: OperateurEconomique) => {
    setSelectedOperateur(operateur)
    setIsModalOpen(true)
  }

  const handleModalSubmit = async (data: CreateOperateurRequest) => {
    try {
      setIsSubmitting(true)
      if (selectedOperateur) {
        await apiClient.updateOperateur(selectedOperateur.id, data as UpdateOperateurRequest)
      } else {
        await apiClient.createOperateur(data)
      }
      setIsModalOpen(false)
      loadOperateurs()
    } catch (err) {
      setError("Erreur lors de l'enregistrement de l'opérateur")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet opérateur?")) return

    try {
      await apiClient.deleteOperateur(id)
      loadOperateurs()
    } catch (err) {
      setError("Erreur lors de la suppression de l'opérateur")
      console.error(err)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    setAppliedSearch(searchTerm.trim())
  }

  if (isLoading && operateurs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement des opérateurs...</p>
        </div>
      </div>
    )
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fournisseurs</h1>
          <p className="text-muted-foreground mt-1">Gérez les opérateurs économiques du registre</p>
        </div>
        <Button onClick={handleAddNew} className="gap-2">
          <Plus size={18} />
          Nouveau Fournisseur
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  placeholder="Rechercher par raison sociale, n° d'immatriculation ou wilaya..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>
            <select
              value={statutFilter}
              onChange={(e) => setStatutFilter(e.target.value)}
              className="px-3 py-2 rounded-md border border-input bg-background"
            >
              <option value="all">Tous les statuts</option>
              {Array.from(
                new Set(operateurs.map((o) => o.statutLibelle).filter(Boolean) as string[])
              ).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredOperateurs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun fournisseur trouvé
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">N° Immatriculation</th>
                    <th className="text-left py-3 px-4">Raison sociale</th>
                    <th className="text-left py-3 px-4">Secteur</th>
                    <th className="text-left py-3 px-4">Téléphone</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Statut</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOperateurs.map((op) => (
                    <tr
                      key={op.id}
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium">{op.numeroImmatriculation}</td>
                      <td className="py-3 px-4">{op.raisonSociale}</td>
                      <td className="py-3 px-4">{op.secteurActiviteLibelle || '—'}</td>
                      <td className="py-3 px-4">{op.telephone || '—'}</td>
                      <td className="py-3 px-4">{op.email || '—'}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                            op.statutLibelle === 'validé'
                              ? 'bg-[#2db34b] text-white'
                              : op.statutLibelle === 'en cours' || op.statutLibelle === 'archivé'
                              ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                              : op.statutLibelle === 'rejeté' || op.statutLibelle === 'suspendu'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                          }`}
                        >
                          {op.statutLibelle || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(op)}
                            className="p-1 hover:bg-muted rounded"
                            title="Modifier"
                          >
                            <Edit2 size={16} className="text-[#2db34b]" />
                          </button>
                          <button
                            onClick={() => handleDelete(op.id)}
                            className="p-1 hover:bg-muted rounded"
                            title="Supprimer"
                          >
                            <Trash2 size={16} className="text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {total > PAGE_SIZE && (
            <div className="flex justify-between items-center text-sm text-muted-foreground mt-4">
              <span>
                Page {page} / {totalPages} — {total} résultat(s)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded border border-border disabled:opacity-50"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1 rounded border border-border disabled:opacity-50"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <OperateurModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        operateur={selectedOperateur}
        isLoading={isSubmitting}
      />
    </div>
  )
}
