import React, { useEffect, useRef, useState } from 'react'
import { useSocket } from 'use-socketio'
import { DelayQueue } from 'rx-queue'

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
    info: drive.info
  }
}

function DriveList ({ loadDrives, onKeyAdd }) {
  const updatedDrives = useRef({})

  const [drives, setDrives] = useState(() => {
    const drives = loadDrives()

    return drives.reduce((drives, drive) => {
      drives[drive.key] = buildDriveData(drive)
      return drives
    }, {})
  })

  const delay = useRef()

  function updateDrive (drive) {
    updatedDrives.current[drive.key] = buildDriveData(drive)
    delay.current.next()
  }

  // // Drive data
  const { unsubscribe: unsubscribeDriveDownload } = useSocket('drive.download', updateDrive)
  const { unsubscribe: unsubscribeDriveIndexUpdate } = useSocket('drive.indexjson.update', updateDrive)
  const { unsubscribe: unsubscribeDrivePeerAdd } = useSocket('drive.peer.add', updateDrive)
  const { unsubscribe: unsubscribeDrivePeerRemove } = useSocket('drive.peer.remove', updateDrive)
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
    delay.current = new DelayQueue(100)
    delay.current.subscribe(function () {
      const toUpdate = { ...updatedDrives.current }

      updatedDrives.current = {}

      console.log('execute', Object.keys(toUpdate).length)

      setDrives(drives => ({
        ...drives,
        ...toUpdate
      }))
    })

    return () => {
      unsubscribeDriveDownload()
      unsubscribeDriveIndexUpdate()
      unsubscribeDrivePeerAdd()
      unsubscribeDrivePeerRemove()
      unsubscribeDriveUpload()
      unsubscribeKeyAdd()
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
