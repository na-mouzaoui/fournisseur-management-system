'use client'

import { useState, useEffect } from 'react'
import {
  OperateurEconomique,
  CreateOperateurRequest,
  SecteurActivite,
  Statut,
  Document,
} from '@/lib/types'
import { apiClient } from '@/lib/api-client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select } from './ui/select'
import { Download, Upload, FileText, Calendar, Trash2, X } from 'lucide-react'

const DOCUMENT_TYPES: { code: string; label: string }[] = [
  { code: 'REGISTRE_COMMERCE', label: 'Registre de commerce' },
  { code: 'EXTRAIT_ROLE', label: 'Extrait de rôle' },
  { code: 'STATUTS_SOCIETE', label: 'Statuts de société' },
  { code: 'ATTESTATION_NIF', label: 'Attestation NIF' },
  { code: 'ATTESTATION_NIS', label: 'Attestation NIS' },
  { code: 'CASIER_JUDICIAIRE', label: 'Casier judiciaire' },
  { code: 'PIECE_IDENTITE', label: "Pièce d'identité" },
]

interface OperateurModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateOperateurRequest) => Promise<void>
  operateur?: OperateurEconomique
  isLoading?: boolean
}

interface OperateurForm {
  numeroImmatriculation: string
  raisonSociale: string
  nif: string
  nis: string
  registreCommerce: string
  secteurActiviteId: string
  adresse: string
  telephone: string
  email: string
  statutId: string
}

const emptyForm: OperateurForm = {
  numeroImmatriculation: '',
  raisonSociale: '',
  nif: '',
  nis: '',
  registreCommerce: '',
  secteurActiviteId: '',
  adresse: '',
  telephone: '',
  email: '',
  statutId: '',
}

export default function OperateurModal({
  isOpen,
  onClose,
  onSubmit,
  operateur,
  isLoading = false,
}: OperateurModalProps) {
  const [formData, setFormData] = useState<OperateurForm>(emptyForm)
  const [secteurs, setSecteurs] = useState<SecteurActivite[]>([])
  const [statuts, setStatuts] = useState<Statut[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [upTypeCode, setUpTypeCode] = useState('REGISTRE_COMMERCE')
  const [upFile, setUpFile] = useState<File | null>(null)
  const [upDateExpiration, setUpDateExpiration] = useState('')
  const [upLoading, setUpLoading] = useState(false)
  const [dateInputs, setDateInputs] = useState<Record<number, string>>({})
  const [savingDates, setSavingDates] = useState<Record<number, boolean>>({})
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [viewDoc, setViewDoc] = useState<Document | null>(null)
  const [viewUrl, setViewUrl] = useState<string | null>(null)
  const [viewLoading, setViewLoading] = useState(false)

  const toDateInputValue = (dateString?: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    return date.toISOString().slice(0, 10)
  }

  useEffect(() => {
    apiClient.getSecteurs().then(setSecteurs).catch(() => setSecteurs([]))
    apiClient.getStatuts().then(setStatuts).catch(() => setStatuts([]))
  }, [])

  useEffect(() => {
    if (isOpen && operateur) {
      setDocsLoading(true)
      setDocuments([])
      setUpFile(null)
      setUpDateExpiration('')
      setViewDoc(null)
      if (viewUrl) window.URL.revokeObjectURL(viewUrl)
      setViewUrl(null)
      apiClient
        .getOperateurDocuments(operateur.id)
        .then((docs) => {
          setDocuments(docs)
          setDateInputs(
            Object.fromEntries(docs.map((d) => [d.id, toDateInputValue(d.dateExpiration)]))
          )
        })
        .catch(() => setDocuments([]))
        .finally(() => setDocsLoading(false))
    }
  }, [isOpen, operateur])

  const handleUpload = async () => {
    if (!operateur || !upFile) return
    setUpLoading(true)
    try {
      await apiClient.uploadOperateurDocument(
        operateur.id,
        upTypeCode,
        upFile,
        upDateExpiration || undefined
      )
      const docs = await apiClient.getOperateurDocuments(operateur.id)
      setDocuments(docs)
      setUpFile(null)
      setUpDateExpiration('')
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
      alert("Erreur lors du téléchargement")
    }
  }

  const docTypeLabel = (code: string) =>
    DOCUMENT_TYPES.find((t) => t.code === code)?.label || code

  const handleView = async (doc: Document) => {
    if (viewUrl) window.URL.revokeObjectURL(viewUrl)
    setViewDoc(doc)
    setViewUrl(null)
    setViewLoading(true)
    try {
      const blob = await apiClient.downloadDocument(doc.id)
      setViewUrl(window.URL.createObjectURL(blob))
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : ''
      if (!errMsg.includes('401')) {
        console.error(err)
        alert('Erreur lors de la consultation du document')
      }
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
      const updated = await apiClient.updateDocumentDateExpiration(doc.id, value || null)
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    return date.toLocaleDateString('fr-FR')
  }

  useEffect(() => {
    if (operateur) {
      setFormData({
        numeroImmatriculation: operateur.numeroImmatriculation,
        raisonSociale: operateur.raisonSociale,
        nif: operateur.nif || '',
        nis: operateur.nis || '',
        registreCommerce: operateur.registreCommerce || '',
        secteurActiviteId: operateur.secteurActiviteId
          ? String(operateur.secteurActiviteId)
          : '',
        adresse: operateur.adresse || '',
        telephone: operateur.telephone || '',
        email: operateur.email || '',
        statutId: operateur.statutId ? String(operateur.statutId) : '',
      })
    } else {
      setFormData(emptyForm)
    }
  }, [operateur, isOpen])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload: CreateOperateurRequest = {
      numeroImmatriculation: formData.numeroImmatriculation,
      raisonSociale: formData.raisonSociale,
      nif: formData.nif || undefined,
      nis: formData.nis || undefined,
      registreCommerce: formData.registreCommerce || undefined,
      secteurActiviteId: formData.secteurActiviteId
        ? Number(formData.secteurActiviteId)
        : null,
      adresse: formData.adresse || undefined,
      telephone: formData.telephone || undefined,
      email: formData.email || undefined,
    }
    if (operateur) {
      payload.dateImmatriculation = operateur.dateImmatriculation
      payload.statutId = formData.statutId ? Number(formData.statutId) : null
    }
    await onSubmit(payload)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {operateur ? "Modifier l'opérateur" : 'Ajouter un opérateur'}
          </DialogTitle>
          <DialogDescription>
            {operateur
              ? "Modifiez les informations de l'opérateur"
              : "Ajoutez un nouvel opérateur au registre. Le statut sera défini à 'en cours'."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numeroImmatriculation">
                N° d'immatriculation{' '}
                <span className="text-[#e82c2a]">*</span>
              </Label>
              <Input
                id="numeroImmatriculation"
                name="numeroImmatriculation"
                value={formData.numeroImmatriculation}
                onChange={handleChange}
                required
                disabled={isLoading}
                placeholder="Ex : 00/00/000000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="raisonSociale">
                Raison sociale <span className="text-[#e82c2a]">*</span>
              </Label>
              <Input
                id="raisonSociale"
                name="raisonSociale"
                value={formData.raisonSociale}
                onChange={handleChange}
                required
                disabled={isLoading}
                placeholder="Ex : SARL Entreprise"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nif">NIF</Label>
              <Input
                id="nif"
                name="nif"
                value={formData.nif}
                onChange={handleChange}
                disabled={isLoading}
                placeholder="Numéro d'identification fiscale"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nis">NIS</Label>
              <Input
                id="nis"
                name="nis"
                value={formData.nis}
                onChange={handleChange}
                disabled={isLoading}
                placeholder="Numéro d'identification statistique"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="registreCommerce">Registre de commerce</Label>
              <Input
                id="registreCommerce"
                name="registreCommerce"
                value={formData.registreCommerce}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secteurActiviteId">Secteur d'activité</Label>
              <Select
                id="secteurActiviteId"
                name="secteurActiviteId"
                value={formData.secteurActiviteId}
                onChange={handleChange}
                disabled={isLoading}
              >
                <option value="">-- Sélectionner --</option>
                {secteurs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.libelle}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adresse">Adresse</Label>
            <Input
              id="adresse"
              name="adresse"
              value={formData.adresse}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone</Label>
              <Input
                id="telephone"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                disabled={isLoading}
                placeholder="Ex : 0550 00 00 00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                placeholder="contact@entreprise.dz"
              />
            </div>
          </div>

          {operateur && (
            <div className="space-y-2">
              <Label htmlFor="statutId">Statut</Label>
              <Select
                id="statutId"
                name="statutId"
                value={formData.statutId}
                onChange={handleChange}
                disabled={isLoading}
              >
                <option value="">-- Sélectionner --</option>
                {statuts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.libelle}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-muted-foreground">
                Vous pouvez changer le statut de l'opérateur après sa
                création.
              </p>
            </div>
          )}

          {operateur && (
            <div className="space-y-3 border-t pt-4">
              <Label className="text-sm font-semibold">Documents du fournisseur</Label>

              {docsLoading ? (
                <p className="text-sm text-muted-foreground">Chargement des documents...</p>
              ) : documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucun document uploadé pour le moment.
                </p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3">
                      <div className="border rounded-md flex items-center justify-between gap-3 px-3 py-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 shrink-0 text-[#2db34b]" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{docTypeLabel(doc.typeCode)}</p>
                            <p className="text-xs text-muted-foreground truncate">{doc.nomFichier}</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(doc)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">Date d'expiration du document</span>
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <Input
                          type="date"
                          className="w-[150px] h-8"
                          value={dateInputs[doc.id] ?? ''}
                          onChange={(e) => {
                            handleDateChange(doc, e.target.value)
                            handleSaveDate(doc, e.target.value)
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid gap-3 pt-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="upTypeCode">Type de document</Label>
                    <Select
                      id="upTypeCode"
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
                  <div className="space-y-2">
                    <Label htmlFor="upDateExpiration">Date d'expiration</Label>
                    <Input
                      id="upDateExpiration"
                      type="date"
                      value={upDateExpiration}
                      onChange={(e) => setUpDateExpiration(e.target.value)}
                      disabled={upLoading}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    id="upFile"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => setUpFile(e.target.files?.[0] || null)}
                    disabled={upLoading}
                  />
                  <Button
                    type="button"
                    onClick={handleUpload}
                    disabled={upLoading || !upFile}
                  >
                    {upLoading ? 'Upload...' : 'Uploader'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Upload className="h-3 w-3" />
                  Formats acceptés : PDF, PNG, JPG. Un nouveau fichier du même type remplacera
                  l'ancien.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
