import React from 'react'

import { makeStyles } from '@material-ui/core/styles'
import Box from '@material-ui/core/Box'
import Typography from '@material-ui/core/Typography'

const useStyles = makeStyles(theme => ({
  root: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: '1 0'
  },
  logo: {},
  geut: {
    letterSpacing: '2vmin',
    margin: 'calc(0.5 * 2vmin)',
    marginRight: 'calc(-0.5 * 2vmin)',
    color: '#4f5186',
    fontFamily: theme.typography.fontFamilyGEUT
  }
}))

function SplashScreen () {
  const classes = useStyles()

  return (
    <div className={classes.root}>
      <div id='logo' className={classes.logo}>
        <svg
          version='1.1'
          xmlns='http://www.w3.org/2000/svg'
          x='0px' y='0px'
          width='100%'
          height='100%'
          viewBox='0 0 609 602'
          enableBackground='new 0 0 609 602'
        >
          <g>
            <ellipse fill='#7800D2' stroke='#000000' strokeWidth='20' strokeMiterlimit='10' cx='304.726' cy='300.717' rx='259.978' ry='257.503' />
            <polygon
              fill='#28BE46' stroke='#000000' strokeWidth='20' strokeMiterlimit='10' points='434,238.807 434,351.824 369.634,418.652 305.145,485.48 240.593,418.662 176.055,351.852 176.039,238.737 193.822,172 240.55,172 305.058,105.176 369.545,172 419.822,172'
            />
            <line fill='none' stroke='#000000' strokeWidth='20' strokeMiterlimit='10' x1='305' y1='113' x2='305' y2='530' />
            <line fill='none' stroke='#000000' strokeWidth='20' strokeMiterlimit='10' x1='304.806' y1='232.323' x2='367.457' y2='169.672' />
            <line fill='none' stroke='#000000' strokeWidth='20' strokeMiterlimit='10' x1='304.807' y1='319.323' x2='423.908' y2='200.221' />
            <line fill='none' stroke='#000000' strokeWidth='20' strokeMiterlimit='10' x1='306.432' y1='405.198' x2='435.322' y2='276.307' />
            <line fill='none' stroke='#000000' strokeWidth='20' strokeMiterlimit='10' x1='241' y1='343' x2='241' y2='304' />
            <line fill='none' stroke='#000000' strokeWidth='20' strokeMiterlimit='10' x1='241' y1='255' x2='241' y2='216' />
            <line fill='none' stroke='#000000' strokeWidth='20' strokeMiterlimit='10' x1='369' y1='343' x2='369' y2='304' />
            <line fill='none' stroke='#000000' strokeWidth='20' strokeMiterlimit='10' x1='369' y1='255' x2='369' y2='216' />

            <line fill='none' stroke='#000000' strokeWidth='20' strokeMiterlimit='10' x1='303.221' y1='232.323' x2='243.695' y2='172.799' />

            <line fill='none' stroke='#000000' strokeWidth='20' strokeMiterlimit='10' x1='303.221' y1='319.324' x2='186.471' y2='202.572' />

            <line fill='none' stroke='#000000' strokeWidth='20' strokeMiterlimit='10' x1='301.596' y1='404.198' x2='174.37' y2='276.973' />
            <polyline
              fill='none' stroke='#000000' strokeWidth='20' strokeMiterlimit='10' points='163.438,161.941 169.822,137 194,137'
            />
            <polyline fill='none' stroke='#000000' strokeWidth='20' strokeMiterlimit='10' points='450.147,161.941 443.35,137 420,137' />
          </g>
        </svg>
      </div>
      <Box
        className='by-geut'
        color='text.secondary'
        m={1}
        display='flex'

        flexDirection='column'
        alignItems='center'
        alignContent='center'
      >
        <Typography variant='subtitle1' component='span'>by</Typography>
        <Typography className={classes.geut} variant='h4' component='span' gutterBottom>GEUT</Typography>

        <Typography variant='caption' component='span'>in collaboration with</Typography>
        <Typography variant='h6' gutterBottom>Liberate Science</Typography>
      </Box>
    </div>
  )
}

export default SplashScreen
