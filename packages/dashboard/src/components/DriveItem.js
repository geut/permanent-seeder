import React, { useEffect, useState } from 'react'
import useFetch from 'use-http'
import { useLastMessage } from 'use-socketio'
import { CopyToClipboard } from 'react-copy-to-clipboard'

import { makeStyles } from '@material-ui/core'
import Button from '@material-ui/core/Button'
import Grid from '@material-ui/core/Grid'
import LinearProgress from '@material-ui/core/LinearProgress'
import Paper from '@material-ui/core/Paper'
import Tooltip from '@material-ui/core/Tooltip'
import Typography from '@material-ui/core/Typography'

import { API_URL } from '../config'

import { useHumanizedBytes } from '../hooks/unit'

import DriveItemGridContainer from './DriveItemGridContainer'
import DriveFiles from './DriveFiles'
import DrivePeers from './DrivePeers'
import { indigo } from '@material-ui/core/colors'

const useStyles = makeStyles(theme => ({
  root: {
    marginBottom: theme.spacing(2)
  },

  driveContainer: {
    padding: theme.spacing(2)
  },

  driveKey: {
    fontFamily: 'monospace',
    fontSize: '1.2rem',
    cursor: 'pointer'
  },

  transferProgress: {
    height: theme.spacing(1.5)
  },

  noItems: {
    margin: theme.spacing()
  },

  infoItem: {
    padding: theme.spacing(2),
    backgroundColor: indigo[100]
  }
}))

function DriveItem ({ driveKey }) {
  const classes = useStyles()

  const [keyData, setKeyData] = useState({})

  const [sizeBlocks, setSizeBlocks] = useState(0)
  const [sizeBytes, setSizeBytes] = useState(0)
  const [downloadedBlocks, setDownloadedBlocks] = useState(0)
  const [downloadedBytes, setDownloadedBytes] = useState(0)
  const [files, setFiles] = useState([])

  const [peers, setPeers] = useState({})
  const [showInfo, setShowInfo] = useState(false)

  const { get, response } = useFetch(API_URL)

  const { data: liveKeyStat, unsubscribe } = useLastMessage(`stats.keys.${driveKey}`)

  function reduceFileStats (fileStats = {}) {
    return Object.entries(fileStats).reduce((total, [fileName, { blocks, size, downloadedBlocks }]) => {
      total.sizeBlocks += blocks
      total.sizeBytes += size
      total.downloadedBlocks += downloadedBlocks
      total.downloadedBytes += downloadedBlocks * size / blocks
      total.files = {
        ...total.files,
        [fileName]: { blocks, size }
      }

      return total
    }, { sizeBlocks: 0, sizeBytes: 0, downloadedBlocks: 0, downloadedBytes: 0, files: {} })
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
    if (event === 'add' || event === 'download') {
      const { sizeBlocks, sizeBytes, downloadedBlocks, downloadedBytes, files } = reduceFileStats(drive.fileStats)

      if (event === 'add') {
        setFiles(files)
        setSizeBlocks(sizeBlocks)
        setSizeBytes(sizeBytes)
        setDownloadedBlocks(downloadedBlocks)
        setDownloadedBytes(downloadedBytes)
      } else {
        updatePeers(content.peers, 'downloaded')
      }
    }

    // if (event === 'download') {
    // }

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
      if (event === 'add' || event === 'download') {
        const { sizeBlocks, sizeBytes, downloadedBlocks, downloadedBytes, files } = reduceFileStats(drive.fileStats)

        if (event === 'add') {
          stats.files = files
          stats.sizeBlocks = sizeBlocks
          stats.sizeBytes = sizeBytes
          stats.downloadedBlocks = downloadedBlocks
          stats.downloadedBytes = downloadedBytes
        } else {
          content.peers.map(peer => {
            if (!stats.peers[peer.remoteAddress]) {
              stats.peers[peer.remoteAddress] = emptyPeer(peer.remoteAddress)
            }

            stats.peers[peer.remoteAddress].downloadedBlocks = peer.downloadedBlocks
            stats.peers[peer.remoteAddress].downloadedBytes = peer.downloadedBytes
          })
        }
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
      peers: {},
      files: {}
    })

    setSizeBlocks(processed.sizeBlocks)
    setSizeBytes(processed.sizeBytes)
    setDownloadedBlocks(processed.downloadedBlocks)
    setDownloadedBytes(processed.downloadedBytes)
    setPeers(processed.peers)
    setFiles(processed.files)
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
      <div className={classes.driveContainer}>
        <Grid container>
          <DriveItemGridContainer xs alignItems='center' justify='center'>
            <Grid container direction='column' alignItems='flex-start'>
              <Typography variant='h4'>{keyData.title}</Typography>
              <div onClick={e => e.stopPropagation()}>
                <CopyToClipboard text={driveKey}>
                  <Tooltip title='Click to copy'>
                    <Typography
                      variant='subtitle1'
                      className={classes.driveKey}
                    >
                      {driveKey}
                    </Typography>
                  </Tooltip>
                </CopyToClipboard>
              </div>
              <Button color='primary' onClick={() => setShowInfo(showInfo => !showInfo)}>{showInfo ? 'Hide' : 'Show'} info</Button>
            </Grid>
          </DriveItemGridContainer>

          <DriveItemGridContainer>
            <Typography variant='h4'>{size} <Typography variant='caption'>{sizeUnit}</Typography></Typography>
            <Typography variant='h6' align='center'>{sizeBlocks} <Typography variant='caption'>blocks</Typography></Typography>
          </DriveItemGridContainer>

          <DriveItemGridContainer xs={3} direction='row'>
            <Grid container item xs direction='column' alignItems='flex-end' justify='center'>
              <Typography variant='h3'>{downloadPercent}%</Typography>
            </Grid>
            <Grid container item xs direction='column' alignItems='center'>
              <Typography variant='h4'>{download} <Typography variant='caption'>{downloadUnit}</Typography></Typography>
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

      {showInfo && (
        <Grid container>
          <Grid item xs className={classes.infoItem}>
            {Object.values(peers).length === 0 && <Typography key='peers-header-empty' className={classes.noItems} variant='h6'>No peers to show</Typography>}
            {Object.values(peers).length > 0 && <DrivePeers peers={peers} driveSizeBlocks={sizeBlocks} />}
          </Grid>
          <Grid item xs={4} className={classes.infoItem}>
            {Object.values(files).length === 0 && <Typography key='files-header-empty' className={classes.noItems} variant='h6'>No files to show</Typography>}
            {Object.values(files).length > 0 && <DriveFiles files={files} />}
          </Grid>
        </Grid>
      )}
    </Paper>
  )
}

export default DriveItem
