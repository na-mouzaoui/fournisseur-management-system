'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Edit2 } from 'lucide-react'

interface RelationData {
  [key: string]: string
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 mt-6 first:mt-0">{children}</h3>
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-4">{children}</h4>
}

function FieldGroup({ label, value, editing, onChange }: { label: string; value: string; editing: boolean; onChange?: (v: string) => void }) {
  return (
    <div className="flex gap-2 items-center text-sm">
      <dt className="w-56 text-muted-foreground shrink-0">{label}</dt>
      {editing ? (
        <Input value={value} onChange={(e) => onChange?.(e.target.value)} className="flex-1" />
      ) : (
        <dd className="font-medium">{value || '—'}</dd>
      )}
    </div>
  )
}

function CheckboxGroup({ label, value, editing, onChange, options }: { label: string; value: string; editing: boolean; onChange?: (v: string) => void; options: string[] }) {
  const selected = value ? value.split(', ') : []
  const toggle = (opt: string) => {
    const next = selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt]
    onChange?.(next.join(', '))
  }
  return (
    <div className="space-y-2 text-sm">
      <dt className="text-muted-foreground font-medium">{label}</dt>
      {editing ? (
        <div className="flex flex-wrap gap-2">
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                selected.includes(opt) ? 'bg-[#2db34b] text-white border-[#2db34b]' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <dd className="font-medium">{value || '—'}</dd>
      )}
    </div>
  )
}

function TextareaGroup({ label, value, editing, onChange }: { label: string; value: string; editing: boolean; onChange?: (v: string) => void }) {
  return (
    <div className="space-y-2 text-sm">
      <dt className="w-56 text-muted-foreground shrink-0">{label}</dt>
      {editing ? (
        <textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      ) : (
        <dd className="font-medium">{value || '—'}</dd>
      )}
    </div>
  )
}

export default function RelationSection({ operateurId }: { operateurId: number }) {
  const [editing, setEditing] = useState(false)
  const [data, setData] = useState<RelationData>({})
  const [saving, setSaving] = useState(false)

  const STORAGE_KEY = `relation_${operateurId}`

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setData(JSON.parse(saved))
    } catch {}
  }, [STORAGE_KEY])

  const update = (key: string, value: string) => setData(d => ({ ...d, [key]: value }))

  const save = async () => {
    setSaving(true)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end pb-2">
        {editing ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>Annuler</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Edit2 size={16} className="mr-1.5" /> Modifier
          </Button>
        )}
      </div>

      <SectionTitle>1. Nature des relations commerciales</SectionTitle>

      <SubTitle>1.1. Type de relations commerciales</SubTitle>
      <div className="space-y-3">
        <CheckboxGroup label="Type de relation" value={data.typeRelation} editing={editing} onChange={v => update('typeRelation', v)} options={['Relations contractuelles', 'Relations de prestations ponctuelles', "Relations d'approvisionnement récurrentes", 'Partenariats stratégiques', 'Relations de sous-traitance', 'Conventions de services (SLA)']} />
      </div>

      <SubTitle>1.2. Durée et historique des relations</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Date de début des relations" value={data.dateDebut} editing={editing} onChange={v => update('dateDebut', v)} />
        <FieldGroup label="Durée cumulée des échanges" value={data.dureeCumulee} editing={editing} onChange={v => update('dureeCumulee', v)} />
        <FieldGroup label="Renouvellements successifs" value={data.renouvellements} editing={editing} onChange={v => update('renouvellements', v)} />
        <FieldGroup label="Antécédents" value={data.antecedents} editing={editing} onChange={v => update('antecedents', v)} />
      </div>

      <SubTitle>1.3. Champ d'intervention</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Nature des biens/services fournis" value={data.natureBiensServices} editing={editing} onChange={v => update('natureBiensServices', v)} />
        <FieldGroup label="Volume des prestations" value={data.volumePrestations} editing={editing} onChange={v => update('volumePrestations', v)} />
        <FieldGroup label="Niveau de complexité" value={data.niveauComplexite} editing={editing} onChange={v => update('niveauComplexite', v)} />
        <FieldGroup label="Interdépendance opérationnelle" value={data.interdependance} editing={editing} onChange={v => update('interdependance', v)} />
      </div>

      <SectionTitle>2. Qualité de l'exécution contractuelle</SectionTitle>

      <SubTitle>2.1. Respect des délais</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Taux de livraisons dans les délais" value={data.tauxLivraisonsDelais} editing={editing} onChange={v => update('tauxLivraisonsDelais', v)} />
        <FieldGroup label="Retards constatés et fréquence" value={data.retardsConstates} editing={editing} onChange={v => update('retardsConstates', v)} />
        <FieldGroup label="Causes des retards" value={data.causesRetards} editing={editing} onChange={v => update('causesRetards', v)} />
      </div>

      <SubTitle>2.2. Conformité des prestations</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Réactivité et mesures correctives" value={data.reactiviteCorrectives} editing={editing} onChange={v => update('reactiviteCorrectives', v)} />
        <FieldGroup label="Taux de conformité" value={data.tauxConformite} editing={editing} onChange={v => update('tauxConformite', v)} />
        <FieldGroup label="Nombre de retours/réclamations" value={data.nombreRetours} editing={editing} onChange={v => update('nombreRetours', v)} />
        <FieldGroup label="Respect des normes" value={data.respectNormes} editing={editing} onChange={v => update('respectNormes', v)} />
        <FieldGroup label="Niveau de qualité mesuré" value={data.niveauQualite} editing={editing} onChange={v => update('niveauQualite', v)} />
      </div>

      <SubTitle>2.3. Respect des obligations contractuelles</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Respect des clauses contractuelles" value={data.respectClauses} editing={editing} onChange={v => update('respectClauses', v)} />
        <FieldGroup label="Obligations spécifiques" value={data.obligationsSpecifiques} editing={editing} onChange={v => update('obligationsSpecifiques', v)} />
        <FieldGroup label="Respect des quantités et SLA" value={data.respectQuantitesSLA} editing={editing} onChange={v => update('respectQuantitesSLA', v)} />
      </div>

      <SubTitle>2.4. Capacité de continuité d'activité</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Documents administratifs" value={data.documentsAdmin} editing={editing} onChange={v => update('documentsAdmin', v)} />
        <FieldGroup label="Plan de continuité/alternative" value={data.planContinuite} editing={editing} onChange={v => update('planContinuite', v)} />
        <FieldGroup label="Gestion prévisionnelle des risques" value={data.gestionRisques} editing={editing} onChange={v => update('gestionRisques', v)} />
        <FieldGroup label="Fiabilité chaîne d'approvisionnement" value={data.fiabiliteChaine} editing={editing} onChange={v => update('fiabiliteChaine', v)} />
      </div>

      <SectionTitle>3. Qualité de la communication</SectionTitle>

      <SubTitle>3.1. Disponibilité et réactivité</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Délai moyen de réponse" value={data.delaiMoyenReponse} editing={editing} onChange={v => update('delaiMoyenReponse', v)} />
        <FieldGroup label="Réactivité en cas de problèmes" value={data.reactiviteProblemes} editing={editing} onChange={v => update('reactiviteProblemes', v)} />
        <FieldGroup label="Disponibilité en urgence" value={data.disponibiliteUrgence} editing={editing} onChange={v => update('disponibiliteUrgence', v)} />
        <FieldGroup label="Qualité des échanges" value={data.qualiteEchanges} editing={editing} onChange={v => update('qualiteEchanges', v)} />
      </div>

      <SubTitle>3.2. Courtoisie, professionnalisme et transparence</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Transparence des informations" value={data.transparenceInfos} editing={editing} onChange={v => update('transparenceInfos', v)} />
        <FieldGroup label="Attitude constructive" value={data.attitudeConstructive} editing={editing} onChange={v => update('attitudeConstructive', v)} />
        <FieldGroup label="Coopération en cas de non-conformités" value={data.cooperationNonConformites} editing={editing} onChange={v => update('cooperationNonConformites', v)} />
      </div>

      <SubTitle>3.3. Gestion des conflits</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Processus de traitement des litiges" value={data.processusLitiges} editing={editing} onChange={v => update('processusLitiges', v)} />
        <FieldGroup label="Capacité à proposer des solutions" value={data.capaciteSolutions} editing={editing} onChange={v => update('capaciteSolutions', v)} />
        <FieldGroup label="Niveau d'escalade nécessaire" value={data.niveauEscalade} editing={editing} onChange={v => update('niveauEscalade', v)} />
        <FieldGroup label="Collaboration équipes internes" value={data.collaborationEquipes} editing={editing} onChange={v => update('collaborationEquipes', v)} />
      </div>

      <SectionTitle>4. Fiabilité économique, administrative et contractuelle</SectionTitle>

      <SubTitle>4.1. Stabilité et solvabilité</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Historique financier récent" value={data.historiqueFinancier} editing={editing} onChange={v => update('historiqueFinancier', v)} />
        <FieldGroup label="Capacité à absorber les variations" value={data.capaciteAbsorber} editing={editing} onChange={v => update('capaciteAbsorber', v)} />
        <FieldGroup label="Absence d'incidents de paiement" value={data.absenceIncidents} editing={editing} onChange={v => update('absenceIncidents', v)} />
        <FieldGroup label="Transparence fiscale et sociale" value={data.transparenceFiscale} editing={editing} onChange={v => update('transparenceFiscale', v)} />
        <FieldGroup label="Absence de litiges juridiques" value={data.absenceLitiges} editing={editing} onChange={v => update('absenceLitiges', v)} />
        <FieldGroup label="Validité des documents" value={data.validiteDocuments} editing={editing} onChange={v => update('validiteDocuments', v)} />
      </div>

      <SectionTitle>5. Satisfaction des structures contractantes</SectionTitle>

      <SubTitle>5.1. Enquêtes de satisfaction</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Note de satisfaction globale" value={data.noteSatisfaction} editing={editing} onChange={v => update('noteSatisfaction', v)} />
        <FieldGroup label="Critiques récurrentes" value={data.critiquesRecurrentes} editing={editing} onChange={v => update('critiquesRecurrentes', v)} />
        <FieldGroup label="Points forts valorisés" value={data.pointsForts} editing={editing} onChange={v => update('pointsForts', v)} />
      </div>

      <SubTitle>5.2. Indicateurs de fidélisation</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Volume des achats récurrents" value={data.volumeAchats} editing={editing} onChange={v => update('volumeAchats', v)} />
        <FieldGroup label="Renouvellement de contrats" value={data.renouvellementContrats} editing={editing} onChange={v => update('renouvellementContrats', v)} />
        <FieldGroup label="Extension du périmètre d'intervention" value={data.extensionPerimetre} editing={editing} onChange={v => update('extensionPerimetre', v)} />
        <FieldGroup label="Recommandations internes" value={data.recommandationsInternes} editing={editing} onChange={v => update('recommandationsInternes', v)} />
      </div>

      <SectionTitle>6. Relations commerciales avec les tiers</SectionTitle>

      <SubTitle>6.1. Réputation commerciale</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Avis des autres clients" value={data.avisClients} editing={editing} onChange={v => update('avisClients', v)} />
        <FieldGroup label="Analyse publique" value={data.analysePublique} editing={editing} onChange={v => update('analysePublique', v)} />
        <FieldGroup label="Historique de conflits avec tiers" value={data.historiqueConflits} editing={editing} onChange={v => update('historiqueConflits', v)} />
      </div>

      <SubTitle>6.2. Relations avec ses propres fournisseurs</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Indicateurs de conformité commerciale" value={data.indicateursConformite} editing={editing} onChange={v => update('indicateursConformite', v)} />
        <FieldGroup label="Respect des délais de paiement" value={data.respectDelaisPaiement} editing={editing} onChange={v => update('respectDelaisPaiement', v)} />
        <FieldGroup label="Qualité de la communication fournisseurs" value={data.qualiteCommFournisseurs} editing={editing} onChange={v => update('qualiteCommFournisseurs', v)} />
        <FieldGroup label="Gestion éthique des relations" value={data.gestionEthique} editing={editing} onChange={v => update('gestionEthique', v)} />
        <FieldGroup label="Capacité de négociation équilibrée" value={data.capaciteNegociation} editing={editing} onChange={v => update('capaciteNegociation', v)} />
      </div>

      <SubTitle>6.3. Conformité à la législation commerciale</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Absence de pratiques déloyales" value={data.absencePratiquesDeloyales} editing={editing} onChange={v => update('absencePratiquesDeloyales', v)} />
        <FieldGroup label="Respect du droit de la concurrence" value={data.respectDroitConcurrence} editing={editing} onChange={v => update('respectDroitConcurrence', v)} />
        <FieldGroup label="Transparence dans les transactions" value={data.transparenceTransactions} editing={editing} onChange={v => update('transparenceTransactions', v)} />
      </div>

      <SectionTitle>7. Indicateurs synthétiques d'évaluation</SectionTitle>
      <div className="space-y-3">
        <FieldGroup label="Respect des délais" value={data.indRespectDelais} editing={editing} onChange={v => update('indRespectDelais', v)} />
        <FieldGroup label="Conformité des prestations" value={data.indConformitePrestations} editing={editing} onChange={v => update('indConformitePrestations', v)} />
        <FieldGroup label="Réclamation" value={data.indReclamation} editing={editing} onChange={v => update('indReclamation', v)} />
        <FieldGroup label="Réactivité" value={data.indReactivite} editing={editing} onChange={v => update('indReactivite', v)} />
        <FieldGroup label="Professionnalisme" value={data.indProfessionnalisme} editing={editing} onChange={v => update('indProfessionnalisme', v)} />
        <FieldGroup label="Gestion des litiges" value={data.indGestionLitiges} editing={editing} onChange={v => update('indGestionLitiges', v)} />
        <FieldGroup label="Respect administratif" value={data.indRespectAdmin} editing={editing} onChange={v => update('indRespectAdmin', v)} />
        <FieldGroup label="Fiabilité financière" value={data.indFiabiliteFinanciere} editing={editing} onChange={v => update('indFiabiliteFinanciere', v)} />
      </div>

      <SectionTitle>8. Analyse globale finale</SectionTitle>
      <div className="space-y-3">
        <TextareaGroup label="L'opérateur respecte-t-il régulièrement ses engagements?" value={data.analyseEngagements} editing={editing} onChange={v => update('analyseEngagements', v)} />
        <TextareaGroup label="L'exécution est-elle fiable, régulière, performante?" value={data.analyseExecution} editing={editing} onChange={v => update('analyseExecution', v)} />
        <TextareaGroup label="Les relations sont-elles constructives, professionnelles, durables?" value={data.analyseRelations} editing={editing} onChange={v => update('analyseRelations', v)} />
        <TextareaGroup label="Son comportement avec les tiers est-il éthique et conforme?" value={data.analyseComportement} editing={editing} onChange={v => update('analyseComportement', v)} />
        <TextareaGroup label="La relation commerciale représente-t-elle un faible risque?" value={data.analyseRisque} editing={editing} onChange={v => update('analyseRisque', v)} />
      </div>
    </div>
  )
}