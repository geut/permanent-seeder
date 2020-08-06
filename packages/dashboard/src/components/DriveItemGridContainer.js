import React from 'react'

import { makeStyles } from '@material-ui/core'
import Grid from '@material-ui/core/Grid'

const useStyles = makeStyles(theme => ({
  driveItemGridContainer: {
    marginRight: 1,

    '&:last-child': {
      marginRight: 0
    }
  }
}))

function DriveItemGridContainer ({ children, ...props }) {
  const classes = useStyles()

  return (
    <Grid container item xs={1} alignContent='center' justify='center' direction='column' className={classes.driveItemGridContainer} {...props}>
      {children}
    </Grid>
  )
}

export default DriveItemGridContainer
