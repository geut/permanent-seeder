import { humanizedBytes, milisecondsToHms } from '../format'
import humanizeDuration from 'humanize-duration'

export function useHumanizedBytes (bytes = 0) {
  if (typeof bytes !== 'number' || bytes !== Number(bytes)) {
    bytes = 0
  }
  const { humanized, unit, pretty } = humanizedBytes(bytes)
  return [humanized, unit, pretty]
}

export function useMilisecondsToHms (d) {
  return milisecondsToHms(d)
}

const shortEnglishHumanizer = humanizeDuration.humanizer({
  language: 'shortEn',
  languages: {
    shortEn: {
      y: () => 'y',
      mo: () => 'mo',
      w: () => 'w',
      d: () => 'd',
      h: () => 'h',
      m: () => 'm',
      s: () => 's',
      ms: () => 'ms'
    }
  }
})

export function useHumanMsToDHM (d) {
  return shortEnglishHumanizer(d, { round: true, largest: 3, units: ['d', 'h', 'm'], delimiter: ':', spacer: '' })
}
