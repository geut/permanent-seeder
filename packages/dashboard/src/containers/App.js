import React from 'react'
import { HashRouter as Router, Switch, Route } from 'react-router-dom'

import Layout from '../components/Layout'

import { AppStateProvider } from '../context/app-state'
import { SocketProvider } from '../context/socket'

import Dashboard from './Dashboard'

function AppContainer () {
  return (
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
  )
}

export default AppContainer
