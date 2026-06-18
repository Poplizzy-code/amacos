import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

axios.defaults.baseURL = import.meta.env.VITE_API_URL || ''
axios.defaults.withCredentials = true

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const { data } = await axios.get('/api/auth/me', { withCredentials: true })
        setUser(data.user)
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    fetchMe()
  }, [])

  const register = async (formData) => {
    const { data } = await axios.post('/api/auth/register', formData, { withCredentials: true })
    setUser(data.user)
    return data
  }

  const login = async (email, password) => {
    const { data } = await axios.post('/api/auth/login', { email, password }, { withCredentials: true })
    setUser(data.user)
    return data
  }

  const logout = async () => {
    await axios.post('/api/auth/logout', {}, { withCredentials: true })
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
