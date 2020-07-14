const { readFileSync } = require('fs')
const { homedir } = require('os')
const { join, resolve } = require('path')

const deepExtend = require('deep-extend')
const tomlParse = require('@iarna/toml/parse')

const CONFIG_FILENAME = 'permanent-seeder.toml'

const getConfigFileContent = (folderPath) => {
  const filePath = resolve(join(folderPath, CONFIG_FILENAME))
  let content
  try {
    content = readFileSync(filePath, { encoding: 'utf-8' })
  } catch (error) {}

  return content
}

const getConfig = (folderPath) => {
  const content = getConfigFileContent(folderPath)

  return content ? tomlParse(content) : {}
}

const loadConfig = () => {
  const globalConfig = getConfig(join(homedir(), 'permanent-seeder'))
  const localConfig = getConfig(process.cwd())

  return deepExtend(globalConfig, localConfig)
}

const Config = {
  settings: {
    config: { empty: true }
  },

  created () {
    this.settings.config = loadConfig()
  }
}

module.exports.Config = Config
