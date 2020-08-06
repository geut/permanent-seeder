import React, { useMemo } from 'react'

import { makeStyles } from '@material-ui/core'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'

const useStyles = makeStyles(theme => ({
  driveContainer: {
    padding: theme.spacing(2)
  },
  gridItem: {
    marginRight: 1,

    '&:first-child': {
      marginRight: 0,
      flex: '1 1 auto',
      maxWidth: 'initial',

      '& > .MuiTypography-root': {
        textAlign: 'left'
      }
    },

    '&:last-child': {
      marginRight: 0
    }
  }
}))

const HEADERS = [
  'Drive Key',
  'Size',
  'Download',
  'Upload',
  'Peers',
  'CPU',
  'Memory',
  'Disk'
]

function DriveItemHeader ({ driveKey }) {
  const classes = useStyles()

  const headers = useMemo(() => {
    return HEADERS.map(title => (
      <Grid item xs={1} key={title} className={classes.gridItem}>
        <Typography variant='h5' align='center'>{title}</Typography>
      </Grid>
    ))
  })

  return (
    <div className={classes.driveContainer}>
      <Grid container>
        {headers}
      </Grid>
    </div>
  )
}

export default DriveItemHeader
