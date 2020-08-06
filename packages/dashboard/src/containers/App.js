import React from 'react'
import { HashRouter as Router, Switch, Route } from 'react-router-dom'
import { ThemeProvider, unstable_createMuiStrictModeTheme as createMuiTheme } from '@material-ui/core'

import Layout from '../components/Layout'

import { AppStateProvider } from '../context/app-state'
import { SocketProvider } from '../context/socket'

import Dashboard from './Dashboard'

function AppContainer () {
  return (
    <ThemeProvider theme={createMuiTheme()}>
      <AppStateProvider>
        <SocketProvider>
          <Router>
            <Layout>
              <Switch>
                <Route path='/' exact>
                  <Dashboard />
                </Route>
              </Switch>
            </Layout>
          </Router>
        </SocketProvider>
      </AppStateProvider>
    </ThemeProvider>
  )
}

export default AppContainer
