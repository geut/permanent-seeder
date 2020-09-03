import React, { useState, useEffect } from 'react'

import { makeStyles } from '@material-ui/core'
import TextField from '@material-ui/core/TextField'
import Dialog from '@material-ui/core/Dialog'
import Button from '@material-ui/core/Button'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'

const useStyles = makeStyles(() => ({
  input: {
    fontFamily: 'monospace'
  }
}))

function AddKeyDialog ({ open, error, onClose, onAdd }) {
  const classes = useStyles()
  const [key, setKey] = useState('')

  function handleAdd () {
    onAdd(key)
  }

  function handleKeyChange (event) {
    setKey(event.target.value)
  }

  useEffect(() => {
    setKey('')
  }, [open])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='sm'
      fullWidth
      aria-labelledby='form-dialog-title'
    >
      <DialogTitle id='form-dialog-title'>Add key</DialogTitle>
      <DialogContent>
        <TextField
          label='Key'
          value={key}
          onChange={handleKeyChange}
          error={Boolean(error)}
          helperText={error || undefined}
          inputProps={{
            className: classes.input
          }}
          autoFocus
          fullWidth
          margin='dense'
          type='text'
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color='primary'>
          Cancel
        </Button>
        <Button onClick={handleAdd} color='primary'>
          Add
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddKeyDialog
