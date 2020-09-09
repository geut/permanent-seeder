```bash
# TERMINAL 1
# Cli
cd permanent-seeder/packages/cli

# Initialize config global
./bin/run config:init --global

# Check file
cat ~/permanent-seeder/permanent-seeder.toml


# TERMINAL 2
# Example creator/consumer
cd permanent-seeder/packages/seeder/src/example

# Run hyperdrive creator (existen drive)
# Let it running until seeder start
node creator.js # Get the generated key = hyper://
# Initialized new content, hyper://559750bc1b667e11c43472e7e2de45c6ba61852d08abfb140cae21d71b795e65


# TERMINAL 1
# Add previous creator key to database
./bin/run key:add 559750bc1b667e11c43472e7e2de45c6ba61852d08abfb140cae21d71b795e65

# Start seeder
./bin/run start


# TERMINAL 3
# Check pm2 logs and wait for drive to be sync
tail -f ~/.pm2/logs/seeder-daemon-out.log


# TERMINAL 4
# Check pm2 error log (Ignore endpoint http://localhost:3000)
tail -f ~/.pm2/logs/seeder-daemon-error.log


# TERMINAL 2
# Stop creator (ctrl + c)
>>>Ctrl + c

# Start consumer
node consumer.js 559750bc1b667e11c43472e7e2de45c6ba61852d08abfb140cae21d71b795e65

# Now you should see contents of json creator.js
```
