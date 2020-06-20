# [Lookquran.com](https://lookquran.com)

## About

This project was a self weekend (actually two weekends) challenge for me to build instant and minimal search engine for quran, as most quran websites doesn't offer this feature as I intend to use, so I built it on my own. On the first 2 weeks I got 1K visitors and received many positive feedbacks.

Recently I've been asked to share the source code while I'm sure this is not the best thing to share but let's agree that done is better than perfect. This version was built on the bare minimum. I haven't configured build tools or plugged any external node packages. Maybe weird, maybe it's all about this.

## Requirements

- [Nginx](https://nodejs.org) for serving static files and reverse proxy.
- [Node.js](https://nodejs.org) version 8 or higher for api server.

or Alternatively, use [Docker compose](https://docs.docker.com/compose/install).

## Usage

- For development

```bash
docker-compose up
```

The app will start on default port 80. You can check it at <http://localhost>
