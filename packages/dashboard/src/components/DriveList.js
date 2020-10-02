import React, { useEffect, useState } from 'react'
import { useSocket } from 'use-socketio'

import DrivesTable from './DrivesTable'

function buildDriveData (drive) {
  return {
    key: drive.key,
    sizeBlocks: drive.size.blocks,
    sizeBytes: drive.size.bytes,
    downloadedBlocks: drive.size.downloadedBlocks,
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

  // // Drive data
  const { unsubscribe: unsubscribeDriveDownload } = useSocket('drive.download', updateDrive)
  const { unsubscribe: unsubscribeDrivePeerAdd } = useSocket('drive.peer.add', updateDrive)
  const { unsubscribe: unsubscribeDrivePeerRemove } = useSocket('drive.peer.remove', updateDrive)
  const { unsubscribe: unsubscribeDriveReady } = useSocket('drive.ready', updateDrive)
  const { unsubscribe: unsubscribeDriveUpdate } = useSocket('drive.update', updateDrive)
  const { unsubscribe: unsubscribeDriveUpload } = useSocket('drive.peer.upload', updateDrive)

  // New keys
  const { unsubscribe: unsubscribeKeyAdd } = useSocket('drive.add', updateDrive)

  // Removed keys
  const { unsubscribe: unsubscribeKeyRemove } = useSocket('drive.remove', key => {
    setDrives(drives => {
      const newDrives = { ...drives }
      delete newDrives[key]
      return newDrives
    })
  })

  useEffect(() => {
    return () => {
      unsubscribeKeyAdd()
      unsubscribeKeyRemove()
      unsubscribeDriveDownload()
      unsubscribeDrivePeerAdd()
      unsubscribeDrivePeerRemove()
      unsubscribeDriveReady()
      unsubscribeDriveUpdate()
      unsubscribeDriveUpload()
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
