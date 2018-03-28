"use strict";

const https = require('https');
const path = require('path');

const express = require('express');

const staticFileMiddleware = express.static('public', {});
const history = require('connect-history-api-fallback');

const fs = require('fs');
const key  = fs.readFileSync('ssl/key.pem', 'utf8');
const cert = fs.readFileSync('ssl/cert.pem', 'utf8');
const credentials = {key, cert};

const httpsListenPort = 5000;

const app = express();

app.use('/:service/ui', staticFileMiddleware);

app.use('/:service/ui', history({
    disableDotRule: true,
    verbose: false
}));

app.use('/:service/ui', staticFileMiddleware);

let httpsServer = https.createServer(credentials, app);

app.use('/_file_/:name', function (req, res, next){
    fs.readFile(path.join(__dirname, 'file-storage', req.params.name), function (err, content){
        if(err) {
            res.status(500).end(`<!DOCTYPE html><html> <head><meta charset="utf-8"></head><body>Ошибка при запросе файла: ${req.params.name}</body></html>`);
        }
        else {
            res.end(content);
        }
    });
});

fs.readdir('./services/', (err, dirs) => {
    dirs.forEach(dir => {
        console.log(dir);
        try {
            //const serviceStatic = express.static(`public`, {});
            app.use(`/${dir}/`, require(`./services/${dir}/router`)(dir));
            //app.use(`/${dir}/ui`, serviceStatic);
        }
        catch (err) {
            console.log(err);
        }
    });

    httpsServer.listen(httpsListenPort);
    console.log(`https server linten on ${httpsListenPort} port.`);
});


process.on('unhandledRejection', err => {
    throw err;
    //console.log('Unhandled rejection:', err);
});