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

const APPRECIATION_SCALE = [
  { min: 24, label: 'Excellent', badge: 'bg-[#2db34b] text-white' },
  { min: 16, label: 'Bon', badge: 'bg-[#2db34b]/15 text-[#2db34b]' },
  { min: 12, label: 'Satisfaisant', badge: 'bg-yellow-100 text-yellow-800' },
  { min: 8, label: 'Insatisfaisant', badge: 'bg-orange-100 text-orange-800' },
  { min: 0, label: 'Mauvais', badge: 'bg-red-100 text-red-800' },
] as const

function getAppreciation(note?: number | null) {
  if (note === undefined || note === null) return null
  return APPRECIATION_SCALE.find((s) => note >= s.min) ?? null
}

function ScoreBadge({ note }: { note?: number | null }) {
  const appreciation = getAppreciation(note)
  if (note === undefined || note === null || !appreciation) return <span className="text-muted-foreground text-sm">—</span>
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${appreciation.badge}`}>
      <Star size={12} fill="currentColor" /> {note.toFixed(1)}/24 · {appreciation.label}
    </span>
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

type EvaluationForm = {
  noteConformite: number
  noteDelai: number
  notePrixConsultation: number
  notePrixContrat: number
  noteHse: number
  noteService: number
}

const CRITERIA: {
  key: keyof EvaluationForm
  label: string
  max: number
  options: { value: number; label: string }[]
}[] = [
  {
    key: 'noteConformite',
    label: 'Conformité du Produit/Service Acheté',
    max: 5,
    options: [
      { value: 0, label: 'Non-respect des exigences techniques ayant une incidence sur la qualité du produit et service' },
      { value: 2, label: "Qualité acceptable ou non-respect partiel des Exigences Techniques, n'ayant pas une incidence sur la qualité du produit et service" },
      { value: 4, label: 'Bonne qualité (conforme aux exigences)' },
      { value: 5, label: 'Très bonne qualité (au-delà des exigences et attentes)' },
    ],
  },
  {
    key: 'noteDelai',
    label: 'Délai de livraison',
    max: 5,
    options: [
      { value: 0, label: 'Non-respect des délais' },
      { value: 2, label: "Acceptable - non-respect des délais n'ayant pas une incidence sur les délais de réalisation" },
      { value: 4, label: 'Respect des délais' },
      { value: 5, label: 'Effort exceptionnel (délais réduits)' },
    ],
  },
  {
    key: 'notePrixConsultation',
    label: 'Prix (Consultation)',
    max: 4,
    options: [
      { value: 0, label: 'Prix excessif' },
      { value: 2, label: 'Prix moyen' },
      { value: 4, label: 'Prix moins disant' },
    ],
  },
  {
    key: 'notePrixContrat',
    label: 'Prix (Contrat à commande)',
    max: 4,
    options: [
      { value: 0, label: 'Prix révisé à la hausse' },
      { value: 3, label: 'Prix maintenu' },
      { value: 4, label: 'Effort commercial / Remise' },
    ],
  },
  {
    key: 'noteHse',
    label: 'Respect des spécifications HSE',
    max: 2,
    options: [
      { value: 0, label: "Non-respect des spécifications impactant la santé sécurité et/ou l'environnement" },
      { value: 2, label: 'Respect des spécifications HSE' },
    ],
  },
  {
    key: 'noteService',
    label: 'Le Service et la Relation Client',
    max: 4,
    options: [
      { value: 0, label: 'Qualité de service médiocre' },
      { value: 2, label: 'Qualité de service moyennement satisfaisante (nombre de requêtes ≥ 3)' },
      { value: 3, label: 'Qualité de service satisfaisante (nombre de requêtes ≤ 2)' },
      { value: 4, label: 'Qualité de service excellente (nombre de requêtes = 0)' },
    ],
  },
]

const EMPTY_EVAL_FORM: EvaluationForm = {
  noteConformite: -1,
  noteDelai: -1,
  notePrixConsultation: -1,
  notePrixContrat: -1,
  noteHse: -1,
  noteService: -1,
}

function CriterionPicker({
  criterion,
  value,
  onChange,
}: {
  criterion: (typeof CRITERIA)[number]
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm font-semibold leading-snug">{criterion.label}</Label>
        <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-muted-foreground">
          {criterion.max} pts
        </span>
      </div>
      <div className="space-y-2">
        {criterion.options.map((opt) => {
          const active = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={active}
              className={`w-full flex items-start gap-3 rounded-lg border-2 px-3.5 py-2.5 text-left cursor-pointer transition-all ${
                active
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border bg-card hover:border-muted-foreground/40 hover:bg-muted/30'
              }`}
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  active ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                }`}
              >
                {active && <span className="h-2 w-2 rounded-full bg-white" />}
              </span>
              <span className="text-sm leading-snug">
                <span className={`font-bold ${active ? 'text-primary' : ''}`}>
                  {opt.value} pt{opt.value > 1 ? 's' : ''}
                </span>
                <span className="text-muted-foreground"> — {opt.label}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

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
  const [evalForm, setEvalForm] = useState<EvaluationForm>(EMPTY_EVAL_FORM)
  const [evalStep, setEvalStep] = useState(0)
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
    const incomplete = CRITERIA.some((c) => evalForm[c.key] < 0)
    if (incomplete) return
    try {
      setSubmitting(true)
      await apiClient.createEvaluation({
        operateurId: id,
        noteConformite: evalForm.noteConformite,
        noteDelai: evalForm.noteDelai,
        notePrixConsultation: evalForm.notePrixConsultation,
        notePrixContrat: evalForm.notePrixContrat,
        noteHse: evalForm.noteHse,
        noteService: evalForm.noteService,
      })
      const [evals, st] = await Promise.all([
        apiClient.getEvaluationsByOperateur(id),
        apiClient.getEvaluationStats(id),
      ])
      setEvaluations(evals)
      setStats(st)
      setShowEvalModal(false)
      setEvalStep(0)
      setEvalForm(EMPTY_EVAL_FORM)
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
                  {stats?.noteGlobaleActuelle != null ? '/24' : ''}
                </p>
                <p className="text-xs text-muted-foreground">Note moyenne</p>
                {stats?.noteGlobaleActuelle != null && (
                  <span
                    className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${getAppreciation(stats.noteGlobaleActuelle)?.badge}`}
                  >
                    {getAppreciation(stats.noteGlobaleActuelle)?.label}
                  </span>
                )}
              </div>
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-2xl font-bold">
                  {stats?.derniereNote != null ? stats.derniereNote.toFixed(1) : '—'}
                  {stats?.derniereNote != null ? '/24' : ''}
                </p>
                <p className="text-xs text-muted-foreground">Dernière note</p>
                {stats?.derniereNote != null && (
                  <span
                    className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${getAppreciation(stats.derniereNote)?.badge}`}
                  >
                    {getAppreciation(stats.derniereNote)?.label}
                  </span>
                )}
              </div>
            </div>
            <Button onClick={() => { setEvalStep(0); setShowEvalModal(true) }}>
              <Star size={16} className="mr-1.5" /> Nouvelle évaluation
            </Button>
          </div>

          <div className="rounded-lg border p-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Échelle d'appréciation
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {APPRECIATION_SCALE.map((s, i) => (
                <span
                  key={s.label}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${s.badge}`}
                >
                  {s.label}
                  {i === 0 ? ' : 24' : i === APPRECIATION_SCALE.length - 1 ? ' : < 8' : ` : ${s.min} - ${APPRECIATION_SCALE[i - 1].min - 1}`}
                </span>
              ))}
            </div>
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
                  <div className="grid grid-cols-3 gap-3 text-center text-xs">
                    {CRITERIA.map((crit) => (
                      <div key={crit.key} className="p-2 rounded bg-gray-50">
                        <p className="font-semibold text-sm">
                          {ev[crit.key]}/{crit.max}
                        </p>
                        <p className="text-muted-foreground">{crit.label}</p>
                      </div>
                    ))}
                  </div>
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
              Évaluez {operateur.raisonSociale} sur les 6 critères ({' '}
              {CRITERIA.reduce((s, c) => s + c.max, 0)} points au total).
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-1.5 mt-1">
            {CRITERIA.map((crit, i) => {
              const done = evalForm[crit.key] >= 0
              const current = i === evalStep
              return (
                <button
                  key={crit.key}
                  type="button"
                  onClick={() => setEvalStep(i)}
                  title={`${i + 1}. ${crit.label}`}
                  className={`h-2 flex-1 rounded-full transition-colors cursor-pointer ${
                    done ? 'bg-[#2db34b]' : current ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            Critère {evalStep + 1} / {CRITERIA.length} — {CRITERIA[evalStep].label}
          </p>

          <div className="mt-3 space-y-4">
            <CriterionPicker
              criterion={CRITERIA[evalStep]}
              value={evalForm[CRITERIA[evalStep].key]}
              onChange={(v) => setEvalForm((f) => ({ ...f, [CRITERIA[evalStep].key]: v }))}
            />

            {evalStep === CRITERIA.length - 1 && (() => {
              const total = CRITERIA.reduce((s, c) => s + (evalForm[c.key] >= 0 ? evalForm[c.key] : 0), 0)
              const appr = getAppreciation(total)
              return (
                <div className="rounded-lg bg-gray-50 p-3 flex items-center justify-between">
                  <span className="text-sm font-medium">Total</span>
                  <span className="flex items-center gap-2">
                    {appr && <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${appr.badge}`}>{appr.label}</span>}
                    <span className="text-lg font-bold">{total} / 24</span>
                  </span>
                </div>
              )
            })()}

            <div className="flex items-center justify-between gap-2 pt-2">
              {evalStep > 0 ? (
                <Button variant="outline" onClick={() => setEvalStep((s) => s - 1)}>
                  Précédent
                </Button>
              ) : (
                <span />
              )}
              {evalStep < CRITERIA.length - 1 ? (
                <Button
                  onClick={() => setEvalStep((s) => s + 1)}
                  disabled={evalForm[CRITERIA[evalStep].key] < 0}
                >
                  Suivant
                </Button>
              ) : (
                <Button
                  onClick={handleSubmitEvaluation}
                  disabled={CRITERIA.some((c) => evalForm[c.key] < 0) || submitting}
                >
                  {submitting ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
