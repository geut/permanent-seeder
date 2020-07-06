const { promises: { copyFile, writeFile }, constants: { COPYFILE_EXCL }, createReadStream } = require('fs')
const { join, resolve } = require('path')
const lodashGet = require('lodash.get')
const lodashSet = require('lodash.set')
const deepExtend = require('deep-extend')
const tomlParseStream = require('@iarna/toml/parse-stream')
const tomlStringify = require('@iarna/toml/stringify')

const CONFIG_FILENAME = 'permanent-seeder.toml'
const CONFIG_EXAMPLE_FILENAME = 'permanent-seeder.example.toml'

const getConfig = async folderPath => {
  const filePath = resolve(join(folderPath, CONFIG_FILENAME))
  let config
  try {
    config = await tomlParseStream(createReadStream(filePath, { encoding: 'utf-8' }))
  } catch (error) {}

  return config
}

/**
 * Creates a config file on the specified location
 *
 * @param {string} configFolderPath Path to the folder where config file will be created
 * @param {object} options Options
 * @param {boolean} options.force Override existent file
 */
module.exports.init = async (configFolderPath, options = {}) => {
  const filePath = resolve(join(configFolderPath, CONFIG_FILENAME))

  await copyFile(
    resolve(__dirname, CONFIG_EXAMPLE_FILENAME),
    filePath,
    options.force ? null : COPYFILE_EXCL
  )
}

/**
 * Returns a config entry based on key.
 * If key not present return all config entries
 *
 * @param {string} key Config key
 * @param {object} options Options
 * @param {string} options.globalConfigFolderPath Path to the folder where config file resides (global)
 * @param {string} options.localConfigFolderPath Path to the folder where config file resides (local)
 */
module.exports.get = async (key, options = {}) => {
  const globalConfig = await getConfig(options.globalConfigFolderPath)
  const localConfig = await getConfig(options.localConfigFolderPath)

  if (!globalConfig && !localConfig) return

  const mergedConfig = deepExtend(globalConfig, localConfig)

  if (key) {
    return lodashGet(mergedConfig, key)
  }

  return mergedConfig
}

/**
 * Sets a config key => value
 *
 * @param {string} key Config key
 * @param {any} value Value to set
 * @param {string} options.configFolderPath Path to the folder where config file resides
 */
module.exports.set = async (key, value, options = {}) => {
  const config = await getConfig(options.configFolderPath)

  if (!config) {
    const error = new Error(`Config file on ${options.configFolderPath} doesn't exists`)
    error.code = 'CONFIG_FILE_NOT_EXISTS'
    throw error
  }

  lodashSet(config, key, value)

  const filePath = resolve(join(options.configFolderPath, CONFIG_FILENAME))

  await writeFile(filePath, tomlStringify(config), 'utf-8')
}
