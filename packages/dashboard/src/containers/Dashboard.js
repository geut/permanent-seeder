import React, { useEffect, useState } from 'react'
import { useSocket } from 'use-socketio'
import useFetch from 'use-http'
import { HotKeys } from 'react-hotkeys'
import { encode } from 'dat-encoding'

import { makeStyles } from '@material-ui/core'

import { API_URL } from '../config'
import { useAppBarTitle } from '../hooks/layout'

import DriveItem from '../components/DriveItem'
import DriveItemHeader from '../components/DriveItemHeader'
import HostStats from '../components/HostStats'
import AddKeyDialog from '../components/AddKeyDialog'

const useStyles = makeStyles((theme) => ({
  root: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    flexWrap: 'nowrap'
  },

  expand: {
    flex: 1,
    display: 'flex'
  },

  drives: {
    flex: 1,
    flexBasis: theme.spacing(11), // HotStats height
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    overflowY: 'auto'
  },

  hostStats: {
    height: theme.spacing(11),
    flex: 0
  }
}))

function Dashboard () {
  const classes = useStyles()
  const [, setAppBarTitle] = useAppBarTitle()
  const [keys, setKeys] = useState({})
  const [addKeyDialogOpen, setAddKeyDialogOpen] = useState(false)
  const [addKeyDialogError, setAddKeyDialogError] = useState(null)
  const [addKeyDialogKey, setAddKeyDialogKey] = useState(null)

  useEffect(() => {
    setAppBarTitle('Permanent Seeder')
  }, [setAppBarTitle])

  const { get, post, response, error } = useFetch(API_URL)

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

  function handleKeyAddDialogClose () {
    setAddKeyDialogOpen(false)
  }

  function handleKeyAddDialogOpen (key = '') {
    setAddKeyDialogError(null)
    setAddKeyDialogKey(key)
    setAddKeyDialogOpen(true)
  }

  async function handleKeyAdd (key) {
    await post('/drives', { key })
    if (response.ok) {
      handleKeyAddDialogClose()
      setAddKeyDialogError(null)
    } else {
      setAddKeyDialogError(error ? error.message : response.data)
    }
  }

  const keyMap = {
    PASTE_KEY: 'ctrl+v'
  }

  const handlers = {
    PASTE_KEY: async event => {
      const key = await navigator.clipboard.readText()
      try {
        const validKey = encode(key)
        handleKeyAddDialogOpen(validKey)
      } catch (error) {
        console.warn(error)
      }
    }
  }

  return (
    <HotKeys keyMap={keyMap} className={classes.expand}>
      <HotKeys handlers={handlers} className={classes.expand}>
        <AddKeyDialog
          open={addKeyDialogOpen}
          keyToAdd={addKeyDialogKey}
          onAdd={handleKeyAdd}
          onClose={handleKeyAddDialogClose}
          error={addKeyDialogError}
        />
        <div className={classes.root}>
          <div className={classes.drives}>
            <DriveItemHeader onKeyAdd={() => handleKeyAddDialogOpen()} />
            {Object.values(keys).map(key => <DriveItem key={key} driveKey={key} />)}
          </div>
          <div className={classes.hostStats}>
            <HostStats />
          </div>
        </div>
      </HotKeys>
    </HotKeys>
  )
}

export default Dashboard
