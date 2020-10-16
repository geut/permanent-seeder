import React from 'react'
import clsx from 'clsx'

import { makeStyles } from '@material-ui/core/styles'

import MuiAppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'
import IconButton from '@material-ui/core/IconButton'
import MenuIcon from '@material-ui/icons/Menu'

import { DRAWER_WIDTH } from '../constants'
import PSIcon from './PSIcon'

import { useLeftSidebar, useAppBarTitle, useDarkMode } from '../hooks/layout'

const useStyles = makeStyles((theme) => ({
  toolbar: {
    paddingRight: 24 // keep right padding when drawer closed
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    })
  },
  appBarShift: {
    marginLeft: DRAWER_WIDTH,
    width: `calc(100% - ${DRAWER_WIDTH}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    })
  },
  menuButton: {
    marginRight: 36
  },
  menuButtonHidden: {
    display: 'none'
  },
  title: {
    flexGrow: 1
  }
}))

function AppBar ({ drawerWith }) {
  const classes = useStyles()

  const [open, setOpen] = useLeftSidebar()
  const [appBarTitle] = useAppBarTitle()
  const [darkMode, setDarkMode] = useDarkMode()

  const handleDrawerOpen = () => {
    setOpen(true)
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  return (
    <MuiAppBar position='absolute' className={clsx(classes.appBar, open && classes.appBarShift)}>
      <Toolbar className={classes.toolbar}>
        <IconButton
          edge='start'
          color='inherit'
          aria-label='open drawer'
          onClick={handleDrawerOpen}
          className={clsx(classes.menuButton, open && classes.menuButtonHidden)}
        >
          <MenuIcon />
        </IconButton>
        <Typography component='h1' variant='h6' color='inherit' noWrap className={classes.title}>
          {appBarTitle}
        </Typography>
        <IconButton color='inherit' size='small' disableRipple disableFocusRipple onClick={toggleDarkMode}>
          <PSIcon fontSize='large' />
        </IconButton>
      </Toolbar>
    </MuiAppBar>
  )
}

export default AppBar
