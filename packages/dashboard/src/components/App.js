import React from 'react'
import { HashRouter as Router, Switch, Route } from 'react-router-dom'

import Layout from './Layout'

import Dashboard from '../containers/Dashboard'

import { AppStateProvider } from '../hooks/context'

function AppContainer () {
  return (
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
  )
}

export default AppContainer
