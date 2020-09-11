# permanent-seeder

[![Build Status](https://travis-ci.com/geut/permanent-seeder.svg?branch=master)](https://travis-ci.com/geut/permanent-seeder)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

<div style="text-align: center">
  <img alt="Permanent Seeder logo, a  beautiful seed surrounded with a round and exquisite black border" src="packages/dashboard/public/permanent-seeder-192.png"/>
</div>

## <a name="install"></a> Install

```
npm i @geut/permanent-seeder
```

Or from a [tarball](/packages/cli/dist) :package:

Alternatively you can `git clone` this repo and build it from source:

```
npm i
npm run bootstrap
permanent-seeder stop
permanent-seeder start
```

## <a name="usage"></a> Usage

First, create a base config file, you can tweak it later ;-)
```
$ permanent-seeder config:init
```

Then, start the Permanent Seeder daemon
```
$ permanent-seeder start
```
:rocket:

## <a name="commands"></a> Commands
```
$ permanent-seeder [COMMAND] [--OPTIONS]
```
### Config
```
$ permanent-seeder config:[init|get]
```
- `init`: creates the base config file for the Permanent Seeder. This is a `.toml` file that will live in `~/permanent-seeder/settings.toml`.
- `get`: returns the settings from the CLI. Useful when you are changing values and want to be sure they are pick up by the Permanent Seeder.

Default settings:
```toml
# Permanent seeder path (will be completed on config:init)
path = 'permanent-seeder'

# Enable stats recording
save_stats = true

# keys.endpoints = array of configs per endpoint
[[keys.endpoints]]

  # Where to fetch keys
  url = 'http://localhost:3000'

  # Frequency between fetchs (in minutes)
  frequency = 5

  # Hook to parse response
  hook = 'endpoint-hook.js'

## To add another endpoint, uncomment and complete next lines:
# [[keys.endpoints]]
#   url =
#   frequency =
#   hook
```

### Start

```
$ permanent-seeder start
```
Bootstrap a Permanent Seeder instance that will keep up running in the background. If you change settings, you will need to call `start` command again.

### Status
```
$ permanent-seeder status
```
It will return instance status. If it is running and some basic stats.

### Stop
```
$ permanent-seeder stop
```
Stops the current instance.

### Dashboard
```
$ permanent-seeder dashboard
```
Opens the dashboard app in a browser. If you want to manually access the dashboard, it can be found in: `localhost:3001`

### Key Management :key:
```
$ permanent-seeder key:[add|remove|remove-all]
```
- `add`: Insert a new key Permanent Seeder db, it will start downloading and seeding ASAP.
- `remove`: Removes a single key from the seeder db and also stops seeding it (e.g.: no more announcing to other peers)
- `remove-all`: Removes and unnanounce all the keys in the db.

### Logs

```
$ permanent-seeder logs --[live|all|error]
```
- `live`: like doing a `tail -f` of the logs.
- `all`: Show all the logs stored.
- `error`: Display only error logs.

### repl
```
$ permanent-seeder repl
```
Useful to inspect the Permanent Seeder under the hood. :microscope:

## Keys Endpoint

The Permanent Seeder can `fetch` keys from an external endpoint, i.e: perform a `GET` request against a particular endpoint. This can be useful if you maintain a service that stores hyperdrive's keys. If that is the case, then the Permament Seeder can fetch those keys regularly. You can think of this like a cron job.

Whilst, we internally expect an `Array<{key}>`, you can customize and parse the fetch response the way you need it.

To do this, you will need to modify `$HOME/permanent-seeder/endpoint-hook.js`.

That hook will be called after `fetch` the response.

You can also tweak the fetch `frequency` (defined in **minutes**) and the endpoint `url`. These options can be found in the `settings.toml` file:
```toml
[[keys.endpoints]]
url = "http://localhost:3000"
frequency = 5
hook = "$HOME/permanent-seeder/endpoint-hook.js"
```

## Design

The Permanent Seeder is a CLI tool that can starts a daemon which will [seed](https://en.wikipedia.org/wiki/Seeding_(computing)) [hyperdrive's](https://hypercore-protocol.org/#hyperdrive) keys that you pass into it.
Using the CLI you can add, remove keys, check the status and inspect logs.

It also contains a [`dashboard`](#dashboard) that you can use to have a visual reference of what is going on with your hyperdrives.

As you can see the project does a couple of things. To do this we decided to use a microservices based approach. We choose to use [moleculer](https://moleculer.services/) as the structural framework behind the Permanent Seeder. This enables multiples processes to communicate each other and at the same time each of these will have a single responsibility/scope. This also give us some room to scale things up if needed.
:sunglasses:

## <a name="issues"></a> Issues

:bug: If you found an issue we encourage you to report it on [github](https://github.com/geut/permanent-seeder/issues). Please specify your OS and the actions to reproduce it.

## <a name="contribute"></a> Contributing

:busts_in_silhouette: Ideas and contributions to the project are welcome. You must follow this [guideline](https://github.com/geut/permanent-seeder/blob/master/CONTRIBUTING.md).

## Built in collaboration with Liberate Science

<a href="https://libscie.org" rel="nofollow">
<img src="https://github.com/libscie.png" alt="Liberate Science" width="200px" style="max-width:100%;">
</a>

## License

MIT © A [**GEUT**](http://geutstudio.com/) project
