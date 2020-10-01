import React, { useState } from 'react'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import fastDeepEqual from 'fast-deep-equal'

import { makeStyles } from '@material-ui/core'
import TableCell from '@material-ui/core/TableCell'
import MuiTableRow from '@material-ui/core/TableRow'
import IconButton from '@material-ui/core/IconButton'
import Collapse from '@material-ui/core/Collapse'
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp'

import { humanizedBytes } from '../format'

import DriveInfo from './DriveInfo'
import DriveDetailsDialog from './DriveDetailsDialog'

const useStyles = makeStyles((theme) => ({
  row: {
    cursor: 'pointer'
  },
  collapse: {
    padding: 0,
    '&:last-child': {
      paddingRight: 0
    }
  },
  key: {
    cursor: 'pointer'
  }
}))

const DrivesTableRow = React.memo(
  function DrivesTableRow ({
    driveKey,
    title,
    sizeBlocks,
    sizeBytes,
    downloadedBlocks,
    peers,
    files,
    info,
    onClick
  }) {
    const classes = useStyles()
    const [open, setOpen] = useState(false)
    const [detailsOpen, setDetailsOpen] = useState(false)

    function handleToggleInfo (event) {
      event.stopPropagation()
      setOpen(open => !open)
    }

    return (
      <>
        <MuiTableRow
          hover
          role='checkbox'
          tabIndex={-1}
          key={driveKey}
          onClick={() => setDetailsOpen(true)}
          className={classes.row}
        >
          <TableCell padding='none' align='center'>
            <IconButton aria-label='expand row' size='small' onClick={handleToggleInfo}>
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          </TableCell>
          <TableCell align='center'>
            <CopyToClipboard text={driveKey}>
              <code
                title={`${driveKey}\n(click to copy)`}
                className={classes.key}
              >
                {driveKey.substr(0, 6)}...{driveKey.substr(-6)}
              </code>
            </CopyToClipboard>
          </TableCell>
          <TableCell>{title}</TableCell>
          <TableCell align='center'>{sizeBlocks}</TableCell>
          <TableCell align='center'>{humanizedBytes(sizeBytes).pretty}</TableCell>
          <TableCell align='center'>{downloadedBlocks}</TableCell>
          <TableCell align='center'>{peers.length}</TableCell>
        </MuiTableRow>
        <MuiTableRow>
          <TableCell className={classes.collapse} colSpan={7}>
            <Collapse in={open} timeout='auto' unmountOnExit>
              <DriveInfo peers={peers} files={files} sizeBytes={sizeBytes} />
            </Collapse>
          </TableCell>
        </MuiTableRow>
        {
          detailsOpen && (
            <DriveDetailsDialog
              open
              title={title}
              onClose={() => setDetailsOpen(false)}
              info={info}
            />
          )
        }
      </>
    )
  },
  fastDeepEqual
)

export default DrivesTableRow
