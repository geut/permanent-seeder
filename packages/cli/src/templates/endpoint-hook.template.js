
/**
 * Hook to execute after fetch. It receives the response object
 * And MUST return an array of Key Records:
 *
 * keyRecord = {
 *   key: '....'
 * }
 *
 * @param {Respnse} response response from endpoint
 *
 * @returns {object[]} key records to update
 */
async function hook (response) {
  return response.json()
}

module.exports = hook
