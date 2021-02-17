import React from 'react'

import { CopyToClipboard } from 'react-copy-to-clipboard'

import { makeStyles } from '@material-ui/core'
import Paper from '@material-ui/core/Paper'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import Tooltip from '@material-ui/core/Tooltip'

import { humanizedBytes } from '../format'

const useStyles = makeStyles(theme => ({
  container: {
    maxHeight: 440
  },
  table: {
    width: '100%',
    tableLayout: 'fixed'
  },
  address: {
    fontFamily: 'monospace'
  }
}))

function DrivePeers ({ peers }) {
  const classes = useStyles()

  return (
    <TableContainer square component={Paper} className={classes.container}>
      <Table aria-label="drive's peers table" size='small' className={classes.table}>
        <TableHead>
          <TableRow>
            <TableCell><Tooltip title='Peers Ids' aria-label='peers ids column header' placement='right'><span>Peers</span></Tooltip></TableCell>
            <TableCell align='right'>Download Size</TableCell>
            <TableCell align='right'>Download Blocks</TableCell>
            <TableCell align='right'>Upload Size</TableCell>
            <TableCell align='right'>Upload Blocks</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {peers.map(({ remoteAddress, downloadedBytes, downloadedBlocks, uploadedBytes, uploadedBlocks }) => {
            return (
              <TableRow key={remoteAddress}>
                <TableCell className={classes.address}>
                  <CopyToClipboard text={remoteAddress}>
                    <code
                      title={`${remoteAddress}\n(click to copy)`}
                      className={classes.key}
                    >
                      {remoteAddress.substr(0, 6)}...{remoteAddress.substr(-6)}
                    </code>
                  </CopyToClipboard>
                </TableCell>
                <TableCell align='right'>{humanizedBytes(downloadedBytes).pretty}</TableCell>
                <TableCell align='right'>{downloadedBlocks}</TableCell>
                <TableCell align='right'>{humanizedBytes(uploadedBytes).pretty}</TableCell>
                <TableCell align='right'>{uploadedBlocks}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default DrivePeers
