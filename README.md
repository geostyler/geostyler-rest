# node-rest-template

Template for a Node.js based REST API.

## Dev-Setup

### Run dev-server

```
git clone https://github.com/meggsimum/node-rest-template.git

cd node-rest-template

npm install

npm run start-dev
```

### Run unit tests

```
cd /path/to/this/checkout

npm run test
```

## Production setup

### Run server

```
cd /path/to/this/checkout

npm start
```

### Run with Docker

```
cd /path/to/this/checkout

docker build -t node_rest_server .

docker run -e NODE_API_PORT=9999 -p 9999:9999 node_rest_server
```
