'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import {
  OperateurEconomique,
  CreateOperateurRequest,
  UpdateOperateurRequest,
  Document,
  SecteurActivite,
  Statut,
} from '@/lib/types'
import { apiClient } from '@/lib/api-client'
import OperateurModal from '@/components/operateur-modal'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Plus,
  Trash2,
  Edit2,
  Download,
  Upload,
  FileText,
  Calendar,
  Building2,
  MapPin,
  Phone,
  Mail,
  Hash,
  Lock,
  SlidersHorizontal,
} from 'lucide-react'

const PAGE_SIZE = 10

interface OperateurEditForm {
  raisonSociale: string
  nif: string
  nis: string
  registreCommerce: string
  secteurActiviteId: string
  adresse: string
  wilaya: string
  telephone: string
  email: string
  typeOperateur: string
  formeJuridique: string
  dateCreationEntreprise: string
  statutId: string
  docDates: Record<number, string>
}

const toDateInputValue = (dateString?: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  return date.toISOString().slice(0, 10)
}

const DOCUMENT_TYPES: { code: string; label: string }[] = [
  { code: 'REGISTRE_COMMERCE', label: 'Registre de commerce' },
  { code: 'EXTRAIT_ROLE', label: 'Extrait de rôle' },
  { code: 'STATUTS_SOCIETE', label: 'Statuts de société' },
  { code: 'ATTESTATION_NIF', label: 'Attestation NIF' },
  { code: 'ATTESTATION_NIS', label: 'Attestation NIS' },
  { code: 'CASIER_JUDICIAIRE', label: 'Casier judiciaire' },
  { code: 'PIECE_IDENTITE', label: "Pièce d'identité" },
]

const STATUTS_FOURNISSEUR = ['actif', 'blacklisté', 'archivé']

const docTypeLabel = (code: string) =>
  DOCUMENT_TYPES.find((t) => t.code === code)?.label || code

const formatDate = (dateString?: string) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  return date.toLocaleDateString('fr-FR')
}

function OperateurDocuments({
  operateurId,
  archived = false,
  editing = false,
  editDocDates,
  onDocDateChange,
}: {
  operateurId: number
  archived?: boolean
  editing?: boolean
  editDocDates?: Record<number, string>
  onDocDateChange?: (docId: number, value: string) => void
}) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [docsLoading, setDocsLoading] = useState(true)
  const [upTypeCode, setUpTypeCode] = useState('REGISTRE_COMMERCE')
  const [upFile, setUpFile] = useState<File | null>(null)
  const [upDateExpiration, setUpDateExpiration] = useState('')
  const [upLoading, setUpLoading] = useState(false)
  const [viewDoc, setViewDoc] = useState<Document | null>(null)
  const [viewUrl, setViewUrl] = useState<string | null>(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [savingDates, setSavingDates] = useState<Record<number, boolean>>({})
  const [dateInputs, setDateInputs] = useState<Record<number, string>>({})
  const [dossier, setDossier] = useState<{ id: number; statutId: number; statutLibelle?: string } | null>(null)
  const [dossierStatuts, setDossierStatuts] = useState<Statut[]>([])
  const [savingDossierStatut, setSavingDossierStatut] = useState(false)

  const DOSSIER_STATUTS = ['en cours', 'validé', 'rejeté', 'suspendu']

  const loadDocs = useCallback(async () => {
    setDocsLoading(true)
    try {
      const data = await apiClient.getOperateurDocuments(operateurId)
      setDocuments(data || [])
      setDateInputs(
        Object.fromEntries(
          (data || []).map((d) => [d.id, toDateInputValue(d.dateExpiration)])
        )
      )
    } catch {
      setDocuments([])
    } finally {
      setDocsLoading(false)
    }
  }, [operateurId])

  useEffect(() => {
    loadDocs()
    apiClient.getDossierByOperateur(operateurId)
      .then((d) => {
        if (d && d.id) {
          setDossier({ id: d.id, statutId: d.statutId, statutLibelle: d.statutLibelle })
        }
      })
      .catch((err) => {
        console.error('Erreur chargement dossier:', err)
      })
    apiClient.getStatuts().then((all) => {
      const filtered = all.filter((s) => DOSSIER_STATUTS.includes(s.libelle))
      setDossierStatuts(filtered)
    }).catch((err) => {
      console.error('Erreur chargement statuts:', err)
    })
  }, [loadDocs, operateurId])

  const handleDossierStatutChange = async (statutId: number) => {
    if (!dossier) return
    setSavingDossierStatut(true)
    try {
      const updated = await apiClient.updateDossier(dossier.id, { statutId })
      setDossier({ id: updated.id, statutId: updated.statutId, statutLibelle: updated.statutLibelle })
    } catch (err) {
      console.error(err)
      alert("Erreur lors de la mise à jour du statut du dossier")
    } finally {
      setSavingDossierStatut(false)
    }
  }

  const handleUpload = async () => {
    if (!upFile) return
    setUpLoading(true)
    try {
      await apiClient.uploadOperateurDocument(
        operateurId,
        upTypeCode,
        upFile,
        upDateExpiration || undefined
      )
      setUpFile(null)
      setUpDateExpiration('')
      loadDocs()
    } catch (err) {
      console.error(err)
      alert("Erreur lors de l'upload du document")
    } finally {
      setUpLoading(false)
    }
  }

  const handleDownload = async (doc: Document) => {
    try {
      const blob = await apiClient.downloadDocument(doc.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.nomFichier
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      alert('Erreur lors du téléchargement')
    }
  }

  const handleView = async (doc: Document) => {
    if (viewUrl) window.URL.revokeObjectURL(viewUrl)
    setViewDoc(doc)
    setViewUrl(null)
    setViewLoading(true)
    try {
      const blob = await apiClient.downloadDocument(doc.id)
      setViewUrl(window.URL.createObjectURL(blob))
    } catch (err) {
      console.error(err)
      alert('Erreur lors de la consultation du document')
    } finally {
      setViewLoading(false)
    }
  }

  const handleCloseView = () => {
    if (viewUrl) window.URL.revokeObjectURL(viewUrl)
    setViewUrl(null)
    setViewDoc(null)
  }

  const handleDateChange = (doc: Document, value: string) => {
    setDateInputs((prev) => ({ ...prev, [doc.id]: value }))
  }

  const handleSaveDate = async (doc: Document, value: string) => {
    setSavingDates((prev) => ({ ...prev, [doc.id]: true }))
    try {
      const updated = await apiClient.updateDocumentDateExpiration(
        doc.id,
        value || null
      )
      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, dateExpiration: updated.dateExpiration } : d))
      )
      setDateInputs((prev) => ({ ...prev, [doc.id]: toDateInputValue(updated.dateExpiration) }))
    } catch (err) {
      console.error(err)
      alert("Erreur lors de la mise à jour de la date d'expiration")
    } finally {
      setSavingDates((prev) => ({ ...prev, [doc.id]: false }))
    }
  }

  const handleDelete = async (doc: Document) => {
    if (!window.confirm(`Supprimer le document « ${docTypeLabel(doc.typeCode)} » ?`)) return
    setDeletingId(doc.id)
    try {
      await apiClient.deleteDocument(doc.id)
      if (viewDoc?.id === doc.id) handleCloseView()
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id))
      setDateInputs((prev) => {
        const next = { ...prev }
        delete next[doc.id]
        return next
      })
    } catch (err) {
      console.error(err)
      alert('Erreur lors de la suppression du document')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-3">
      {dossier && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Statut du dossier :</span>
          <select
            value={dossier.statutId}
            onChange={(e) => handleDossierStatutChange(Number(e.target.value))}
            disabled={savingDossierStatut}
            className="px-3 py-1.5 rounded-md border border-input bg-background text-sm h-8"
          >
            {dossierStatuts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.libelle}
              </option>
            ))}
          </select>
        </div>
      )}

      {docsLoading ? (
        <p className="text-sm text-muted-foreground">Chargement des documents...</p>
      ) : documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucun document uploadé pour le moment.
        </p>
      ) : (
        <dl className="grid grid-cols-1 gap-2 text-sm">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center gap-2">
              <dt className="text-muted-foreground flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleView(doc)}
                  title="Consulter le document"
                  className="group flex items-center gap-1.5 hover:underline"
                >
                  <FileText className="h-3.5 w-3.5 text-[#2db34b]" />
                  {docTypeLabel(doc.typeCode)}
                </button>
              </dt>
              {editing ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(doc)}
                    title="Télécharger"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Input
                    id={`docDate-${doc.id}`}
                    type="date"
                    className="w-[160px] h-8 ml-auto"
                    value={editDocDates?.[doc.id] ?? ''}
                    onChange={(e) => onDocDateChange?.(doc.id, e.target.value)}
                  />
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(doc)}
                    title="Télécharger"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(doc)}
                    disabled={deletingId === doc.id}
                    title="Supprimer le document"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <dd className="font-medium flex items-center gap-1.5 ml-auto shrink-0">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    {doc.dateExpiration ? formatDate(doc.dateExpiration) : '—'}
                  </dd>
                </>
              )}
            </div>
          ))}
        </dl>
      )}

      <Dialog open={!!viewDoc} onOpenChange={(open) => !open && handleCloseView()}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {viewDoc ? docTypeLabel(viewDoc.typeCode) : 'Document'}
            </DialogTitle>
            <DialogDescription>
              {viewDoc ? viewDoc.nomFichier : ''}
              {viewDoc?.dateExpiration
                ? ` — Expire le ${formatDate(viewDoc.dateExpiration)}`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="h-[70vh] w-full rounded-md border bg-muted/20">
            {viewLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Chargement du document...
              </div>
            ) : viewUrl ? (
              <iframe
                src={viewUrl}
                title={viewDoc?.nomFichier}
                className="h-full w-full"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {!editing && (
        <div className="rounded-md border p-3 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Uploader un document</p>
          {archived ? (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Lock size={14} /> Fournisseur archivé : l'ajout de documents est désactivé.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor={`upType-${operateurId}`}>Type de document</Label>
                <Select
                  id={`upType-${operateurId}`}
                  value={upTypeCode}
                  onChange={(e) => setUpTypeCode(e.target.value)}
                  disabled={upLoading}
                >
                  {DOCUMENT_TYPES.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`upDate-${operateurId}`}>Date d'expiration</Label>
                <Input
                  id={`upDate-${operateurId}`}
                  type="date"
                  value={upDateExpiration}
                  onChange={(e) => setUpDateExpiration(e.target.value)}
                  disabled={upLoading}
                />
              </div>
            </div>
          )}
          {!archived && (
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setUpFile(e.target.files?.[0] || null)}
                disabled={upLoading}
              />
              <Button type="button" onClick={handleUpload} disabled={upLoading || !upFile}>
                {upLoading ? 'Upload...' : 'Uploader'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function SuppliersPage() {
  const [operateurs, setOperateurs] = useState<OperateurEconomique[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [statutFilter, setStatutFilter] = useState<string>('all')
  const [wilayaFilter, setWilayaFilter] = useState<string>('all')
  const [secteurFilter, setSecteurFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedOperateur, setSelectedOperateur] = useState<OperateurEconomique | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [secteurs, setSecteurs] = useState<SecteurActivite[]>([])
  const [statuts, setStatuts] = useState<Statut[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<OperateurEditForm | null>(null)
  const [savingId, setSavingId] = useState<number | null>(null)

  useEffect(() => {
    apiClient.getSecteurs().then(setSecteurs).catch(() => setSecteurs([]))
    apiClient.getStatuts().then(setStatuts).catch(() => setStatuts([]))
  }, [])

  const loadOperateurs = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.getOperateurs(page, PAGE_SIZE)
      setOperateurs(response.data || [])
      setTotal(response.total || 0)
    } catch (err) {
      setError("Erreur lors du chargement des opérateurs")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [page])

  useEffect(() => {
    loadOperateurs()
  }, [loadOperateurs])

  const filteredOperateurs = operateurs.filter((op) => {
    if (statutFilter !== 'all' && op.statutLibelle !== statutFilter) return false
    if (wilayaFilter !== 'all' && op.wilaya !== wilayaFilter) return false
    if (secteurFilter !== 'all' && op.secteurActiviteLibelle !== secteurFilter) return false
    return true
  })

  const handleAddNew = () => {
    setSelectedOperateur(undefined)
    setIsModalOpen(true)
  }

  const handleStartEdit = async (operateur: OperateurEconomique) => {
    setExpandedId(operateur.id)
    let docDates: Record<number, string> = {}
    try {
      const docs = await apiClient.getOperateurDocuments(operateur.id)
      docDates = Object.fromEntries(
        (docs || []).map((d) => [d.id, toDateInputValue(d.dateExpiration)])
      )
    } catch {
      docDates = {}
    }
    setEditForm({
      raisonSociale: operateur.raisonSociale,
      nif: operateur.nif || '',
      nis: operateur.nis || '',
      registreCommerce: operateur.registreCommerce || '',
      secteurActiviteId: operateur.secteurActiviteId
        ? String(operateur.secteurActiviteId)
        : '',
      adresse: operateur.adresse || '',
      wilaya: operateur.wilaya || '',
      telephone: operateur.telephone || '',
      email: operateur.email || '',
      typeOperateur: operateur.typeOperateur || '',
      formeJuridique: operateur.formeJuridique || '',
      dateCreationEntreprise: toDateInputValue(operateur.dateCreationEntreprise),
      statutId: operateur.statutId ? String(operateur.statutId) : '',
      docDates,
    })
    setEditingId(operateur.id)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm(null)
  }

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setEditForm((prev) => (prev ? { ...prev, [name]: value } : prev))
  }

  const handleDocDateChange = (docId: number, value: string) => {
    setEditForm((prev) =>
      prev ? { ...prev, docDates: { ...prev.docDates, [docId]: value } } : prev
    )
  }

  const handleSaveEdit = async (operateur: OperateurEconomique) => {
    if (!editForm) return
    try {
      setSavingId(operateur.id)
      const payload: UpdateOperateurRequest = {
        raisonSociale: editForm.raisonSociale,
        typeOperateur: editForm.typeOperateur || undefined,
        formeJuridique: editForm.formeJuridique || undefined,
        nif: editForm.nif || undefined,
        nis: editForm.nis || undefined,
        registreCommerce: editForm.registreCommerce || undefined,
        secteurActiviteId: editForm.secteurActiviteId
          ? Number(editForm.secteurActiviteId)
          : null,
        adresse: editForm.adresse || undefined,
        wilaya: editForm.wilaya || undefined,
        telephone: editForm.telephone || undefined,
        email: editForm.email || undefined,
        dateCreationEntreprise: editForm.dateCreationEntreprise || undefined,
        dateImmatriculation: operateur.dateImmatriculation,
        statutId: editForm.statutId ? Number(editForm.statutId) : null,
      }
      await apiClient.updateOperateur(operateur.id, payload)
      const dateEntries = Object.entries(editForm.docDates)
      await Promise.all(
        dateEntries.map(([docId, value]) =>
          apiClient.updateDocumentDateExpiration(Number(docId), value || null)
        )
      )
      setEditingId(null)
      setEditForm(null)
      loadOperateurs()
    } catch (err) {
      setError("Erreur lors de l'enregistrement de l'opérateur")
      console.error(err)
    } finally {
      setSavingId(null)
    }
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

  const handleStatusChange = async (op: OperateurEconomique, statutId: number | null) => {
    try {
      setSavingId(op.id)
      const payload: UpdateOperateurRequest = {
        raisonSociale: op.raisonSociale,
        typeOperateur: op.typeOperateur,
        formeJuridique: op.formeJuridique,
        nif: op.nif,
        nis: op.nis,
        registreCommerce: op.registreCommerce,
        secteurActiviteId: op.secteurActiviteId ?? null,
        adresse: op.adresse,
        wilaya: op.wilaya,
        telephone: op.telephone,
        email: op.email,
        dateCreationEntreprise: op.dateCreationEntreprise,
        dateImmatriculation: op.dateImmatriculation,
        statutId: statutId ?? null,
      }
      await apiClient.updateOperateur(op.id, payload)
      loadOperateurs()
    } catch (err) {
      setError("Erreur lors du changement de statut")
      console.error(err)
    } finally {
      setSavingId(null)
    }
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
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-md border border-input bg-background hover:bg-muted ${showFilters ? 'bg-muted' : ''}`}
            title="Filtres"
          >
            <SlidersHorizontal size={16} />
          </button>
          <Button onClick={handleAddNew} className="gap-2" size="sm">
            <Plus size={16} />
            Nouveau Fournisseur
          </Button>
        </div>
        {showFilters && (
          <div className="flex flex-wrap gap-2 mb-4">
            <select
              value={statutFilter}
              onChange={(e) => setStatutFilter(e.target.value)}
              className="px-3 py-2 rounded-md border border-input bg-background text-sm"
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
            <select
              value={wilayaFilter}
              onChange={(e) => setWilayaFilter(e.target.value)}
              className="px-3 py-2 rounded-md border border-input bg-background text-sm"
            >
              <option value="all">Toutes les wilayas</option>
              {Array.from(
                new Set(operateurs.map((o) => o.wilaya).filter(Boolean) as string[])
              ).sort().map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
            <select
              value={secteurFilter}
              onChange={(e) => setSecteurFilter(e.target.value)}
              className="px-3 py-2 rounded-md border border-input bg-background text-sm"
            >
              <option value="all">Tous les secteurs</option>
              {Array.from(
                new Set(operateurs.map((o) => o.secteurActiviteLibelle).filter(Boolean) as string[])
              ).sort().map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {(statutFilter !== 'all' || wilayaFilter !== 'all' || secteurFilter !== 'all') && (
              <button
                onClick={() => { setStatutFilter('all'); setWilayaFilter('all'); setSecteurFilter('all') }}
                className="px-3 py-2 rounded-md border border-input bg-background text-sm text-muted-foreground hover:text-foreground"
              >
                Réinitialiser
              </button>
            )}
          </div>
        )}
        {filteredOperateurs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucun fournisseur trouvé
          </div>
        ) : (
          <div className="border rounded-lg divide-y">
            {filteredOperateurs.map((op) => {
              const isExpanded = expandedId === op.id
              return (
                <div
                  key={op.id}
                  className={`transition-colors ${isExpanded ? 'bg-white' : ''}`}
                >
                    <div
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : op.id)}
                    >
                      <span className="text-sm text-muted-foreground shrink-0">
                        {op.numeroImmatriculation}
                      </span>
                      <span className="font-medium flex-1 truncate">{op.raisonSociale}</span>
                      {op.isArchived && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 shrink-0">
                          <Lock size={12} /> Verrouillé
                        </span>
                      )}
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={op.statutId ? String(op.statutId) : ''}
                          onChange={(e) =>
                            handleStatusChange(op, e.target.value ? Number(e.target.value) : null)
                          }
                          disabled={savingId === op.id}
                          className="h-9 w-auto min-w-[8rem]"
                          title="Changer le statut"
                        >
                          <option value="">-- Statut --</option>
                          {statuts.filter((s) => STATUTS_FOURNISSEUR.includes(s.libelle)).map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.libelle}
                            </option>
                          ))}
                        </Select>
                        <button
                          onClick={() =>
                            editingId === op.id
                              ? handleCancelEdit()
                              : handleStartEdit(op)
                          }
                          className={`p-1.5 hover:bg-muted rounded ${editingId === op.id ? 'bg-muted' : ''}`}
                          title="Modifier"
                        >
                          <Edit2 size={16} className="text-[#2db34b]" />
                        </button>
                        <button
                          onClick={() => handleDelete(op.id)}
                          className="p-1.5 hover:bg-muted rounded"
                          title="Supprimer"
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t px-4 py-4 grid gap-6 lg:grid-cols-2">
                        {editingId === op.id && editForm ? (
                          <>
                            <div className="space-y-3">
                              <p className="text-sm font-semibold text-gray-900">Informations</p>
                              <div className="grid grid-cols-1 gap-3 text-sm">
                                <div className="flex gap-2 items-center">
                                  <dt className="w-44 text-muted-foreground flex items-center gap-1.5 shrink-0">
                                    <Hash size={14} /> N° Immatriculation
                                  </dt>
                                  <dd className="font-medium">{op.numeroImmatriculation}</dd>
                                </div>
                                <div className="flex gap-2 items-center">
                                  <dt className="w-44 text-muted-foreground shrink-0">
                                    Raison sociale <span className="text-[#e82c2a]">*</span>
                                  </dt>
                                  <Input
                                    name="raisonSociale"
                                    value={editForm.raisonSociale}
                                    onChange={handleEditChange}
                                    disabled={savingId === op.id}
                                  />
                                </div>
                                <div className="flex gap-2 items-center">
                                  <dt className="w-44 text-muted-foreground shrink-0">NIF</dt>
                                  <Input
                                    name="nif"
                                    value={editForm.nif}
                                    onChange={handleEditChange}
                                    disabled={savingId === op.id}
                                  />
                                </div>
                                <div className="flex gap-2 items-center">
                                  <dt className="w-44 text-muted-foreground shrink-0">NIS</dt>
                                  <Input
                                    name="nis"
                                    value={editForm.nis}
                                    onChange={handleEditChange}
                                    disabled={savingId === op.id}
                                  />
                                </div>
                                <div className="flex gap-2 items-center">
                                  <dt className="w-44 text-muted-foreground shrink-0">
                                    Registre de commerce
                                  </dt>
                                  <Input
                                    name="registreCommerce"
                                    value={editForm.registreCommerce}
                                    onChange={handleEditChange}
                                    disabled={savingId === op.id}
                                  />
                                </div>
                                <div className="flex gap-2 items-center">
                                  <dt className="w-44 text-muted-foreground shrink-0">
                                    Secteur d'activité
                                  </dt>
                                  <Select
                                    name="secteurActiviteId"
                                    value={editForm.secteurActiviteId}
                                    onChange={handleEditChange}
                                    disabled={savingId === op.id}
                                  >
                                    <option value="">-- Sélectionner --</option>
                                    {secteurs.map((s) => (
                                      <option key={s.id} value={s.id}>
                                        {s.libelle}
                                      </option>
                                    ))}
                                  </Select>
                                </div>
                                <div className="flex gap-2 items-center">
                                  <dt className="w-44 text-muted-foreground shrink-0">Type</dt>
                                  <Input
                                    name="typeOperateur"
                                    value={editForm.typeOperateur}
                                    onChange={handleEditChange}
                                    disabled={savingId === op.id}
                                  />
                                </div>
                                <div className="flex gap-2 items-center">
                                  <dt className="w-44 text-muted-foreground shrink-0">
                                    Forme juridique
                                  </dt>
                                  <Input
                                    name="formeJuridique"
                                    value={editForm.formeJuridique}
                                    onChange={handleEditChange}
                                    disabled={savingId === op.id}
                                  />
                                </div>
                                <div className="flex gap-2 items-center">
                                  <dt className="w-44 text-muted-foreground shrink-0">
                                    Création entreprise
                                  </dt>
                                  <Input
                                    name="dateCreationEntreprise"
                                    type="date"
                                    value={editForm.dateCreationEntreprise}
                                    onChange={handleEditChange}
                                    disabled={savingId === op.id}
                                  />
                                </div>
                                <div className="flex gap-2 items-center">
                                  <dt className="w-44 text-muted-foreground shrink-0">
                                    Date d'immatriculation
                                  </dt>
                                  <dd className="font-medium">{formatDate(op.dateImmatriculation)}</dd>
                                </div>
                                <div className="flex gap-2 items-center">
                                  <dt className="w-44 text-muted-foreground shrink-0">Statut</dt>
                                  <Select
                                    name="statutId"
                                    value={editForm.statutId}
                                    onChange={handleEditChange}
                                    disabled={savingId === op.id}
                                  >
                                    <option value="">-- Sélectionner --</option>
                                    {statuts.filter((s) => STATUTS_FOURNISSEUR.includes(s.libelle)).map((s) => (
                                      <option key={s.id} value={s.id}>
                                        {s.libelle}
                                      </option>
                                    ))}
                                  </Select>
                                </div>
                                <div className="flex gap-2 items-center">
                                  <dt className="w-44 text-muted-foreground flex items-center gap-1.5 shrink-0">
                                    <MapPin size={14} /> Adresse
                                  </dt>
                                  <Input
                                    name="adresse"
                                    value={editForm.adresse}
                                    onChange={handleEditChange}
                                    disabled={savingId === op.id}
                                  />
                                </div>
                                <div className="flex gap-2 items-center">
                                  <dt className="w-44 text-muted-foreground shrink-0">Wilaya</dt>
                                  <Input
                                    name="wilaya"
                                    value={editForm.wilaya}
                                    onChange={handleEditChange}
                                    disabled={savingId === op.id}
                                  />
                                </div>
                                <div className="flex gap-2 items-center">
                                  <dt className="w-44 text-muted-foreground flex items-center gap-1.5 shrink-0">
                                    <Phone size={14} /> Téléphone
                                  </dt>
                                  <Input
                                    name="telephone"
                                    value={editForm.telephone}
                                    onChange={handleEditChange}
                                    disabled={savingId === op.id}
                                  />
                                </div>
                                <div className="flex gap-2 items-center">
                                  <dt className="w-44 text-muted-foreground flex items-center gap-1.5 shrink-0">
                                    <Mail size={14} /> Email
                                  </dt>
                                  <Input
                                    name="email"
                                    type="email"
                                    value={editForm.email}
                                    onChange={handleEditChange}
                                    disabled={savingId === op.id}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <p className="text-sm font-semibold text-gray-900">Dossiers</p>
                              <OperateurDocuments
                                operateurId={op.id}
                                archived={op.isArchived}
                                editing
                                editDocDates={editForm.docDates}
                                onDocDateChange={handleDocDateChange}
                              />
                              <div className="flex items-center justify-end gap-2 pt-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={handleCancelEdit}
                                  disabled={savingId === op.id}
                                >
                                  Annuler
                                </Button>
                                <Button
                                  type="button"
                                  onClick={() => handleSaveEdit(op)}
                                  disabled={savingId === op.id}
                                >
                                  {savingId === op.id ? 'Enregistrement...' : 'Enregistrer'}
                                </Button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="space-y-3">
                              <p className="text-sm font-semibold text-gray-900">Informations</p>
                              <dl className="grid grid-cols-1 gap-2 text-sm">
                                <div className="flex gap-2">
                                  <dt className="w-44 text-muted-foreground flex items-center gap-1.5">
                                    <Hash size={14} /> N° Immatriculation
                                  </dt>
                                  <dd className="font-medium">{op.numeroImmatriculation || '—'}</dd>
                                </div>
                                <div className="flex gap-2">
                                  <dt className="w-44 text-muted-foreground">Raison sociale</dt>
                                  <dd className="font-medium">{op.raisonSociale || '—'}</dd>
                                </div>
                                <div className="flex gap-2">
                                  <dt className="w-44 text-muted-foreground">NIF</dt>
                                  <dd className="font-medium">{op.nif || '—'}</dd>
                                </div>
                                <div className="flex gap-2">
                                  <dt className="w-44 text-muted-foreground">NIS</dt>
                                  <dd className="font-medium">{op.nis || '—'}</dd>
                                </div>
                                <div className="flex gap-2">
                                  <dt className="w-44 text-muted-foreground">Registre de commerce</dt>
                                  <dd className="font-medium">{op.registreCommerce || '—'}</dd>
                                </div>
                                <div className="flex gap-2">
                                  <dt className="w-44 text-muted-foreground">Secteur d'activité</dt>
                                  <dd className="font-medium">{op.secteurActiviteLibelle || '—'}</dd>
                                </div>
                                <div className="flex gap-2">
                                  <dt className="w-44 text-muted-foreground">Date d'immatriculation</dt>
                                  <dd className="font-medium">{formatDate(op.dateImmatriculation)}</dd>
                                </div>
                                <div className="flex gap-2">
                                  <dt className="w-44 text-muted-foreground">Création entreprise</dt>
                                  <dd className="font-medium">{formatDate(op.dateCreationEntreprise)}</dd>
                                </div>
                                <div className="flex gap-2">
                                  <dt className="w-44 text-muted-foreground">Statut</dt>
                                  <dd className="font-medium">{op.statutLibelle || '—'}</dd>
                                </div>
                                <div className="flex gap-2">
                                  <dt className="w-44 text-muted-foreground flex items-center gap-1.5">
                                    <MapPin size={14} /> Adresse
                                  </dt>
                                  <dd className="font-medium">{op.adresse || '—'}</dd>
                                </div>
                                <div className="flex gap-2">
                                  <dt className="w-44 text-muted-foreground">Wilaya</dt>
                                  <dd className="font-medium">{op.wilaya || '—'}</dd>
                                </div>
                                <div className="flex gap-2">
                                  <dt className="w-44 text-muted-foreground flex items-center gap-1.5">
                                    <Phone size={14} /> Téléphone
                                  </dt>
                                  <dd className="font-medium">{op.telephone || '—'}</dd>
                                </div>
                                <div className="flex gap-2">
                                  <dt className="w-44 text-muted-foreground flex items-center gap-1.5">
                                    <Mail size={14} /> Email
                                  </dt>
                                  <dd className="font-medium">{op.email || '—'}</dd>
                                </div>
                                <div className="flex gap-2">
                                  <dt className="w-44 text-muted-foreground">Type</dt>
                                  <dd className="font-medium capitalize">{op.typeOperateur || '—'}</dd>
                                </div>
                                <div className="flex gap-2">
                                  <dt className="w-44 text-muted-foreground">Forme juridique</dt>
                                  <dd className="font-medium">{op.formeJuridique || '—'}</dd>
                                </div>
                              </dl>
                            </div>

                            <div className="space-y-3">
                              <p className="text-sm font-semibold text-gray-900">Dossiers</p>
                              <OperateurDocuments operateurId={op.id} archived={op.isArchived} />
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
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
        </div>

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
