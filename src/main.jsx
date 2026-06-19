import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import axios from 'axios'
import App from './App.jsx'
import './index.css'

// In production, all API calls go to the backend server URL.
// In development, Vite proxies /api → localhost:5000, so leave baseURL empty.
if (import.meta.env.VITE_API_URL) {
  axios.defaults.baseURL = import.meta.env.VITE_API_URL
}
axios.defaults.withCredentials = true

// Always attach the JWT from localStorage to every request.
// This runs right before the request is sent, so it always reads the
// current token even if axios.defaults were set before login completed.
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('amacos_token')
  if (token) {
    config.headers = config.headers || {}
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
