import React from 'react'

import { makeStyles } from '@material-ui/core/styles'
import Paper from '@material-ui/core/Paper'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'

import { humanizedBytes } from '../format'

const useStyles = makeStyles(theme => ({
  container: {
    maxHeight: 440
  },
  table: {
    width: '100%',
    tableLayout: 'fixed'
  },
  row: {
    '& > td': {
      padding: '6px 8px 6px 8px'
    }
  },
  cellSize: {
    width: 90
  },
  cellBlocks: {
    width: 75
  }
}))

function DriveFiles ({ files }) {
  const classes = useStyles()

  return (
    <TableContainer square component={Paper} className={classes.container}>
      <Table size='small' aria-label="drive's file contents table" className={classes.table}>
        <TableHead>
          <TableRow>
            <TableCell>File</TableCell>
            <TableCell align='right' className={classes.cellSize}>Size</TableCell>
            <TableCell align='right' className={classes.cellBlocks}>Blocks</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.entries(files).map(([fileName, { size, blocks }]) => (
            <TableRow key={fileName} className={classes.row}>
              <TableCell size='small'>{fileName}</TableCell>
              <TableCell align='right'>{humanizedBytes(size).pretty}</TableCell>
              <TableCell align='right'>{blocks}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default DriveFiles
