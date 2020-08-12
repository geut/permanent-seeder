import prettyBytes from 'pretty-bytes'

export function useHumanizedBytes (bytes = 0) {
  const pretty = prettyBytes(bytes)
  const humanized = pretty.split(' ')[0]
  const unit = humanized ? pretty.split(' ')[1] : null

  return [humanized, unit, pretty]
}
