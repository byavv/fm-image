"use strict"
const aws = require('aws-sdk')
  , logger = require("../lib/logger")
  , debug = require('debug')('ms:image');
module.exports = function (server) {
  var s3 = new aws.S3({
    accessKeyId: server.get('aws').accessKeyId,
    secretAccessKey: server.get('aws').secretAccessKey,
    signatureVersion: 'v4'
  });

  var router = server.loopback.Router();
  router.get('/', server.loopback.status());

  router.post('/api/remove', (req, res) => {
    if (req.body && req.body.key) {
      var params = {
        Bucket: 'carmarket',
        Key: req.body.key,
      };
      s3.deleteObject(params, function (err, data) {
        if (err) throw err;
        if (server.rabbit) {
          server.rabbit.publish('ex.cars', {
            type: 'cars.delete.image',
            routingKey: "messages",
            body: { carId: req.body.carId, key: req.body.key }
          }).then(() => {
            debug(`DELETED ${req.body.key} IMAGE`);
            logger.info(`S3 object removed success, key: ${req.body.key}`);
            return res.status(200).send({ message: "delete success" });
          });
        }
      });
    } else {
      logger.error(`Wrong request format: ${req.body}`);
      return res.status(400).send({ message: "Format error, key not found" });
    }

  })
  router.post('/api/upload/:carId', (req, res) => {
    debug(`UPLOAD ${req.files ? req.files.length : 'ERR'} IMAGES FOR USER: ${req.params.carId}`);
    var files = req.files;
    var carId = req.params.carId;
    if (!carId) return res.sendStatus(400);

    server.rabbit.publish('ex.cars', {
      type: 'cars.update.images',
      routingKey: "messages",
      body: { carId: carId, files: files }
    }).then(() => {
      logger.info(`S3 objects (${files.length}) upload success`);
      return res.status(200).send({ message: "upload success" });
    });
  });
  server.use(router);
};
