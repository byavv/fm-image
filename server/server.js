var boot = require('loopback-boot');
var http = require('http');
var loopback = require('loopback');
var app = module.exports = loopback();

var host = process.env.HTTP_HOST || "0.0.0.0",
    http_port = process.env.HTTP_PORT || 3008,
    etcd_host = process.env.ETCD_HOST || "192.168.99.100",
    rabbit_host = process.env.BROCKER_HOST || "192.168.99.100",
    mongo_host = process.env.DBSOURCE_HOST || "localhost";

app.set("mongo_host", mongo_host);
app.set("http_port", http_port);
app.set("etcd_host", etcd_host);
app.set("rabbit_host", rabbit_host);
app.set("ms_name", 'image');

boot(app, __dirname, (err) => {
    if (err) throw err;
    app.start = function () {
        var httpServer = http.createServer(app).listen(http_port, host, () => {
            console.log(`Image server is listening on: http://${host}:${http_port}`);
            app.emit('started');
            app.close = (done) => {
                app.removeAllListeners('started');
                app.removeAllListeners('loaded');
            };
        });
    };
    if (require.main === module)
        app.start();
    app.loaded = true;
    app.emit('loaded');
});
