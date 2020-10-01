import React, { useState } from 'react'

import { makeStyles } from '@material-ui/core/styles'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'

import DrivesTableHead from './DrivesTableHead'
import DrivesTableRow from './DrivesTableRow'

function descendingComparator (a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1
  }
  if (b[orderBy] > a[orderBy]) {
    return 1
  }
  return 0
}

function getComparator (order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy)
}

function stableSort (array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index])
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0])
    if (order !== 0) return order
    return a[1] - b[1]
  })
  return stabilizedThis.map((el) => el[0])
}

const useStyles = makeStyles((theme) => ({
  table: {
    minWidth: 750
  },
  visuallyHidden: {
    border: 0,
    clip: 'rect(0 0 0 0)',
    height: 1,
    margin: -1,
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    top: 20,
    width: 1
  }
}))

function DrivesTable ({ drives, onKeyAdd }) {
  const classes = useStyles()
  const [order, setOrder] = useState('asc')
  const [orderBy, setOrderBy] = useState('key')

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  return (
    <Table
      className={classes.table}
      size='small'
      stickyHeader
      aria-labelledby='tableTitle'
      aria-label='enhanced table'
    >
      <DrivesTableHead
        classes={classes}
        order={order}
        orderBy={orderBy}
        onRequestSort={handleRequestSort}
        onKeyAdd={onKeyAdd}
        rowCount={drives.length}
      />
      <TableBody>
        {stableSort(drives, getComparator(order, orderBy))
          .map((drive, index) => (
            <DrivesTableRow
              key={drive.key}
              driveKey={drive.key}
              title={drive.title}
              sizeBlocks={drive.sizeBlocks}
              sizeBytes={drive.sizeBytes}
              downloadedBlocks={drive.downloadedBlocks}
              peers={drive.peers}
              files={drive.files}
              info={drive.info}
            />
          ))}
      </TableBody>
    </Table>
  )
}

export default DrivesTable
