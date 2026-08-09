'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Edit2 } from 'lucide-react'

interface FinancialData {
  [key: string]: string
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 mt-6 first:mt-0">{children}</h3>
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

export default function FinanciersSection({ operateurId }: { operateurId: number }) {
  const [editing, setEditing] = useState(false)
  const [data, setData] = useState<FinancialData>({})
  const [saving, setSaving] = useState(false)

  const STORAGE_KEY = `financiers_${operateurId}`

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

      <SectionTitle>Informations bancaires</SectionTitle>
      <div className="space-y-3">
        <FieldGroup label="Banque domiciliatrice" value={data.banqueDomiciliatrice} editing={editing} onChange={v => update('banqueDomiciliatrice', v)} />
        <FieldGroup label="Références bancaires" value={data.referencesBancaires} editing={editing} onChange={v => update('referencesBancaires', v)} />
        <FieldGroup label="RIB" value={data.rib} editing={editing} onChange={v => update('rib', v)} />
        <FieldGroup label="Découvert autorisé / lignes de crédit" value={data.decouvertAutorise} editing={editing} onChange={v => update('decouvertAutorise', v)} />
      </div>

      <SectionTitle>Résultats financiers</SectionTitle>
      <div className="space-y-3">
        <FieldGroup label="Chiffre d'affaires annuel" value={data.chiffreAffaires} editing={editing} onChange={v => update('chiffreAffaires', v)} />
        <FieldGroup label="Compte de résultat" value={data.compteResultat} editing={editing} onChange={v => update('compteResultat', v)} />
        <FieldGroup label="Résultat net" value={data.resultatNet} editing={editing} onChange={v => update('resultatNet', v)} />
        <FieldGroup label="Bilan comptable" value={data.bilanComptable} editing={editing} onChange={v => update('bilanComptable', v)} />
      </div>

      <SectionTitle>Capitaux propres et marges</SectionTitle>
      <div className="space-y-3">
        <FieldGroup label="Fonds propres" value={data.fondsPropres} editing={editing} onChange={v => update('fondsPropres', v)} />
        <FieldGroup label="Marge brute" value={data.margeBrute} editing={editing} onChange={v => update('margeBrute', v)} />
        <FieldGroup label="Marge nette" value={data.margeNette} editing={editing} onChange={v => update('margeNette', v)} />
      </div>

      <SectionTitle>Rentabilité et endettement</SectionTitle>
      <div className="space-y-3">
        <FieldGroup label="Rentabilité économique (ROA)" value={data.roa} editing={editing} onChange={v => update('roa', v)} />
        <FieldGroup label="Rentabilité financière (ROE)" value={data.roe} editing={editing} onChange={v => update('roe', v)} />
        <FieldGroup label="Autonomie financière" value={data.autonomieFinanciere} editing={editing} onChange={v => update('autonomieFinanciere', v)} />
        <FieldGroup label="Endettement global" value={data.endettementGlobal} editing={editing} onChange={v => update('endettementGlobal', v)} />
        <FieldGroup label="Capacité de remboursement" value={data.capaciteRemboursement} editing={editing} onChange={v => update('capaciteRemboursement', v)} />
      </div>

      <SectionTitle>Gestion opérationnelle</SectionTitle>
      <div className="space-y-3">
        <FieldGroup label="Rotation des stocks" value={data.rotationStocks} editing={editing} onChange={v => update('rotationStocks', v)} />
        <FieldGroup label="Délai moyen de paiement clients" value={data.delaiPaiementClients} editing={editing} onChange={v => update('delaiPaiementClients', v)} />
        <FieldGroup label="Délai moyen de paiement fournisseurs" value={data.delaiPaiementFournisseurs} editing={editing} onChange={v => update('delaiPaiementFournisseurs', v)} />
      </div>

      <SectionTitle>Indicateurs de performance</SectionTitle>
      <div className="space-y-3">
        <FieldGroup label="Valeur ajoutée" value={data.valeurAjoutee} editing={editing} onChange={v => update('valeurAjoutee', v)} />
        <FieldGroup label="EBITDA" value={data.ebitda} editing={editing} onChange={v => update('ebitda', v)} />
        <FieldGroup label="EBE" value={data.ebe} editing={editing} onChange={v => update('ebe', v)} />
        <FieldGroup label="Taux de marge d'EBE" value={data.tauxMargeEBE} editing={editing} onChange={v => update('tauxMargeEBE', v)} />
        <FieldGroup label="Free Cash Flow" value={data.freeCashFlow} editing={editing} onChange={v => update('freeCashFlow', v)} />
      </div>
    </div>
  )
}
