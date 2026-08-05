'use client'

import { useState, useEffect } from 'react'
import { User, Role, getFullName } from '@/lib/types'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Pencil, Trash2, Plus, KeyRound } from 'lucide-react'

const getRoleLabel = (role: string) => {
  return role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Agent'
}

const getRoleBadgeClass = (role: string) => {
  switch ((role || '').trim().toLowerCase()) {
    case 'admin':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-green-100 text-green-800'
  }
}

const EMPTY_FORM = {
  nom: '',
  prenom: '',
  identifiant: '',
  email: '',
  password: '',
  roleId: '',
  statut: 'actif',
}

export default function AdminUserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({ ...EMPTY_FORM })
  const { toast } = useToast()

  const fetchUsers = async () => {
    try {
      const data = await apiClient.getUtilisateurs()
      setUsers(data || [])
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les utilisateurs',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const data = await apiClient.getRoles()
      setRoles(data || [])
    } catch (error) {
      console.error('Impossible de charger les rôles', error)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [])

  const resetForm = () => {
    setFormData({
      ...EMPTY_FORM,
      roleId: roles[0] ? String(roles[0].id) : '',
    })
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setFormData({
      nom: user.nom,
      prenom: user.prenom || '',
      identifiant: user.identifiant,
      email: user.email || '',
      password: '',
      roleId: user.roleId ? String(user.roleId) : '',
      statut: user.statut || 'actif',
    })
    setIsEditOpen(true)
  }

  const handleCreate = async () => {
    try {
      await apiClient.createUtilisateur({
        nom: formData.nom,
        prenom: formData.prenom || undefined,
        identifiant: formData.identifiant,
        email: formData.email || undefined,
        password: formData.password || '123456789',
        roleId: Number(formData.roleId),
      })
      toast({ title: 'Succès', description: 'Utilisateur créé avec succès' })
      setIsCreateOpen(false)
      resetForm()
      fetchUsers()
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : "Échec de la création",
        variant: 'destructive',
      })
    }
  }

  const handleUpdate = async () => {
    if (!selectedUser) return
    try {
      await apiClient.updateUtilisateur(selectedUser.id, {
        nom: formData.nom,
        prenom: formData.prenom || undefined,
        email: formData.email || undefined,
        roleId: formData.roleId ? Number(formData.roleId) : undefined,
        statut: formData.statut,
      })
      toast({ title: 'Succès', description: 'Utilisateur modifié avec succès' })
      setIsEditOpen(false)
      setSelectedUser(null)
      resetForm()
      fetchUsers()
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Échec de la modification',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (userId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return
    try {
      await apiClient.deleteUtilisateur(userId)
      toast({ title: 'Succès', description: 'Utilisateur supprimé avec succès' })
      fetchUsers()
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Échec de la suppression',
        variant: 'destructive',
      })
    }
  }

  const handleResetPassword = async (userId: number, userEmail: string) => {
    if (!confirm(`Réinitialiser le mot de passe de ${userEmail} à "123456789" ?`)) return
    try {
      await apiClient.resetPassword(userId, '123456789')
      toast({ title: 'Succès', description: 'Mot de passe réinitialisé à 123456789' })
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Échec de la réinitialisation',
        variant: 'destructive',
      })
    }
  }

  if (isLoading && users.length === 0) {
    return <div className="text-center py-8">Chargement...</div>
  }

  const formFields = (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">Prénom</Label>
          <Input
            id="firstName"
            value={formData.prenom}
            onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Nom *</Label>
          <Input
            id="lastName"
            value={formData.nom}
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="identifiant">Identifiant *</Label>
        <Input
          id="identifiant"
          value={formData.identifiant}
          onChange={(e) => setFormData({ ...formData, identifiant: e.target.value })}
          required
          disabled={!!selectedUser}
        />
      </div>
      {!selectedUser && (
        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Laisser vide pour 123456789"
          />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="roleId">Rôle *</Label>
        <Select
          id="roleId"
          value={formData.roleId}
          onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
        >
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {getRoleLabel(role.libelle)}
            </option>
          ))}
        </Select>
      </div>
      {selectedUser && (
        <div className="space-y-2">
          <Label htmlFor="statut">Statut</Label>
          <Select
            id="statut"
            value={formData.statut}
            onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
          >
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
          </Select>
        </div>
      )}
    </>
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetForm() }}>
          <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvel utilisateur
            </Button>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer un utilisateur</DialogTitle>
              <DialogDescription>
                Remplissez tous les champs pour créer un nouveau compte
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">{formFields}</div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm() }}>
                Annuler
              </Button>
              <Button onClick={handleCreate}>Créer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table className="[&_th]:border-r [&_th]:border-border [&_td]:border-r [&_td]:border-border [&_th:last-child]:border-r-0 [&_td:last-child]:border-r-0">
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Identifiant</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{getFullName(user)}</TableCell>
                <TableCell>{user.email || '—'}</TableCell>
                <TableCell>{user.identifiant}</TableCell>
                <TableCell>
                  <Badge className={getRoleBadgeClass(user.role)}>{getRoleLabel(user.role)}</Badge>
                </TableCell>
                <TableCell>
                  {user.statut === 'actif' ? (
                    <Badge variant="secondary">Actif</Badge>
                  ) : (
                    <Badge variant="destructive">Inactif</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(user)}
                      title="Modifier"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleResetPassword(user.id, user.email || user.identifiant)}
                      title="Réinitialiser le mot de passe"
                    >
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(user.id)}
                      title="Supprimer"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if (!open) { setSelectedUser(null); resetForm() } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'utilisateur
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">{formFields}</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditOpen(false); setSelectedUser(null); resetForm() }}>
              Annuler
            </Button>
            <Button onClick={handleUpdate}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
