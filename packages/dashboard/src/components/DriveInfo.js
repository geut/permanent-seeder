import React from 'react'

import { makeStyles } from '@material-ui/core'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import indigo from '@material-ui/core/colors/indigo'

import DrivePeers from './DrivePeers'
import DriveFiles from './DriveFiles'

const useStyles = makeStyles(theme => ({
  root: {
    padding: 8
  },

  infoItem: {
    backgroundColor: indigo[100]
  },

  noItems: {
    margin: theme.spacing()
  }
}))

function DriveInfo ({ peers, files, sizeBytes }) {
  const classes = useStyles()

  return (
    <div className={classes.root}>
      <Grid container spacing={2}>
        <Grid item xs className={classes.infoItem}>
          {peers.length === 0 && <Typography key='peers-header-empty' className={classes.noItems} variant='h6'>No peers to show</Typography>}
          {peers.length > 0 && <DrivePeers peers={peers} driveSize={sizeBytes} />}
        </Grid>
        <Grid item xs={4} className={classes.infoItem}>
          {Object.values(files).length === 0 && <Typography key='files-header-empty' className={classes.noItems} variant='h6'>No files to show</Typography>}
          {Object.values(files).length > 0 && <DriveFiles files={files} />}
        </Grid>
      </Grid>
    </div>
  )
}

export default DriveInfo
