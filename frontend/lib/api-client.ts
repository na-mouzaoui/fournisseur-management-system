import {
  LoginRequest,
  AuthResponse,
  User,
  OperateurEconomique,
  CreateOperateurRequest,
  UpdateOperateurRequest,
  Dossier,
  CreateDossierRequest,
  UpdateDossierRequest,
  Document,
  Notification,
  Role,
  SecteurActivite,
  Statut,
  CreateUtilisateurRequest,
  UpdateUtilisateurRequest,
  ResetPasswordRequest,
  PaginatedResponse,
  DashboardStats,
  AuditLog,
  BlacklistEntry,
  Evaluation,
  EvaluationStats,
  Prestation,
  CreatePrestationRequest,
  UpdatePrestationRequest,
  Etape,
  Historique,
  CreateHistoriqueRequest,
  UpdateHistoriqueRequest,
} from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = API_BASE_URL
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('auth_token')
  }

  // En cas de session expirée (401), on nettoie le jeton et on redirige vers la connexion.
  private handleSessionExpired(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem('auth_token')
    const isAlreadyOnLogin = window.location.pathname.startsWith('/login')
    if (!isAlreadyOnLogin) {
      window.location.href = '/login'
    }
  }

  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const isFormData =
      typeof FormData !== 'undefined' && options.body instanceof FormData

    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> | undefined),
    }
    if (!isFormData) {
      headers['Content-Type'] = 'application/json'
    }

    const token = this.getAuthToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (response.status === 401 && !endpoint.startsWith('/api/auth/login')) {
      this.handleSessionExpired()
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(
        error.message || `${options.method || 'GET'} ${endpoint} -> HTTP ${response.status}`
      )
    }

    if (response.status === 204) {
      return undefined as T
    }

    return response.json() as Promise<T>
  }

  // ===== Authentification =====
  async login(email: string, password: string): Promise<AuthResponse> {
    return this.fetch<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password } as LoginRequest),
    })
  }

  async logout(): Promise<void> {
    await this.fetch<void>('/api/auth/logout', {
      method: 'POST',
    })
  }

  async getCurrentUser(): Promise<User> {
    return this.fetch<User>('/api/auth/me', {
      method: 'GET',
    })
  }

  // ===== Opérateurs économiques (fournisseurs) =====
  async getOperateurs(
    page: number = 1,
    pageSize: number = 10,
    search?: string
  ): Promise<PaginatedResponse<OperateurEconomique>> {
    let url = `/api/operateurs?page=${page}&pageSize=${pageSize}`
    if (search) url += `&search=${encodeURIComponent(search)}`
    return this.fetch<PaginatedResponse<OperateurEconomique>>(url, {
      method: 'GET',
    })
  }

  async getOperateur(id: number): Promise<OperateurEconomique> {
    return this.fetch<OperateurEconomique>(`/api/operateurs/${id}`, {
      method: 'GET',
    })
  }

  async createOperateur(
    data: CreateOperateurRequest
  ): Promise<OperateurEconomique> {
    return this.fetch<OperateurEconomique>('/api/operateurs', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateOperateur(
    id: number,
    data: UpdateOperateurRequest
  ): Promise<OperateurEconomique> {
    return this.fetch<OperateurEconomique>(`/api/operateurs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteOperateur(id: number): Promise<void> {
    await this.fetch<void>(`/api/operateurs/${id}`, {
      method: 'DELETE',
    })
  }

  async archiveOperateur(id: number, isArchived: boolean): Promise<OperateurEconomique> {
    return this.fetch<OperateurEconomique>(`/api/operateurs/${id}/archive`, {
      method: 'POST',
      body: JSON.stringify({ isArchived }),
    })
  }

  async blacklistOperateur(
    id: number,
    data: { motif: string; dateDebut: string; dateFin?: string }
  ): Promise<BlacklistEntry> {
    return this.fetch<BlacklistEntry>(`/api/operateurs/${id}/blacklist`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async reactivateOperateur(id: number): Promise<OperateurEconomique> {
    return this.fetch<OperateurEconomique>(`/api/operateurs/${id}/reactivate`, {
      method: 'POST',
    })
  }

  // ===== Dossiers =====
  async getDossiers(
    page: number = 1,
    pageSize: number = 10,
    statutId?: number
  ): Promise<PaginatedResponse<Dossier>> {
    let url = `/api/dossiers?page=${page}&pageSize=${pageSize}`
    if (statutId) url += `&statutId=${statutId}`
    return this.fetch<PaginatedResponse<Dossier>>(url, {
      method: 'GET',
    })
  }

  async getDossier(id: number): Promise<Dossier> {
    return this.fetch<Dossier>(`/api/dossiers/${id}`, {
      method: 'GET',
    })
  }

  async createDossier(data: CreateDossierRequest): Promise<Dossier> {
    return this.fetch<Dossier>('/api/dossiers', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateDossier(
    id: number,
    data: UpdateDossierRequest
  ): Promise<Dossier> {
    return this.fetch<Dossier>(`/api/dossiers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteDossier(id: number): Promise<void> {
    await this.fetch<void>(`/api/dossiers/${id}`, {
      method: 'DELETE',
    })
  }

  async getDossierByOperateur(operateurId: number): Promise<Dossier> {
    return this.fetch<Dossier>(`/api/dossiers?operateurId=${operateurId}`, {
      method: 'GET',
    })
  }

  // ===== Documents =====
  async uploadDocument(
    fichier: File,
    dossierId: number,
    typeCode: string,
    dateExpiration?: string
  ): Promise<Document> {
    const formData = new FormData()
    formData.append('fichier', fichier)
    formData.append('dossierId', String(dossierId))
    formData.append('typeCode', typeCode)
    if (dateExpiration) formData.append('dateExpiration', dateExpiration)

    return this.fetch<Document>('/api/documents', {
      method: 'POST',
      body: formData,
    })
  }

  async uploadDocumentReplacement(
    dossierId: number,
    typeCode: string,
    fichier: File,
    dateExpiration?: string
  ): Promise<Document> {
    const formData = new FormData()
    formData.append('fichier', fichier)
    if (dateExpiration) formData.append('dateExpiration', dateExpiration)

    return this.fetch<Document>(
      `/api/documents/${dossierId}/types/${typeCode}`,
      {
        method: 'PUT',
        body: formData,
      }
    )
  }

  async downloadDocument(id: number): Promise<Blob> {
    const token = this.getAuthToken()
    const response = await fetch(`${this.baseUrl}/api/documents/${id}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (response.status === 401) {
      this.handleSessionExpired()
    }
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.blob()
  }

  // ===== Documents par opérateur (dossier auto-créé) =====
  async getOperateurDocuments(operateurId: number): Promise<Document[]> {
    return this.fetch<Document[]>(`/api/documents/operateurs/${operateurId}`, {
      method: 'GET',
    })
  }

  async uploadOperateurDocument(
    operateurId: number,
    typeCode: string,
    fichier: File,
    dateExpiration?: string
  ): Promise<Document> {
    const formData = new FormData()
    formData.append('fichier', fichier)
    formData.append('typeCode', typeCode)
    if (dateExpiration) formData.append('dateExpiration', dateExpiration)

    return this.fetch<Document>(`/api/documents/operateurs/${operateurId}`, {
      method: 'POST',
      body: formData,
    })
  }

  async updateDocumentDateExpiration(
    id: number,
    dateExpiration: string | null
  ): Promise<Document> {
    return this.fetch<Document>(`/api/documents/${id}/date-expiration`, {
      method: 'PATCH',
      body: JSON.stringify({ dateExpiration }),
    })
  }

  async deleteDocument(id: number): Promise<void> {
    await this.fetch<void>(`/api/documents/${id}`, {
      method: 'DELETE',
    })
  }

  // ===== Audit =====
  async getAuditLogs(): Promise<AuditLog[]> {
    return this.fetch<AuditLog[]>('/api/audit', {
      method: 'GET',
    })
  }

  // ===== Dashboard =====
  async getDashboardStats(top: number = 5): Promise<DashboardStats> {
    return this.fetch<DashboardStats>(`/api/dashboard/stats?top=${top}`, {
      method: 'GET',
    })
  }

  // ===== Référentiels =====
  async getRoles(): Promise<Role[]> {
    return this.fetch<Role[]>('/api/referentiels/roles', {
      method: 'GET',
    })
  }

  async getSecteurs(): Promise<SecteurActivite[]> {
    return this.fetch<SecteurActivite[]>('/api/referentiels/secteurs', {
      method: 'GET',
    })
  }

  async getStatuts(): Promise<Statut[]> {
    return this.fetch<Statut[]>('/api/referentiels/statuts', {
      method: 'GET',
    })
  }

  async getEtapes(): Promise<Etape[]> {
    return this.fetch<Etape[]>('/api/referentiels/etapes', {
      method: 'GET',
    })
  }

  async createSecteur(libelle: string): Promise<SecteurActivite> {
    return this.fetch<SecteurActivite>('/api/referentiels/secteurs', {
      method: 'POST',
      body: JSON.stringify({ libelle }),
    })
  }

  async createStatut(libelle: string): Promise<Statut> {
    return this.fetch<Statut>('/api/referentiels/statuts', {
      method: 'POST',
      body: JSON.stringify({ libelle }),
    })
  }

  // ===== Utilisateurs =====
  async getUtilisateurs(): Promise<User[]> {
    return this.fetch<User[]>('/api/utilisateurs', {
      method: 'GET',
    })
  }

  async getUtilisateur(id: number): Promise<User> {
    return this.fetch<User>(`/api/utilisateurs/${id}`, {
      method: 'GET',
    })
  }

  async createUtilisateur(data: CreateUtilisateurRequest): Promise<User> {
    return this.fetch<User>('/api/utilisateurs', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateUtilisateur(
    id: number,
    data: UpdateUtilisateurRequest
  ): Promise<User> {
    return this.fetch<User>(`/api/utilisateurs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteUtilisateur(id: number): Promise<void> {
    await this.fetch<void>(`/api/utilisateurs/${id}`, {
      method: 'DELETE',
    })
  }

  async resetPassword(id: number, newPassword: string): Promise<void> {
    await this.fetch<void>(`/api/utilisateurs/${id}/reset-password`, {
      method: 'PATCH',
      body: JSON.stringify({ newPassword } as ResetPasswordRequest),
    })
  }

  // ===== Notifications =====
  async getNotifications(): Promise<Notification[]> {
    return this.fetch<Notification[]>('/api/notifications', {
      method: 'GET',
    })
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await this.fetch<void>(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    })
  }

  // ===== Evaluations =====
  async getEvaluationsByOperateur(operateurId: number): Promise<Evaluation[]> {
    return this.fetch<Evaluation[]>(`/api/evaluations/operateur/${operateurId}`)
  }

  async getEvaluationStats(operateurId: number): Promise<EvaluationStats> {
    return this.fetch<EvaluationStats>(`/api/evaluations/operateur/${operateurId}/stats`)
  }

  async createEvaluation(data: {
    operateurId: number
    noteConformite: number
    noteDelai: number
    notePrixConsultation: number
    notePrixContrat: number
    noteHse: number
    noteService: number
    semestre?: string
    prestationId?: number
    commentaire?: string
  }): Promise<Evaluation> {
    return this.fetch<Evaluation>('/api/evaluations', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // ===== Prestations =====
  async getPrestations(
    page: number = 1,
    pageSize: number = 10,
    search?: string
  ): Promise<PaginatedResponse<Prestation>> {
    let url = `/api/prestations?page=${page}&pageSize=${pageSize}`
    if (search) url += `&search=${encodeURIComponent(search)}`
    return this.fetch<PaginatedResponse<Prestation>>(url, {
      method: 'GET',
    })
  }

  async getPrestation(id: number): Promise<Prestation> {
    return this.fetch<Prestation>(`/api/prestations/${id}`, {
      method: 'GET',
    })
  }

  async createPrestation(data: CreatePrestationRequest): Promise<Prestation> {
    return this.fetch<Prestation>('/api/prestations', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updatePrestation(id: number, data: UpdatePrestationRequest): Promise<Prestation> {
    return this.fetch<Prestation>(`/api/prestations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deletePrestation(id: number): Promise<void> {
    await this.fetch<void>(`/api/prestations/${id}`, {
      method: 'DELETE',
    })
  }

  // ===== Historique =====
  async getHistoriques(
    page: number = 1,
    pageSize: number = 10,
    operateurId?: number,
    search?: string
  ): Promise<PaginatedResponse<Historique>> {
    let url = `/api/historiques?page=${page}&pageSize=${pageSize}`
    if (operateurId) url += `&operateurId=${operateurId}`
    if (search) url += `&search=${encodeURIComponent(search)}`
    return this.fetch<PaginatedResponse<Historique>>(url, {
      method: 'GET',
    })
  }

  async createHistorique(data: CreateHistoriqueRequest): Promise<Historique> {
    return this.fetch<Historique>('/api/historiques', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateHistorique(id: number, data: UpdateHistoriqueRequest): Promise<Historique> {
    return this.fetch<Historique>(`/api/historiques/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteHistorique(id: number): Promise<void> {
    await this.fetch<void>(`/api/historiques/${id}`, {
      method: 'DELETE',
    })
  }
}

export const apiClient = new ApiClient()
