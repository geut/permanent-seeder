const { constants: { COPYFILE_EXCL }, mkdirSync, readFileSync, copyFileSync, writeFileSync } = require('fs')
const { join, resolve } = require('path')

const lodashGet = require('lodash.get')
const lodashSet = require('lodash.set')
const tomlParse = require('@iarna/toml/parse')
const tomlStringify = require('@iarna/toml/stringify')

const { CONFIG_FILENAME, TEMPLATE_CONFIG_FILE_PATH, TEMPLATE_ENDPOINT_HOOK, ENDPOINT_HOOK_FILENAME } = require('./constants')

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
  mkdirSync(configFolderPath, { recursive: true })

  const configFilePath = resolve(join(configFolderPath, CONFIG_FILENAME))
  const endpointHookFilePath = resolve(join(configFolderPath, ENDPOINT_HOOK_FILENAME))

  copyFileSync(
    TEMPLATE_CONFIG_FILE_PATH,
    configFilePath,
    options.force ? null : COPYFILE_EXCL
  )

  copyFileSync(
    TEMPLATE_ENDPOINT_HOOK,
    endpointHookFilePath,
    options.force ? null : COPYFILE_EXCL
  )

  // Set initial runtime config
  this.set('path', configFolderPath, { configFolderPath })
  this.set('keys.endpoints[0].hook', endpointHookFilePath, { configFolderPath })
}

/**
 * Returns a config entry based on key.
 * If key not present return all config entries
 *
 * @param {string} key Config key
 * @param {object} options Options
 * @param {string} options.configFolderPath Path to the folder where config file resides
 */
module.exports.get = (key, options = {}) => {
  const config = getConfig(options.configFolderPath, false)

  if (key) {
    return lodashGet(config, key)
  }

  return config
}

/**
 * Sets a config key => value
 *
 * @param {string} key Config key
 * @param {any} value Value to set
 * @param {string} options.configFolderPath Path to the folder where config file resides
 */
module.exports.set = (key, value, options = { configFolderPath: process.cwd() }) => {
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
