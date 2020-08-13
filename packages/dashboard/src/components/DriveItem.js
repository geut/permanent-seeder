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

  function reduceFileStats (fileStats) {
    return Object.values(fileStats).reduce((total, { blocks, size }) => {
      total.sizeBlocks += blocks
      total.sizeBytes += size
      return total
    }, { sizeBlocks: 0, sizeBytes: 0 })
  }

  function updatePeers (peers, field) {
    setPeers(previousPeers => {
      const newPeers = {}

      peers.map(peer => {
        newPeers[peer.remoteAddress] = {
          ...emptyPeer(peer.remoteAddress),
          ...previousPeers[peer.remoteAddress],
          [`${field}Blocks`]: peer[`${field}Blocks`],
          [`${field}Bytes`]: peer[`${field}Bytes`]
        }
      })

      return {
        ...previousPeers,
        ...newPeers
      }
    })
  }

  function setKeyStatData ({ event, stat: { content, drive } }) {
    if (event === 'add') {
      const { sizeBlocks, sizeBytes } = reduceFileStats(drive.fileStats)

      setSizeBlocks(sizeBlocks)
      setSizeBytes(sizeBytes)
    }

    if (event === 'download') {
      setDownloadedBlocks(content.downloadedBlocks)
      setDownloadedBytes(content.downloadedBytes)

      updatePeers(content.peers, 'downloaded')
    }

    if (event === 'upload') {
      updatePeers(content.peers, 'uploaded')
    }
  }

  function emptyPeer (remoteAddress) {
    return {
      remoteAddress,
      downloadedBytes: 0,
      downloadedBlocks: 0,
      uploadedBytes: 0,
      uploadedBlocks: 0
    }
  }

  function processKeyStatsData (stats = []) {
    if (stats.length === 0) return

    const processed = stats.reduce((stats, { event, stat: { content, drive } }) => {
      if (event === 'add') {
        const { sizeBlocks, sizeBytes } = reduceFileStats(drive.fileStats)

        stats.sizeBlocks = sizeBlocks
        stats.sizeBytes = sizeBytes
      }

      if (event === 'download') {
        stats.downloadedBlocks = content.downloadedBlocks
        stats.downloadedBytes = content.downloadedBytes

        content.peers.map(peer => {
          if (!stats.peers[peer.remoteAddress]) {
            stats.peers[peer.remoteAddress] = emptyPeer(peer.remoteAddress)
          }

          stats.peers[peer.remoteAddress].downloadedBlocks = peer.downloadedBlocks
          stats.peers[peer.remoteAddress].downloadedBytes = peer.downloadedBytes
        })
      }

      if (event === 'upload') {
        content.peers.map(peer => {
          if (!stats.peers[peer.remoteAddress]) {
            stats.peers[peer.remoteAddress] = emptyPeer(peer.remoteAddress)
          }

          stats.peers[peer.remoteAddress].uploadedBlocks = peer.uploadedBlocks
          stats.peers[peer.remoteAddress].uploadedBytes = peer.uploadedBytes
        })
      }

      return stats
    }, {
      sizeBlocks: 0,
      sizeBytes: 0,
      downloadedBlocks: 0,
      downloadedBytes: 0,
      peers: {}
    })

    setSizeBlocks(processed.sizeBlocks)
    setSizeBytes(processed.sizeBytes)
    setDownloadedBlocks(processed.downloadedBlocks)
    setDownloadedBytes(processed.downloadedBytes)
    setPeers(processed.peers)
  }

  useEffect(() => {
    async function fetchInitalData () {
      const keyData = await get(`/keys/${driveKey}`)
      if (response.ok) setKeyData(keyData)

      const keyStats = await get(`/stats/keys/${driveKey}`)
      if (response.ok) processKeyStatsData(keyStats)
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
          {Object.values(peers).length === 0 && <Typography key='peers-header-empty' className={classes.noPeers} variant='h6'>No peers to show</Typography>}
          {Object.values(peers).length > 0 && (
            <>
              <DriveItemPeerHeader key={`peers-header-${driveKey}`} />
              {Object.values(peers).map(peer => <DriveItemPeer key={peer.remoteAddress} driveSizeBlocks={sizeBlocks} {...peer} />)}
            </>
          )}
        </Grid>
      )}
    </Paper>
  )
}

export default DriveItem
