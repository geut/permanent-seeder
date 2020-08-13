import React, { useEffect, useState } from 'react'
import useFetch from 'use-http'

import { makeStyles } from '@material-ui/core/styles'
import BottomNavigation from '@material-ui/core/BottomNavigation'
import BottomNavigationAction from '@material-ui/core/BottomNavigationAction'
import CircularProgress from './CircularProgress'
import Typography from '@material-ui/core/Typography'

import { API_URL } from '../config'

const useStyles = makeStyles({
  root: {
    position: 'fixed',
    top: 'auto',
    bottom: 0,
    flexGrow: 1,
    width: '100vw',
    backgroundColor: 'transparent'
  },
  card: {
    minWidth: 100,
    fontSize: 14
  },
  title: {
    fontSize: 14
  },
  pos: {
    marginBottom: 12
  }
})

function HostStats () {
  const classes = useStyles()

  const { get, response } = useFetch(API_URL)
  const [stats, setStats] = useState({ cpu: 10, mem: 0, uptime: '00:00', loadavg: 0 })

  useEffect(() => {
    async function fetchInitalData () {
      const hostStats = await get('/stats/host')
      if (response.ok) setStats(hostStats)
    }

    fetchInitalData()
  }, [])

  const UptimeElem = (uptime) => (
    <Typography style={{ verticalAlign: 'center' }} variant='h6' component='div' color='textSecondary' gutterBottom>
      {uptime}
    </Typography>
  )

  return (
    <BottomNavigation
      showLabels
      className={classes.root}
    >
      <BottomNavigationAction label='CPU' icon={<CircularProgress value={stats.cpu} />} />
      <BottomNavigationAction label='Memory' icon={<CircularProgress value={stats.mem} />} />
      <BottomNavigationAction label='Uptime' icon={UptimeElem(stats.uptime)} />
      <BottomNavigationAction label='Load' icon={<CircularProgress value={stats.loadavg} />} />
    </BottomNavigation>
  )
}

export default HostStats

/*
 *<Grid container justify='center' spacing={1}>
        <Grid key='cpu' item>
          <CardWithStat className={classes.card} title='CPU' value={stats.cpu} />
        </Grid>
        <Grid key='mem' item>
          <CardWithStat title='Mem' value={stats.mem} />
        </Grid>
        <Grid key='uptime' item>
          <CardWithStat title='Up' value={stats.uptime} />
        </Grid>
        <Grid key='load' item>
          <CardWithStat title='Load' value={stats.loadavg} />
        </Grid>
        <Grid key='disk' item />
      </Grid>

 */
