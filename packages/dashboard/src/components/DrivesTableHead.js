import React from 'react'

import TableCell from '@material-ui/core/TableCell'
import TableHead from '@material-ui/core/TableHead'
import MuiTableRow from '@material-ui/core/TableRow'
import TableSortLabel from '@material-ui/core/TableSortLabel'
import IconButton from '@material-ui/core/IconButton'

import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline'
import { makeStyles } from '@material-ui/core'

const headCells = [
  { id: 'seedingStatus', numeric: false, label: 'Status', width: '40px', sort: false },
  {
    id: 'key',
    numeric: false,
    label: 'Key',
    extra: ({ onKeyAdd }) =>
      (
        <IconButton
          aria-label='add key'
          onClick={onKeyAdd}
          color='primary'
          variant='outlined'
          size='small'
        >
          <AddCircleOutlineIcon />
        </IconButton>
      )
  },
  { id: 'title', numeric: false, label: 'Title', width: '30%' },
  { id: 'sizeBlocks', numeric: true, label: 'Blocks' },
  { id: 'sizeBytes', numeric: true, label: 'Size' },
  { id: 'downloadedBlocks', numeric: true, label: 'Downloaded blocks' },
  { id: 'downloadedPercent', numeric: true, label: 'Downloaded (%)' },
  { id: 'peers', numeric: true, label: 'Peers' }
]

const useStyles = makeStyles((theme) => ({
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
  },

  tableHeadCell: {
    '& > span > svg': {
      position: 'absolute',
      top: 2,
      right: -25
    }
  }
}))

function DrivesTableHead ({ order, orderBy, onRequestSort, rowCount, ...props }) {
  const classes = useStyles()

  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property)
  }

  return (
    <TableHead>
      <MuiTableRow>
        <TableCell key='expand'>{rowCount} Key{rowCount !== 1 ? 's' : ''}</TableCell>
        {headCells.map(({ extra: ExtraComponent, ...headCell }) => (
          <TableCell
            key={headCell.id}
            align={headCell.align || 'center'}
            sortDirection={orderBy === headCell.id ? order : false}
            width={headCell.width}
            className={classes.tableHeadCell}
          >
            {headCell.sort !== false && (
              <TableSortLabel
                active={orderBy === headCell.id}
                direction={orderBy === headCell.id ? order : 'asc'}
                onClick={createSortHandler(headCell.id)}
              >
                {headCell.label}
                {orderBy === headCell.id ? (
                  <span className={classes.visuallyHidden}>
                    {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                  </span>
                ) : null}
                {ExtraComponent && <ExtraComponent {...props} />}
              </TableSortLabel>
            )}

            {headCell.sort === false && headCell.label}
          </TableCell>
        ))}
      </MuiTableRow>
    </TableHead>
  )
}

export default DrivesTableHead
