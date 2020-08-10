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
  ['Drive Key', { }],
  ['Size', { }],
  ['Download', { xs: 2 }],
  ['Upload', { xs: 2 }],
  ['Peers', { }]
  // 'CPU',
  // 'Memory',
  // 'Disk'
]

function DriveItemHeader () {
  const classes = useStyles()

  const headers = useMemo(() => {
    return HEADERS.map(([title, { xs = 1 }]) => (
      <Grid item xs={xs} key={title} className={classes.gridItem}>
        <Typography variant='h5' align='center'>{title}</Typography>
      </Grid>
    ))
  }, [classes.gridItem])

  return (
    <div className={classes.driveContainer}>
      <Grid container>
        {headers}
      </Grid>
    </div>
  )
}

export default DriveItemHeader
