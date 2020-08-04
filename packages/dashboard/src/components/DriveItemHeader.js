import React from 'react'

import { makeStyles } from '@material-ui/core'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'

const useStyles = makeStyles(theme => ({
  driveContainer: {
    padding: theme.spacing(2)
  }
}))

function DriveItemHeader ({ driveKey }) {
  const classes = useStyles()

  return (
    <div className={classes.driveContainer}>
      <Grid container>
        <Grid item xs>
          <Typography variant='h5'>Drive Key</Typography>
        </Grid>
        <Grid item xs={1}>
          <Typography variant='h5' align='center'>Size</Typography>
        </Grid>
        <Grid item xs={1}>
          <Typography variant='h5' align='center'>Peers</Typography>
        </Grid>
        <Grid item xs={1}>
          <Typography variant='h5' align='center'>CPU</Typography>
        </Grid>
        <Grid item xs={1}>
          <Typography variant='h5' align='center'>Memory</Typography>
        </Grid>
        <Grid item xs={1}>
          <Typography variant='h5' align='center'>Disk</Typography>
        </Grid>
      </Grid>
    </div>
  )
}

export default DriveItemHeader
