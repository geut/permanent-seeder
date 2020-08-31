import React, { useState, useEffect } from 'react'
import { HashRouter as Router, Switch, Route, Redirect } from 'react-router-dom'
import { SocketIOProvider } from 'use-socketio'
import { Transition, TransitionGroup } from 'react-transition-group'

import { ThemeProvider, unstable_createMuiStrictModeTheme as createMuiTheme } from '@material-ui/core'
import CssBaseline from '@material-ui/core/CssBaseline'

import Layout from '../components/Layout'

import { AppStateProvider } from '../context/app-state'

import Dashboard from './Dashboard'
import SplashScreen from '../components/SplashScreen'
import NoMatch from '../components/NoMatch'
import { play, exit } from '../timeline'

import EthSansTTF from '../fonts/eth-sans/EthRomainEthon.ttf'

const ethSansTTF = {
  fontFamily: 'Ethon',
  fontStyle: 'normal',
  fontWeight: 400,
  src: `
    local('Ethon'),
    local('Ethon-Regular'),
    url(${EthSansTTF}) format('ttf')
  `
}

const theme = createMuiTheme({
  typography: {
    fontFamilyGEUT: 'ethon, Arial'
  },
  overrides: {
    MuiCssBaseline: {
      '@global': {
        '@font-face': [ethSansTTF]
      }
    }
  },
  palette: {
    primary: {
      main: '#7800D2',
      light: '#ad47ff',
      dark: '#3e009f'
    },
    secondary: {
      main: '#5bd200',
      light: '#93ff4d',
      dark: '#0ca000'
    }
  }
})

function AppContainer () {
  const [intro, setIntro] = useState(true)
  useEffect(() => {
    async function delay () {
      await new Promise(resolve => setTimeout(resolve, 1700))
      setIntro(false)
    }

    delay()
  }, [])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SocketIOProvider url='http://localhost:3001'>
        <AppStateProvider>
          <Router>
            <Layout>
              <Route render={({ location }) => {
                const { pathname, key } = location

                return (
                  <TransitionGroup component={null}>
                    <Transition
                      key={key}
                      appear
                      onEnter={(node, appears) => play(pathname, node, appears)}
                      onExit={(node, appears) => exit(node, appears)}
                      timeout={{ enter: 1750, exit: 250 }}
                    >
                      <Switch>
                        <Route exact path='/'>
                          {intro ? <SplashScreen /> : <Redirect to='/dashboard' />}
                        </Route>
                        <Route path='/dashboard'>
                          <Dashboard />
                        </Route>
                        <Route path='*'>
                          <NoMatch />
                        </Route>
                      </Switch>
                    </Transition>
                  </TransitionGroup>
                )
              }}
              />

            </Layout>
          </Router>
        </AppStateProvider>
      </SocketIOProvider>
    </ThemeProvider>
  )
}

export default AppContainer
