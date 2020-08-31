import React, { useEffect, useState } from 'react'
import useFetch from 'use-http'
import { useSocket } from 'use-socketio'
import { CopyToClipboard } from 'react-copy-to-clipboard'

import { makeStyles } from '@material-ui/core'
import IconButton from '@material-ui/core/IconButton'
import InfoIcon from '@material-ui/icons/Info'
import FoldIcon from '@material-ui/icons/UnfoldLess'
import UnfoldIcon from '@material-ui/icons/UnfoldMore'
import Grid from '@material-ui/core/Grid'
import LinearProgress from '@material-ui/core/LinearProgress'
import Paper from '@material-ui/core/Paper'
import Tooltip from '@material-ui/core/Tooltip'
import Typography from '@material-ui/core/Typography'
import indigo from '@material-ui/core/colors/indigo'

import { API_URL } from '../config'

import { useHumanizedBytes } from '../hooks/unit'

import DriveItemGridContainer from './DriveItemGridContainer'
import DriveFiles from './DriveFiles'
import DrivePeers from './DrivePeers'
import DriveInfoDialog from './DriveInfo'

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

  const [title, setTitle] = useState('')
  const [sizeBlocks, setSizeBlocks] = useState(0)
  const [sizeBytes, setSizeBytes] = useState(0)
  const [downloadedBlocks, setDownloadedBlocks] = useState(0)
  const [files, setFiles] = useState({})
  const [peers, setPeers] = useState([])
  const [driveInfo, setDriveInfo] = useState({})
  const [showInfo, setShowInfo] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const { get, response, error } = useFetch(API_URL)

  const { socket } = useSocket()

  const { unsubscribe: unsubscribeDriveUpadte } = useSocket(`drive.${driveKey}.update`, () => {
    socket.emit('drive.stats', driveKey, setFiles)
  })

  const { unsubscribe: unsubscribeDriveDownload } = useSocket(`drive.${driveKey}.download`, () => {
    socket.emit('drive.size', driveKey, size => {
      setSizeBlocks(size.blocks)
      setSizeBytes(size.bytes)
      setDownloadedBlocks(size.downloadedBlocks)
    })

    socket.emit('drive.peers', driveKey, setPeers)
  })

  const { unsubscribe: unsubscribeDriveUpload } = useSocket(`drive.${driveKey}.upload`, () => {
    socket.emit('drive.peers', driveKey, setPeers)
  })

  const { unsubscribe: unsubscribeDrivePeerAdd } = useSocket(`drive.${driveKey}.peer.add`, () => {
    socket.emit('drive.peers', driveKey, setPeers)
  })

  const { unsubscribe: unsubscribeDrivePeerRemove } = useSocket(`drive.${driveKey}.peer.remove`, () => {
    socket.emit('drive.peers', driveKey, setPeers)
  })

  useEffect(() => {
    async function fetchInitalData () {
      const drive = await get(`/drives/${driveKey}`)

      if (!response.ok) {
        console.warn(error)
        return
      }

      setTitle(drive.key.title)
      setSizeBlocks(drive.size.blocks)
      setSizeBytes(drive.size.bytes)
      setDownloadedBlocks(drive.size.downloadedBlocks)
      setFiles(drive.stats)
      setPeers(drive.peers)

      const driveInfo = await get(`/drives/${driveKey}/info`)
      if (!response.ok) {
        console.warn(error)
        return
      }

      setDriveInfo(driveInfo)
    }

    fetchInitalData()

    return () => {
      unsubscribeDriveUpadte()
      unsubscribeDriveDownload()
      unsubscribeDriveUpload()
      unsubscribeDrivePeerAdd()
      unsubscribeDrivePeerRemove()
    }
  }, [driveKey])

  const downloadPercent = Math.round(downloadedBlocks * 100 / (sizeBlocks || 1))

  const bytesPerBlock = sizeBytes / (sizeBlocks || 1)
  const [size, sizeUnit] = useHumanizedBytes(sizeBytes)
  const [download, downloadUnit] = useHumanizedBytes(downloadedBlocks * bytesPerBlock)

  const openDetails = () => {
    setShowDetails(true)
  }
  const closeDetails = () => {
    setShowDetails(false)
  }

  return (
    <Paper className={classes.root} elevation={5}>
      <div className={classes.driveContainer}>
        <Grid container>
          <DriveItemGridContainer xs alignItems='center' justify='center'>
            <Grid container direction='column' alignItems='flex-start'>
              <Typography variant='h4'>{title}</Typography>
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
              <Grid container alignItems='flex-start'>
                <IconButton onClick={() => setShowInfo(showInfo => !showInfo)}>{showInfo ? <FoldIcon /> : <UnfoldIcon />}</IconButton>
                <IconButton aria-label='drive details' onClick={openDetails}><InfoIcon /></IconButton>
                <DriveInfoDialog open={showDetails} onClose={closeDetails} info={driveInfo} />
              </Grid>
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
            <Typography variant='h3'>{peers.length}</Typography>
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
            {peers.length === 0 && <Typography key='peers-header-empty' className={classes.noItems} variant='h6'>No peers to show</Typography>}
            {peers.length > 0 && <DrivePeers peers={peers} driveSizeBlocks={sizeBlocks} />}
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
