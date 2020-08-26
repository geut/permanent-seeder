import React from 'react'

import { makeStyles } from '@material-ui/core'
import Paper from '@material-ui/core/Paper'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'

import { humanizedBytes } from '../format'

const useStyles = makeStyles(theme => ({
  address: {
    fontFamily: 'monospace',
    fontSize: '1.2rem'
  }
}))

function DrivePeers ({ peers, driveSizeBlocks }) {
  const classes = useStyles()

  return (
    <TableContainer square component={Paper}>
      <Table aria-label='simple table'>
        <TableHead>
          <TableRow>
            <TableCell>Peers</TableCell>
            <TableCell align='center'>Download Percent</TableCell>
            <TableCell align='right'>Download Size</TableCell>
            <TableCell align='right'>Download Blocks</TableCell>
            <TableCell align='center'>Upload Percent</TableCell>
            <TableCell align='right'>Upload Size</TableCell>
            <TableCell align='right'>Upload Blocks</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {peers.map(({ remoteAddress, downloadedBytes, downloadedBlocks, uploadedBytes, uploadedBlocks }) => {
            const downloadedPercent = Math.round(downloadedBlocks * 100 / (driveSizeBlocks || 1))
            const uploadedPercent = Math.round(uploadedBlocks * 100 / (driveSizeBlocks || 1))
            return (
              <TableRow key={remoteAddress}>
                <TableCell className={classes.address}>{remoteAddress}</TableCell>
                <TableCell align='center'><strong>{downloadedPercent}%</strong></TableCell>
                <TableCell align='right'>{humanizedBytes(downloadedBytes).pretty}</TableCell>
                <TableCell align='right'>{downloadedBlocks}</TableCell>
                <TableCell align='center'><strong>{uploadedPercent}%</strong></TableCell>
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
