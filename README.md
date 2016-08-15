[![CircleCI](https://circleci.com/gh/byavv/fm-image.svg?style=svg)](https://circleci.com/gh/byavv/fm-image)

## Microservice image for [funny-market](https://github.com/byavv/funny-market) project

### Features: 
- [rabbitmq](https://www.rabbitmq.com/) messaging via [rabbot](https://github.com/arobson/rabbot)
- [etcd](https://github.com/coreos/etcd) self-registration via [etcd-registry](https://github.com/mafintosh/etcd-registry)

### Usage

    npm install -g nodemon 
     ...
    git clone https://github.com/byavv/fm-image.git
    cd fm-image
    npm install

### Basic Commands

    npm start
    npm run dev
    npm test
    npm run clean
    npm run serve