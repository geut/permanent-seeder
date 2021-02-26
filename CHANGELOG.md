# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Changed
- Update: release process update git tag action

### Fixed
- packages/seeder
  - Fix: use remotePublicKey to differentiate peers #154

## [1.0.5] - 2021-01-22
### Changed
- Update: publish from ci tweaks (release workflow)

### Fixed
- packages/seeder
  - Update: get rid of connectivity method call #150
- packages/sdk
  - Fix: Using cron v1.7.2 #151

## [1.0.4] - 2020-11-17
### Changed
- packages/dasboard
  - Update: add prepublishOnly script for rebuilding cra

## [1.0.3] - 2020-11-17
### Fixed
- packages/dashboard
  - Fix: remove unnecesary hook dependencies

## [1.0.2] - 2020-11-16
### Changed
- packages/sdk
  - Fix: adjust to process-top api change

## [1.0.1] - 2020-11-09
### Fixed
- packages/seeder
  - Update: unseed improvements (destroyStorage, closing)

## 1.0.0 - 2020-10-30
### Added
- Add routes section to README

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
  - Update: add new drive-download-resume event, avoid emitting drive-add multiple times on restart
- packages/metrics
  - Update: use trammel to get directory size of ps work dir
  - Update: update to reflect latest events (drive life cycle)
- Docs update

### Fixed
- packages/cli
  - Use api config to open dashboard in browser

### Added
- packages/cli
  - Pretty print logs

[Unreleased]: https://github.com/geut/permanent-seeder/compare/v1.0.5...HEAD
[1.0.5]: https://github.com/geut/permanent-seeder/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/geut/permanent-seeder/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/geut/permanent-seeder/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/geut/permanent-seeder/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/geut/permanent-seeder/compare/v1.0.0...v1.0.1
