import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

export const SocketProvider = ({ children }) => {
  const { user } = useAuth()
  const socketRef = useRef(null)
  const [notifCount, setNotifCount] = useState(0)

  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect()
      socketRef.current = null
      setNotifCount(0)
      return
    }

    const serverUrl = import.meta.env.VITE_API_URL || window.location.origin
    const token = localStorage.getItem('amacos_token')
    const socket = io(serverUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      auth: token ? { token } : undefined,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('join', user._id)
    })

    socket.on('notification', (notif) => {
      setNotifCount(c => c + 1)
      const icons = {
        friend_request: '👋',
        friend_accepted: '🎉',
        message: '💬',
        post_like: '❤️',
        post_comment: '💬',
      }
      toast(notif.content || 'New notification', {
        icon: icons[notif.type] || '🔔',
        duration: 4000,
      })
    })

    socket.on('new_message', () => {
      // Bump unread badge — actual message display handled in DMPanel
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [user?._id])

  const resetNotifCount = () => setNotifCount(0)
  const getSocket = () => socketRef.current

  return (
    <SocketContext.Provider value={{ getSocket, notifCount, resetNotifCount }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)
