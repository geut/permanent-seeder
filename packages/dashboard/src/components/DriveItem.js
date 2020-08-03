import React from 'react'

import { useDrivesStats } from '../hooks/drives'

import { makeStyles } from '@material-ui/core'
import Divider from '@material-ui/core/Divider'
import Grid from '@material-ui/core/Grid'
import LinearProgress from '@material-ui/core/LinearProgress'
import Paper from '@material-ui/core/Paper'
import Typography from '@material-ui/core/Typography'

import CircularProgress from './CircularProgress'

const useStyles = makeStyles(theme => ({
  driveContainer: {
    padding: theme.spacing(2)
  },
  driveTitle: {
    fontFamily: 'monospace'
  },
  transferProgress: {
    height: theme.spacing(1)
  }
}))

function DriveItem ({ driveKey }) {
  const classes = useStyles()
  const [data] = useDrivesStats(driveKey)

  const currentData = data.length > 0 ? data[data.length - 1] : {}

  const size = currentData.size?.blocks || 1
  const downloaded = (currentData.download?.blocks || 0) * 100 / size
  const uploaded = (currentData.upload?.blocks || 0) * 100 / size

  return (
    <Paper>
      <div className={classes.driveContainer}>
        <Grid container>
          <Grid container item xs alignItems='center'>
            <Typography variant='h5' className={classes.driveTitle}>{driveKey}</Typography>
          </Grid>
          <Grid container item xs={1} alignContent='center' justify='center'>
            <Grid container item xs direction='column' alignItems='center'>
              <Grid item><Typography variant='h5'>{currentData.size?.blocks}</Typography></Grid>
              <Grid item>Blocks</Grid>
            </Grid>
            <Grid container item xs direction='column' alignItems='center'>
              <Grid item><Typography variant='h5'>{currentData.size?.bytes}</Typography></Grid>
              <Grid item>Bytes</Grid>
            </Grid>
          </Grid>
          <Divider orientation='vertical' flexItem />
          <Grid container item xs={1} alignContent='center' justify='center'>
            <Typography variant='h3'>{currentData.peers}</Typography>
          </Grid>
          <Divider orientation='vertical' flexItem />
          <Grid container item xs={1} alignContent='center' justify='center'>
            <CircularProgress value={currentData.cpu * 100} size={64} />
          </Grid>
          <Divider orientation='vertical' flexItem />
          <Grid container item xs={1} alignContent='center' justify='center'>
            <CircularProgress value={currentData.memory * 100} size={64} />
          </Grid>
          <Divider orientation='vertical' flexItem />
          <Grid container item xs={1} alignContent='center' justify='center'>
            <CircularProgress value={currentData.disk * 100} size={64} />
          </Grid>
        </Grid>
      </div>
      {/* <pre>{JSON.stringify(data[data.length - 1], null, 2)}</pre> */}
      <LinearProgress
        value={uploaded}
        valueBuffer={downloaded}
        variant='buffer'
        className={classes.transferProgress}
      />
    </Paper>
  )
}

export default DriveItem
