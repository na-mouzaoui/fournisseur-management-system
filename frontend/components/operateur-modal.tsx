'use client'

import { useState, useEffect } from 'react'
import {
  OperateurEconomique,
  CreateOperateurRequest,
  SecteurActivite,
  Statut,
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

  useEffect(() => {
    apiClient.getSecteurs().then(setSecteurs).catch(() => setSecteurs([]))
    apiClient.getStatuts().then(setStatuts).catch(() => setStatuts([]))
  }, [])

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
      <DialogContent className="max-h-[90vh] overflow-y-auto">
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <p className="text-sm font-semibold text-[#2db34b]">
              Identification
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
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
              <div className="space-y-1.5">
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
              <div className="space-y-1.5">
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
              <div className="space-y-1.5">
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
          </div>

          <div className="space-y-4">
            <p className="text-sm font-semibold text-[#2db34b]">
              Informations commerciales
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="registreCommerce">Registre de commerce</Label>
                <Input
                  id="registreCommerce"
                  name="registreCommerce"
                  value={formData.registreCommerce}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1.5">
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
          </div>

          <div className="space-y-4">
            <p className="text-sm font-semibold text-[#2db34b]">Contact</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="adresse">Adresse</Label>
                <Input
                  id="adresse"
                  name="adresse"
                  value={formData.adresse}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1.5">
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
              <div className="space-y-1.5">
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
          </div>

          {operateur && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-[#2db34b]">
                Gestion du statut
              </p>
              <div className="space-y-1.5">
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
