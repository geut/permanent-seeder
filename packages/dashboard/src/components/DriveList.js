import React, { useEffect, useState } from 'react'
import { useSocket } from 'use-socketio'

import DrivesTable from './DrivesTable'

function getPercentage (value, total, precision = 1) {
  return total > 0 ? parseFloat((value * 100 / total).toFixed(precision)) : 0
}

function getFsSize (stats = {}) {
  return Object.values(stats).reduce((total, sizes) => {
    total.blocks += sizes.blocks
    total.bytes += sizes.size
    return total
  }, {
    blocks: 0,
    bytes: 0
  })
}

function buildDriveData (drive) {
  const fsSize = getFsSize(drive.stats)

  return {
    key: drive.key,
    sizeBlocks: drive.size.blocks,
    sizeBytes: drive.size.bytes,
    downloadedBlocks: drive.size.downloadedBlocks,
    downloadedPercent: getPercentage(drive.size.downloadedBlocks, drive.size.blocks),
    title: drive.info.indexJSON?.title || `Drive-${drive.key.substring(0, 6)}`,
    peers: drive.peers,
    files: drive.stats,
    fsBlocks: fsSize.blocks,
    fsBytes: fsSize.bytes,
    info: drive.info,
    recentlyAdded: drive.recentlyAdded,
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
