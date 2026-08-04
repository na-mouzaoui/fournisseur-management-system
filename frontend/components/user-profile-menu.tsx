"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { User, Shield, LogOut, Bell } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getFullName, Notification } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api-client"
import { Badge } from "@/components/ui/badge"

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function UserProfileMenu() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  useEffect(() => {
    if (open) {
      apiClient
        .getNotifications()
        .then((data) => setNotifications(data || []))
        .catch(() => setNotifications([]))
    }
  }, [open])

  if (!user) return null

  const handleLogout = async () => {
    await logout()
    router.push("/auth/login")
    router.refresh()
  }

  const handleMarkAsRead = async (id: number) => {
    try {
      await apiClient.markNotificationAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, lu: true } : n))
      )
    } catch (err) {
      console.error(err)
    }
  }

  const name = getFullName(user) || user.identifiant
  const isAdmin = user.role === "admin"
  const unreadCount = notifications.filter((n) => !n.lu).length

  return (
    <div className="relative" ref={ref}>
      <DropdownButton open={open} setOpen={setOpen} unreadCount={unreadCount} />

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-96 rounded-md border bg-popover p-1 shadow-md">
          {/* Notifications */}
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-sm font-medium flex items-center gap-2">
              <Bell className="h-4 w-4" style={{ color: "#2db34b" }} />
              Notifications
            </span>
            {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
          </div>
          <div className="max-h-56 overflow-y-auto space-y-1 px-1 py-1">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground px-2 py-3 text-center">
                Aucune notification
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`rounded-md border border-border px-3 py-2 ${
                    n.lu ? "opacity-60" : "bg-[#2db34b]/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{n.type || "Notification"}</p>
                      {n.message && (
                        <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                      )}
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {formatDate(n.dateCreation)}
                      </p>
                    </div>
                    {!n.lu && (
                      <button
                        onClick={() => handleMarkAsRead(n.id)}
                        className="text-xs px-2 py-1 rounded border border-border hover:bg-muted shrink-0"
                        title="Marquer comme lue"
                      >
                        Lue
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="my-1 h-px bg-border" />

          {/* Profil */}
          <div className="px-2 py-1.5 text-sm font-medium">Mon Profil</div>
          <div className="px-2 py-2 space-y-2">
            <div>
              <p className="truncate text-sm font-medium">{name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.identifiant}</p>
            </div>
            <div>
              <span
                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                style={
                  isAdmin
                    ? { borderColor: "#e82c2a", color: "#e82c2a" }
                    : { borderColor: "#2db34b", color: "#2db34b" }
                }
              >
                {isAdmin ? "Admin" : user.role}
              </span>
            </div>
          </div>
          <div className="my-1 h-px bg-border" />
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                router.push("/admin")
              }}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
            >
              <Shield className="h-4 w-4" style={{ color: "#e82c2a" }} />
              Administration
            </button>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
          >
            <LogOut className="h-4 w-4" style={{ color: "#e82c2a" }} />
            Déconnexion
          </button>
        </div>
      )}
    </div>
  )
}

function DropdownButton({
  open,
  setOpen,
  unreadCount,
}: {
  open: boolean
  setOpen: (o: boolean) => void
  unreadCount: number
}) {
  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        title="Menu profil et notifications"
      >
        <User className="h-5 w-5" />
      </Button>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
          style={{ backgroundColor: "#e82c2a" }}
        >
          {unreadCount}
        </span>
      )}
    </div>
  )
}
