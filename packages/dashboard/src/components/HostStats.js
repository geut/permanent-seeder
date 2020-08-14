import React, { useEffect, useState } from 'react'
import useFetch from 'use-http'
import { useLastMessage } from 'use-socketio'

import { makeStyles, withStyles } from '@material-ui/core/styles'
import Avatar from '@material-ui/core/Avatar'
import BottomNavigation from '@material-ui/core/BottomNavigation'
import BottomNavigationAction from '@material-ui/core/BottomNavigationAction'
import Button from '@material-ui/core/Button'
import ClickAwayListener from '@material-ui/core/ClickAwayListener'
import Typography from '@material-ui/core/Typography'
import Tooltip from '@material-ui/core/Tooltip'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import ListItemAvatar from '@material-ui/core/ListItemAvatar'
import DataUsageIcon from '@material-ui/icons/DataUsage'

import CircularProgress from './CircularProgress'

import { API_URL } from '../config'
import { useMilisecondsToHms } from '../hooks/unit'

const useStyles = makeStyles(theme => ({
  root: {
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

const HtmlTooltip = withStyles((theme) => ({
  tooltip: {
    backgroundColor: '#f5f5f9',
    color: 'rgba(0, 0, 0, 0.87)',
    maxWidth: 220,
    fontSize: theme.typography.pxToRem(12),
    border: '1px solid #dadde9'
  }
}))(Tooltip)

const DiskData = ({ disks = [] }) => {
  const [open, setOpen] = useState(false)
  const diskItem = (datum, i) => (
    <ListItem key={i}>
      <ListItemAvatar>
        <Avatar>
          <DataUsageIcon />
        </Avatar>
      </ListItemAvatar>
      <ListItemText primary={datum._filesystem} secondary={datum._capacity} />
    </ListItem>
  )
  const handleTooltipClose = () => {
    setOpen(false)
  }

  const handleTooltipOpen = () => {
    setOpen(true)
  }

  return (
    <ClickAwayListener onClickAway={handleTooltipClose}>
      <div>
        <HtmlTooltip
          PopperProps={{
            disablePortal: true
          }}
          onClose={handleTooltipClose}
          open={open}
          disableFocusListener
          disableHoverListener
          disableTouchListener
          title={
            <>
              <List>
                {disks.map((d, idx) => diskItem(d, idx))}
              </List>
            </>
          }
        >
          <Button onClick={handleTooltipOpen}>FS</Button>
        </HtmlTooltip>
      </div>
    </ClickAwayListener>
  )
}

function HostStats () {
  const classes = useStyles()

  const { get, response } = useFetch(API_URL)
  const [stats, setStats] = useState({ cpu: 0, mem: 0, uptime: 0, loadavg: [0, 0, 0], disk: [] })
  const { data: liveHostStat, unsubscribe } = useLastMessage('host.stats')

  useEffect(() => {
    async function fetchInitalData () {
      const hostStats = await get('/stats/host')
      if (response.ok) setStats(hostStats)
    }

    fetchInitalData()

    return () => unsubscribe()
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
      <BottomNavigationAction label='Disk Usage' icon={<DiskData disks={stats.disk} />} />
    </BottomNavigation>
  )
}

export default HostStats
