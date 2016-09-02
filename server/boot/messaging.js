"use strict"
const rabbit = require('rabbot')
    , async = require('async')
    , aws = require('aws-sdk')
    , logger = require("../lib/logger")
    , debug = require('debug')('ms:image');



module.exports = function (app) {
    rabbit.on('unreachable', () => {
        logger.error(`Error connecting RabbitMQ instance on ${app.get("rabbit_host")}:5672: UNREACHABLE`);
        process.exit(1);
    });
    const s3 = new aws.S3({
        accessKeyId: app.get('aws').accessKeyId,
        secretAccessKey: app.get('aws').secretAccessKey,
        signatureVersion: 'v4'
    });
    function handle() {
        rabbit.handle('image.delete', (message) => {
            const images = message.body || [];
            async.each(images, (image, callback) => {
                let params = {
                    Bucket: 'carmarket',
                    Key: image.key,
                };
                s3.deleteObject(params, (err, data) => {
                    debug("IMAGES DELETED", err, images, data)
                    callback(err, data)
                });
            }, (err, res) => {
                if (err) {
                    logger.error(`Error deletion images from S3`, err);
                } else {
                    logger.info(`Deleted images`, images);
                }
                message.ack();
            });
        });
    }

    app.once('started', () => {
        require('../lib/topology')(rabbit, {
            name: app.get('ms_name'),
            host: app.get("rabbit_host")
        })
            .then(handle)
            .then(() => {
                app.rabbit = rabbit;
                logger.info('Rabbit client started');
            })
            .catch((err) => {
                logger.error(`Error when joining rabbit network: ${err}`);
                throw err;
            })
    });
}
