import React from 'react'
import prettyBytes from 'pretty-bytes'

import { makeStyles } from '@material-ui/core'
import Grid from '@material-ui/core/Grid'
import LinearProgress from '@material-ui/core/LinearProgress'
import Paper from '@material-ui/core/Paper'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import Tooltip from '@material-ui/core/Tooltip'
import Typography from '@material-ui/core/Typography'

import purple from '@material-ui/core/colors/purple'
import grey from '@material-ui/core/colors/grey'

import { useDrivesStats } from '../hooks/drives'

import CircularProgress from './CircularProgress'
import DriveItemGridContainer from './DriveItemGridContainer'

const useStyles = makeStyles(theme => ({
  root: {
    marginBottom: theme.spacing(2)
  },

  driveContainer: {
    padding: theme.spacing(2)
  },

  driveKey: {
    fontFamily: 'monospace',
    fontSize: '1.2rem'
  },

  transferProgress: {
    height: theme.spacing(1.5)
  },

  transferProgressDownloadBar: {
    backgroundColor: purple[500]
  },

  transferProgressUploadBar: {
    backgroundColor: purple[100]
  },

  transferProgressBackground: {
    backgroundImage: 'none',
    backgroundColor: grey[300],
    animation: 'none'
  },

  transferTooltip: {
    padding: 0,
    maxWidth: 'none'
  }
}))

function useHumanizedBytes (bytes = 0) {
  const pretty = prettyBytes(bytes)
  const humanized = pretty.split(' ')[0]
  const unit = humanized ? pretty.split(' ')[1] : null

  return [humanized, unit, pretty]
}

function DriveItem ({ driveKey }) {
  const classes = useStyles()
  const [data] = useDrivesStats(driveKey)

  const currentData = data.length > 0 ? data[data.length - 1] : {}

  const sizeBlocks = currentData.size?.blocks || 0
  const downloadBlocks = currentData.download?.blocks || 0
  const uploadBlocks = currentData.upload?.blocks || 0

  const downloadPercent = downloadBlocks * 100 / (sizeBlocks || 1)
  const uploadPercent = uploadBlocks * 100 / (sizeBlocks || 1)

  const [size, sizeUnit] = useHumanizedBytes(currentData.size?.bytes)
  const [download, downloadUnit] = useHumanizedBytes(currentData.download?.bytes)
  const [upload, uploadUnit] = useHumanizedBytes(currentData.upload?.bytes)

  return (
    <Paper className={classes.root} elevation={5}>
      <div className={classes.driveContainer}>
        <Grid container>
          <DriveItemGridContainer xs alignItems='center' justify='flex-start'>
            <Grid container direction='column'>
              <Typography variant='h4'>{currentData.title}</Typography>
              <Typography variant='subtitle1' className={classes.driveKey}>{driveKey}</Typography>
            </Grid>
          </DriveItemGridContainer>

          <DriveItemGridContainer>
            <Typography variant='h5'>{size} <Typography variant='caption'>{sizeUnit}</Typography></Typography>
            <Typography variant='h6' align='center'>{sizeBlocks} <Typography variant='caption'>blocks</Typography></Typography>
          </DriveItemGridContainer>

          <DriveItemGridContainer direction='row'>
            <Grid container item xs direction='column' alignItems='flex-end' justify='center'>
              <Typography variant='h3'>{downloadPercent}%</Typography>
            </Grid>
            <Grid container item xs direction='column' alignItems='center'>
              <Typography variant='h5'>{download} <Typography variant='caption'>{downloadUnit}</Typography></Typography>
              <Typography variant='h6' align='center'>{downloadBlocks} <Typography variant='caption'>blocks</Typography></Typography>
            </Grid>
          </DriveItemGridContainer>

          <DriveItemGridContainer direction='row'>
            <Grid container item xs direction='column' alignItems='flex-end' justify='center'>
              <Typography variant='h3'>{uploadPercent}%</Typography>
            </Grid>
            <Grid container item xs direction='column' alignItems='center'>
              <Typography variant='h5'>{upload} <Typography variant='caption'>{uploadUnit}</Typography></Typography>
              <Typography variant='h6' align='center'>{uploadBlocks} <Typography variant='caption'>blocks</Typography></Typography>
            </Grid>
          </DriveItemGridContainer>

          <DriveItemGridContainer>
            <Typography variant='h3'>{currentData.peers}</Typography>
          </DriveItemGridContainer>

          <DriveItemGridContainer>
            <CircularProgress value={currentData.cpu * 100} size={64} />
          </DriveItemGridContainer>

          <DriveItemGridContainer>
            <CircularProgress value={currentData.memory * 100} size={64} />
          </DriveItemGridContainer>

          <DriveItemGridContainer>
            <CircularProgress value={currentData.disk * 100} size={64} />
          </DriveItemGridContainer>
        </Grid>
      </div>

      <Tooltip
        title={
          <TableContainer component={Paper} elevation={5}>
            <Table className={classes.table} size='small' aria-label='a dense table'>
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell align='center'>Blocks</TableCell>
                  <TableCell align='center'>Bytes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {['Download', 'Upload'].map((row) => (
                  <TableRow key={row}>
                    <TableCell component='th' scope='row'>{row}</TableCell>
                    <TableCell align='center'>{currentData[row.toLowerCase()]?.blocks}</TableCell>
                    <TableCell align='center'>{prettyBytes(currentData[row.toLowerCase()]?.bytes || 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        }
        interactive
        classes={{
          tooltip: classes.transferTooltip
        }}
      >
        <LinearProgress
          value={uploadPercent}
          valueBuffer={downloadPercent}
          variant='buffer'
          className={classes.transferProgress}
          classes={{
            bar1Buffer: classes.transferProgressDownloadBar,
            bar2Buffer: classes.transferProgressUploadBar,
            dashed: classes.transferProgressBackground
          }}
        />
      </Tooltip>
    </Paper>
  )
}

export default DriveItem
