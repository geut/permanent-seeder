import React from 'react'

import { makeStyles } from '@material-ui/core'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'

import PersonIcon from '@material-ui/icons/Person'

import { useHumanizedBytes } from '../hooks/unit'

import DriveItemGridContainer from './DriveItemGridContainer'

const useStyles = makeStyles(theme => ({
  root: {
    margin: theme.spacing(1)
  },

  peerIcon: {
    width: theme.spacing(8)
  },

  remoteAddress: {
    fontFamily: 'monospace',
    fontSize: '1.2rem'
  }
}))

function DriveItemPeer ({ remoteAddress, downloadedBytes, downloadedBlocks, uploadedBytes, uploadedBlocks, driveSizeBlocks }) {
  const classes = useStyles()

  const [downloaded, downloadedUnit] = useHumanizedBytes(downloadedBytes)
  const [uploaded, uploadedUnit] = useHumanizedBytes(uploadedBytes)

  const downloadedPercent = Math.round(downloadedBlocks * 100 / (driveSizeBlocks || 1))
  const uploadedPercent = Math.round(uploadedBlocks * 100 / (driveSizeBlocks || 1))

  return (
    <Grid container item spacing={2} className={classes.root}>
      <DriveItemGridContainer adjust className={classes.peerIcon}>
        <PersonIcon />
      </DriveItemGridContainer>

      <DriveItemGridContainer xs={2}>
        <Typography variant='caption' className={classes.remoteAddress}>{remoteAddress}</Typography>
      </DriveItemGridContainer>

      <DriveItemGridContainer xs={3}>
        <Typography variant='h5'>
          {downloaded} <Typography variant='caption'>{downloadedUnit}</Typography> /{' '}
          {downloadedBlocks} <Typography variant='caption'>blocks</Typography> / {' '}
          {downloadedPercent} <Typography variant='caption'>%</Typography>
        </Typography>
      </DriveItemGridContainer>

      <DriveItemGridContainer xs={3}>
        <Typography variant='h5'>
          {uploaded} <Typography variant='caption'>{uploadedUnit}</Typography> /{' '}
          {uploadedBlocks} <Typography variant='caption'>blocks</Typography> /{' '}
          {uploadedPercent} <Typography variant='caption'>%</Typography>
        </Typography>
      </DriveItemGridContainer>
    </Grid>
  )
}

export default DriveItemPeer
