import React from 'react'
import { HashRouter as Router, Switch, Route } from 'react-router-dom'
import { SocketIOProvider } from 'use-socketio'

import { ThemeProvider, unstable_createMuiStrictModeTheme as createMuiTheme } from '@material-ui/core'

import Layout from '../components/Layout'

import { AppStateProvider } from '../context/app-state'

import Dashboard from './Dashboard'

function AppContainer () {
  return (
    <ThemeProvider theme={createMuiTheme()}>
      <SocketIOProvider url='http://localhost:3001'>
        <AppStateProvider>
          <Router>
            <Layout>
              <Switch>
                <Route path='/' exact>
                  <Dashboard />
                </Route>
              </Switch>
            </Layout>
          </Router>
        </AppStateProvider>
      </SocketIOProvider>
    </ThemeProvider>
  )
}

export default AppContainer
