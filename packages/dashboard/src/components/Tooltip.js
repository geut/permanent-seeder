import React from 'react'

import { makeStyles } from '@material-ui/core'
import MUITooltip from '@material-ui/core/Tooltip'

const useStyles = makeStyles(theme => ({
  tooltip: ({ maxWidth, width }) => ({
    padding: theme.spacing(1),
    backgroundColor: theme.palette.common.white,
    color: theme.palette.common.black,
    boxShadow: theme.shadows[1],
    maxWidth: maxWidth || 'none',
    width: width || 'auto',
    fontSize: theme.typography.pxToRem(12)
  })
}))

function Tooltip ({ title, children, ...props }) {
  const classes = useStyles(props)

  return (
    <MUITooltip
      classes={classes}
      title={title}
      {...props}
    >
      {children}
    </MUITooltip>
  )
}

export default Tooltip
