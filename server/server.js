"use strtict"
const boot = require('loopback-boot')
    , http = require('http')
    , loopback = require('loopback')
    , app = module.exports = loopback()
    , logger = require("./lib/logger")
    , debug = require('debug')('ms:image');

const host = process.env.HTTP_HOST || "0.0.0.0",
    http_port = process.env.HTTP_PORT || 3008,
    etcd_host = process.env.ETCD_HOST || "localhost",
    rabbit_host = process.env.BROCKER_HOST || "localhost",
    mongo_host = process.env.DBSOURCE_HOST || "localhost";

if (!process.env.HTTP_HOST) { logger.warn(`HTTP_HOST environment is not set, try default ${http_port}`); }
if (!process.env.ETCD_HOST) { logger.warn(`ETCD_HOST environment is not set, try default ${etcd_host}`); }
if (!process.env.BROCKER_HOST) { logger.warn(`BROCKER_HOST environment is not set, try default ${rabbit_host}`); }
if (!process.env.DBSOURCE_HOST) { logger.warn(`DBSOURCE_HOST environment is not set, try default ${mongo_host}`); }
if (!process.env.AWS_ACCESS_KEY) { logger.error(`AWS_ACCESS_KEY is not set`); }
if (!process.env.AWS_SECRET_KEY) { logger.error(`AWS_SECRET_KEY is not set`); }


app.set("mongo_host", mongo_host);
app.set("http_port", http_port);
app.set("etcd_host", etcd_host);
app.set("rabbit_host", rabbit_host);
app.set("ms_name", 'image');
app.set("awsAccessKey", process.env.AWS_ACCESS_KEY);
app.set("awsSecretKey", process.env.AWS_SECRET_KEY)

boot(app, __dirname, (err) => {
    if (err) throw err;
    app.start = function () {
        const httpServer = http.createServer(app).listen(http_port, () => {
            app.emit('started');            
            app.close = function (done) {
                app.removeAllListeners('started');
                app.removeAllListeners('loaded');
                if (app.registry) {
                    debug('Leave etcd ...');
                    app.registry.leave(app.get('ms_name'));
                }
                if (app.rabbit) {
                    debug('Close rabbit...');
                    app.rabbit.closeAll();
                }
                httpServer.close(done);
            };
            process.on('SIGINT', app.close);
        });
    };
    if (require.main === module)
        app.start();
    app.loaded = true;
    app.emit('loaded');
});
