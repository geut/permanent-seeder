import React from 'react'

import MUICircularProgress from '@material-ui/core/CircularProgress'
import Typography from '@material-ui/core/Typography'
import Box from '@material-ui/core/Box'

function CircularProgress (props) {
  return (
    <Box position='relative' display='inline-flex'>
      <MUICircularProgress variant='static' {...props} />
      <Box
        top={0}
        left={0}
        bottom={0}
        right={0}
        position='absolute'
        display='flex'
        alignItems='center'
        justifyContent='center'
      >
        <Typography variant='h6' component='div' color='textSecondary'>{`${Math.round(
          props.value
        )}%`}
        </Typography>
      </Box>
    </Box>
  )
}

export default CircularProgress
