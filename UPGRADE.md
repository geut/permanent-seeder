# 0.0.1-alpha.7 to 0.0.1-alpha.8
  - On this version we've added a new log formatting, and both of current log files (`output.log` and `error.log`) should be empty before next `permanent-seeder` restart. Here's an example:

  ```bash
  permanent-seeder stop
  cd ~/permanent-seeder/logs
  mv output.log output.old.log # Optional: backup
  mv error.log error.old.log # Optional: backup
  echo '' > output.log # Empty file
  echo '' > error.log # Empty file
  permanent-seeder start
  ```
