import { TimelineMax as Timeline, Power1, Back } from 'gsap'

const getDefaultTimeline = (node, delay) => {
  if (!node) return
  const timeline = new Timeline({ paused: true })
  const content = node.querySelector('#dashboard')
  if (!content) return

  timeline
    .from(node, 0.3, { display: 'none', autoAlpha: 0, delay, ease: Power1.easeIn })
    .from(content, 0.45, { autoAlpha: 0, y: 25, ease: Power1.easeInOut })

  return timeline
}

const getHomeTimeline = (node, delay) => {
  if (!node) return
  const timeline = new Timeline({ paused: true })
  const texts = node.querySelectorAll('.by-geut')
  timeline
    .from(node, 0.15, { display: 'none', autoAlpha: 0, delay })
    .staggerFrom(texts, 0.375, { autoAlpha: 0, y: 25, ease: Back.easeOut.config(1.7), delay: 0.3 }, 0.125)

  return timeline
}

export const play = (pathname, node, appears) => {
  if (!node) return
  const delay = appears ? 0 : 0.5
  let timeline

  if (pathname === '/') { timeline = getHomeTimeline(node, delay) } else { timeline = getDefaultTimeline(node, delay) }

  window
    .loadPromise
    .then(() => window.requestAnimationFrame(() => {
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
