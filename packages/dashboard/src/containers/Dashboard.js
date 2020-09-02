import React, { useEffect, useState } from 'react'
import { useSocket } from 'use-socketio'
import useFetch from 'use-http'

import { makeStyles } from '@material-ui/core'

import { API_URL } from '../config'
import { useAppBarTitle } from '../hooks/layout'

import DriveItem from '../components/DriveItem'
import DriveItemHeader from '../components/DriveItemHeader'
import HostStats from '../components/HostStats'

const useStyles = makeStyles((theme) => ({
  root: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },

  drives: {
    padding: theme.spacing(2),
    paddingTop: 0,
    flexGrow: 1
  },

  hostStats: {
    flexShrink: 1,
    flexGrow: 0
  }
}))

function Dashboard () {
  const classes = useStyles()
  const [, setAppBarTitle] = useAppBarTitle()
  const [keys, setKeys] = useState({})

  useEffect(() => {
    setAppBarTitle('Permanent Seeder')
  }, [setAppBarTitle])

  const { get, response } = useFetch(API_URL)

  // New keys
  const { unsubscribe: unsubscribeKeyAdd } = useSocket('drive.add', key => {
    setKeys(keys => ({ ...keys, [key]: key }))
  })

  // Removed keys
  const { unsubscribe: unsubscribeKeyRemove } = useSocket('drive.remove', key => {
    setKeys(keys => {
      const { [key]: deletedKey, ...newKeys } = keys
      return newKeys
    })
  })

  // Existing keys
  useEffect(() => {
    async function fetchInitalData () {
      const drives = await get('/drives')
      if (response.ok) {
        setKeys(drives.reduce((keys, drive) => {
          keys[drive.key.publicKey] = drive.key.publicKey
          return keys
        }, {}))
      }
    }

    fetchInitalData()

    return () => {
      unsubscribeKeyAdd()
      unsubscribeKeyRemove()
    }
  }, [])

  return (
    <div id='dashboard' className={classes.root}>
      <div className={classes.drives}>
        <DriveItemHeader />
        {Object.values(keys).map(key => <DriveItem key={key} driveKey={key} />)}
      </div>
      <div className={classes.hostStats}>
        <HostStats />
      </div>
    </div>
  )
}

export default Dashboard
