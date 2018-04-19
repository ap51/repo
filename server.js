//process.execArgv[0] = process.execArgv[0].replace('-brk', '');
"use strict";

const https = require('https');
const path = require('path');
const cluster = require('cluster');
//var cluster = require('express-cluster');
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
let cpuCount = require('os').cpus().length;
let workers = [];

if(cluster.isMaster) {

    for (let i = 0; i < cpuCount; i++) {
        let worker = cluster.fork();

        worker.on('message', async function (msg) {
            let {action, module, method, args, uid} = msg;
            console.log('PROXY:', module, method, process.pid);

            switch (action) {
                case 'execute':
                    common_resources[module] = common_resources[module] || require(module);
                    let result = await common_resources[module][method](...args);

                    worker.send({uid, result, source: 'database', origin: msg});
                    for (let j in workers) {
                        worker !== workers[j] && workers[j].send({source: 'database', origin: msg});
                    }

                    break;
                default:
                    break;
            }
        });

        workers.push(worker);
    }
}

if(cluster.isWorker) {
    fs.readdir('./services/', (err, dirs) => {
        dirs.forEach(async dir => {
            console.log(dir);
            try {
                app.use(`/${dir}/`, require(`./services/${dir}/router`).router);
                process.send({msg: 'ok', pid: process.pid});

                const io = require('socket.io')(httpsServer, {
                    path: `/${dir}/ui/_socket_`
                });

                const service_namespace = io.of(`/${dir}`);

                service_namespace.on('connection', function(client){
                    client.emit('server:event', 'update1:location', 'https://localhost:5000/mtsn/ui/chats.get');

                    process.on('message', function(msg) {
                        let {source, origin} = msg;

                        switch (source) {
                            case 'database':
                                switch (origin.method) {
                                    case 'insert':
                                    case 'update':
                                    case 'remove':
                                        console.log('SOCKET:', source, origin.method, process.pid, client.id);
                                        //console.log('broadcast from:', process.pid);
                                        //client.broadcast.emit('server:event', 'update:location', 'https://localhost:5000/mtsn/ui/chats.get');
                                        client.emit('server:event', 'update:location', 'https://localhost:5000/mtsn/ui/chats.get');
                                        break;
                                }
                                break;
                        }
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
}


/*
cluster(function() {
        fs.readdir('./services/', (err, dirs) => {
            dirs.forEach(async dir => {
                console.log(dir);
                try {
                    app.use(`/${dir}/`, require(`./services/${dir}/router`).router);
                    process.send({msg: 'ok', pid: process.pid});

                    const io = require('socket.io')(httpsServer, {
                        path: `/${dir}/ui/_socket_`
                    });

                    const service_namespace = io.of(`/${dir}`);

                    service_namespace.on('connection', function(client){
                        client.emit('server:event', 'update1:location', 'https://localhost:5000/mtsn/ui/chats.get');

                        process.on('message', function(msg){
                            let {source, origin} = msg;
                            switch (source) {
                                case 'database':
                                    switch (origin.method) {
                                        case 'insert':
                                        case 'update':
                                        case 'remove':
                                            console.log('DATABASE.UPDATE:', msg.source, msg.origin);
                                            client.emit('server:event', 'update:location', 'https://localhost:5000/mtsn/ui/chats.get');
                                            break;
                                    }
                                    break;
                            }
                        });


                        const database = require(`${__dirname}/services/${dir}/database/db`);

                        console.log('SOCKET CONNECTED:', process.pid, Object.keys(client.nsp.connected));

                        client.on('chat:message', async function(data, callback) {
                            let updates = await database.update('message', {_id: ''}, data);
                            let message = {};
                            message = updates[0];

                            //console.log('SOCKET:', message);
                            callback(message);
                        });
                        
                        client.on('event', function(data, callback){
                            //console.log('SOCKET:', data);
                            callback({recieved: 1});
                        });

                        client.on('disconnecting', function(...args){
                            //console.log('SOCKET: DISCONNECTING', args);
                        });

                        client.on('disconnect', function(...args){
                            //console.log('SOCKET: DISCONNECT', args);
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
        respawn: true,
        workerListener: async function (msg) {
            //console.log('master with pid', process.pid, 'received', msg, 'from worker');
            let {action, module, method, args, uid} = msg;
            switch (action) {
                case 'execute':
                    common_resources[module] = common_resources[module] || require(module);
                    let result = await common_resources[module][method](...args);
                    this.send({uid, result, source: 'database', origin: msg});
                    break;
                default:
                    break;
            }
        }
    });
*/

process.on('unhandledRejection', err => {
    //throw err;
    console.log('unhandledRejection => ', err)
});