import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

// Keep axios Authorization header in sync with localStorage token
const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('amacos_token', token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    localStorage.removeItem('amacos_token')
    delete axios.defaults.headers.common['Authorization']
  }
}

// Restore token from localStorage on page load
const savedToken = localStorage.getItem('amacos_token')
if (savedToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const { data } = await axios.get('/api/auth/me')
        setUser(data.user)
      } catch {
        setAuthToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    fetchMe()
  }, [])

  const register = async (formData) => {
    const { data } = await axios.post('/api/auth/register', formData)
    setAuthToken(data.token)
    setUser(data.user)
    return data
  }

  const login = async (email, password) => {
    const { data } = await axios.post('/api/auth/login', { email, password })
    setAuthToken(data.token)
    setUser(data.user)
    return data
  }

  const logout = async () => {
    try { await axios.post('/api/auth/logout', {}) } catch { /* ignore */ }
    setAuthToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
