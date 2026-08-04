'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Role, SecteurActivite, Statut } from '@/lib/types'
import { apiClient } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import { Plus } from 'lucide-react'

export default function ReferentielsTab() {
  const [roles, setRoles] = useState<Role[]>([])
  const [secteurs, setSecteurs] = useState<SecteurActivite[]>([])
  const [statuts, setStatuts] = useState<Statut[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [newSecteur, setNewSecteur] = useState('')
  const [newStatut, setNewStatut] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadReferentiels()
  }, [])

  const loadReferentiels = async () => {
    try {
      setIsLoading(true)
      const [rolesData, secteursData, statutsData] = await Promise.all([
        apiClient.getRoles(),
        apiClient.getSecteurs(),
        apiClient.getStatuts(),
      ])
      setRoles(rolesData || [])
      setSecteurs(secteursData || [])
      setStatuts(statutsData || [])
    } catch (err) {
      setError('Erreur lors du chargement des référentiels')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddSecteur = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSecteur.trim()) return
    try {
      setIsSaving(true)
      await apiClient.createSecteur(newSecteur.trim())
      setNewSecteur('')
      toast({ title: 'Succès', description: 'Secteur ajouté' })
      loadReferentiels()
    } catch (err) {
      setError('Erreur lors de l\'ajout du secteur')
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddStatut = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStatut.trim()) return
    try {
      setIsSaving(true)
      await apiClient.createStatut(newStatut.trim())
      setNewStatut('')
      toast({ title: 'Succès', description: 'Statut ajouté' })
      loadReferentiels()
    } catch (err) {
      setError("Erreur lors de l'ajout du statut")
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement des référentiels...</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Rôles (lecture seule) */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3">Rôles</h3>
            <div className="space-y-2">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className="flex items-center justify-between border border-border rounded-md px-3 py-2"
                >
                  <span className="font-medium capitalize">{role.libelle}</span>
                  {role.description && (
                    <span className="text-xs text-muted-foreground truncate ml-2">
                      {role.description}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Secteurs d'activité */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <h3 className="font-semibold">Secteurs d'activité</h3>
            <div className="flex flex-wrap gap-2">
              {secteurs.map((s) => (
                <Badge key={s.id} variant="secondary" className="gap-1">
                  {s.libelle}
                </Badge>
              ))}
            </div>
            <form onSubmit={handleAddSecteur} className="space-y-2">
              <Label htmlFor="newSecteur">Nouveau secteur</Label>
              <div className="flex gap-2">
                <Input
                  id="newSecteur"
                  value={newSecteur}
                  onChange={(e) => setNewSecteur(e.target.value)}
                  disabled={isSaving}
                  placeholder="Ex: Industrie"
                />
                <Button type="submit" size="icon" disabled={isSaving}>
                  <Plus size={16} />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Statuts */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <h3 className="font-semibold">Statuts</h3>
            <div className="flex flex-wrap gap-2">
              {statuts.map((s) => (
                <Badge key={s.id} variant="secondary" className="gap-1">
                  {s.libelle}
                </Badge>
              ))}
            </div>
            <form onSubmit={handleAddStatut} className="space-y-2">
              <Label htmlFor="newStatut">Nouveau statut</Label>
              <div className="flex gap-2">
                <Input
                  id="newStatut"
                  value={newStatut}
                  onChange={(e) => setNewStatut(e.target.value)}
                  disabled={isSaving}
                  placeholder="Ex: expiré"
                />
                <Button type="submit" size="icon" disabled={isSaving}>
                  <Plus size={16} />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
