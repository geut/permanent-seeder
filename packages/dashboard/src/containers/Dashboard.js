import React, { useEffect, useState } from 'react'
import { useSocket } from 'use-socketio'

import { useAppBarTitle } from '../hooks/layout'

import DriveItem from '../components/DriveItem'
import DriveItemHeader from '../components/DriveItemHeader'

function Dashboard () {
  const [, setAppBarTitle] = useAppBarTitle()
  const [seederStats, setSeederStats] = useState({})

  const { unsubscribe } = useSocket('seeder.stats', stat => {
    const key = Buffer.from(stat.metadata.key).toString('hex')
    setSeederStats(seederStats => ({
      ...seederStats,
      [key]: stat
    }))
  })

  useEffect(() => {
    setAppBarTitle('Dashboard')
  }, [setAppBarTitle])

  useEffect(() => {
    return () => unsubscribe()
  }, [])

  return (
    <div>
      <DriveItemHeader />
      {Object.keys(seederStats).map(key => <DriveItem key={key} driveKey={key} />)}
    </div>
  )
}

export default Dashboard
