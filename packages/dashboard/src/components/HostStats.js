import React, { useEffect, useState } from 'react'
import useFetch from 'use-http'

import { makeStyles } from '@material-ui/core/styles'
import BottomNavigation from '@material-ui/core/BottomNavigation'
import BottomNavigationAction from '@material-ui/core/BottomNavigationAction'
import Typography from '@material-ui/core/Typography'

import CircularProgress from './CircularProgress'

import { API_URL } from '../config'
import { useMilisecondsToHms } from '../hooks/sizes'

const useStyles = makeStyles(theme => ({
  root: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    backgroundColor: 'transparent',
    position: 'fixed',
    bottom: 0,
    width: '100%'
  }
}))

function Uptime ({ uptime }) {
  const formatted = useMilisecondsToHms(uptime)

  return (
    <Typography style={{ verticalAlign: 'center' }} variant='h6' component='div' color='textSecondary' gutterBottom>
      {formatted}
    </Typography>
  )
}

function HostStats () {
  const classes = useStyles()

  const { get, response } = useFetch(API_URL)
  const [stats, setStats] = useState({ cpu: 0, mem: 0, uptime: 0, loadavg: [0, 0, 0] })

  useEffect(() => {
    async function fetchInitalData () {
      const hostStats = await get('/stats/host')
      if (response.ok) setStats(hostStats)
    }

    fetchInitalData()
  }, [])

  return (
    <BottomNavigation
      showLabels
      className={classes.root}
    >
      <BottomNavigationAction label='CPU' icon={<CircularProgress value={Math.round(stats.cpu * 100)} />} />
      <BottomNavigationAction label='Memory' icon={<CircularProgress value={Math.round(stats.mem * 100)} />} />
      <BottomNavigationAction label='Uptime' icon={<Uptime uptime={stats.uptime} />} />
      <BottomNavigationAction label='Load' icon={<CircularProgress value={stats.loadavg[1]} />} />
    </BottomNavigation>
  )
}

export default HostStats
