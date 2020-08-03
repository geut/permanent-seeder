import { useEffect, useState } from 'react'

import { NAMESPACE_STATS_DRIVE } from '../constants'

import { useSocketSubscription } from './socket'

export function useDrivesStats (key) {
  const [data, setData] = useState([])
  const [ready, setReady] = useState(false)

  const [liveData] = useSocketSubscription(`${NAMESPACE_STATS_DRIVE}${key ? `.${key}` : ''}`)

  useEffect(() => {
    async function fetchDrives () {
      const response = await window.fetch(`http://localhost:3001/api/drives/${key || ''}`)
      const data = await response.json()

      setData([data])
      setReady(true)
    }

    fetchDrives()

    return () => setReady(false)
  }, [key, setData])

  useEffect(() => {
    if (!ready) return

    if (liveData) {
      setData(drivesData => [...drivesData, liveData])
    }
  }, [ready, setData, liveData])

  return [data]
}
