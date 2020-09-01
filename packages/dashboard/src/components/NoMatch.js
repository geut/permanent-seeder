import React from 'react'
import { useLocation } from 'react-router-dom'

import Box from '@material-ui/core/Box'
import Typography from '@material-ui/core/Typography'

function NoMatch () {
  const location = useLocation()

  return (
    <Box
      display='flex'
      justifyContent='center'
      alignItems='center'
      height='100vh'
    >
      <Typography color='secondary' variant='h3' gutterBottom>
      No match for <code>{location.pathname}</code>
      </Typography>
    </Box>
  )
}

export default NoMatch
