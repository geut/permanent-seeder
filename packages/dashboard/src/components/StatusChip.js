import React from 'react'
import clsx from 'clsx'

import { makeStyles } from '@material-ui/core'
import Chip from '@material-ui/core/Chip'
import teal from '@material-ui/core/colors/teal'
import red from '@material-ui/core/colors/red'

const useStyles = makeStyles(theme => ({
  chipError: {
    backgroundColor: red[500],
    '& > span': {
      color: theme.palette.common.white
    }
  }
}))

const useChipStyles = makeStyles(theme => ({
  label: {
    color: theme.palette.common.black
  },

  colorPrimary: {
    '& $label': {
      color: theme.palette.common.white
    },
    backgroundColor: teal[500]
  }
}))

function StatusChip ({ condition, ...props }) {
  const classes = useStyles()
  const chipClasses = useChipStyles()

  const label = condition !== undefined ? (condition ? 'Yes' : 'No') : condition
  const color = condition !== undefined ? (condition ? 'primary' : 'default') : condition
  const error = condition !== undefined ? !condition : false

  return (
    <Chip
      label={label}
      color={color}
      component='span'
      size='small'
      classes={chipClasses}
      className={clsx({ [classes.chipError]: error })}
      {...props}
    />
  )
}

export default StatusChip
