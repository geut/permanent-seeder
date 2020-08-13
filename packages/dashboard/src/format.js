import prettyBytes from 'pretty-bytes'

export function humanizedBytes (bytes = 0) {
  const pretty = prettyBytes(bytes)
  const humanized = pretty.split(' ')[0]
  const unit = humanized ? pretty.split(' ')[1] : null

  return { humanized, unit, pretty }
}

export function milisecondsToHms (d) {
  d = d / 1000
  d = Number(d)

  var h = Math.floor(d / 3600)
  var m = Math.floor(d % 3600 / 60)
  var s = Math.floor(d % 3600 % 60)

  return ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2) + ':' + ('0' + s).slice(-2)
}
