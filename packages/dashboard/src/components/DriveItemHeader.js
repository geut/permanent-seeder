import React, { useMemo } from 'react'

import { makeStyles } from '@material-ui/core'
import IconButton from '@material-ui/core/IconButton'
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline'
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
  },
  driveKeyHeader: {
    display: 'inline-block',
    marginRight: theme.spacing()
  },
  addKeyButton: {
    verticalAlign: 'bottom'
  }

}))

function DriveItemHeader ({ onKeyAdd }) {
  const classes = useStyles()

  const HEADERS = [
    ['Drive Key', {
      className: classes.driveKeyHeader,
      extra: (
        <IconButton
          aria-label='add key'
          onClick={onKeyAdd}
          color='primary'
          variant='outlined'
          size='small'
          className={classes.addKeyButton}
        >
          <AddCircleOutlineIcon />
        </IconButton>
      )
    }],
    ['Size', { }],
    ['Download', { xs: 3 }],
    ['Peers', { }]
  ]

  const headers = useMemo(() => {
    return HEADERS.map(([title, { xs = 1, extra, className }]) => (
      <Grid item xs={xs} key={title} className={classes.gridItem}>
        <Typography variant='h5' align='center' className={className}>{title}</Typography>
        {extra}
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
