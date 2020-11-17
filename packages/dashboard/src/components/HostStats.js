import React, { useEffect, useState } from 'react'
import useFetch from 'use-http'
import { useLastMessage } from 'use-socketio'

import { makeStyles } from '@material-ui/core/styles'
import BottomNavigation from '@material-ui/core/BottomNavigation'
import BottomNavigationAction from '@material-ui/core/BottomNavigationAction'
import Typography from '@material-ui/core/Typography'

import CircularProgress from './CircularProgress'

import { API_URL } from '../config'
import { useMilisecondsToHms } from '../hooks/unit'
import { humanizedBytes } from '../format'

const useStyles = makeStyles(theme => ({
  root: {
    height: theme.spacing(7),
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    backgroundColor: 'transparent',
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

const DiskData = ({ disk = { directory: 0 } }) => {
  return (
    <Typography style={{ verticalAlign: 'center' }} variant='h6' component='div' color='textSecondary' gutterBottom>
      {humanizedBytes(disk.directory).pretty}
    </Typography>
  )
}

function HostStats () {
  const classes = useStyles()

  const { get, response } = useFetch(API_URL)
  const [stats, setStats] = useState({ cpu: 0, mem: 0, uptime: 0, loadavg: [0, 0, 0], disk: { directory: 0 } })
  const { data: liveHostStat, unsubscribe } = useLastMessage('stats.host')

  useEffect(() => {
    async function fetchInitalData () {
      const hostStats = await get('/stats/host')

      if (response.ok) setStats(hostStats)
    }

    fetchInitalData()

    return () => unsubscribe()
    // eslint-disable-next-line
  }, [])

  useEffect(() => {
    if (!liveHostStat) return
    setStats(liveHostStat)
  }, [liveHostStat])

  return (
    <BottomNavigation
      showLabels
      className={classes.root}
    >
      <BottomNavigationAction label='CPU' icon={<CircularProgress value={Math.round(stats.cpu * 100)} />} />
      <BottomNavigationAction label='Memory' icon={<CircularProgress value={Math.round(stats.mem * 100)} />} />
      <BottomNavigationAction label='Uptime' icon={<Uptime uptime={stats.uptime} />} />
      <BottomNavigationAction label='Load' icon={<CircularProgress value={stats.loadavg[1]} />} />
      <BottomNavigationAction label='Disk Usage' icon={<DiskData disk={stats.disk} />} />
    </BottomNavigation>
  )
}

export default HostStats
