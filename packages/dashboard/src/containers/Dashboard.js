import React, { Suspense, useEffect } from 'react'
import { useAsyncResource } from 'use-async-resource'

import { makeStyles } from '@material-ui/core'
import Box from '@material-ui/core/Box'
import LinearProgress from '@material-ui/core/LinearProgress'

import { API_URL } from '../config'

import { useAppBarTitle } from '../hooks/layout'

import HostStats from '../components/HostStats'
import DriveList from '../components/DriveList'

const useStyles = makeStyles((theme) => ({
  root: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    flexWrap: 'nowrap'
  },

  fullLoaderWrapper: {
    marginLeft: -theme.spacing(7),
    width: '100vw'
  },
  fullLoader: {
    width: '100vw',
    height: 5
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

const fetchDrives = () => window.fetch(`${API_URL}/drives`).then(res => res.json())

function Dashboard () {
  const classes = useStyles()
  const [, setAppBarTitle] = useAppBarTitle()

  const [loadDrives] = useAsyncResource(fetchDrives, [])

  useEffect(() => {
    setAppBarTitle('Permanent Seeder')
  }, [setAppBarTitle])

  return (
    <div className={classes.root}>
      <div className={classes.drives}>
        <Suspense fallback={
          <Box className={classes.fullLoaderWrapper}>
            <LinearProgress color='secondary' className={classes.fullLoader} />
          </Box>
        }
        >

          <DriveList loadDrives={loadDrives} />
        </Suspense>
      </div>
      <div className={classes.hostStats}>
        <HostStats />
      </div>
    </div>
  )
}

export default Dashboard
