'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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
  MapPin,
  Phone,
  Mail,
  Hash,
  Lock,
  SlidersHorizontal,
  Ban,
  Archive,
  RefreshCw,
  ChevronDown,
} from 'lucide-react'

const PAGE_SIZE = 10

interface OperateurEditForm {
  raisonSociale: string
  nif: string
  secteurActiviteId: string
  typeFournisseur: string
  gerant: string
  adresse: string
  telephone: string
  email: string
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
  { code: 'VALIDITE_COTISATIONS_CNAS', label: 'Validité des cotisations sociales CNAS / CASNOS' },
  { code: 'CERTIFICAT_MISE_A_JOUR_FISCAL', label: 'Certificat de mise à jour / Attestation fiscale' },
  { code: 'CERTIFICAT_QUALIFICATION', label: 'Certificat de qualification / Agrément ou certification ISO 9001' },
]

const STATUTS_FOURNISSEUR = ['actif', 'blacklisté', 'archivé']

function StatutBadge({ statut }: { statut?: string }) {
  const classes =
    statut === 'actif'
      ? 'bg-[#2db34b] text-white'
      : statut === 'blacklisté'
      ? 'bg-red-100 text-red-800'
      : statut === 'archivé'
      ? 'bg-gray-100 text-gray-700'
      : 'bg-gray-100 text-gray-700'
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${classes}`}>
      {statut || '—'}
    </span>
  )
}

const docTypeLabel = (code: string) =>
  DOCUMENT_TYPES.find((t) => t.code === code)?.label || code

const formatDate = (dateString?: string) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  return date.toLocaleDateString('fr-FR')
}

export function OperateurDocuments({
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
  const [uploadingType, setUploadingType] = useState<string | null>(null)
  const [upFiles, setUpFiles] = useState<Record<string, File | null>>({})
  const [upDates, setUpDates] = useState<Record<string, string>>({})
  const [upLoading, setUpLoading] = useState<string | null>(null)
  const [viewDoc, setViewDoc] = useState<Document | null>(null)
  const [viewUrl, setViewUrl] = useState<string | null>(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [dossier, setDossier] = useState<{ id: number; statutId: number; statutLibelle?: string } | null>(null)
  const [dossierStatuts, setDossierStatuts] = useState<Statut[]>([])
  const [savingDossierStatut, setSavingDossierStatut] = useState(false)

  const DOSSIER_STATUTS = ['en cours', 'validé', 'rejeté', 'suspendu']

  const loadDocs = useCallback(async () => {
    setDocsLoading(true)
    try {
      const data = await apiClient.getOperateurDocuments(operateurId)
      setDocuments(data || [])
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

  const handleUpload = async (typeCode: string) => {
    const file = upFiles[typeCode]
    if (!file) return
    setUpLoading(typeCode)
    try {
      await apiClient.uploadOperateurDocument(
        operateurId,
        typeCode,
        file,
        upDates[typeCode] || undefined
      )
      setUpFiles((prev) => ({ ...prev, [typeCode]: null }))
      setUpDates((prev) => ({ ...prev, [typeCode]: '' }))
      setUploadingType(null)
      loadDocs()
    } catch (err) {
      console.error(err)
      alert("Erreur lors de l'upload du document")
    } finally {
      setUpLoading(null)
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

  const handleDelete = async (doc: Document) => {
    if (!window.confirm(`Supprimer le document « ${docTypeLabel(doc.typeCode)} » ?`)) return
    setDeletingId(doc.id)
    try {
      await apiClient.deleteDocument(doc.id)
      if (viewDoc?.id === doc.id) handleCloseView()
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id))
    } catch (err) {
      console.error(err)
      alert('Erreur lors de la suppression du document')
    } finally {
      setDeletingId(null)
    }
  }

  const getDocForType = (typeCode: string) => documents.find((d) => d.typeCode === typeCode)

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
      ) : (
        <div className="space-y-2">
          {DOCUMENT_TYPES.map((type) => {
            const doc = getDocForType(type.code)
            const isUploading = uploadingType === type.code

            if (doc) {
              return (
                <div key={type.code} className="flex items-center gap-2 py-2 border-b last:border-b-0">
                  <span className="text-muted-foreground flex items-center gap-1.5 shrink-0">
                    <FileText className="h-3.5 w-3.5 text-[#2db34b]" />
                    {type.label}
                  </span>
                  {editing ? (
                    <>
                      <Input
                        id={`docDate-${doc.id}`}
                        type="date"
                        className="w-[160px] h-8 ml-auto"
                        value={editDocDates?.[doc.id] ?? ''}
                        onChange={(e) => onDocDateChange?.(doc.id, e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(doc)}
                        title="Télécharger"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="font-medium flex items-center gap-1.5 ml-auto shrink-0 text-sm">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {doc.dateExpiration ? formatDate(doc.dateExpiration) : '—'}
                      </span>
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
                    </>
                  )}
                </div>
              )
            }

            return (
              <div key={type.code} className="flex items-center gap-2 py-2 border-b last:border-b-0">
                <span className="text-muted-foreground flex items-center gap-1.5 shrink-0">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  {type.label}
                </span>
                {archived ? (
                  <span className="text-xs text-muted-foreground ml-auto">
                    <Lock size={12} className="inline mr-1" />Archivé
                  </span>
                ) : isUploading ? (
                  <div className="flex items-center gap-2 ml-auto">
                    <Input
                      type="date"
                      className="w-[140px] h-8"
                      value={upDates[type.code] || ''}
                      onChange={(e) => setUpDates((prev) => ({ ...prev, [type.code]: e.target.value }))}
                      placeholder="Date expiration"
                    />
                    <Input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="w-[200px] h-8"
                      onChange={(e) => setUpFiles((prev) => ({ ...prev, [type.code]: e.target.files?.[0] || null }))}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleUpload(type.code)}
                      disabled={upLoading === type.code || !upFiles[type.code]}
                    >
                      {upLoading === type.code ? '...' : 'Confirmer'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => { setUploadingType(null); setUpFiles((prev) => ({ ...prev, [type.code]: null })) }}
                    >
                      Annuler
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="ml-auto"
                    onClick={() => setUploadingType(type.code)}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Importer
                  </Button>
                )}
              </div>
            )
          })}
        </div>
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
    </div>
  )
}

export default function SuppliersPage() {
  const router = useRouter()
  const [operateurs, setOperateurs] = useState<OperateurEconomique[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [statutFilter, setStatutFilter] = useState<string>('all')
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
  const [blacklistOperateurId, setBlacklistOperateurId] = useState<number | null>(null)
  const [blacklistForm, setBlacklistForm] = useState({ motif: '', dateDebut: '', dateFin: '' })

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
      secteurActiviteId: operateur.secteurActiviteId
        ? String(operateur.secteurActiviteId)
        : '',
      typeFournisseur: operateur.typeFournisseur || '',
      gerant: operateur.gerant || '',
      adresse: operateur.adresse || '',
      telephone: operateur.telephone || '',
      email: operateur.email || '',
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
        typeFournisseur: editForm.typeFournisseur || undefined,
        gerant: editForm.gerant || undefined,
        formeJuridique: editForm.formeJuridique || undefined,
        nif: editForm.nif || undefined,
        secteurActiviteId: editForm.secteurActiviteId
          ? Number(editForm.secteurActiviteId)
          : null,
        adresse: editForm.adresse || undefined,
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
        typeFournisseur: op.typeFournisseur,
        gerant: op.gerant,
        formeJuridique: op.formeJuridique,
        nif: op.nif,
        secteurActiviteId: op.secteurActiviteId ?? null,
        adresse: op.adresse,
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

  const handleArchive = async (op: OperateurEconomique) => {
    if (!confirm(`Archiver "${op.raisonSociale}" ?`)) return
    try {
      setSavingId(op.id)
      await apiClient.archiveOperateur(op.id, true)
      loadOperateurs()
    } catch (err) {
      setError("Erreur lors de l'archivage")
      console.error(err)
    } finally {
      setSavingId(null)
    }
  }

  const handleBlacklistSubmit = async () => {
    if (!blacklistOperateurId || !blacklistForm.motif || !blacklistForm.dateDebut) return
    try {
      setSavingId(blacklistOperateurId)
      await apiClient.blacklistOperateur(blacklistOperateurId, {
        motif: blacklistForm.motif,
        dateDebut: blacklistForm.dateDebut,
        dateFin: blacklistForm.dateFin || undefined,
      })
      setBlacklistOperateurId(null)
      setBlacklistForm({ motif: '', dateDebut: '', dateFin: '' })
      loadOperateurs()
    } catch (err) {
      setError("Erreur lors du blacklistage")
      console.error(err)
    } finally {
      setSavingId(null)
    }
  }

  const handleReactivate = async (op: OperateurEconomique) => {
    if (!confirm(`Réactiver "${op.raisonSociale}" ?`)) return
    try {
      setSavingId(op.id)
      await apiClient.reactivateOperateur(op.id)
      loadOperateurs()
    } catch (err) {
      setError("Erreur lors de la réactivation")
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
                  value={secteurFilter}
                  onChange={(e) => setSecteurFilter(e.target.value)}
                  className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                >
                  <option value="all">Tous les secteurs</option>
                {Array.from(
                  new Set(operateurs.map((o) => o.secteurActiviteLibelle).filter(Boolean) as string[])
                ).sort().map((s) => (
                  <option key={s} value={s}>
                    {operateurs.find((o) => o.secteurActiviteLibelle === s)?.secteurActiviteCode ? `${operateurs.find((o) => o.secteurActiviteLibelle === s)?.secteurActiviteCode} - ` : ''}{s}
                  </option>
                ))}
            </select>
                {(statutFilter !== 'all' || secteurFilter !== 'all') && (
                  <button
                    onClick={() => { setStatutFilter('all'); setSecteurFilter('all') }}
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
              const rowBg =
                op.statutLibelle === 'blacklisté'
                  ? 'bg-red-50/60'
                  :                 op.statutLibelle === 'archivé'
                  ? 'bg-gray-100'
                  : ''
              return (
                <div
                  key={op.id}
                  className={`transition-colors ${isExpanded ? (rowBg || 'bg-white') : rowBg}`}
                >
                    <div
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                      onClick={() => router.push(`/suppliers/${op.id}`)}
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : op.id) }}
                        className="p-1 hover:bg-muted rounded transition-colors"
                        title={isExpanded ? 'Réduire' : 'Développer'}
                      >
                        <ChevronDown size={16} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                      <span className="text-sm text-muted-foreground shrink-0">
                        {op.numeroImmatriculation}
                      </span>
                      <span className="font-medium flex-1 truncate">{op.raisonSociale}</span>
                      <StatutBadge statut={op.statutLibelle} />
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {op.statutLibelle === 'actif' && (
                          <>
                            <button
                              onClick={() => {
                                setBlacklistOperateurId(op.id)
                                setBlacklistForm({ motif: '', dateDebut: '', dateFin: '' })
                              }}
                              className="p-1.5 hover:bg-red-50 rounded"
                              title="Blacklister"
                            >
                              <Ban size={16} className="text-red-600" />
                            </button>
                            <button
                              onClick={() => handleArchive(op)}
                              className="p-1.5 hover:bg-muted rounded"
                              title="Archiver"
                            >
                              <Archive size={16} className="text-gray-600" />
                            </button>
                          </>
                        )}
                        {op.statutLibelle === 'blacklisté' && (
                          <>
                            <button
                              onClick={() => handleReactivate(op)}
                              className="p-1.5 hover:bg-green-50 rounded"
                              title="Réactiver"
                            >
                              <RefreshCw size={16} className="text-[#2db34b]" />
                            </button>
                            <button
                              onClick={() => handleArchive(op)}
                              className="p-1.5 hover:bg-muted rounded"
                              title="Archiver"
                            >
                              <Archive size={16} className="text-gray-600" />
                            </button>
                          </>
                        )}
                        {op.statutLibelle === 'archivé' && (
                          <button
                            onClick={() => handleReactivate(op)}
                            className="p-1.5 hover:bg-green-50 rounded"
                            title="Réactiver"
                          >
                            <RefreshCw size={16} className="text-[#2db34b]" />
                          </button>
                        )}
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
                                    <Hash size={14} /> Code
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
                                  <dt className="w-44 text-muted-foreground shrink-0">
                                    Type fournisseur
                                  </dt>
                                  <Select
                                    name="typeFournisseur"
                                    value={editForm.typeFournisseur}
                                    onChange={handleEditChange}
                                    disabled={savingId === op.id}
                                  >
                                    <option value="">-- Sélectionner --</option>
                                    <option value="Local">Local</option>
                                    <option value="International">International</option>
                                    <option value="Sous-traitant">Sous-traitant</option>
                                  </Select>
                                </div>
                                <div className="flex gap-2 items-center">
                                  <dt className="w-44 text-muted-foreground shrink-0">
                                    Gérant
                                  </dt>
                                  <Input
                                    name="gerant"
                                    value={editForm.gerant}
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
                                  <StatutBadge statut={op.statutLibelle} />
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
                                    <Hash size={14} /> Code
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
                                  <dt className="w-44 text-muted-foreground">Secteur d'activité</dt>
                                  <dd className="font-medium">{op.secteurActiviteCode ? `${op.secteurActiviteCode} - ` : ''}{op.secteurActiviteLibelle || '—'}</dd>
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
                                  <dd><StatutBadge statut={op.statutLibelle} /></dd>
                                </div>
                                <div className="flex gap-2">
                                  <dt className="w-44 text-muted-foreground flex items-center gap-1.5">
                                    <MapPin size={14} /> Adresse
                                  </dt>
                                  <dd className="font-medium">{op.adresse || '—'}</dd>
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
                                  <dt className="w-44 text-muted-foreground">Type fournisseur</dt>
                                  <dd className="font-medium">{op.typeFournisseur || '—'}</dd>
                                </div>
                                <div className="flex gap-2">
                                  <dt className="w-44 text-muted-foreground">Gérant</dt>
                                  <dd className="font-medium">{op.gerant || '—'}</dd>
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

      <Dialog open={blacklistOperateurId !== null} onOpenChange={(open) => { if (!open) { setBlacklistOperateurId(null); setBlacklistForm({ motif: '', dateDebut: '', dateFin: '' }) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Blacklister le fournisseur</DialogTitle>
            <DialogDescription>
              Spécifiez le motif et la période de blacklistage.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="blacklist-motif">Motif *</Label>
              <Input
                id="blacklist-motif"
                value={blacklistForm.motif}
                onChange={(e) => setBlacklistForm((f) => ({ ...f, motif: e.target.value }))}
                placeholder="Raison du blacklistage"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="blacklist-date-debut">Date de début *</Label>
                <Input
                  id="blacklist-date-debut"
                  type="date"
                  value={blacklistForm.dateDebut}
                  onChange={(e) => setBlacklistForm((f) => ({ ...f, dateDebut: e.target.value }))}
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="blacklist-date-fin">Date de fin</Label>
                <Input
                  id="blacklist-date-fin"
                  type="date"
                  value={blacklistForm.dateFin}
                  onChange={(e) => setBlacklistForm((f) => ({ ...f, dateFin: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => { setBlacklistOperateurId(null); setBlacklistForm({ motif: '', dateDebut: '', dateFin: '' }) }}
              >
                Annuler
              </Button>
              <Button
                onClick={handleBlacklistSubmit}
                disabled={!blacklistForm.motif || !blacklistForm.dateDebut || savingId === blacklistOperateurId}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {savingId === blacklistOperateurId ? 'Blacklistage...' : 'Confirmer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
