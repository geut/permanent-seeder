# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Changed
- packages/dashboard
  - Expose public/index.html as main + assets tweaks
  - Update: use preload for api/drives
- packages/sdk
  - Use require.resolve with dirname to obtain the dasboard assets dir
  - Update: pass optional swarm port to seeder
  - Api port setting
  - Api https settings
  - Pino as default logger
- packages/seeder
  - Fix: use corestoreOpts + allow optional preferredPort setting
- packages/metrics
  - Update: use trammel to get directory size of ps work dir
- Docs update

### Fixed
- packages/cli
  - Use api config to open dashboard in browser

### Added
- packahes/cli
  - Pretty print logs
