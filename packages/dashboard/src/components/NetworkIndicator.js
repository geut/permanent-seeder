import React, { useEffect, useState } from 'react'
import { useSocket } from 'use-socketio'
import useFetch from 'use-http'

import { API_URL } from '../config'

import { makeStyles } from '@material-ui/core'
import Grid from '@material-ui/core/Grid'
import orange from '@material-ui/core/colors/orange'
import teal from '@material-ui/core/colors/teal'
import WifiRoundedIcon from '@material-ui/icons/WifiRounded'

import Tooltip from './Tooltip'
import TooltipInfoItem from './TooltipInfoItem'
import StatusChip from './StatusChip'

const useNetworkIconStyles = makeStyles(theme => ({
  colorPrimary: {
    color: teal[500]
  },

  colorSecondary: {
    color: orange[500]
  }
}))

function NetworkIndicator () {
  const networkIconClasses = useNetworkIconStyles()
  const [network, setNetwork] = useState({ swarm: { currentPeers: [] } })

  const { get, response, error } = useFetch(API_URL)

  useSocket('stats.network', (stats) => {
    setNetwork(network => ({ ...network, ...stats }))
  })

  useEffect(() => {
    async function fetchInitalData () {
      const networkInfo = await get('/stats/network')
      if (!response.ok) {
        console.warn(error)
        return
      }

      setNetwork(network => ({ ...network, ...networkInfo }))
    }

    fetchInitalData()
    // eslint-disable-next-line
  }, [])

  const color = !network.online
    ? 'error'
    : (
      !network.swarm?.holepunchable
        ? 'secondary'
        : 'primary'
    )

  return (
    <Tooltip
      interactive
      width={300}
      title={
        <>
          <Grid container direction='column' spacing={1}>
            <TooltipInfoItem
              label='Online'
              value={
                <StatusChip condition={network.online} />
              }
            />
            <TooltipInfoItem
              label='Holepunchable'
              value={
                <StatusChip condition={network.swarm.holepunchable} />
              }
            />
            <TooltipInfoItem
              label='Address'
              value={
                <StatusChip label={network.swarm.remoteAddress} />
              }
            />
            <TooltipInfoItem
              label='Total Peers'
              value={
                <StatusChip label={network.swarm.currentPeers.length} />
              }
            />
          </Grid>
        </>
      }
    >
      <WifiRoundedIcon color={color} classes={networkIconClasses} />
    </Tooltip>
  )
}

export default NetworkIndicator
