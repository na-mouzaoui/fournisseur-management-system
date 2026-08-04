'use client'

import { useState, useEffect } from 'react'
import { User, Role, CreateUtilisateurRequest, UpdateUtilisateurRequest } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'

interface UserModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  user?: User
  roles?: Role[]
  isLoading?: boolean
}

interface UserForm {
  nom: string
  prenom: string
  identifiant: string
  email: string
  roleId: string
  statut: string
}

export default function UserModal({
  isOpen,
  onClose,
  onSubmit,
  user,
  roles = [],
  isLoading = false,
}: UserModalProps) {
  const [formData, setFormData] = useState<UserForm>({
    nom: '',
    prenom: '',
    identifiant: '',
    email: '',
    roleId: '',
    statut: 'actif',
  })

  useEffect(() => {
    if (user) {
      setFormData({
        nom: user.nom,
        prenom: user.prenom || '',
        identifiant: user.identifiant,
        email: user.email || '',
        roleId: user.roleId ? String(user.roleId) : '',
        statut: user.statut || 'actif',
      })
    } else {
      setFormData({
        nom: '',
        prenom: '',
        identifiant: '',
        email: '',
        roleId: roles[0] ? String(roles[0].id) : '',
        statut: 'actif',
      })
    }
  }, [user, isOpen, roles])

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
    if (user) {
      const payload: UpdateUtilisateurRequest = {
        nom: formData.nom,
        prenom: formData.prenom || undefined,
        email: formData.email || undefined,
        roleId: formData.roleId ? Number(formData.roleId) : undefined,
        statut: formData.statut,
      }
      await onSubmit(payload)
    } else {
      const payload: CreateUtilisateurRequest = {
        nom: formData.nom,
        prenom: formData.prenom || undefined,
        identifiant: formData.identifiant,
        email: formData.email || undefined,
        roleId: Number(formData.roleId),
      }
      await onSubmit(payload)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {user ? "Modifier l'utilisateur" : 'Ajouter un utilisateur'}
          </DialogTitle>
          <DialogDescription>
            {user
              ? "Modifiez les informations de l'utilisateur"
              : 'Ajoutez un nouvel utilisateur au système'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <p className="text-sm font-semibold text-[#2db34b]">
              Identité
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="nom">
                  Nom <span className="text-[#e82c2a]">*</span>
                </Label>
                <Input
                  id="nom"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prenom">Prénom</Label>
                <Input
                  id="prenom"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-semibold text-[#2db34b]">Compte</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="identifiant">
                  Identifiant <span className="text-[#e82c2a]">*</span>
                </Label>
                <Input
                  id="identifiant"
                  name="identifiant"
                  value={formData.identifiant}
                  onChange={handleChange}
                  required={!user}
                  disabled={isLoading || !!user}
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
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="roleId">
                  Rôle <span className="text-[#e82c2a]">*</span>
                </Label>
                <Select
                  id="roleId"
                  name="roleId"
                  value={formData.roleId}
                  onChange={handleChange}
                  disabled={isLoading}
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.libelle}
                    </option>
                  ))}
                </Select>
              </div>

              {user && (
                <div className="space-y-1.5">
                  <Label htmlFor="statut">Statut</Label>
                  <Select
                    id="statut"
                    name="statut"
                    value={formData.statut}
                    onChange={handleChange}
                    disabled={isLoading}
                  >
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                  </Select>
                </div>
              )}
            </div>

            {!user && (
              <div className="text-xs p-3 bg-[#2db34b]/10 border border-[#2db34b]/20 rounded-md text-gray-700">
                Le mot de passe par défaut du nouvel utilisateur est{' '}
                <span className="font-bold">123456789</span>. Il pourra le
                modifier après sa première connexion.
              </div>
            )}
          </div>

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
