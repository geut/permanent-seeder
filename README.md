# permanent-seeder

[![Build Status](https://travis-ci.com/geut/permanent-seeder.svg?branch=master)](https://travis-ci.com/geut/permanent-seeder)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

## <a name="install"></a> Install

```
npm i
npm run bootstrap
```

## <a name="usage"></a> Usage

### Create config for dashboard
```
cd packages/dashboard
cp .env.example .env
```

### Build dashboard app before start services with:
```
npm run build
```

### Start services
```
cd ../cli
./bin/run config:init --global
./bin/run start --restart
```

Dashboard will run on `http://localhost:3001`

### Optional: Start Dashboard in DEV mode
```
cd ../dashboard
npm start
```

Dashboard will run on `http://localhost:3000`

### Logs:

- Out: `tail -f ~/.pm2/logs/seeder-daemon-out.log`
- Errors: `tail -f ~/.pm2/logs/seeder-daemon-error.log`


### Stop services
```
cd ../cli
./bin/run stop
```

Dashboard will run on `http://localhost:3001`

## <a name="issues"></a> Issues

:bug: If you found an issue we encourage you to report it on [github](https://github.com/geut/permanent-seeder/issues). Please specify your OS and the actions to reproduce it.

## <a name="contribute"></a> Contributing

:busts_in_silhouette: Ideas and contributions to the project are welcome. You must follow this [guideline](https://github.com/geut/permanent-seeder/blob/master/CONTRIBUTING.md).

## License

MIT © A [**GEUT**](http://geutstudio.com/) project
