const development = {
  "LOG": "debug",
  "DEVTOOLS": true,
}

module.exports = {
  "default": {},
  "development": {
    "NODE_ENV": "development",
    "SERVER_HOST": "localhost",
    "SERVER_PORT": 4000,
    "DREAMTRACK_HOST": "127.0.0.1:30200",
    "DOWNLOADS_API": "http://127.0.0.1:30200/downloads",
    ...development
  },
  "production": {
    "NODE_ENV": "production",
    "DREAMTRACK_HOST": "track.opendreamnet.com",
    "DOWNLOADS_API": "https://d.opendreamnet.com"
  },
  "test": {
    "NODE_ENV": "test",
  },
  "preview": {
    ...development
  }
}
