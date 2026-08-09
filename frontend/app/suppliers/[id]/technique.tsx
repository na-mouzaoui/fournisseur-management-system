'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Edit2 } from 'lucide-react'

interface TechniqueData {
  [key: string]: string
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 mt-6 first:mt-0">{children}</h3>
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h4 className="text-sm font-medium text-gray-700 mt-4">{children}</h4>
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

function TextareaGroup({ label, value, editing, onChange }: { label: string; value: string; editing: boolean; onChange?: (v: string) => void }) {
  return (
    <div className="flex gap-2 items-start text-sm">
      <dt className="w-56 text-muted-foreground shrink-0 mt-2">{label}</dt>
      {editing ? (
        <textarea value={value} onChange={(e) => onChange?.(e.target.value)} className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm min-h-[60px]" rows={3} />
      ) : (
        <dd className="font-medium whitespace-pre-wrap">{value || '—'}</dd>
      )}
    </div>
  )
}

function CheckboxGroup({ label, options, value, editing, onChange }: { label: string; options: string[]; value: string; editing: boolean; onChange?: (v: string) => void }) {
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

export default function TechniqueSection({ operateurId }: { operateurId: number }) {
  const [editing, setEditing] = useState(false)
  const [data, setData] = useState<TechniqueData>({})
  const [saving, setSaving] = useState(false)

  const STORAGE_KEY = `technique_${operateurId}`

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

      {/* Section 1 */}
      <SectionTitle>1. Informations relatives aux moyens humains</SectionTitle>
      <SubTitle>Organisation et structure technique</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Répartition des équipes techniques" value={data.repartitionEquipes} editing={editing} onChange={v => update('repartitionEquipes', v)} />
        <FieldGroup label="Niveau d'autonomie des responsables techniques" value={data.autonomieResponsables} editing={editing} onChange={v => update('autonomieResponsables', v)} />
        <FieldGroup label="Effectif global technique" value={data.effectifGlobal} editing={editing} onChange={v => update('effectifGlobal', v)} />
        <FieldGroup label="Nombre total de techniciens" value={data.nombreTechniciens} editing={editing} onChange={v => update('nombreTechniciens', v)} />
        <FieldGroup label="Nombre total d'ingénieurs" value={data.nombreIngenieurs} editing={editing} onChange={v => update('nombreIngenieurs', v)} />
        <FieldGroup label="Ratio effectif / charge de travail" value={data.ratioEffectifCharge} editing={editing} onChange={v => update('ratioEffectifCharge', v)} />
      </div>

      <SubTitle>Disponibilité du personnel</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Fonction / spécialisation" value={data.fonctionSpecialisation} editing={editing} onChange={v => update('fonctionSpecialisation', v)} />
        <FieldGroup label="Production" value={data.production} editing={editing} onChange={v => update('production', v)} />
        <FieldGroup label="Installation" value={data.installation} editing={editing} onChange={v => update('installation', v)} />
        <FieldGroup label="Maintenance" value={data.maintenance} editing={editing} onChange={v => update('maintenance', v)} />
        <FieldGroup label="Contrôle qualité" value={data.controleQualite} editing={editing} onChange={v => update('controleQualite', v)} />
        <FieldGroup label="Autres" value={data.autresPersonnel} editing={editing} onChange={v => update('autresPersonnel', v)} />
        <CheckboxGroup label="Niveau d'autonomie" options={['Autonomie partielle', 'Autonomie étendue', 'Autonomie totale']} value={data.niveauAutonomie} editing={editing} onChange={v => update('niveauAutonomie', v)} />
      </div>

      {/* Section 2 */}
      <SectionTitle>2. Moyens matériels et équipements techniques</SectionTitle>
      <SubTitle>2.1. Liste des équipements disponibles</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Type et modèle" value={data.typeModele} editing={editing} onChange={v => update('typeModele', v)} />
        <FieldGroup label="Capacité" value={data.capacite} editing={editing} onChange={v => update('capacite', v)} />
        <FieldGroup label="Nombre d'unités" value={data.nombreUnites} editing={editing} onChange={v => update('nombreUnites', v)} />
        <FieldGroup label="Année d'acquisition" value={data.anneeAcquisition} editing={editing} onChange={v => update('anneeAcquisition', v)} />
        <FieldGroup label="État" value={data.etatEquipement} editing={editing} onChange={v => update('etatEquipement', v)} />
        <FieldGroup label="Localisation" value={data.localisationEquipement} editing={editing} onChange={v => update('localisationEquipement', v)} />
      </div>

      <SubTitle>2.2. Moyens logistiques</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Parc automobile (camions, utilitaires)" value={data.parcAutomobile} editing={editing} onChange={v => update('parcAutomobile', v)} />
        <FieldGroup label="Moyens de levage" value={data.moyensLevage} editing={editing} onChange={v => update('moyensLevage', v)} />
        <FieldGroup label="Moyens de transport spécifiques" value={data.moyensTransport} editing={editing} onChange={v => update('moyensTransport', v)} />
      </div>

      <SubTitle>2.3. Disponibilité de maintenance</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Ateliers de maintenance internes" value={data.ateliersMaintenance} editing={editing} onChange={v => update('ateliersMaintenance', v)} />
        <FieldGroup label="Contrats de maintenance préventive" value={data.contratsMaintenance} editing={editing} onChange={v => update('contratsMaintenance', v)} />
        <FieldGroup label="Rapidité d'intervention en cas de panne" value={data.rapiditeIntervention} editing={editing} onChange={v => update('rapiditeIntervention', v)} />
      </div>

      {/* Section 3 */}
      <SectionTitle>3. Capacité de production / capacité d'exécution</SectionTitle>
      <SubTitle>3.1. Capacité nominale</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Production journalière" value={data.productionJournaliere} editing={editing} onChange={v => update('productionJournaliere', v)} />
        <FieldGroup label="Production mensuelle" value={data.productionMensuelle} editing={editing} onChange={v => update('productionMensuelle', v)} />
        <FieldGroup label="Production annuelle" value={data.productionAnnuelle} editing={editing} onChange={v => update('productionAnnuelle', v)} />
      </div>

      <SubTitle>3.2. Capacité réelle (opérationnelle)</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Capacité installée vs capacité utilisée" value={data.capaciteInstalleeVsUtilisee} editing={editing} onChange={v => update('capaciteInstalleeVsUtilisee', v)} />
        <FieldGroup label="Pannes" value={data.pannes} editing={editing} onChange={v => update('pannes', v)} />
        <FieldGroup label="Maintenance" value={data.maintenanceCapacite} editing={editing} onChange={v => update('maintenanceCapacite', v)} />
        <FieldGroup label="Absentéisme" value={data.absenteisme} editing={editing} onChange={v => update('absenteisme', v)} />
        <FieldGroup label="Contraintes logistiques" value={data.contraintesLogistiques} editing={editing} onChange={v => update('contraintesLogistiques', v)} />
      </div>

      <SubTitle>3.3. Capacité de mobilisation rapide</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Charge actuelle du planning" value={data.chargePlanning} editing={editing} onChange={v => update('chargePlanning', v)} />
        <FieldGroup label="Délai de mise en place des ressources humaines" value={data.delaiMisePlaceRH} editing={editing} onChange={v => update('delaiMisePlaceRH', v)} />
        <FieldGroup label="Délai de mobilisation des équipements" value={data.delaiMobilisationEquipements} editing={editing} onChange={v => update('delaiMobilisationEquipements', v)} />
        <FieldGroup label="Capacité à gérer plusieurs projets simultanés" value={data.capaciteProjetsSimultanes} editing={editing} onChange={v => update('capaciteProjetsSimultanes', v)} />
      </div>

      {/* Section 4 */}
      <SectionTitle>4. Références techniques et expériences similaires</SectionTitle>
      <div className="space-y-3">
        <FieldGroup label="Nom du client" value={data.nomClientRef} editing={editing} onChange={v => update('nomClientRef', v)} />
        <FieldGroup label="Objet de la prestation" value={data.objetPrestation} editing={editing} onChange={v => update('objetPrestation', v)} />
        <FieldGroup label="Nature du produit" value={data.natureProduit} editing={editing} onChange={v => update('natureProduit', v)} />
        <FieldGroup label="Complexité technique" value={data.complexiteTechnique} editing={editing} onChange={v => update('complexiteTechnique', v)} />
        <FieldGroup label="Durée de réalisation" value={data.dureeRealisation} editing={editing} onChange={v => update('dureeRealisation', v)} />
        <FieldGroup label="Valeur du projet" value={data.valeurProjet} editing={editing} onChange={v => update('valeurProjet', v)} />
        <FieldGroup label="Résultats obtenus" value={data.resultatsObtenus} editing={editing} onChange={v => update('resultatsObtenus', v)} />
        <FieldGroup label="Contacts pour vérification" value={data.contactsVerification} editing={editing} onChange={v => update('contactsVerification', v)} />
      </div>

      {/* Section 5 */}
      <SectionTitle>5. Conformité technique et certifications</SectionTitle>
      <SubTitle>Certifications importantes</SubTitle>
      <div className="space-y-3">
        <CheckboxGroup label="Certifications" options={['ISO 9001', 'ISO 14001', 'ISO 45001', 'ISO 27001']} value={data.certifications} editing={editing} onChange={v => update('certifications', v)} />
      </div>

      <SubTitle>Autres exigences de conformité</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Normes industrielles sectorielles" value={data.normesIndustrielles} editing={editing} onChange={v => update('normesIndustrielles', v)} />
        <FieldGroup label="Conformité réglementaire" value={data.conformiteReglementaire} editing={editing} onChange={v => update('conformiteReglementaire', v)} />
        <FieldGroup label="Autorisations et licences professionnelles" value={data.autorisationsLicences} editing={editing} onChange={v => update('autorisationsLicences', v)} />
        <FieldGroup label="Agréments techniques" value={data.agrementsTechniques} editing={editing} onChange={v => update('agrementsTechniques', v)} />
        <FieldGroup label="Conformité aux normes nationales" value={data.conformiteNormesNationales} editing={editing} onChange={v => update('conformiteNormesNationales', v)} />
      </div>

      {/* Section 6 */}
      <SectionTitle>6. Méthodes, procédés et technologies utilisées</SectionTitle>
      <SubTitle>6.1. Procédés techniques / industriels</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Méthodes de fabrication" value={data.methodesFabrication} editing={editing} onChange={v => update('methodesFabrication', v)} />
        <FieldGroup label="Techniques d'installation" value={data.techniquesInstallation} editing={editing} onChange={v => update('techniquesInstallation', v)} />
        <FieldGroup label="Modes opératoires normalisés" value={data.modesOperatoires} editing={editing} onChange={v => update('modesOperatoires', v)} />
        <FieldGroup label="Plans d'assurance qualité (PAQ)" value={data.plansAssuranceQualite} editing={editing} onChange={v => update('plansAssuranceQualite', v)} />
        <FieldGroup label="Tests et protocoles de vérification" value={data.testsProtocoles} editing={editing} onChange={v => update('testsProtocoles', v)} />
      </div>

      <SubTitle>6.2. Niveau d'innovation</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Automatisation" value={data.automatisation} editing={editing} onChange={v => update('automatisation', v)} />
        <FieldGroup label="Digitalisation" value={data.digitalisation} editing={editing} onChange={v => update('digitalisation', v)} />
        <FieldGroup label="Utilisation de logiciels spécialisés" value={data.logicielsSpecialises} editing={editing} onChange={v => update('logicielsSpecialises', v)} />
        <FieldGroup label="Capacité R&D" value={data.capaciteRD} editing={editing} onChange={v => update('capaciteRD', v)} />
      </div>

      {/* Section 7 */}
      <SectionTitle>7. Système de gestion de la qualité et contrôle technique</SectionTitle>
      <SubTitle>7.1. Procédures qualité</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Plan Qualité Projet (PQP)" value={data.planQualiteProjet} editing={editing} onChange={v => update('planQualiteProjet', v)} />
        <FieldGroup label="Contrôles en cours de production" value={data.controlesProduction} editing={editing} onChange={v => update('controlesProduction', v)} />
        <FieldGroup label="Audits internes" value={data.auditsInternes} editing={editing} onChange={v => update('auditsInternes', v)} />
      </div>

      <SubTitle>7.2. Contrôle qualité final</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Tests" value={data.tests} editing={editing} onChange={v => update('tests', v)} />
        <FieldGroup label="Essais" value={data.essais} editing={editing} onChange={v => update('essais', v)} />
        <FieldGroup label="Rapports de conformité" value={data.rapportsConformite} editing={editing} onChange={v => update('rapportsConformite', v)} />
        <FieldGroup label="Traçabilité des produits ou prestations" value={data.tracabilite} editing={editing} onChange={v => update('tracabilite', v)} />
      </div>

      <SubTitle>7.3. Taux d'acceptation / rejet</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Historique : % de non-conformités" value={data.historiqueNonConformites} editing={editing} onChange={v => update('historiqueNonConformites', v)} />
        <FieldGroup label="Actions correctives et préventives" value={data.actionsCorrectives} editing={editing} onChange={v => update('actionsCorrectives', v)} />
      </div>

      {/* Section 8 */}
      <SectionTitle>8. Capacité financière liée à la réalisation technique</SectionTitle>
      <div className="space-y-3">
        <FieldGroup label="Capacité à acheter ou renouveler les équipements" value={data.capaciteAchatEquipements} editing={editing} onChange={v => update('capaciteAchatEquipements', v)} />
        <FieldGroup label="Trésorerie pour financer les approvisionnements techniques" value={data.tresorerieApprovisionnements} editing={editing} onChange={v => update('tresorerieApprovisionnements', v)} />
        <FieldGroup label="Assurances techniques et garanties" value={data.assurancesTechniques} editing={editing} onChange={v => update('assurancesTechniques', v)} />
      </div>

      {/* Section 9 */}
      <SectionTitle>9. Sous-traitance technique</SectionTitle>
      <div className="space-y-3">
        <FieldGroup label="Liste des sous-traitants" value={data.listeSousTraitants} editing={editing} onChange={v => update('listeSousTraitants', v)} />
        <FieldGroup label="Degré de dépendance" value={data.degresDependence} editing={editing} onChange={v => update('degresDependence', v)} />
        <FieldGroup label="Certification et qualification des partenaires" value={data.certificationPartenaires} editing={editing} onChange={v => update('certificationPartenaires', v)} />
        <FieldGroup label="Garanties contractuelles" value={data.garantiesContractuelles} editing={editing} onChange={v => update('garantiesContractuelles', v)} />
        <CheckboxGroup label="Type" options={['Interne', 'Sous-traitant certifié']} value={data.typeSousTraitance} editing={editing} onChange={v => update('typeSousTraitance', v)} />
      </div>

      {/* Section 10 */}
      <SectionTitle>10. Indicateurs techniques d'évaluation</SectionTitle>

      <SubTitle>Taux d'utilisation des équipements</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Indicateur — Taux d'utilisation des équipements" value={data.indicateurUtilisationEquipements} editing={editing} onChange={v => update('indicateurUtilisationEquipements', v)} />
        <FieldGroup label="Formule — Taux d'utilisation des équipements" value={data.formuleUtilisationEquipements} editing={editing} onChange={v => update('formuleUtilisationEquipements', v)} />
        <FieldGroup label="Norme — Taux d'utilisation des équipements" value={data.normeUtilisationEquipements} editing={editing} onChange={v => update('normeUtilisationEquipements', v)} />
        <FieldGroup label="Interprétation — Taux d'utilisation des équipements" value={data.interpretationUtilisationEquipements} editing={editing} onChange={v => update('interpretationUtilisationEquipements', v)} />
      </div>

      <SubTitle>Disponibilité des équipements</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Indicateur — Disponibilité des équipements" value={data.indicateurDisponibiliteEquipements} editing={editing} onChange={v => update('indicateurDisponibiliteEquipements', v)} />
        <FieldGroup label="Formule — Disponibilité des équipements" value={data.formuleDisponibiliteEquipements} editing={editing} onChange={v => update('formuleDisponibiliteEquipements', v)} />
        <FieldGroup label="Norme — Disponibilité des équipements" value={data.normeDisponibiliteEquipements} editing={editing} onChange={v => update('normeDisponibiliteEquipements', v)} />
        <FieldGroup label="Interprétation — Disponibilité des équipements" value={data.interpretationDisponibiliteEquipements} editing={editing} onChange={v => update('interpretationDisponibiliteEquipements', v)} />
      </div>

      <SubTitle>Respect des délais techniques</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Indicateur — Respect des délais techniques" value={data.indicateurRespectDelais} editing={editing} onChange={v => update('indicateurRespectDelais', v)} />
        <FieldGroup label="Formule — Respect des délais techniques" value={data.formuleRespectDelais} editing={editing} onChange={v => update('formuleRespectDelais', v)} />
        <FieldGroup label="Norme — Respect des délais techniques" value={data.normeRespectDelais} editing={editing} onChange={v => update('normeRespectDelais', v)} />
        <FieldGroup label="Interprétation — Respect des délais techniques" value={data.interpretationRespectDelais} editing={editing} onChange={v => update('interpretationRespectDelais', v)} />
      </div>

      <SubTitle>Taux de non-conformité</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Indicateur — Taux de non-conformité" value={data.indicateurNonConformite} editing={editing} onChange={v => update('indicateurNonConformite', v)} />
        <FieldGroup label="Formule — Taux de non-conformité" value={data.formuleNonConformite} editing={editing} onChange={v => update('formuleNonConformite', v)} />
        <FieldGroup label="Norme — Taux de non-conformité" value={data.normeNonConformite} editing={editing} onChange={v => update('normeNonConformite', v)} />
        <FieldGroup label="Interprétation — Taux de non-conformité" value={data.interpretationNonConformite} editing={editing} onChange={v => update('interpretationNonConformite', v)} />
      </div>

      <SubTitle>Capacité de mobilisation</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Indicateur — Capacité de mobilisation" value={data.indicateurMobilisation} editing={editing} onChange={v => update('indicateurMobilisation', v)} />
        <FieldGroup label="Formule — Capacité de mobilisation" value={data.formuleMobilisation} editing={editing} onChange={v => update('formuleMobilisation', v)} />
        <FieldGroup label="Norme — Capacité de mobilisation" value={data.normeMobilisation} editing={editing} onChange={v => update('normeMobilisation', v)} />
        <FieldGroup label="Interprétation — Capacité de mobilisation" value={data.interpretationMobilisation} editing={editing} onChange={v => update('interpretationMobilisation', v)} />
      </div>
    </div>
  )
}
