## Events

### Description

- `drive-add`: emitted once when the key is added to the Permanent Seeder
- `drive-download-resume`: emitted if there is a difference between total feed blocks and downloaded
- `drive-download`: emitted on feed download.
    - `started`: set to `true` when download starts
        - updates seeding status: `waiting` => `downloading`
    - `finished`: set to `true` when `downloadedBlocks >= feed.length`
        - updates seeding status: `seeding`
    - updates size:
        - `blocks`, `bytes`: content feed size
        - `downloadedBlocks`, `downloadedBytes`: content feed downloaded size
    - debounced
- `drive-info`: emitted once after some initial threshold is downloaded.
    - includes: `index.json`, drive version
- `drive-peer-add`: emitted on drive's peer add
    - includes actual list of peers
- `drive-peer-remove`: emitted on drive's peer remove
    - includes actual list of peers
- `drive-stats`:
    - Emitted once:
        - right after download is started
        - right after download is finished
        - on `drive-update`: content feed is updated
    - Includes drive's **file system stats**
    - Debounced by 1 second. Max wait 3 seconds
- `drive-remove`:
    - emitted once after calling `unseed`
    - destroy drive storage
    - stop seeding drive (`announce: false, lookup: false`)

### Lifecycle

Events are ordered from the _beggining_, i.e.: when they are added to the permanent seeder, to _end_ or when they are downloaded completely.

- `drive-add`
- `drive-download-resume`
- `drive-download`
- `drive-download` [**started**] [once]
    - `drive-info` [after-started]
    - `drive-stats` [after-started]
- `drive-peer-add`
- `drive-peer-remove`
- `drive-download` [**finished**] [once]
    - `drive-info` [after-finished]
    - `drive-stats` [after-finished]
