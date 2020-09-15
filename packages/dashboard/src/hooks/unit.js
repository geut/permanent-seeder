import { humanizedBytes, milisecondsToHms } from '../format'

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
