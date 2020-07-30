import React from 'react'

import { Grid } from '@material-ui/core'

import { useSocketSubscription } from '../hooks/socket'

function Dashboard () {
  const [data] = useSocketSubscription('event')

  return (
    <Grid container spacing={3}>

      <Grid item xs={12} md={8} lg={9}>
        Permanent seeder dashboard

        <pre>
          {JSON.stringify(data, null, 2)}
        </pre>
      </Grid>
    </Grid>
  )
}

export default Dashboard
