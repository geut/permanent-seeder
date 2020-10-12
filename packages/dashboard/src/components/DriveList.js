import React, { useEffect, useState } from 'react'
import { useSocket } from 'use-socketio'

import DrivesTable from './DrivesTable'

function getPercentage (value, total, precision = 1) {
  return total > 0 ? parseFloat((value * 100 / total).toFixed(precision)) : 0
}

function buildDriveData (drive) {
  return {
    key: drive.key,
    sizeBlocks: drive.size.blocks,
    sizeBytes: drive.size.bytes,
    downloadedBlocks: drive.size.downloadedBlocks,
    downloadedPercent: getPercentage(drive.size.downloadedBlocks, drive.size.blocks),
    title: drive.info.indexJSON?.title || `Drive-${drive.key.substring(0, 6)}`,
    peers: drive.peers,
    files: drive.stats,
    info: drive.info,
    seedingStatus: drive.seedingStatus
  }
}

function DriveList ({ loadDrives, onKeyAdd }) {
  const [drives, setDrives] = useState(() => {
    const drives = loadDrives()

    return drives.reduce((drives, drive) => {
      drives[drive.key] = buildDriveData(drive)
      return drives
    }, {})
  })

  function updateDrive (drive) {
    setDrives(drives => ({
      ...drives,
      [drive.key]: buildDriveData(drive)
    }))
  }

  // New key + update
  const { unsubscribe: unsubscribeKeyUpdate } = useSocket('update', updateDrive)

  // Removed key
  const { unsubscribe: unsubscribeKeyRemove } = useSocket('drive.remove', key => {
    setDrives(drives => {
      const newDrives = { ...drives }
      delete newDrives[key]
      return newDrives
    })
  })

  useEffect(() => {
    return () => {
      unsubscribeKeyUpdate()
      unsubscribeKeyRemove()
    }
  }, [])

  if (!drives) { return null }

  return (
    <DrivesTable
      drives={Object.values(drives)}
      onKeyAdd={onKeyAdd}
    />
  )
}

export default DriveList
