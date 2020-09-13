import React from 'react'

import { makeStyles, useTheme } from '@material-ui/core/styles'
import useMediaQuery from '@material-ui/core/useMediaQuery'
import Chip from '@material-ui/core/Chip'
import Dialog from '@material-ui/core/Dialog'
import Grid from '@material-ui/core/Grid'
import MuiDialogTitle from '@material-ui/core/DialogTitle'
import DialogContent from '@material-ui/core/DialogContent'
import Paper from '@material-ui/core/Paper'
import IconButton from '@material-ui/core/IconButton'
import CloseIcon from '@material-ui/icons/Close'
import Typography from '@material-ui/core/Typography'

import ReactJson from 'react-json-view'

const useStyles = makeStyles(theme => ({
  dialogTitle: {
    margin: 0,
    padding: theme.spacing(2)
  },
  dialogSubTitle: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2)
  },
  dialogContent: {
    padding: theme.spacing(2)
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500]
  }
}))

const DialogTitle = (props) => {
  const classes = useStyles()
  const { children, onClose, ...other } = props
  return (
    <MuiDialogTitle disableTypography className={classes.dialogTitle} {...other}>
      <Typography variant='h6'>{children}</Typography>
      {onClose ? (
        <IconButton aria-label='close' className={classes.closeButton} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      ) : null}
    </MuiDialogTitle>
  )
}

function DriveInfo ({ info = {}, onClose, open, title }) {
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

  const handleCopy = (copy) => {
    navigator.clipboard.writeText(JSON.stringify(copy.src, null, '\t'))
  }

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
        Drive Info
      </DialogTitle>
      <Grid container alignItems='center' className={classes.dialogSubTitle}>
        <Grid item xs>
          <Typography gutterBottom color='textSecondary' variant='h6'>
            {title}
          </Typography>
        </Grid>
        <Grid item>
          <Typography gutterBottom variant='h6'>
            {versionLabel({ version })}
          </Typography>
        </Grid>
      </Grid>
      <DialogContent className={classes.dialogContent} dividers>
        <div style={{ marginBottom: '1em' }}>
          <Typography variant='overline' style={{ fontWeight: 'bold' }} display='block'>
          index.json
          </Typography>

          <Paper>
            <ReactJson
              src={indexJSON}
              style={{ minWidth: '500px', borderRadius: theme.shape.borderRadius, padding: theme.spacing(1), fontSize: theme.typography.fontSize }}
              displayDataTypes={false}
              indentWidth={2}
              collapseStringsAfterLength={15}
              enableClipboard={handleCopy}
              theme='solarized'
            />
          </Paper>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default DriveInfo
