import React from 'react'

import { makeStyles } from '@material-ui/core'
import Grid from '@material-ui/core/Grid'

const useStyles = makeStyles(theme => ({
  driveItemGridContainer: ({ adjust }) => ({
    width: adjust ? 'auto' : 'inherit',
    marginRight: 1,

    '&:last-child': {
      marginRight: 0
    }
  })
}))

function DriveItemGridContainer ({ children, adjust = false, ...props }) {
  const classes = useStyles({ adjust })

  return (
    <Grid container item xs={adjust ? undefined : 1} alignContent='center' justify='center' direction='column' className={classes.driveItemGridContainer} {...props}>
      {children}
    </Grid>
  )
}

export default DriveItemGridContainer
