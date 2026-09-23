import { createContext, useContext, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import { ROLE_BASE } from '../utils'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const navigate = useNavigate()

  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token')
    const role  = localStorage.getItem('role')
    const nom   = localStorage.getItem('nom')
    const email = localStorage.getItem('email')
    return token ? { token, role, nom, email } : null
  })

  const login = useCallback(async (email, motDePasse) => {
    const data = await authService.login(email, motDePasse)
    localStorage.setItem('token', data.token)
    localStorage.setItem('role',  data.role)
    localStorage.setItem('nom',   data.nom)
    localStorage.setItem('email', data.email)
    setUser(data)
    navigate(ROLE_BASE[data.role] || '/dashboard/admin')
  }, [navigate])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('nom')
    localStorage.removeItem('email')
    setUser(null)
    navigate('/login')
  }, [navigate])

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
