import React from 'react'

import { withStyles, makeStyles, useTheme } from '@material-ui/core/styles'
import useMediaQuery from '@material-ui/core/useMediaQuery'
import Chip from '@material-ui/core/Chip'
import Dialog from '@material-ui/core/Dialog'
import MuiDialogTitle from '@material-ui/core/DialogTitle'
import MuiDialogContent from '@material-ui/core/DialogContent'
import IconButton from '@material-ui/core/IconButton'
import CloseIcon from '@material-ui/icons/Close'
import Typography from '@material-ui/core/Typography'

import ReactJson from 'react-json-view'

const useStyles = makeStyles(theme => ({
  root: {
    minWidth: '500px'
  },
  indexJSON: {
  }
}))

const styles = (theme) => ({
  root: {
    margin: 0,
    padding: theme.spacing(2)
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500]
  }
})

const DialogTitle = withStyles(styles)((props) => {
  const { children, classes, onClose, ...other } = props
  return (
    <MuiDialogTitle disableTypography className={classes.root} {...other}>
      <Typography variant='h6'>{children}</Typography>
      {onClose ? (
        <IconButton aria-label='close' className={classes.closeButton} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      ) : null}
    </MuiDialogTitle>
  )
})

const DialogContent = withStyles((theme) => ({
  root: {
    padding: theme.spacing(2)
  }
}))(MuiDialogContent)

function DriveInfo ({ info = {}, onClose, open }) {
  const theme = useTheme()
  const classes = useStyles()
  const { version, indexJSON = {} } = info
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'))
  const versionLabel = ({ version }) => (
    <Chip
      label={version}
      color='secondary'
      variant='outlined'
    />
  )

  const titleLabel = (title = '') => (
    <Typography variant='h5' color='primary' component='span' style={{ textTransform: 'capitalize' }} noWrap gutterBottom>
      {title}
    </Typography>
  )

  return (
    <Dialog
      scroll='paper'
      fullScreen={fullScreen}
      onClose={onClose}
      aria-labelledby='drive-details-title'
      open={open}
      fullWidth
    >
      <DialogTitle id='drive-details-title' onClose={onClose}>
        Drive Info{indexJSON.title ? ':' : ''} {titleLabel(indexJSON.title)}
      </DialogTitle>
      <DialogContent className={classes.root} dividers>
        <div style={{ marginBottom: '1em' }}>
          <Typography variant='overline' style={{ fontWeight: 'bold' }} display='block'>
        Version
          </Typography>
          {versionLabel({ version })}
        </div>
        <div style={{ marginBottom: '1em' }}>
          <Typography variant='overline' style={{ fontWeight: 'bold' }} display='block'>
          index.json
          </Typography>
          <div className={classes.indexJSON}>
            <ReactJson src={indexJSON} style={{ minWidth: '500px' }} displayDataTypes={false} indentWidth={2} collapseStringsAfterLength={15} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default DriveInfo
