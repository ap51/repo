//process.execArgv[0] = process.execArgv[0].replace('-brk', '');
"use strict";

const https = require('https');
const path = require('path');
const cluster = require('cluster');
const memored = require('memored');

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

cluster.on('exit', function (worker) {
    console.log('Worker %d died :(', worker.id);
    cluster.fork();
});

Date.prototype.toJSON = function() {
    return this * 1
};

let common_resources = {};

let store = function (key, value) {
    return new Promise(function (resolve, reject) {
        memored.store(key, value, function(err) {
            err ? reject(err) : resolve(key);
            console.log('Value stored!');
        });
    })
};

let read = function (key) {
    return new Promise(function (resolve, reject) {
        memored.read(key, function(err, value) {
            err ? reject(err) : resolve(value);
        });
    })
};

let keys = function () {
    return new Promise(function (resolve, reject) {
        memored.keys(function(err, keys) {
            err ? reject(err) : resolve(keys);
        });
    })
};

if (cluster.isMaster) {
    let cpuCount = require('os').cpus().length;

    fs.readdir('./services/', (err, dirs) => {
        dirs.forEach(async dir => {
            common_resources[dir] = common_resources[dir] || {};
            common_resources[dir].database = common_resources[dir].database || require(path.join(__dirname, 'services', dir, 'database', 'db'));

            await store(dir, common_resources[dir].database);
            console.log('keys:', await keys());
        });


        for (let i = 0; i < cpuCount; i += 1) {
            let worker = cluster.fork();

            worker.on('message', async function(msg) {
                let {service, module, method, args} = msg;
                try {
                    console.log(...args);
                    let result = await common_resources[service][module][method](...args);
                    worker.send({module, method, result});
                }
                catch(err) {
                    worker.send({module, method, err});
                }
            });

            let entries = Object.entries(common_resources['mtsn'].database);
            entries = entries.reduce(function (memo, entry) {
                let [key, value] = entry;
                typeof value === 'function' && memo.push(key);

                return memo;
            }, []);
            worker.send({module: 'databse', method: 'init', exports: entries})
            //worker.send({a: ''});
        }
    });
}
else {
    //console.log('PROCESS:', process.pid);
/*
     process.on('message', function(msg) {
        console.log('DATABASE:', msg);
    });
*/

    fs.readdir('./services/', (err, dirs) => {
        dirs.forEach(async dir => {
            //console.log(await keys());
            console.log(dir);
            try {
                let database = require(path.join(__dirname, 'services', dir, 'database', 'db'));
                app.use(`/${dir}/`, require(`./services/${dir}/router`));
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
*/


process.on('unhandledRejection', err => {
    throw err;
    //console.log('Unhandled rejection:', err);
});