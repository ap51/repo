//process.execArgv[0] = process.execArgv[0].replace('-brk', '');
"use strict";

const https = require('https');
const path = require('path');
//const cluster = require('cluster');
var cluster = require('express-cluster');
//const memored = require('memored');

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

Date.prototype.toJSON = function() {
    return `$$date:${this * 1}`;
};

RegExp.prototype.toJSON = function () {
    let regex = this;
    let flags = regex.flags;
    regex = regex.toString();
    regex = regex.replace(`/${flags}`, '').replace(/\//gi, '');
    return `$$regex:${regex}:${flags}`;
};

let parseOrigin = JSON.parse;

let parse = function (text) {
    let reviver = function(key, value) {
        if (typeof value === "string" && value.indexOf('$$date:') === 0) {
            value = value.replace('$$date:', '');
            return new Date(parseInt(value));
        }

        if (typeof value === "string" && value.indexOf('$$regex:') === 0) {
            value = value.replace('$$regex:', '');
            let [expr, flags] = value.split(':');
            try {
                return new RegExp(expr, flags);
            }
            catch (err) {
                return expr;
            }
        }

        return value;
    };

    return parseOrigin(text, reviver);
};

JSON.parse = parse;

let common_resources = {};

let common_resourses = {};

cluster(function() {
        fs.readdir('./services/', (err, dirs) => {
            dirs.forEach(async dir => {
                console.log(dir);
                try {
                    app.use(`/${dir}/`, require(`./services/${dir}/router`).router);
                    process.send({msg: 'ok', pid: process.pid});

                    const io = require('socket.io')(httpsServer, {
                        path: dir
                    });

                    io.on('connection', function(client){
                        client.on('event', function(data){
                            console.log('SOCKET:', data);
                        });

                        client.on('disconnecting', function(...args){
                            console.log('SOCKET: DISCONNECTING', args);
                        });

                        client.on('disconnect', function(...args){
                            console.log('SOCKET: DISCONNECT', args);
                        });
                    });
                }
                catch (err) {
                    console.log(err);
                }
            });

            httpsServer.listen(httpsListenPort);



            console.log(`https server linten on ${httpsListenPort} port.`);
        });
    },
    {
        verbose: true,
        respawn: false,
        workerListener: async function (msg) {
            //console.log('master with pid', process.pid, 'received', msg, 'from worker');
            let {action, module, method, args, uid} = msg;
            switch (msg.action) {
                case 'execute':
                    common_resources[module] = common_resources[module] || require(module);
                    let result = await common_resources[module][method](...args);
                    this.send({uid, result});
                    break;
                default:
                    break;
            }
        }
    });

process.on('unhandledRejection', err => {
    throw err;
});