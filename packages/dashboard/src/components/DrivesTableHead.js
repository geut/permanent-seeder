import React from 'react'

import TableCell from '@material-ui/core/TableCell'
import TableHead from '@material-ui/core/TableHead'
import MuiTableRow from '@material-ui/core/TableRow'
import TableSortLabel from '@material-ui/core/TableSortLabel'
import IconButton from '@material-ui/core/IconButton'

import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline'

const headCells = [
  {
    id: 'key',
    numeric: false,
    label: 'Key',
    extra: ({ onKeyAdd, classes }) =>
      (
        <IconButton
          aria-label='add key'
          onClick={onKeyAdd}
          color='primary'
          variant='outlined'
          size='small'
          className={classes.addKeyButton}
        >
          <AddCircleOutlineIcon />
        </IconButton>
      )
  },
  { id: 'title', numeric: false, label: 'Title', width: '40%' },
  { id: 'sizeBlocks', numeric: true, label: 'Blocks' },
  { id: 'sizeBytes', numeric: true, label: 'Size' },
  { id: 'downloadedBlocks', numeric: true, label: 'Downloaded blocks' },
  { id: 'peers', numeric: true, label: 'Peers' }
]

function DrivesTableHead ({ classes, order, orderBy, onRequestSort, rowCount, ...props }) {
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
              {ExtraComponent && <ExtraComponent classes={classes} {...props} />}
            </TableSortLabel>
          </TableCell>
        ))}
      </MuiTableRow>
    </TableHead>
  )
}

export default DrivesTableHead
