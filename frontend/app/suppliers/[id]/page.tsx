'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Hash,
  Star,
  Calendar,
  Edit2,
} from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { OperateurEconomique, Evaluation, EvaluationStats, SecteurActivite } from '@/lib/types'
import { OperateurDocuments } from '../page'
import { Select } from '@/components/ui/select'
import CommercialSection from './commercial'
import TechniqueSection from './technique'
import FinanciersSection from './financiers'
import RelationSection from './relation'

function StatutBadge({ statut }: { statut?: string }) {
  const classes =
    statut === 'actif'
      ? 'bg-[#2db34b] text-white'
      : statut === 'blacklisté'
      ? 'bg-red-100 text-red-800'
      : statut === 'archivé'
      ? 'bg-gray-200 text-gray-700'
      : 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${classes}`}>
      {statut || '—'}
    </span>
  )
}

function ScoreBadge({ note }: { note?: number | null }) {
  if (note === undefined || note === null) return <span className="text-muted-foreground text-sm">—</span>
  const color =
    note >= 4 ? 'bg-[#2db34b] text-white' :
    note >= 3 ? 'bg-yellow-100 text-yellow-800' :
    'bg-red-100 text-red-800'
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${color}`}>
      <Star size={12} fill="currentColor" /> {note.toFixed(1)}
    </span>
  )
}

function StarRating({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange(star)}
          onMouseEnter={() => !disabled && setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="disabled:cursor-not-allowed"
        >
          <Star
            size={24}
            className={`transition-colors ${
              star <= (hover || value) ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill={star <= (hover || value) ? 'currentColor' : 'none'}
          />
        </button>
      ))}
    </div>
  )
}

function formatDate(dateString?: string) {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  return date.toISOString().slice(0, 10)
}

function formatDateTime(dateString?: string) {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const AXES = [
  { key: 'noteQualite', label: 'Qualité' },
  { key: 'noteDelai', label: 'Délai' },
  { key: 'notePrix', label: 'Prix' },
  { key: 'noteService', label: 'Service' },
] as const

export default function SupplierDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)

  const [operateur, setOperateur] = useState<OperateurEconomique | null>(null)
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [stats, setStats] = useState<EvaluationStats | null>(null)
  const [secteurs, setSecteurs] = useState<SecteurActivite[]>([])
  const [activeTab, setActiveTab] = useState<'info' | 'technique' | 'commerciale' | 'financiers' | 'relation' | 'evaluations' | 'historique'>('info')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const [showEvalModal, setShowEvalModal] = useState(false)
  const [evalForm, setEvalForm] = useState({ noteQualite: 0, noteDelai: 0, notePrix: 0, noteService: 0, commentaire: '' })
  const [submitting, setSubmitting] = useState(false)
  const [editingTab, setEditingTab] = useState<string | null>(null)
  const [editInfoForm, setEditInfoForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([
      apiClient.getOperateur(id).catch(() => null),
      apiClient.getEvaluationsByOperateur(id).catch(() => []),
      apiClient.getEvaluationStats(id).catch(() => null),
      apiClient.getSecteurs().catch(() => []),
    ]).then(([op, evals, st, sect]) => {
      setOperateur(op)
      setEvaluations(evals)
      setStats(st)
      setSecteurs(sect)
    }).catch(() => setError('Erreur lors du chargement')).finally(() => setIsLoading(false))
  }, [id])

  const startEditInfo = () => {
    if (!operateur) return
    setEditInfoForm({
      raisonSociale: operateur.raisonSociale || '',
      nif: operateur.nif || '',
      secteurActiviteId: operateur.secteurActiviteId ? String(operateur.secteurActiviteId) : '',
      typeFournisseur: operateur.typeFournisseur || '',
      gerant: operateur.gerant || '',
      formeJuridique: operateur.formeJuridique || '',
      dateCreationEntreprise: operateur.dateCreationEntreprise || '',
      adresse: operateur.adresse || '',
      telephone: operateur.telephone || '',
      email: operateur.email || '',
    })
    setEditingTab('info')
  }

  const saveEditInfo = async () => {
    if (!operateur) return
    try {
      setSaving(true)
      await apiClient.updateOperateur(operateur.id, {
        raisonSociale: editInfoForm.raisonSociale,
        nif: editInfoForm.nif || undefined,
        secteurActiviteId: editInfoForm.secteurActiviteId ? Number(editInfoForm.secteurActiviteId) : null,
        typeFournisseur: editInfoForm.typeFournisseur || undefined,
        gerant: editInfoForm.gerant || undefined,
        formeJuridique: editInfoForm.formeJuridique || undefined,
        dateCreationEntreprise: editInfoForm.dateCreationEntreprise || undefined,
        dateImmatriculation: operateur.dateImmatriculation,
        adresse: editInfoForm.adresse || undefined,
        telephone: editInfoForm.telephone || undefined,
        email: editInfoForm.email || undefined,
      })
      const updated = await apiClient.getOperateur(id)
      setOperateur(updated)
      setEditingTab(null)
    } catch (err) {
      setError("Erreur lors de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitEvaluation = async () => {
    if (!evalForm.noteQualite || !evalForm.noteDelai || !evalForm.notePrix || !evalForm.noteService) return
    try {
      setSubmitting(true)
      await apiClient.createEvaluation({
        operateurId: id,
        ...evalForm,
      })
      const [evals, st] = await Promise.all([
        apiClient.getEvaluationsByOperateur(id),
        apiClient.getEvaluationStats(id),
      ])
      setEvaluations(evals)
      setStats(st)
      setShowEvalModal(false)
      setEvalForm({ noteQualite: 0, noteDelai: 0, notePrix: 0, noteService: 0, commentaire: '' })
    } catch (err) {
      setError("Erreur lors de l'enregistrement")
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-[#2db34b]" />
      </div>
    )
  }

  if (!operateur) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Fournisseur non trouvé</p>
        <Link href="/suppliers" className="text-[#2db34b] hover:underline mt-2 inline-block">
          Retour à la liste
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/suppliers"
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">{operateur.raisonSociale}</h1>
            <StatutBadge statut={operateur.statutLibelle} />
            <ScoreBadge note={stats?.noteGlobaleActuelle} />
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
            <Hash size={14} /> {operateur.numeroImmatriculation}
          </p>
        </div>
      </div>

      <div className="flex gap-1 border-b overflow-x-auto">
        <button
          onClick={() => setActiveTab('info')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'info'
              ? 'border-[#2db34b] text-[#2db34b]'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Informations
        </button>
        <button
          onClick={() => setActiveTab('technique')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'technique'
              ? 'border-[#2db34b] text-[#2db34b]'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Technique
        </button>
        <button
          onClick={() => setActiveTab('commerciale')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'commerciale'
              ? 'border-[#2db34b] text-[#2db34b]'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Commerciale
        </button>
        <button
          onClick={() => setActiveTab('financiers')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'financiers'
              ? 'border-[#2db34b] text-[#2db34b]'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Financiers
        </button>
        <button
          onClick={() => setActiveTab('relation')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'relation'
              ? 'border-[#2db34b] text-[#2db34b]'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Relation Commerciales
        </button>
        <button
          onClick={() => setActiveTab('evaluations')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'evaluations'
              ? 'border-[#2db34b] text-[#2db34b]'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Évaluations {stats && stats.totalEvaluations > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-gray-100">
              {stats.totalEvaluations}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('historique')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'historique'
              ? 'border-[#2db34b] text-[#2db34b]'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Historique
        </button>
      </div>

      {activeTab === 'info' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            {editingTab === 'info' ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditingTab(null)} disabled={saving}>Annuler</Button>
                <Button onClick={saveEditInfo} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
              </div>
            ) : (
              <Button variant="outline" onClick={startEditInfo}>
                <Edit2 size={16} className="mr-1.5" /> Modifier
              </Button>
            )}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-900">Informations</p>
              {editingTab === 'info' ? (
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex gap-2 items-center">
                    <dt className="w-44 text-muted-foreground flex items-center gap-1.5 shrink-0"><Hash size={14} /> Code</dt>
                    <dd className="font-medium">{operateur.numeroImmatriculation}</dd>
                  </div>
                  <div className="flex gap-2 items-center">
                    <dt className="w-44 text-muted-foreground shrink-0">Raison sociale</dt>
                    <Input value={editInfoForm.raisonSociale} onChange={(e) => setEditInfoForm(f => ({...f, raisonSociale: e.target.value}))} disabled={saving} />
                  </div>
                  <div className="flex gap-2 items-center">
                    <dt className="w-44 text-muted-foreground shrink-0">NIF</dt>
                    <Input value={editInfoForm.nif} onChange={(e) => setEditInfoForm(f => ({...f, nif: e.target.value}))} disabled={saving} />
                  </div>
                  <div className="flex gap-2 items-center">
                    <dt className="w-44 text-muted-foreground shrink-0">Secteur d'activité</dt>
                    <Select value={editInfoForm.secteurActiviteId} onChange={(e) => setEditInfoForm(f => ({...f, secteurActiviteId: e.target.value}))} disabled={saving}>
                      <option value="">-- Sélectionner --</option>
                      {secteurs.map((s) => (
                        <option key={s.id} value={s.id}>{s.code} - {s.libelle}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex gap-2 items-center">
                    <dt className="w-44 text-muted-foreground shrink-0">Type fournisseur</dt>
                    <Select value={editInfoForm.typeFournisseur} onChange={(e) => setEditInfoForm(f => ({...f, typeFournisseur: e.target.value}))} disabled={saving}>
                      <option value="">-- Sélectionner --</option>
                      <option value="Local">Local</option>
                      <option value="International">International</option>
                      <option value="Sous-traitant">Sous-traitant</option>
                    </Select>
                  </div>
                  <div className="flex gap-2 items-center">
                    <dt className="w-44 text-muted-foreground shrink-0">Gérant</dt>
                    <Input value={editInfoForm.gerant} onChange={(e) => setEditInfoForm(f => ({...f, gerant: e.target.value}))} disabled={saving} />
                  </div>
                  <div className="flex gap-2 items-center">
                    <dt className="w-44 text-muted-foreground shrink-0">Forme juridique</dt>
                    <Input value={editInfoForm.formeJuridique} onChange={(e) => setEditInfoForm(f => ({...f, formeJuridique: e.target.value}))} disabled={saving} />
                  </div>
                  <div className="flex gap-2 items-center">
                    <dt className="w-44 text-muted-foreground shrink-0">Création entreprise</dt>
                    <Input type="date" value={editInfoForm.dateCreationEntreprise} onChange={(e) => setEditInfoForm(f => ({...f, dateCreationEntreprise: e.target.value}))} disabled={saving} />
                  </div>
                </div>
              ) : (
                <dl className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex gap-2">
                    <dt className="w-44 text-muted-foreground flex items-center gap-1.5"><Hash size={14} /> Code</dt>
                    <dd className="font-medium">{operateur.numeroImmatriculation || '—'}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-44 text-muted-foreground">Raison sociale</dt>
                    <dd className="font-medium">{operateur.raisonSociale || '—'}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-44 text-muted-foreground">NIF</dt>
                    <dd className="font-medium">{operateur.nif || '—'}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-44 text-muted-foreground">Secteur d'activité</dt>
                    <dd className="font-medium">{operateur.secteurActiviteCode ? `${operateur.secteurActiviteCode} - ` : ''}{operateur.secteurActiviteLibelle || '—'}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-44 text-muted-foreground">Date d'immatriculation</dt>
                    <dd className="font-medium">{formatDate(operateur.dateImmatriculation)}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-44 text-muted-foreground">Création entreprise</dt>
                    <dd className="font-medium">{formatDate(operateur.dateCreationEntreprise)}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-44 text-muted-foreground">Statut</dt>
                    <dd><StatutBadge statut={operateur.statutLibelle} /></dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-44 text-muted-foreground">Type fournisseur</dt>
                    <dd className="font-medium">{operateur.typeFournisseur || '—'}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-44 text-muted-foreground">Gérant</dt>
                    <dd className="font-medium">{operateur.gerant || '—'}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-44 text-muted-foreground">Forme juridique</dt>
                    <dd className="font-medium">{operateur.formeJuridique || '—'}</dd>
                  </div>
                </dl>
              )}
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-900">Contact</p>
              {editingTab === 'info' ? (
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex gap-2 items-center">
                    <dt className="w-44 text-muted-foreground flex items-center gap-1.5 shrink-0"><MapPin size={14} /> Adresse</dt>
                    <Input value={editInfoForm.adresse} onChange={(e) => setEditInfoForm(f => ({...f, adresse: e.target.value}))} disabled={saving} />
                  </div>
                  <div className="flex gap-2 items-center">
                    <dt className="w-44 text-muted-foreground flex items-center gap-1.5 shrink-0"><Phone size={14} /> Téléphone</dt>
                    <Input value={editInfoForm.telephone} onChange={(e) => setEditInfoForm(f => ({...f, telephone: e.target.value}))} disabled={saving} />
                  </div>
                  <div className="flex gap-2 items-center">
                    <dt className="w-44 text-muted-foreground flex items-center gap-1.5 shrink-0"><Mail size={14} /> Email</dt>
                    <Input value={editInfoForm.email} onChange={(e) => setEditInfoForm(f => ({...f, email: e.target.value}))} disabled={saving} />
                  </div>
                </div>
              ) : (
                <dl className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <dt className="w-44 text-muted-foreground flex items-center gap-1.5"><MapPin size={14} /> Adresse</dt>
                    <dd className="font-medium">{operateur.adresse || '—'}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-44 text-muted-foreground flex items-center gap-1.5"><Phone size={14} /> Téléphone</dt>
                    <dd className="font-medium">{operateur.telephone || '—'}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-44 text-muted-foreground flex items-center gap-1.5"><Mail size={14} /> Email</dt>
                    <dd className="font-medium">{operateur.email || '—'}</dd>
                  </div>
                </dl>
              )}
            </div>
            <div className="space-y-3 lg:col-span-2">
              <p className="text-sm font-semibold text-gray-900">Dossiers</p>
              <OperateurDocuments operateurId={operateur.id} archived={operateur.isArchived} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'evaluations' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-2xl font-bold">{stats?.totalEvaluations ?? 0}</p>
                <p className="text-xs text-muted-foreground">Évaluations</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-2xl font-bold">
                  {stats?.noteGlobaleActuelle != null ? stats.noteGlobaleActuelle.toFixed(1) : '—'}
                </p>
                <p className="text-xs text-muted-foreground">Note moyenne</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-2xl font-bold">
                  {stats?.derniereNote != null ? stats.derniereNote.toFixed(1) : '—'}
                </p>
                <p className="text-xs text-muted-foreground">Dernière note</p>
              </div>
            </div>
            <Button onClick={() => setShowEvalModal(true)}>
              <Star size={16} className="mr-1.5" /> Nouvelle évaluation
            </Button>
          </div>

          {evaluations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune évaluation pour ce fournisseur
            </div>
          ) : (
            <div className="space-y-3">
              {evaluations.map((ev) => (
                <div key={ev.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ScoreBadge note={ev.noteGlobale} />
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar size={14} /> {formatDateTime(ev.dateEvaluation)}
                      </span>
                    </div>
                    {ev.evaluateurNom && (
                      <span className="text-xs text-muted-foreground">Par {ev.evaluateurNom}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-3 text-center text-xs">
                    {AXES.map((axe) => (
                      <div key={axe.key} className="p-2 rounded bg-gray-50">
                        <p className="font-semibold text-sm">{ev[axe.key]}/5</p>
                        <p className="text-muted-foreground">{axe.label}</p>
                      </div>
                    ))}
                  </div>
                  {ev.commentaire && (
                    <p className="text-sm text-muted-foreground italic">{ev.commentaire}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>
      )}

      {activeTab === 'technique' && (
        <TechniqueSection operateurId={id} />
      )}

      {activeTab === 'commerciale' && (
        <CommercialSection operateurId={id} />
      )}

      {activeTab === 'financiers' && (
        <FinanciersSection operateurId={id} />
      )}

      {activeTab === 'relation' && (
        <RelationSection operateurId={id} />
      )}

      {activeTab === 'historique' && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">Section en cours de développement</p>
        </div>
      )}

      <Dialog open={showEvalModal} onOpenChange={setShowEvalModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle évaluation</DialogTitle>
            <DialogDescription>
              Évaluez {operateur.raisonSociale} sur les 4 axes (1 à 5 étoiles).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {AXES.map((axe) => (
              <div key={axe.key} className="flex items-center justify-between">
                <Label className="w-20">{axe.label}</Label>
                <StarRating
                  value={evalForm[axe.key]}
                  onChange={(v) => setEvalForm((f) => ({ ...f, [axe.key]: v }))}
                />
              </div>
            ))}
            <div className="space-y-2">
              <Label>Commentaire (optionnel)</Label>
              <textarea
                value={evalForm.commentaire}
                onChange={(e) => setEvalForm((f) => ({ ...f, commentaire: e.target.value }))}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm min-h-[80px]"
                placeholder="Remarques..."
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowEvalModal(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleSubmitEvaluation}
                disabled={!evalForm.noteQualite || !evalForm.noteDelai || !evalForm.notePrix || !evalForm.noteService || submitting}
              >
                {submitting ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
