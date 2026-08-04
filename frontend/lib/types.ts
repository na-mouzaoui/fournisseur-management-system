// ===== Authentification =====
export interface LoginRequest {
  identifiant: string
  password: string
}

export interface AuthResponse {
  token: string
  expiresIn: number
  user: User
}

export interface User {
  id: number
  nom: string
  prenom?: string
  identifiant: string
  email?: string
  role: string // libelle du rôle : 'admin' | 'agent' | ...
  statut: string // 'actif' | 'inactif'
  dateCreation: string
  roleId?: number
}

export function getFullName(user: Pick<User, 'nom' | 'prenom'> | null | undefined): string {
  if (!user) return ''
  return user.prenom ? `${user.prenom} ${user.nom}` : user.nom
}

export interface CreateUtilisateurRequest {
  nom: string
  prenom?: string
  identifiant: string
  password?: string
  email?: string
  roleId: number
}

export interface UpdateUtilisateurRequest {
  nom: string
  prenom?: string
  email?: string
  roleId?: number
  statut?: string
}

export interface ResetPasswordRequest {
  newPassword: string
}

// ===== Opérateurs économiques (fournisseurs) =====
export interface OperateurEconomique {
  id: number
  numeroImmatriculation: string
  raisonSociale: string
  typeOperateur?: string
  formeJuridique?: string
  nif?: string
  nis?: string
  registreCommerce?: string
  secteurActiviteId?: number
  secteurActiviteLibelle?: string
  adresse?: string
  wilaya?: string
  telephone?: string
  email?: string
  dateCreationEntreprise?: string
  dateImmatriculation: string
  statutId?: number
  statutLibelle?: string
  createdBy?: number
  createdAt: string
  updatedAt?: string
}

export interface CreateOperateurRequest {
  numeroImmatriculation: string
  raisonSociale: string
  typeOperateur?: string
  formeJuridique?: string
  nif?: string
  nis?: string
  registreCommerce?: string
  secteurActiviteId?: number | null
  adresse?: string
  wilaya?: string
  telephone?: string
  email?: string
  dateCreationEntreprise?: string
  dateImmatriculation?: string
  statutId?: number | null
}

export interface UpdateOperateurRequest {
  raisonSociale: string
  typeOperateur?: string
  formeJuridique?: string
  nif?: string
  nis?: string
  registreCommerce?: string
  secteurActiviteId?: number | null
  adresse?: string
  wilaya?: string
  telephone?: string
  email?: string
  dateCreationEntreprise?: string
  dateImmatriculation: string
  statutId?: number | null
}

// ===== Dossiers & documents =====
export interface Document {
  id: number
  dossierId: number
  typeCode: string
  nomFichier: string
  fileID: string
  dateExpiration?: string
  userUploader: number
  createdAt: string
}

export interface Dossier {
  id: number
  operateurId: number
  operateurRaisonSociale?: string
  operateurNumeroImmatriculation?: string
  statutId: number
  statutLibelle?: string
  agentAffecteId?: number
  agentAffecteNom?: string
  dateCreation: string
  documents: Document[]
}

export interface CreateDossierRequest {
  operateurId: number
  statutId: number
  agentAffecteId?: number | null
}

export interface UpdateDossierRequest {
  statutId?: number
  agentAffecteId?: number | null
}

// ===== Notifications =====
export interface Notification {
  id: number
  utilisateurId: number
  dossierId?: number
  type?: string
  message?: string
  lu: boolean
  dateCreation: string
}

// ===== Audit =====
export interface AuditLog {
  id: number
  utilisateurId?: number
  utilisateurIdentifiant: string
  action: string
  entite: string
  entiteId?: number
  details?: string
  dateHeure: string
}

// ===== Référentiels =====
export interface Role {
  id: number
  libelle: string
  description?: string
}

export interface SecteurActivite {
  id: number
  libelle: string
}

export interface Statut {
  id: number
  libelle: string
}

// ===== Pagination =====
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

// ===== Dashboard =====
export interface EvolutionMensuelle {
  mois: string // format: 'YYYY-MM'
  nouveaux: number
}

export interface SecteurRepartition {
  secteur: string
  nombre: number
}

export interface DernierFournisseur {
  id: number
  raisonSociale: string
  secteur?: string
  statut?: string
  dateCreation: string
}

export interface DashboardStats {
  totalOperateurs: number
  operateursBlacklistes: number
  nouveaux30Jours: number
  evolutionMensuelle: EvolutionMensuelle[]
  repartitionSecteurs: SecteurRepartition[]
  derniersFournisseurs: DernierFournisseur[]
}
