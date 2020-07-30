import { useContext, useEffect, useState } from 'react'

import SocketContext from '../context/socket'

export function useSocketSubscription (namespace = 'event') {
  const socket = useContext(SocketContext)
  const [data, setData] = useState([])

  useEffect(() => {
    function handler (data) {
      console.log(data)
      setData(oldData => [...oldData, data.payload])
    }

    socket.on(namespace, handler)

    return () => socket.off(namespace, handler)
  }, [socket])

  return [
    data
  ]
}
