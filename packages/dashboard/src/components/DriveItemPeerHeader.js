import React from 'react'

import { makeStyles } from '@material-ui/core'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import DriveItemGridContainer from './DriveItemGridContainer'

const useStyles = makeStyles(theme => ({
  root: {
    margin: theme.spacing(1),
    marginTop: 0,
    marginBottom: -theme.spacing()
  },

  peerIcon: {
    width: theme.spacing(8)
  }
}))

const HEADERS = [
  ['Address', { xs: 1 }],
  ['Download', { xs: 2 }],
  ['Uploaded', { xs: 2 }]
]

function DriveItemPeerHeader () {
  const classes = useStyles()

  return (
    <Grid container item spacing={2} className={classes.root}>
      <DriveItemGridContainer adjust className={classes.peerIcon} />
      {
        HEADERS.map(([title, { xs = 2 }]) => (
          <DriveItemGridContainer xs={xs} key={title}><Typography variant='h6' align='center'>{title}</Typography></DriveItemGridContainer>
        ))
      }
    </Grid>
  )
}

export default DriveItemPeerHeader
