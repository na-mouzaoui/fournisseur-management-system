'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Hash,
  Calendar,
  AlertTriangle,
  Archive,
  Check,
  ChevronDown,
} from 'lucide-react'
import { Prestation, OperateurEconomique, Etape } from '@/lib/types'
import { apiClient } from '@/lib/api-client'

const PAGE_SIZE = 10

const formatDate = (dateString?: string) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  return date.toLocaleDateString('fr-FR')
}

const toDateInputValue = (dateString?: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  return date.toISOString().slice(0, 10)
}

const EMPTY_FORM = {
  reference: '',
  structureContractante: '',
  description: '',
  operateurId: '',
  etapeId: '',
  dateDebut: '',
  dateFin: '',
}

const operateurLabel = (op?: OperateurEconomique) =>
  op ? `${op.raisonSociale}${op.numeroImmatriculation ? ` (${op.numeroImmatriculation})` : ''}` : ''

const isBlacklisted = (op: OperateurEconomique) => op.statutLibelle?.toLowerCase() === 'blacklisté'
const isArchived = (op: OperateurEconomique) => !!op.isArchived

export default function PrestationsPage() {
  const [prestations, setPrestations] = useState<Prestation[]>([])
  const [operateurs, setOperateurs] = useState<OperateurEconomique[]>([])
  const [etapes, setEtapes] = useState<Etape[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    apiClient.getOperateurs(1, 1000).then((r) => setOperateurs(r.data || [])).catch(() => setOperateurs([]))
    apiClient.getEtapes().then(setEtapes).catch(() => setEtapes([]))
  }, [])

  const loadPrestations = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.getPrestations(page, PAGE_SIZE, search || undefined)
      setPrestations(response.data || [])
      setTotal(response.total || 0)
      setTotalPages(Math.max(1, Math.ceil((response.total || 0) / PAGE_SIZE)))
    } catch (err) {
      setError("Erreur lors du chargement des prestations")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    loadPrestations()
  }, [loadPrestations])

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setIsModalOpen(true)
  }

  const openEdit = (prestation: Prestation) => {
    setEditingId(prestation.id)
    setForm({
      reference: prestation.reference,
      structureContractante: prestation.structureContractante,
      description: prestation.description || '',
      operateurId: String(prestation.operateurId),
      etapeId: prestation.etapeId ? String(prestation.etapeId) : '',
      dateDebut: toDateInputValue(prestation.dateDebut),
      dateFin: toDateInputValue(prestation.dateFin),
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.reference || !form.structureContractante || !form.operateurId || !form.etapeId || !form.dateDebut) return
    try {
      setSaving(true)
      const payload = {
        reference: form.reference.trim(),
        structureContractante: form.structureContractante.trim(),
        description: form.description.trim() || undefined,
        operateurId: Number(form.operateurId),
        etapeId: form.etapeId ? Number(form.etapeId) : null,
        dateDebut: form.dateDebut,
        dateFin: form.dateFin || undefined,
      }
      if (editingId) {
        await apiClient.updatePrestation(editingId, payload)
      } else {
        await apiClient.createPrestation(payload)
      }
      setIsModalOpen(false)
      setError('')
      await loadPrestations()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement de la prestation")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (prestation: Prestation) => {
    if (!window.confirm(`Supprimer la prestation « ${prestation.reference} » ?`)) return
    try {
      setDeletingId(prestation.id)
      await apiClient.deletePrestation(prestation.id)
      setError('')
      await loadPrestations()
    } catch (err) {
      setError("Erreur lors de la suppression de la prestation")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Prestations</h1>
          <p className="text-sm text-muted-foreground">
            {total} prestation(s)
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-1.5" /> Nouvelle prestation
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Rechercher par référence ou fournisseur..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-[#2db34b]" />
        </div>
      ) : prestations.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-lg">
          Aucune prestation trouvée
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-4">Référence</th>
                <th className="text-left py-3 px-4">Structure contractante</th>
                <th className="text-left py-3 px-4">Étape en cours</th>
                <th className="text-left py-3 px-4">Fournisseur</th>
                <th className="text-left py-3 px-4">Date de début</th>
                <th className="text-left py-3 px-4">Date de fin</th>
                <th className="text-right py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {prestations.map((prestation) => (
                <tr key={prestation.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="py-3 px-4 font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <Hash size={14} className="text-muted-foreground" /> {prestation.reference}
                    </span>
                  </td>
                  <td className="py-3 px-4">{prestation.structureContractante || '—'}</td>
                  <td className="py-3 px-4">
                    {prestation.etapeLibelle ? (
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        {prestation.etapeLibelle}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="py-3 px-4">{prestation.operateurRaisonSociale || '—'}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <Calendar size={14} /> {formatDate(prestation.dateDebut)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{formatDate(prestation.dateFin)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(prestation)}
                        className="p-1.5 hover:bg-muted rounded"
                        title="Modifier"
                      >
                        <Edit2 size={16} className="text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(prestation)}
                        disabled={deletingId === prestation.id}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Modifier la prestation' : 'Nouvelle prestation'}
            </DialogTitle>
            <DialogDescription>
              Renseignez les informations de la prestation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prestation-reference">Référence *</Label>
              <div className="relative">
                <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="prestation-reference"
                  className="pl-9"
                  placeholder="Ex : PR-2026-001"
                  value={form.reference}
                  onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prestation-operateur">Fournisseur *</Label>
              <OperateurSelect
                value={form.operateurId}
                onChange={(v) => setForm((f) => ({ ...f, operateurId: v }))}
                operateurs={operateurs}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prestation-structure">Structure contractante *</Label>
              <Input
                id="prestation-structure"
                placeholder="Ex : Direction des Achats, Unité Opérationnelle..."
                value={form.structureContractante}
                onChange={(e) => setForm((f) => ({ ...f, structureContractante: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prestation-etape">Étape en cours *</Label>
              <select
                id="prestation-etape"
                value={form.etapeId}
                onChange={(e) => setForm((f) => ({ ...f, etapeId: e.target.value }))}
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#2db34b] focus:ring-2 focus:ring-[#2db34b]"
              >
                <option value="">-- Sélectionner l'étape --</option>
                {etapes.map((et) => (
                  <option key={et.id} value={et.id}>{et.libelle}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prestation-description">Description</Label>
              <textarea
                id="prestation-description"
                rows={3}
                placeholder="Objet de la prestation, périmètre, observations..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#2db34b] focus:ring-2 focus:ring-[#2db34b]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prestation-debut">Date de début *</Label>
                <Input
                  id="prestation-debut"
                  type="date"
                  value={form.dateDebut}
                  onChange={(e) => setForm((f) => ({ ...f, dateDebut: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prestation-fin">Date de fin</Label>
                <Input
                  id="prestation-fin"
                  type="date"
                  value={form.dateFin}
                  onChange={(e) => setForm((f) => ({ ...f, dateFin: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={saving}>
                Annuler
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!form.reference || !form.structureContractante || !form.operateurId || !form.etapeId || !form.dateDebut || saving}
              >
                {saving ? 'Enregistrement...' : editingId ? 'Enregistrer' : 'Créer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function OperateurSelect({
  value,
  onChange,
  operateurs,
}: {
  value: string
  onChange: (value: string) => void
  operateurs: OperateurEconomique[]
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = operateurs.find((op) => String(op.id) === value)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#2db34b] focus:ring-2 focus:ring-[#2db34b]"
      >
        <span className="flex items-center gap-2 min-w-0">
          {selected ? (
            <>
              <span className="truncate">{operateurLabel(selected)}</span>
              {isBlacklisted(selected) && <AlertTriangle size={16} className="shrink-0 text-red-600" />}
              {isArchived(selected) && <Archive size={16} className="shrink-0 text-gray-400" />}
            </>
          ) : (
            <span className="text-muted-foreground">-- Sélectionner --</span>
          )}
        </span>
        <ChevronDown size={16} className={`shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border border-gray-300 bg-white shadow-lg">
          {operateurs.map((op) => {
            const blacklisted = isBlacklisted(op)
            const archived = isArchived(op)
            return (
              <button
                key={op.id}
                type="button"
                onClick={() => { onChange(String(op.id)); setOpen(false) }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                  blacklisted ? 'bg-red-50/60' : archived ? 'bg-gray-100' : ''
                } ${String(op.id) === value ? 'font-medium' : ''}`}
              >
                <span className="flex-1 truncate">{operateurLabel(op)}</span>
                {blacklisted && <AlertTriangle size={16} className="shrink-0 text-red-600" />}
                {archived && <Archive size={16} className="shrink-0 text-gray-400" />}
                {String(op.id) === value && <Check size={16} className="shrink-0 text-[#2db34b]" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
