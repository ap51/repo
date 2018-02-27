"use strict";

const express = require('express');

const https = require('https');
const cluster = require('cluster');
const path = require('path');

const fs = require('fs');
const privateKey  = fs.readFileSync('ssl/key.pem', 'utf8');
const certificate = fs.readFileSync('ssl/cert.pem', 'utf8');
const credentials = {key: privateKey, cert: certificate};

const httpsListenPort = 3001;


//const history = require('connect-history-api-fallback');

const app = express();

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

httpsServer.listen(httpsListenPort);
