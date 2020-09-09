import React, { useState, useEffect } from 'react'

import { makeStyles } from '@material-ui/core'
import TextField from '@material-ui/core/TextField'
import Dialog from '@material-ui/core/Dialog'
import Button from '@material-ui/core/Button'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import InputAdornment from '@material-ui/core/InputAdornment'
import KeyIcon from '@material-ui/icons/VpnKey'

const useStyles = makeStyles((theme) => ({
  title: {
    color: theme.palette.text.primary
  },
  input: {
    fontFamily: 'monospace'
  }
}))

function AddKeyDialog ({ open, keyToAdd = '', error, onClose, onAdd }) {
  const classes = useStyles()
  const [key, setKey] = useState('')

  function handleAdd () {
    onAdd(key)
  }

  function handleKeyChange (event) {
    setKey(event.target.value)
  }

  useEffect(() => {
    setKey(keyToAdd)
  }, [keyToAdd])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='sm'
      fullWidth
      aria-labelledby='form-dialog-title'
    >
      <DialogTitle id='form-dialog-title' className={classes.title}>Add Key</DialogTitle>
      <DialogContent>
        <TextField
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
          color='primary'
          variant='outlined'
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <KeyIcon />
              </InputAdornment>
            )
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleAdd}>
          Add
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddKeyDialog
