import React, { useEffect } from 'react'

import { useAppBarTitle } from '../hooks/layout'
import { useDrivesStats } from '../hooks/drives'

import DriveItem from '../components/DriveItem'
import DriveItemHeader from '../components/DriveItemHeader'

function Dashboard () {
  const [data] = useDrivesStats()
  const [, setAppBarTitle] = useAppBarTitle()

  useEffect(() => {
    setAppBarTitle('Dashboard')
  }, [setAppBarTitle])

  if (data.length === 0) return null

  const drives = data[data.length - 1]

  return (
    <div>
      <DriveItemHeader />
      {Object.keys(drives).map(key => <DriveItem key={key} driveKey={key} />)}
    </div>
  )
}

export default Dashboard
