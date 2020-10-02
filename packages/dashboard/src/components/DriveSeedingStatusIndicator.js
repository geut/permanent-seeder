import React from 'react'

import { makeStyles } from '@material-ui/core'

import DotIcon from '@material-ui/icons/FiberManualRecord'

import green from '@material-ui/core/colors/green'
import orange from '@material-ui/core/colors/orange'
import yellow from '@material-ui/core/colors/yellow'

const useStyles = makeStyles(theme => ({
  waiting: {
    color: orange[200]
  },

  seeding: {
    color: green[200]
  },

  downloading: {
    color: yellow[200]
  }
}))

function DriveSeedingStatusIndicator ({ status = 'WAITING' }) {
  const classes = useStyles()

  return (
    <DotIcon className={classes[status.toLowerCase()]} />
  )
}

export default DriveSeedingStatusIndicator
