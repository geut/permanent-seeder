import { TimelineMax as Timeline, Power1, Power2, Back } from 'gsap'

const getDefaultTimeline = (node, delay) => {
  if (!node) return
  const timeline = new Timeline({ paused: true })

  timeline
    .from(node, 0.3, { display: 'none', autoAlpha: 0, delay, ease: Power2.easeIn })

  return timeline
}

const getHomeTimeline = (node, delay) => {
  if (!node) return
  const timeline = new Timeline({ paused: true })
  const texts = node.querySelectorAll('.by-geut')
  timeline
    .from(node, 0.15, { display: 'none', autoAlpha: 0, delay, ease: Back.easeInOut.config(0.7) })
    .staggerFrom(texts, 0.375, { autoAlpha: 0, y: 25, ease: Power2.easeOut }, 0.125)

  return timeline
}

export const play = (pathname, node, appears) => {
  if (!node) return

  const delay = appears ? 0 : 0.5
  let timeline

  if (pathname === '/') {
    timeline = getHomeTimeline(node, delay)
  } else {
    timeline = getDefaultTimeline(node, delay)
  }

  const loadPromise = new Promise(function (resolve) {
    if (document.readyState === 'loading') { // Loading hasn't finished yet
      window.addEventListener('DOMContentLoaded', resolve)
    } else { // `DOMContentLoaded` has already fired
      return resolve()
    }
  })

  loadPromise.then(() => window.requestAnimationFrame(() => {
    if (timeline) {
      timeline.play()
    }
  }))
}

export const exit = (node) => {
  if (!node) return
  const timeline = new Timeline({ paused: true })

  timeline.to(node, 0.15, { autoAlpha: 0, ease: Power1.easeOut })
  timeline.play()
}
