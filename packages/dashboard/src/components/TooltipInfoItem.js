import React from 'react'

import Typography from '@material-ui/core/Typography'
import Grid from '@material-ui/core/Grid'

function TooltipInfoItem ({ label, value }) {
  return (
    <Grid item container justify='space-between'>
      <Grid item>
        <Typography>{label}</Typography>
      </Grid>
      <Grid item>
        {value}
      </Grid>
    </Grid>
  )
}

export default TooltipInfoItem
