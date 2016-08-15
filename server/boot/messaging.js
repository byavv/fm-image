"use strict"
const rabbit = require('rabbot')
    , async = require('async')
    , aws = require('aws-sdk')
    , logger = require("../lib/logger")
    , debug = require('debug')('ms:image');

module.exports = function (app) {
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
                    debug("IMAGES DELETED", images, data)
                    callback(err, data)
                });
            }, (err, res) => {
                err ? message.nack() : message.ack();
            });
        });
        app.rabbit = rabbit;
        logger.info(`Service ${app.get('ms_name')} joined rabbit network`);
    }
    app.once('started', () => {
        require('../lib/topology')(rabbit, {
            name: app.get('ms_name'),
            host: app.get("rabbit_host")
        })
            .then(handle)
            .catch((err) => {
                logger.error(`Error when joining rabbit network: ${err}`);
                throw err;
            })
    });
}
