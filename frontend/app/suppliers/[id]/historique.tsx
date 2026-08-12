'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Plus,
  Edit2,
  Trash2,
  Calendar,
  History,
  Hash,
} from 'lucide-react'
import { Historique, OperateurEconomique, Prestation } from '@/lib/types'
import { apiClient } from '@/lib/api-client'

const PAGE_SIZE = 10

const CURRENT_YEAR = new Date().getFullYear()

const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 2014 }, (_, i) => CURRENT_YEAR - i)

const EMPTY_FORM = {
  action: '',
  operateurId: '',
  prestationId: '',
  annee: String(CURRENT_YEAR),
}

const formatDateTime = (dateString?: string) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function HistoriqueSection({ operateurId }: { operateurId: number }) {
  const [historiques, setHistoriques] = useState<Historique[]>([])
  const [operateurs, setOperateurs] = useState<OperateurEconomique[]>([])
  const [prestations, setPrestations] = useState<Prestation[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    apiClient.getOperateurs(1, 1000).then((r) => setOperateurs(r.data || [])).catch(() => setOperateurs([]))
    apiClient.getPrestations(1, 1000).then((r) => setPrestations(r.data || [])).catch(() => setPrestations([]))
  }, [])

  const loadHistoriques = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.getHistoriques(page, PAGE_SIZE, operateurId, search || undefined)
      setHistoriques(response.data || [])
      setTotal(response.total || 0)
      setTotalPages(Math.max(1, Math.ceil((response.total || 0) / PAGE_SIZE)))
    } catch (err) {
      setError("Erreur lors du chargement de l'historique")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [page, search, operateurId])

  useEffect(() => {
    loadHistoriques()
  }, [loadHistoriques])

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, operateurId: String(operateurId) })
    setIsModalOpen(true)
  }

  const openEdit = (historique: Historique) => {
    setEditingId(historique.id)
    setForm({
      action: historique.action,
      operateurId: String(historique.operateurId),
      prestationId: String(historique.prestationId),
      annee: String(historique.annee),
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.action.trim() || !form.operateurId || !form.prestationId || !form.annee) return
    try {
      setSaving(true)
      const payload = {
        action: form.action.trim(),
        operateurId: Number(form.operateurId),
        prestationId: Number(form.prestationId),
        annee: Number(form.annee),
      }
      if (editingId) {
        await apiClient.updateHistorique(editingId, payload)
      } else {
        await apiClient.createHistorique(payload)
      }
      setIsModalOpen(false)
      setError('')
      await loadHistoriques()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (historique: Historique) => {
    if (!window.confirm(`Supprimer l'action « ${historique.action} » ?`)) return
    try {
      setDeletingId(historique.id)
      await apiClient.deleteHistorique(historique.id)
      setError('')
      await loadHistoriques()
    } catch (err) {
      setError("Erreur lors de la suppression")
    } finally {
      setDeletingId(null)
    }
  }

  const filteredPrestations = prestations.filter((p) => p.operateurId === Number(form.operateurId))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{total} action(s) d'historique</p>
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-1.5" /> Nouvelle action
        </Button>
      </div>

      <div className="relative flex-1 max-w-sm">
        <Input
          className="pl-3"
          placeholder="Rechercher dans l'historique..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-[#2db34b]" />
        </div>
      ) : historiques.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-lg">
          <History size={32} className="mx-auto mb-2 opacity-40" />
          Aucune action dans l'historique pour ce fournisseur
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-4">Action</th>
                <th className="text-left py-3 px-4">Fournisseur</th>
                <th className="text-left py-3 px-4">Contrat</th>
                <th className="text-left py-3 px-4">Année</th>
                <th className="text-left py-3 px-4">Ajouté par</th>
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-right py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {historiques.map((h) => (
                <tr key={h.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="py-3 px-4 font-medium">{h.action}</td>
                  <td className="py-3 px-4">{h.operateurRaisonSociale || '—'}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5">
                      <Hash size={14} className="text-muted-foreground" /> {h.prestationReference || '—'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar size={14} className="text-muted-foreground" /> {h.annee}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{h.createurNom || '—'}</td>
                  <td className="py-3 px-4 text-muted-foreground">{formatDateTime(h.createdAt)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(h)}
                        className="p-1.5 hover:bg-muted rounded"
                        title="Modifier"
                      >
                        <Edit2 size={16} className="text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(h)}
                        disabled={deletingId === h.id}
                        className="p-1.5 hover:bg-red-50 rounded disabled:opacity-50"
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
        <div className="flex justify-between items-center text-sm text-muted-foreground">
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Modifier l'action" : 'Nouvelle action'}
            </DialogTitle>
            <DialogDescription>
              Une action d'historique concerne un fournisseur, un contrat et une année.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="historique-action">Action *</Label>
              <Input
                id="historique-action"
                placeholder="Ex : Signature du contrat, Avenant, Litige..."
                value={form.action}
                onChange={(e) => setForm((f) => ({ ...f, action: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="historique-fournisseur">Fournisseur *</Label>
              <Select
                id="historique-fournisseur"
                value={form.operateurId}
                onChange={(e) => setForm((f) => ({ ...f, operateurId: e.target.value, prestationId: '' }))}
              >
                <option value="">-- Sélectionner --</option>
                {operateurs.map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.raisonSociale}{op.numeroImmatriculation ? ` (${op.numeroImmatriculation})` : ''}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="historique-contrat">Contrat *</Label>
              <Select
                id="historique-contrat"
                value={form.prestationId}
                onChange={(e) => setForm((f) => ({ ...f, prestationId: e.target.value }))}
                disabled={!form.operateurId}
              >
                <option value="">-- Sélectionner --</option>
                {filteredPrestations.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.reference}{p.structureContractante ? ` — ${p.structureContractante}` : ''}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="historique-annee">Année *</Label>
              <Select
                id="historique-annee"
                value={form.annee}
                onChange={(e) => setForm((f) => ({ ...f, annee: e.target.value }))}
              >
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={saving}>
                Annuler
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!form.action.trim() || !form.operateurId || !form.prestationId || !form.annee || saving}
              >
                {saving ? 'Enregistrement...' : editingId ? 'Enregistrer' : 'Ajouter'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
