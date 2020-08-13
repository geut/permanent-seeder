import React, { useEffect, useState } from 'react'
import { useSocket } from 'use-socketio'
import useFetch from 'use-http'

import { API_URL } from '../config'
import { useAppBarTitle } from '../hooks/layout'

import DriveItem from '../components/DriveItem'
import DriveItemHeader from '../components/DriveItemHeader'
import HostStats from '../components/HostStats'

function reduceKeys (keys = []) {
  return keys.reduce((keys, keyRecord) => {
    keys[keyRecord.key] = keyRecord
    return keys
  }, {})
}

function Dashboard () {
  const [, setAppBarTitle] = useAppBarTitle()
  const [keys, setKeys] = useState({})

  const { unsubscribe } = useSocket('keys', keys => {
    setKeys(reduceKeys(keys))
  })

  useEffect(() => {
    setAppBarTitle('Permanent Seeder')
  }, [setAppBarTitle])

  const { get, response } = useFetch(API_URL)

  useEffect(() => {
    async function fetchInitalData () {
      const keys = await get('/keys')
      if (response.ok) setKeys(reduceKeys(keys))
    }

    fetchInitalData()

    return () => unsubscribe()
  }, [])

  return (
    <div>
      <DriveItemHeader />
      {Object.keys(keys).map(key => <DriveItem key={key} driveKey={key} />)}
      <HostStats />
    </div>
  )
}

export default Dashboard
