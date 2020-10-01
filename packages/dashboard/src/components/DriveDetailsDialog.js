import React from 'react'
import ReactJson from 'react-json-view'

import { makeStyles, useTheme } from '@material-ui/core/styles'
import Chip from '@material-ui/core/Chip'
import Dialog from '@material-ui/core/Dialog'
import DialogContent from '@material-ui/core/DialogContent'
import Grid from '@material-ui/core/Grid'
import IconButton from '@material-ui/core/IconButton'
import MuiDialogTitle from '@material-ui/core/DialogTitle'
import Paper from '@material-ui/core/Paper'
import Typography from '@material-ui/core/Typography'
import useMediaQuery from '@material-ui/core/useMediaQuery'

import CloseIcon from '@material-ui/icons/Close'

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

function DriveDetailsDialog ({ info = {}, onClose, open, title }) {
  const theme = useTheme()
  const classes = useStyles()
  const { version, indexJSON = {} } = info
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'))

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
      <MuiDialogTitle
        id='drive-details-title'
        disableTypography
        onClose={onClose}
        className={classes.dialogTitle}
      >
        <Typography variant='h6'>Drive Info</Typography>
        {onClose ? (
          <IconButton aria-label='close' className={classes.closeButton} onClick={onClose}>
            <CloseIcon />
          </IconButton>
        ) : null}
      </MuiDialogTitle>

      <Grid container alignItems='center' className={classes.dialogSubTitle}>
        <Grid item xs>
          <Typography gutterBottom color='textSecondary' variant='h6'>
            {title}
          </Typography>
        </Grid>
        <Grid item>
          <Typography gutterBottom variant='h6'>
            <Chip
              label={version}
              color='secondary'
              variant='outlined'
            />
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
              displayDataTypes={false}
              indentWidth={2}
              collapseStringsAfterLength={15}
              enableClipboard={handleCopy}
              theme='solarized'
              style={{
                minWidth: '500px',
                borderRadius: theme.shape.borderRadius,
                padding: theme.spacing(1),
                fontSize: theme.typography.fontSize
              }}
            />
          </Paper>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default DriveDetailsDialog
