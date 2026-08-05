'use client'

import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { AuditLog } from '@/lib/types'
import { apiClient } from '@/lib/api-client'
import { Filter, Search } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface UserOption {
  id: number
  identifiant: string
  nom: string
  prenom?: string
}

const getActionBadgeClass = (action: string) => {
  const normalized = action.toUpperCase()

  if (normalized.includes('SUPPRIMER') || normalized.includes('DELETE') || normalized.includes('REMOVE')) {
    return 'bg-red-100 text-red-800'
  }

  if (
    normalized.includes('CRÉER') ||
    normalized.includes('CREER') ||
    normalized.includes('AJOUTER') ||
    normalized.includes('ADD') ||
    normalized.includes('SAVE') ||
    normalized.includes('ENREG')
  ) {
    return 'bg-green-100 text-green-800'
  }

  if (
    normalized.includes('MODIFIER') ||
    normalized.includes('RÉINITIALISER') ||
    normalized.includes('REINITIALISER') ||
    normalized.includes('REMPLACER') ||
    normalized.includes('MARQUER')
  ) {
    return 'bg-blue-100 text-blue-800'
  }

  return 'bg-gray-100 text-gray-800'
}

type SortField = 'action' | 'userName' | 'date' | 'details'
type SortOrder = 'asc' | 'desc'

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  return date.toLocaleString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export default function AdminAuditLogs() {
  const { toast } = useToast()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)

  const [selectedUser, setSelectedUser] = useState<string>('all')
  const [selectedAction, setSelectedAction] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  useEffect(() => {
    loadUsers()
    loadLogs()
  }, [selectedUser, selectedAction, dateFrom, dateTo])

  const loadUsers = async () => {
    try {
      const data = await apiClient.getUtilisateurs()
      setUsers(data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs', error)
    }
  }

  const loadLogs = async () => {
    setLoading(true)
    try {
      const data = await apiClient.getAuditLogs()
      setLogs(data || [])
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Erreur lors du chargement des logs',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const sortedLogs = [...logs].sort((a, b) => {
    let aValue: string | number
    let bValue: string | number

    switch (sortField) {
      case 'action':
        aValue = a.action
        bValue = b.action
        break
      case 'userName':
        aValue = a.utilisateurIdentifiant || ''
        bValue = b.utilisateurIdentifiant || ''
        break
      case 'details':
        aValue = a.details || ''
        bValue = b.details || ''
        break
      case 'date':
      default:
        aValue = new Date(a.dateHeure).getTime()
        bValue = new Date(b.dateHeure).getTime()
    }

    if (typeof aValue === 'string') {
      return sortOrder === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue))
    }
    return sortOrder === 'asc'
      ? Number(aValue) - Number(bValue)
      : Number(bValue) - Number(aValue)
  })

  const filteredLogs = sortedLogs.filter((log) => {
    const matchesUser = selectedUser === 'all' || String(log.utilisateurId) === selectedUser
    const matchesAction = selectedAction === 'all' || log.action === selectedAction

    let matchesDate = true
    if (dateFrom) {
      const from = new Date(dateFrom)
      matchesDate = matchesDate && new Date(log.dateHeure) >= from
    }
    if (dateTo) {
      const to = new Date(dateTo)
      to.setHours(23, 59, 59, 999)
      matchesDate = matchesDate && new Date(log.dateHeure) <= to
    }

    const q = search.toLowerCase()
    const matchesSearch =
      (log.utilisateurIdentifiant || '').toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      (log.details || '').toLowerCase().includes(q) ||
      log.entite.toLowerCase().includes(q)

    return matchesUser && matchesAction && matchesDate && matchesSearch
  })

  const handleReset = () => {
    setSelectedUser('all')
    setSelectedAction('all')
    setDateFrom('')
    setDateTo('')
    setSearch('')
  }

  const uniqueActions = Array.from(new Set(logs.map((l) => l.action)))

  const parseDetails = (details: string | null | undefined) => {
    if (!details) return null
    try {
      return JSON.parse(details)
    } catch {
      return details
    }
  }

  const formatDetailValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'boolean') return value ? 'Oui' : 'Non'
    if (typeof value === 'object') return JSON.stringify(value, null, 2)
    return String(value)
  }

  const renderDetailValue = (value: unknown) => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'object') {
      return (
        <pre className="text-xs whitespace-pre-wrap break-words bg-background p-2 rounded">
          {JSON.stringify(value, null, 2)}
        </pre>
      )
    }
    return <span>{formatDetailValue(value)}</span>
  }

  const renderDetailsPreview = (log: AuditLog) => {
    const parsed = parseDetails(log.details)
    if (parsed && typeof parsed === 'object') {
      const entries = Object.entries(parsed)
      return (
        <div className="space-y-1">
          {entries.slice(0, 2).map(([key, value]) => (
            <div key={key} className="text-sm">
              <span className="font-medium text-muted-foreground">{key}: </span>
              <span className="truncate">{formatDetailValue(value)}</span>
            </div>
          ))}
          {entries.length > 2 && (
            <span className="text-xs text-muted-foreground">
              +{entries.length - 2} autre{entries.length - 2 > 1 ? 's' : ''}
            </span>
          )}
        </div>
      )
    }
    return <div className="truncate">{log.details || '-'}</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Filter className="h-4 w-4" style={{ color: '#e82c2a' }} />
          {showFilters ? 'Masquer' : 'Filtres'}
        </Button>
      </div>

      {showFilters && (
        <div className="rounded-lg border bg-muted/50 p-4">
          <h3 className="mb-4 text-sm font-semibold">Filtres Avancés</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label>Utilisateur</Label>
              <Select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
                <option value="all">Tous les utilisateurs</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.prenom ? `${user.prenom} ${user.nom}` : user.nom} ({user.identifiant})
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label>Action</Label>
              <Select value={selectedAction} onChange={(e) => setSelectedAction(e.target.value)}>
                <option value="all">Toutes les actions</option>
                {uniqueActions.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label>Date début</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>

            <div>
              <Label>Date fin</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={handleReset} variant="outline" size="sm">
              Réinitialiser
            </Button>
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4" style={{ color: '#e82c2a' }} />
        <Input
          placeholder="Rechercher par utilisateur, action ou détails..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="text-center py-8">Chargement...</div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">Aucun log trouvé</div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('action')} className="h-8 p-0 font-semibold hover:underline">
                    Action
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('userName')} className="h-8 p-0 font-semibold hover:underline">
                    Utilisateur
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('date')} className="h-8 p-0 font-semibold hover:underline">
                    Fait le
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('details')} className="h-8 p-0 font-semibold hover:underline">
                    Détails
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow
                  key={log.id}
                  onClick={() => {
                    setSelectedLog(log)
                    setShowDetailsDialog(true)
                  }}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${getActionBadgeClass(log.action)}`}
                    >
                      {log.action}
                    </span>
                  </TableCell>
                  <TableCell>{log.utilisateurIdentifiant || '—'}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(log.dateHeure)}</TableCell>
                  <TableCell className="max-w-md">{renderDetailsPreview(log)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="text-sm text-muted-foreground">
        Total: {filteredLogs.length} entrée{filteredLogs.length > 1 ? 's' : ''}
      </div>

      {/* Dialog détails */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de l'action</DialogTitle>
            <DialogDescription>Informations complètes sur cette action d'audit</DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Action</Label>
                  <div className="mt-1">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${getActionBadgeClass(selectedLog.action)}`}
                    >
                      {selectedLog.action}
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Utilisateur</Label>
                  <p className="mt-1">{selectedLog.utilisateurIdentifiant || '—'}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Date et heure</Label>
                  <p className="mt-1">{formatDate(selectedLog.dateHeure)}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Élément</Label>
                  <p className="mt-1">
                    {selectedLog.entite}
                    {selectedLog.entiteId ? ` (n°${selectedLog.entiteId})` : ''}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold text-muted-foreground">Détails complets</Label>
                <div className="mt-1 p-3 bg-muted rounded-md max-h-96 overflow-y-auto">
                  {(() => {
                    const parsed = parseDetails(selectedLog.details)
                    if (!parsed) {
                      return <p className="text-sm text-muted-foreground">Aucun détail disponible</p>
                    }
                    if (typeof parsed === 'object') {
                      return (
                        <div className="space-y-3">
                          {Object.entries(parsed).map(([key, value]) => (
                            <div key={key} className="border-b border-border/50 pb-2 last:border-0">
                              <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                                {key}
                              </div>
                              <div className="text-sm">{renderDetailValue(value)}</div>
                            </div>
                          ))}
                        </div>
                      )
                    }
                    return (
                      <pre className="text-sm whitespace-pre-wrap break-words">
                        {selectedLog.details}
                      </pre>
                    )
                  })()}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
