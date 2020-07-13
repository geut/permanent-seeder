const { constants: { COPYFILE_EXCL }, readFileSync, copyFileSync, writeFileSync } = require('fs')
const { join, resolve } = require('path')
const lodashGet = require('lodash.get')
const lodashSet = require('lodash.set')
const deepExtend = require('deep-extend')
const tomlParse = require('@iarna/toml/parse')
const tomlStringify = require('@iarna/toml/stringify')

const CONFIG_FILENAME = 'permanent-seeder.toml'
const CONFIG_EXAMPLE_FILENAME = 'permanent-seeder.example.toml'

const getConfigFileContent = (folderPath) => {
  const filePath = resolve(join(folderPath, CONFIG_FILENAME))
  let content
  try {
    content = readFileSync(filePath, { encoding: 'utf-8' })
  } catch (error) {}

  return content
}

const getConfig = (folderPath, fallbackValue) => {
  const content = getConfigFileContent(folderPath)

  return content ? tomlParse(content) : (fallbackValue !== undefined ? fallbackValue : {})
}

/**
 * Creates a config file on the specified location
 *
 * @param {string} configFolderPath Path to the folder where config file will be created
 * @param {object} options Options
 * @param {boolean} options.force Override existent file
 */
module.exports.init = (configFolderPath, options = {}) => {
  const filePath = resolve(join(configFolderPath, CONFIG_FILENAME))

  copyFileSync(
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
module.exports.get = (key, options = {}) => {
  const globalConfig = getConfig(options.globalConfigFolderPath)
  const localConfig = getConfig(options.localConfigFolderPath)

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
module.exports.set = (key, value, options = {}) => {
  const config = getConfig(options.configFolderPath, false)

  if (!config) {
    const error = new Error(`Config file on ${options.configFolderPath} doesn't exists`)
    error.code = 'CONFIG_FILE_NOT_EXISTS'
    throw error
  }

  lodashSet(config, key, value)

  const filePath = resolve(join(options.configFolderPath, CONFIG_FILENAME))

  writeFileSync(filePath, tomlStringify(config), 'utf-8')
}
