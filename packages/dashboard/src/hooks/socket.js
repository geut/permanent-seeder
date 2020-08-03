import { useEffect, useState, useContext } from 'react'

import SocketContext from '../context/socket'

// export function useSocketSubscription (namespace) {
//   const socket = useContext(SocketContext)
//   const [data, setData] = useState([])

//   useEffect(() => {
//     function handler (data) {
//       setData(oldData => [...oldData, data.payload])
//     }

//     socket.on(namespace, handler)

//     return () => {
//       socket.off(namespace, handler)
//     }
//   }, [socket, namespace])

//   return [
//     data
//   ]
// }

export function useSocketSubscription (namespace) {
  const socket = useContext(SocketContext)
  const [data, setData] = useState()

  useEffect(() => {
    function handler (data) {
      setData(data.payload)
    }

    socket.on(namespace, handler)

    return () => {
      socket.off(namespace, handler)
    }
  }, [socket, namespace])

  return [
    data
  ]
}
