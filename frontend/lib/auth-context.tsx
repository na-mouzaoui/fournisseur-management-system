'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from './types'
import { apiClient } from './api-client'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setToken: (token: string) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Charger le token au démarrage
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token')
    if (storedToken) {
      setToken(storedToken)

      // Récupérer les infos utilisateur depuis l'API
      apiClient
        .getCurrentUser()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('auth_token')
          setToken(null)
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const response = await apiClient.login(email, password)
    localStorage.setItem('auth_token', response.token)
    setToken(response.token)
    setUser(response.user)
  }

  const logout = async () => {
    await apiClient.logout().catch(() => {})
    localStorage.removeItem('auth_token')
    setToken(null)
    setUser(null)
  }

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token,
    login,
    logout,
    setToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
