import React, { useRef, useEffect, useState } from 'react'
import io from 'socket.io-client'

const SocketContext = React.createContext()

export function SocketProvider ({ children }) {
  const socket = useRef(io('http://localhost:3001'))
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    async function waitConnection () {
      await new Promise(resolve => socket.current.on('connect', resolve))
      setConnected(true)
    }

    waitConnection()
  }, [])

  if (!connected) return null

  return (
    <SocketContext.Provider value={socket.current}>
      {children}
    </SocketContext.Provider>
  )
}

export default SocketContext
