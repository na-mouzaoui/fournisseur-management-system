'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Edit2 } from 'lucide-react'

interface CommercialData {
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

export default function CommercialSection({ operateurId }: { operateurId: number }) {
  const [editing, setEditing] = useState(false)
  const [data, setData] = useState<CommercialData>({})
  const [saving, setSaving] = useState(false)

  const STORAGE_KEY = `commercial_${operateurId}`

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

      <SectionTitle>1. Identité de marque</SectionTitle>
      <SubTitle>1.1. Éléments fondamentaux</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Nom commercial" value={data.nomCommercial} editing={editing} onChange={v => update('nomCommercial', v)} />
        <FieldGroup label="Logo" value={data.logo} editing={editing} onChange={v => update('logo', v)} />
        <FieldGroup label="Charte graphique" value={data.charteGraphique} editing={editing} onChange={v => update('charteGraphique', v)} />
        <FieldGroup label="Slogan et messages clés" value={data.slogan} editing={editing} onChange={v => update('slogan', v)} />
        <FieldGroup label="Valeurs défendues" value={data.valeurs} editing={editing} onChange={v => update('valeurs', v)} />
        <FieldGroup label="Promesse de marque" value={data.promesseMarque} editing={editing} onChange={v => update('promesseMarque', v)} />
        <FieldGroup label="Univers de marque" value={data.universMarque} editing={editing} onChange={v => update('universMarque', v)} />
        <CheckboxGroup label="Piliers de marque" value={data.piliersMarque} editing={editing} onChange={v => update('piliersMarque', v)} options={['Innovation', 'Qualité', 'Proximité', 'Prix', 'Rapidité', 'Fiabilité', 'Economie', 'Expertise']} />
        <FieldGroup label="Codes visuels" value={data.codesVisuels} editing={editing} onChange={v => update('codesVisuels', v)} />
        <FieldGroup label="Couleurs" value={data.couleurs} editing={editing} onChange={v => update('couleurs', v)} />
        <FieldGroup label="Style de communication" value={data.styleCommunication} editing={editing} onChange={v => update('styleCommunication', v)} />
      </div>

      <SubTitle>1.2. Histoire et ADN commercial</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Ancienneté de l'opérateur" value={data.anciennete} editing={editing} onChange={v => update('anciennete', v)} />
        <FieldGroup label="Évolution du positionnement" value={data.evolutionPositionnement} editing={editing} onChange={v => update('evolutionPositionnement', v)} />
        <FieldGroup label="Image voulue vs image perçue" value={data.imageVouluePercue} editing={editing} onChange={v => update('imageVouluePercue', v)} />
      </div>

      <SectionTitle>2. Positionnement commercial</SectionTitle>
      <SubTitle>2.1. Positionnement sur le marché</SubTitle>
      <div className="space-y-3">
        <CheckboxGroup label="Segment(s) ciblé(s)" value={data.segmentsCibles} editing={editing} onChange={v => update('segmentsCibles', v)} options={['B2B', 'B2C', 'B2G']} />
        <CheckboxGroup label="Type de clientèle" value={data.typeClientele} editing={editing} onChange={v => update('typeClientele', v)} options={['Entreprises stratégiques', 'Grands Comptes', 'Premium', 'Economique', 'Standard']} />
      </div>

      <SubTitle>2.2. Proposition de valeur</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Positionnement prix" value={data.positionnementPrix} editing={editing} onChange={v => update('positionnementPrix', v)} />
        <FieldGroup label="Positionnement produit/service" value={data.positionnementProduit} editing={editing} onChange={v => update('positionnementProduit', v)} />
        <FieldGroup label="Différenciation commerciale" value={data.differentiation} editing={editing} onChange={v => update('differentiation', v)} />
        <FieldGroup label="Avantages compétitifs clés" value={data.avantagesCompetitifs} editing={editing} onChange={v => update('avantagesCompetitifs', v)} />
        <FieldGroup label="Solutions innovantes ou exclusives" value={data.solutionsInnovantes} editing={editing} onChange={v => update('solutionsInnovantes', v)} />
      </div>

      <SectionTitle>3. Mix commercial (4P)</SectionTitle>
      <SubTitle>3.1. Produit / Service</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Gamme proposée" value={data.gamme} editing={editing} onChange={v => update('gamme', v)} />
        <FieldGroup label="Niveau d'innovation" value={data.niveauInnovation} editing={editing} onChange={v => update('niveauInnovation', v)} />
        <FieldGroup label="Certifications ou labels" value={data.certifications} editing={editing} onChange={v => update('certifications', v)} />
        <FieldGroup label="Garantie et SAV" value={data.garantieSAV} editing={editing} onChange={v => update('garantieSAV', v)} />
        <CheckboxGroup label="Positionnement produit" value={data.positionnementProduitDetail} editing={editing} onChange={v => update('positionnementProduitDetail', v)} options={['Adapté', 'Qualité supérieure', 'Innovation technologique', 'Simplicité', 'Durabilité', 'Diversité', 'Profondeur', 'Nouveautés']} />
      </div>

      <SubTitle>3.2. Prix</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Politique tarifaire" value={data.politiqueTarifaire} editing={editing} onChange={v => update('politiqueTarifaire', v)} />
        <FieldGroup label="Conditions commerciales" value={data.conditionsCommerciales} editing={editing} onChange={v => update('conditionsCommerciales', v)} />
        <FieldGroup label="Stratégie de marge" value={data.strategieMarge} editing={editing} onChange={v => update('strategieMarge', v)} />
        <CheckboxGroup label="Type de tarification" value={data.typeTarification} editing={editing} onChange={v => update('typeTarification', v)} options={['Fixe', 'Flexible', 'Discount', 'Bundle']} />
        <CheckboxGroup label="Avantages commerciaux" value={data.avantagesCommerciaux} editing={editing} onChange={v => update('avantagesCommerciaux', v)} options={['Remises', 'Ristournes', 'Crédits', 'Délais']} />
      </div>

      <SubTitle>3.3. Distribution (Place)</SubTitle>
      <div className="space-y-3">
        <CheckboxGroup label="Canaux de distribution" value={data.canauxDistribution} editing={editing} onChange={v => update('canauxDistribution', v)} options={['Direct', 'Distributeurs', 'Plateformes']} />
        <FieldGroup label="Réseau de vente" value={data.reseauVente} editing={editing} onChange={v => update('reseauVente', v)} />
        <FieldGroup label="Logistique" value={data.logistique} editing={editing} onChange={v => update('logistique', v)} />
        <CheckboxGroup label="Zone géographique" value={data.zoneGeographique} editing={editing} onChange={v => update('zoneGeographique', v)} options={['Local', 'Régional', 'National']} />
        <FieldGroup label="Délais de livraison" value={data.delaisLivraison} editing={editing} onChange={v => update('delaisLivraison', v)} />
        <FieldGroup label="Capacité zones éloignées" value={data.capaciteZonesEloignees} editing={editing} onChange={v => update('capaciteZonesEloignees', v)} />
      </div>

      <SubTitle>3.4. Communication (Promotion)</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Qualité du service client" value={data.qualiteServiceClient} editing={editing} onChange={v => update('qualiteServiceClient', v)} />
        <FieldGroup label="Plan de communication annuel" value={data.planCommunication} editing={editing} onChange={v => update('planCommunication', v)} />
        <FieldGroup label="Publicité" value={data.publicite} editing={editing} onChange={v => update('publicite', v)} />
        <FieldGroup label="Marketing digital" value={data.marketingDigital} editing={editing} onChange={v => update('marketingDigital', v)} />
        <FieldGroup label="Relations publiques" value={data.relationsPubliques} editing={editing} onChange={v => update('relationsPubliques', v)} />
        <CheckboxGroup label="Médias utilisés" value={data.medias} editing={editing} onChange={v => update('medias', v)} options={['Réseaux sociaux', 'Site web', 'Newsletters', 'Evénements', 'Sponsoring', 'Salons professionnels']} />
        <FieldGroup label="Messages diffusés" value={data.messages} editing={editing} onChange={v => update('messages', v)} />
      </div>

      <SectionTitle>4. Réputation et concurrence</SectionTitle>
      <SubTitle>4.1. Réputation commerciale</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Notoriété sur le marché" value={data.notoriete} editing={editing} onChange={v => update('notoriete', v)} />
        <FieldGroup label="Perception des clients" value={data.perceptionClients} editing={editing} onChange={v => update('perceptionClients', v)} />
        <FieldGroup label="Avis et commentaires en ligne" value={data.avisEnLigne} editing={editing} onChange={v => update('avisEnLigne', v)} />
      </div>

      <SubTitle>4.2. Positionnement concurrentiel</SubTitle>
      <div className="space-y-3">
        <CheckboxGroup label="Comparaison" value={data.comparaisonConcurrents} editing={editing} onChange={v => update('comparaisonConcurrents', v)} options={['Qualité', 'Prix', 'Innovation']} />
        <FieldGroup label="Points forts" value={data.pointsForts} editing={editing} onChange={v => update('pointsForts', v)} />
        <FieldGroup label="Points faibles" value={data.pointsFaibles} editing={editing} onChange={v => update('pointsFaibles', v)} />
      </div>

      <SubTitle>4.3. Indicateurs de confiance</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Taux de fidélisation" value={data.tauxFidelisation} editing={editing} onChange={v => update('tauxFidelisation', v)} />
        <FieldGroup label="Références clients" value={data.referencesClients} editing={editing} onChange={v => update('referencesClients', v)} />
        <FieldGroup label="Certifications reconnues" value={data.certificationsReconnues} editing={editing} onChange={v => update('certificationsReconnues', v)} />
        <FieldGroup label="Ancienneté des relations" value={data.ancienneteRelations} editing={editing} onChange={v => update('ancienneteRelations', v)} />
      </div>

      <SectionTitle>5. Relation client et fidélisation</SectionTitle>
      <SubTitle>5.1. Méthodes de prospection</SubTitle>
      <div className="space-y-3">
        <CheckboxGroup label="Méthodes" value={data.methodesProspection} editing={editing} onChange={v => update('methodesProspection', v)} options={['Prospection terrain', 'Digitale', 'Réseaux professionnels']} />
      </div>

      <SubTitle>5.2. Gestion de la relation client</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Suivi des dossiers et réclamations" value={data.suiviDossiers} editing={editing} onChange={v => update('suiviDossiers', v)} />
        <FieldGroup label="Outils CRM utilisés" value={data.outilsCRM} editing={editing} onChange={v => update('outilsCRM', v)} />
        <FieldGroup label="Délais de réponse" value={data.delaisReponse} editing={editing} onChange={v => update('delaisReponse', v)} />
        <FieldGroup label="Personnalisation de la communication" value={data.personnalisation} editing={editing} onChange={v => update('personnalisation', v)} />
      </div>

      <SubTitle>5.3. Fidélisation</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Programmes spécifiques" value={data.programmesFidelisation} editing={editing} onChange={v => update('programmesFidelisation', v)} />
        <CheckboxGroup label="Types de contrats" value={data.typesContrats} editing={editing} onChange={v => update('typesContrats', v)} options={['Contrats annuels', 'Maintenance', 'Remises fidélité']} />
        <FieldGroup label="Taux de rétention client" value={data.tauxRetention} editing={editing} onChange={v => update('tauxRetention', v)} />
        <FieldGroup label="Actions d'anticipation des besoins" value={data.anticipationBesoins} editing={editing} onChange={v => update('anticipationBesoins', v)} />
      </div>

      <SectionTitle>6. Développement et innovation</SectionTitle>
      <SubTitle>6.1. Développement des marchés</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Nouveaux segments visés" value={data.nouveauxSegments} editing={editing} onChange={v => update('nouveauxSegments', v)} />
        <FieldGroup label="Zones géographiques ciblées" value={data.zonesCiblees} editing={editing} onChange={v => update('zonesCiblees', v)} />
        <FieldGroup label="Partenariats commerciaux" value={data.partenariats} editing={editing} onChange={v => update('partenariats', v)} />
      </div>

      <SubTitle>6.2. Stratégie d'innovation commerciale</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Nouveaux produits ou services prévus" value={data.nouveauxProduits} editing={editing} onChange={v => update('nouveauxProduits', v)} />
        <FieldGroup label="Digitalisation de la gestion commerciale" value={data.digitalisation} editing={editing} onChange={v => update('digitalisation', v)} />
        <FieldGroup label="Modernisation des outils marketing" value={data.modernisationOutils} editing={editing} onChange={v => update('modernisationOutils', v)} />
      </div>

      <SectionTitle>7. Indicateurs de performance</SectionTitle>
      <SubTitle>7.1. Données de ventes</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Chiffre d'affaires commercial par segment" value={data.caCommercial} editing={editing} onChange={v => update('caCommercial', v)} />
        <FieldGroup label="Taux de croissance annuel" value={data.tauxCroissance} editing={editing} onChange={v => update('tauxCroissance', v)} />
        <FieldGroup label="Volume des ventes" value={data.volumeVentes} editing={editing} onChange={v => update('volumeVentes', v)} />
      </div>

      <SubTitle>7.2. Indicateurs de performance client</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Taux de conversion (prospects → clients)" value={data.tauxConversion} editing={editing} onChange={v => update('tauxConversion', v)} />
        <FieldGroup label="Délai moyen de conclusion" value={data.delaiConclusion} editing={editing} onChange={v => update('delaiConclusion', v)} />
        <FieldGroup label="Indice de satisfaction (NPS)" value={data.nps} editing={editing} onChange={v => update('nps', v)} />
      </div>

      <SubTitle>7.3. Part de marché</SubTitle>
      <div className="space-y-3">
        <FieldGroup label="Part de marché estimée par secteur" value={data.partMarche} editing={editing} onChange={v => update('partMarche', v)} />
        <FieldGroup label="Évolution par rapport aux concurrents" value={data.evolutionConcurrence} editing={editing} onChange={v => update('evolutionConcurrence', v)} />
      </div>

      <SectionTitle>8. Cohérence de la marque</SectionTitle>
      <div className="space-y-3">
        <FieldGroup label="Cohérence communication / actions / promesse" value={data.coherenceMarque} editing={editing} onChange={v => update('coherenceMarque', v)} />
        <FieldGroup label="Alignement discours marketing / réalité" value={data.alignementMarketing} editing={editing} onChange={v => update('alignementMarketing', v)} />
        <FieldGroup label="Respect des engagements commerciaux" value={data.respectEngagements} editing={editing} onChange={v => update('respectEngagements', v)} />
      </div>
    </div>
  )
}
