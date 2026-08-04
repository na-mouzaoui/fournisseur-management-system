'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { User, Role, getFullName } from '@/lib/types'
import { apiClient } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import { Plus, Trash2, Edit2, RotateCcw } from 'lucide-react'
import UserModal from './user-modal'

export default function UsersTab() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const loadUsers = async () => {
    try {
      setIsLoading(true)
      const data = await apiClient.getUtilisateurs()
      setUsers(data || [])
    } catch (err) {
      setError('Erreur lors du chargement des utilisateurs')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
    apiClient.getRoles().then(setRoles).catch(() => setRoles([]))
  }, [])

  const roleName = (user: User) => {
    const role = roles.find((r) => r.libelle === user.role)
    return role?.libelle || user.role || 'utilisateur'
  }

  const filteredUsers = users.filter((user) => {
    const q = searchTerm.toLowerCase()
    return (
      user.nom.toLowerCase().includes(q) ||
      (user.prenom || '').toLowerCase().includes(q) ||
      user.identifiant.toLowerCase().includes(q) ||
      (user.email || '').toLowerCase().includes(q)
    )
  })

  const handleAddNew = () => {
    setSelectedUser(undefined)
    setIsModalOpen(true)
  }

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setIsModalOpen(true)
  }

  const handleModalSubmit = async (data: any) => {
    try {
      setIsSubmitting(true)
      if (selectedUser) {
        await apiClient.updateUtilisateur(selectedUser.id, data)
      } else {
        await apiClient.createUtilisateur(data)
      }
      setIsModalOpen(false)
      loadUsers()
    } catch (err) {
      setError("Erreur lors de l'enregistrement de l'utilisateur")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur?')) return

    try {
      await apiClient.deleteUtilisateur(id)
      toast({ title: 'Succès', description: 'Utilisateur supprimé' })
      loadUsers()
    } catch (err) {
      setError("Erreur lors de la suppression de l'utilisateur")
      console.error(err)
    }
  }

  const handleResetPassword = async (id: number) => {
    if (!confirm('Réinitialiser le mot de passe à 123456789?')) return

    try {
      await apiClient.resetPassword(id, '123456789')
      toast({ title: 'Succès', description: 'Mot de passe réinitialisé à 123456789' })
    } catch (err) {
      setError('Erreur lors de la réinitialisation du mot de passe')
      console.error(err)
    }
  }

  if (isLoading && users.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement des utilisateurs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Rechercher par nom, prénom ou identifiant..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <Button onClick={handleAddNew} className="gap-2">
          <Plus size={18} />
          Nouvel Utilisateur
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun utilisateur trouvé
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Identifiant</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{getFullName(user)}</TableCell>
                    <TableCell>{user.identifiant}</TableCell>
                    <TableCell>{user.email || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{roleName(user)}</Badge>
                    </TableCell>
                    <TableCell>
                      {user.statut === 'actif' ? (
                        <Badge>Actif</Badge>
                      ) : (
                        <Badge variant="destructive">Inactif</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-1 hover:bg-muted rounded"
                          title="Modifier"
                        >
                          <Edit2 size={16} className="text-[#2db34b]" />
                        </button>
                        <button
                          onClick={() => handleResetPassword(user.id)}
                          className="p-1 hover:bg-muted rounded"
                          title="Réinitialiser mot de passe"
                        >
                          <RotateCcw size={16} className="text-orange-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-1 hover:bg-muted rounded"
                          title="Supprimer"
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        user={selectedUser}
        roles={roles}
        isLoading={isSubmitting}
      />
    </div>
  )
}
