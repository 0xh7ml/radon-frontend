"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"

interface User {
  id: number
  username: string
  email: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [token, setToken] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const router = useRouter()

  React.useEffect(() => {
    const storedToken = localStorage.getItem("jwt_token")
    const storedUser = localStorage.getItem("jwt_user")

    if (storedToken && storedUser) {
      setToken(storedToken)
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        // ignore
      }
      // Validate token by fetching profile
      api
        .get<User>("/auth/profile")
        .then((res) => {
          setUser(res.data)
          localStorage.setItem("jwt_user", JSON.stringify(res.data))
        })
        .catch(() => {
          localStorage.removeItem("jwt_token")
          localStorage.removeItem("jwt_user")
          setToken(null)
          setUser(null)
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (username: string, password: string) => {
    const res = await api.post<{ token: string; user: User }>("/auth/login", {
      username,
      password,
    })
    const { token: newToken, user: newUser } = res.data
    localStorage.setItem("jwt_token", newToken)
    if (newUser) {
      localStorage.setItem("jwt_user", JSON.stringify(newUser))
      setUser(newUser)
    }
    setToken(newToken)

    // If we didn't get user from login, fetch profile
    if (!newUser) {
      try {
        const profileRes = await api.get<User>("/auth/profile")
        setUser(profileRes.data)
        localStorage.setItem("jwt_user", JSON.stringify(profileRes.data))
      } catch {
        // user will just have null user data
      }
    }
  }

  const register = async (
    username: string,
    email: string,
    password: string
  ) => {
    await api.post("/auth/register", { username, email, password })
  }

  const logout = async () => {
    try {
      await api.post("/auth/logout")
    } catch {
      // ignore
    }
    localStorage.removeItem("jwt_token")
    localStorage.removeItem("jwt_user")
    setToken(null)
    setUser(null)
    router.push("/signin")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
