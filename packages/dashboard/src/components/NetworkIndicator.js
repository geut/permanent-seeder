import React, { useEffect, useState } from 'react'
import { useLastMessage } from 'use-socketio'

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
  const [network, setNetwork] = useState({ swarm: {} })
  const { data: lastMessageNetwork, unsubscribe } = useLastMessage('stats.network')

  useEffect(() => {
    if (!lastMessageNetwork) return

    setNetwork(network => ({ ...network, ...lastMessageNetwork }))
  }, [lastMessageNetwork])

  useEffect(() => unsubscribe, [])

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
          </Grid>
        </>
      }
    >
      <WifiRoundedIcon color={color} classes={networkIconClasses} />
    </Tooltip>
  )
}

export default NetworkIndicator
