import React, { useState } from 'react'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import fastDeepEqual from 'fast-deep-equal'

import { makeStyles } from '@material-ui/core'
import FiberNewOutlinedIcon from '@material-ui/icons/FiberNewOutlined'
import TableCell from '@material-ui/core/TableCell'
import MuiTableRow from '@material-ui/core/TableRow'
import IconButton from '@material-ui/core/IconButton'
import Collapse from '@material-ui/core/Collapse'

import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp'

import { humanizedBytes } from '../format'

import DriveInfo from './DriveInfo'
import DriveDetailsDialog from './DriveDetailsDialog'
import DriveSeedingStatusIndicator from './DriveSeedingStatusIndicator'

const useStyles = makeStyles((theme) => ({
  root: {
    cursor: 'pointer',

    '& > td': {
      padding: '6px 8px 6px 8px'
    }
  },

  collapse: {
    padding: 0,
    '&:last-child': {
      paddingRight: 0
    }
  },
  key: {
    cursor: 'pointer'
  },
  newItem: {
    width: '10px'
  }

}))

const DrivesTableRow = React.memo(
  function DrivesTableRow ({
    driveKey,
    title,
    sizeBlocks,
    sizeBytes,
    downloadedBlocks,
    downloadedPercent,
    peers,
    files,
    fsBlocks,
    fsBytes,
    info,
    seedingStatus,
    recentlyAdded,
    onClick
  }) {
    const classes = useStyles()
    const [open, setOpen] = useState(false)
    const [detailsOpen, setDetailsOpen] = useState(false)
    const [sawRecentlyAdded, setSawRecentlyAdded] = useState(recentlyAdded)

    function handleToggleInfo (event) {
      event.stopPropagation()
      setOpen(open => !open)
    }

    function handleOpenDetails (event) {
      event.stopPropagation()
      setDetailsOpen(true)
    }

    function sawNewItem (event) {
      event.stopPropagation()
      // mark as seen
      setSawRecentlyAdded(false)
    }

    return (
      <>
        <MuiTableRow
          hover
          role='checkbox'
          tabIndex={-1}
          key={driveKey}
          onClick={handleOpenDetails}
          className={classes.root}
        >
          <TableCell className={classes.newItem} padding='none' align='center'>
            {sawRecentlyAdded
              ? (
                <IconButton size='small' onClick={sawNewItem}>
                  <FiberNewOutlinedIcon />
                </IconButton>
              )
              : ''}
          </TableCell>
          <TableCell padding='none' align='center'>
            <IconButton aria-label='expand row' size='small' onClick={handleToggleInfo}>
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          </TableCell>
          <TableCell align='center'>
            <DriveSeedingStatusIndicator status={seedingStatus} />
          </TableCell>
          <TableCell align='center'>
            <div onClick={e => e.stopPropagation()}>
              <CopyToClipboard text={driveKey}>
                <code
                  title={`${driveKey}\n(click to copy)`}
                  className={classes.key}
                >
                  {driveKey.substr(0, 6)}...{driveKey.substr(-6)}
                </code>
              </CopyToClipboard>
            </div>
          </TableCell>
          <TableCell>
            {title}
          </TableCell>
          <TableCell align='center'>{sizeBlocks}</TableCell>
          <TableCell align='center'>{humanizedBytes(sizeBytes).pretty}</TableCell>
          <TableCell align='center'>{downloadedBlocks}</TableCell>
          <TableCell align='center'>{downloadedPercent}</TableCell>
          <TableCell align='center'>{peers.length}</TableCell>
        </MuiTableRow>
        <MuiTableRow>
          <TableCell className={classes.collapse} colSpan={10}>
            <Collapse in={open} timeout='auto' unmountOnExit>
              <DriveInfo
                peers={peers}
                files={files}
                sizeBytes={sizeBytes}
                fsBlocks={fsBlocks}
                fsBytes={fsBytes}
              />
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
