import { useState, useEffect, createContext, useContext } from 'react'

interface User {
  userId: string
  username: string
  email: string
  fullName: string
  accessLevel: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  signup: (email: string, password: string, fullName: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const userData = localStorage.getItem('userData')
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        setIsAuthenticated(true)
      } catch (error) {
        localStorage.removeItem('authToken')
        localStorage.removeItem('userData')
      }
    }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    const mockToken = 'demo-token-' + Date.now()
    const mockUser: User = {
      userId: '1',
      username: email.split('@')[0],
      email: email,
      fullName: email.split('@')[0],
      accessLevel: 'admin'
    }
    
    localStorage.setItem('authToken', mockToken)
    localStorage.setItem('userData', JSON.stringify(mockUser))
    
    setUser(mockUser)
    setIsAuthenticated(true)
    
    return true
  }

  const signup = async (email: string, password: string, fullName: string): Promise<boolean> => {
    const mockToken = 'demo-token-' + Date.now()
    const mockUser: User = {
      userId: Date.now().toString(),
      username: email.split('@')[0],
      email: email,
      fullName: fullName,
      accessLevel: 'user'
    }
    
    localStorage.setItem('authToken', mockToken)
    localStorage.setItem('userData', JSON.stringify(mockUser))
    
    setUser(mockUser)
    setIsAuthenticated(true)
    
    return true
  }

  const logout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userData')
    setUser(null)
    setIsAuthenticated(false)
  }

  const value: AuthContextType = {
    user,
    isAuthenticated,
    login,
    signup,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}