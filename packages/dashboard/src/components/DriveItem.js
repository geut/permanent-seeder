import React, { useEffect, useState } from 'react'
import useFetch from 'use-http'
import { useLastMessage } from 'use-socketio'

import { makeStyles } from '@material-ui/core'
import Grid from '@material-ui/core/Grid'
import LinearProgress from '@material-ui/core/LinearProgress'
import Paper from '@material-ui/core/Paper'
import Typography from '@material-ui/core/Typography'

import { API_URL } from '../config'

import { useHumanizedBytes } from '../hooks/sizes'

import DriveItemGridContainer from './DriveItemGridContainer'
import DriveItemPeer from './DriveItemPeer'
import DriveItemPeerHeader from './DriveItemPeerHeader'

const useStyles = makeStyles(theme => ({
  root: {
    marginBottom: theme.spacing(2)
  },

  driveContainer: {
    padding: theme.spacing(2)
  },

  driveKey: {
    fontFamily: 'monospace',
    fontSize: '1.2rem'
  },

  transferProgress: {
    height: theme.spacing(1.5)
  },

  noPeers: {
    margin: theme.spacing()
  }
}))

function DriveItem ({ driveKey }) {
  const classes = useStyles()

  const [keyData, setKeyData] = useState({})

  const [sizeBlocks, setSizeBlocks] = useState(0)
  const [sizeBytes, setSizeBytes] = useState(0)
  const [downloadedBlocks, setDownloadedBlocks] = useState(0)
  const [downloadedBytes, setDownloadedBytes] = useState(0)

  const [peers, setPeers] = useState({})
  const [showPeers, setShowPeers] = useState(false)

  const { get, response } = useFetch(API_URL)

  const { data: liveKeyStat, unsubscribe } = useLastMessage(`stats.keys.${driveKey}`)

  function setKeyStatData (data) {
    const { content, drive } = data

    const { blocks: sizeBlocks, size: sizeBytes } = Object.values(drive.fileStats).reduce((total, { blocks, size }) => {
      total.blocks += blocks
      total.size += size
      return total
    }, { blocks: 0, size: 0 })

    setSizeBlocks(sizeBlocks)
    setSizeBytes(sizeBytes)
    setDownloadedBlocks(content.downloadedBlocks)
    setDownloadedBytes(content.downloadedBytes)

    setPeers(peers => ({
      ...peers,
      ...content.peers.reduce((peers, peer) => ({ ...peers, [peer.remoteAddress]: peer }), {})
    }))
  }

  useEffect(() => {
    async function fetchInitalData () {
      const keyData = await get(`/keys/${driveKey}`)
      if (response.ok) setKeyData(keyData)

      const keyStat = await get(`/stats/keys/${driveKey}/latest`)
      if (response.ok && keyStat.stat) setKeyStatData(keyStat.stat)
    }

    fetchInitalData()

    return () => unsubscribe()
  }, [driveKey])

  useEffect(() => {
    if (!liveKeyStat) return
    setKeyStatData(liveKeyStat)
  }, [liveKeyStat])

  const downloadPercent = Math.round(downloadedBlocks * 100 / (sizeBlocks || 1))

  const [size, sizeUnit] = useHumanizedBytes(sizeBytes)
  const [download, downloadUnit] = useHumanizedBytes(downloadedBytes)

  if (!keyData) {
    return null
  }

  return (
    <Paper className={classes.root} elevation={5}>
      <div className={classes.driveContainer} onClick={() => setShowPeers(showPeers => !showPeers)}>
        <Grid container>
          <DriveItemGridContainer xs alignItems='center' justify='center'>
            <Grid container direction='column'>
              <Typography variant='h4'>{keyData.title}</Typography>
              <Typography variant='subtitle1' className={classes.driveKey}>{driveKey}</Typography>
            </Grid>
          </DriveItemGridContainer>

          <DriveItemGridContainer>
            <Typography variant='h3'>{size} <Typography variant='caption'>{sizeUnit}</Typography></Typography>
            <Typography variant='h6' align='center'>{sizeBlocks} <Typography variant='caption'>blocks</Typography></Typography>
          </DriveItemGridContainer>

          <DriveItemGridContainer xs={2} direction='row'>
            <Grid container item xs direction='column' alignItems='flex-end' justify='center'>
              <Typography variant='h3'>{downloadPercent}%</Typography>
            </Grid>
            <Grid container item xs direction='column' alignItems='center'>
              <Typography variant='h3'>{download} <Typography variant='caption'>{downloadUnit}</Typography></Typography>
              <Typography variant='h6' align='center'>{downloadedBlocks} <Typography variant='caption'>blocks</Typography></Typography>
            </Grid>
          </DriveItemGridContainer>
          <DriveItemGridContainer>
            <Typography variant='h3'>{Object.keys(peers).length}</Typography>
          </DriveItemGridContainer>
        </Grid>
      </div>

      <LinearProgress
        value={downloadPercent}
        variant='determinate'
        className={classes.transferProgress}
      />

      {showPeers && (
        <Grid container>
          {Object.values(peers).length === 0 && <Typography className={classes.noPeers} variant='h6'>No peers to show</Typography>}
          {Object.values(peers).length > 0 && (
            <>
              <DriveItemPeerHeader />
              {Object.values(peers).map(peer => <DriveItemPeer key={peer.remoteAddress} driveSizeBlocks={sizeBlocks} {...peer} />)}
            </>
          )}
        </Grid>
      )}
    </Paper>
  )
}

export default DriveItem
