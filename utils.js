const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const JSON5 = require('json5');
const requireFromString = require('require-from-string');


let readFile = function(path, callback){
    return new Promise(function (resolve, reject) {
        fs.readFile(path, function (err, content){
            err ? reject(err) : resolve(content);
        });
    });
};

let getSFC = function(name, service){
    return readFile(path.join(__dirname, 'services', service, 'components', name + '.vue'))
};

let loadContent = async function (name, res, service) {
    let content = '';
    try {
        content = await getSFC(name, service);
    }
    catch (err) {
        content = await getSFC('not-found', service);
    }

    return content;
};

let parseRoute = function (param) {
    let _route = param;

    let [route, action] = _route.split('.');
    let [name, id] = route.split(':');

    return {
        name,
        id,
        action,
        ident: route
    };
};

const crypto = require('crypto2');
const jwt = require('jsonwebtoken');
const Component = require('./component');

let _router = function(service) {
    const express = require('express');
    const bodyParser = require('body-parser');

    const config = require('./config');
    let patterns = config.route_patterns;

    let router = express.Router();
    router.service = service;
    router.database = require(path.join(__dirname, 'services', service, 'database', 'db'));

/*
    class RequestError extends Error {
        constructor(options) {
            super(options.message);
            this.code = options.code;
            this.redirect = options.redirect;
        }
    }
*/

/*
    class Api {
        constructor(routes, router) {
            this.routes = routes;
            this.map = {};
            this.router = router;
            this.tokens = {};
        }

        check(req) {
            let route = function (path) {
                let [route, action] = path.split('.');
                let [name, id] = route.split(':');

                return {
                    name,
                    id,
                    action,
                    ident: route
                };
            };

            req.isAPI = this.routes.find(function (item) {

                let result = name === item.name;

                result = result && item.actions.find(function (item) {
                    return item[`${action}.${method}`] || item[`*.${method}`] || item[`*.*`];
                });

                let key = Object.keys(result || {})[0];
                key && (self.map[JSON5.stringify(route)] = result[key]);

                return !!key;
            });

            req.isAPI = !!req.isAPI;

            return req
        }

        check1(req) {
            let self = this;
            let route = req.params;
            let method = req.method.toLowerCase();
            let {name, action} = route;

            req.isAPI = this.routes.find(function (item) {

                let result = name === item.name;

                result = result && item.actions.find(function (item) {
                    return item[`${action}.${method}`] || item[`*.${method}`] || item[`*.*`];
                });

                let key = Object.keys(result || {})[0];
                key && (self.map[JSON5.stringify(route)] = result[key]);

                return !!key;
            });

            req.isAPI = !!req.isAPI;

            return req.isAPI;
        }

        exec(req, res) {
            this.route = req.params;
            this.redirect = req.headers.referer;

            return this.map[JSON5.stringify(this.route)](req, res, this.router);
        }

        normalize(data) {
            //get schema & applly to data
            return data;
        }


    }

    const routes = require(path.join(__dirname, 'services', service, 'api'));
    router.database = require(path.join(__dirname, 'services', service, 'database', 'db'));

    router.api = new Api(routes || [], router);
*/

    router.use(bodyParser.urlencoded({extended: false}));
    router.use(bodyParser.json());

    router.token = jwt;


/*
    router.get('/public-key', function (req, res, next) {
        res.setHeader(200).end(router.keys.public);
    });
*/

/*
    let generateKeys = async function (force) {
        keys = (keys && !force) || await crypto.createKeyPair();
    };
*/

    let encryptRSA = async function(data, publicKey) {let buffer = new Buffer(data);
        let encrypted = await crypto.encrypt.rsa(data, publicKey);
        return encrypted;
    };

    let decryptRSA = async function(data, privateKey) {
        let decrypted = await crypto.decrypt.rsa(data, privateKey);
        return decrypted;
    };

    router.encode = async function (token) {
        token.verified = true;

        token.data = token.data || {session: await crypto.createPassword()};
        token.data = JSON5.stringify(token.data);

        token.data = await encryptRSA(token.data, token.public || keys.publicKey);

        let encoded = jwt.sign(token, keys.privateKey);
        return encoded;
    };

    router.decode = async function (token) {
        let decoded = {};
        try {
            decoded = token ? jwt.verify(token, keys.privateKey) : {};
        }
        catch (err) {
            decoded = jwt.decode(token);
            decoded.verified = false;
        }

        decoded.data = await decryptRSA(decoded.data, keys.privateKey);
        decoded.data = JSON5.parse(decoded.data);

        decoded.count = decoded.count + 1 || 1;
        return decoded;
    };

    router.beginHandler = function(options) {
        getKeys(service, true);

        return async function (req, res, next) {
            console.log('BEGIN - ', req.originalUrl);
            router.req = req;
            router.res = res;

            let token = req.headers['token'];
            req.token = token ? await router.decode(token) : {};
            req.headers['authorization'] = req.token.access && `Bearer ${req.token.access[router.service]}`;

            let name = req.params.name;

            let content = name && await loadContent(name, res, service);
            router.$ = cheerio.load(content);

            let selector = router.$('server-script');

            router.component = router.component || void 0;
            selector.each(function(i, element) {
                if(i === 0) {
                    let code = router.$(element).text();
                    let Class = requireFromString(code, `server-${name}.js`);
                    router.component = Class && new Class(router);
                }
            });

            selector.remove();

            router.component = router.component || new Component(router);

            next();
        }
    };

    router.endHandler = function(options) {

        return async function (req, res) {
            req.params.action && await router.component[req.params.action](req, res);

            let response = {
                error: res.locals.error,
                redirect_remote: res.redirect_remote,
                redirect_local: res.redirect_local,
                token: await router.encode(req.token),
                auth: req.token.auth,
                data: router.component.data
            };

            if(res.redirect_remote || res.redirect_local) {
                return res.end(JSON.stringify(response));
            }

/*
            let route = res.redirect_local || req.params.name;

            let content = route && await loadContent(route, res, service);
            let $ = cheerio.load(content);

            let selector = $('server-script');

            let component = void 0;
            selector.each(function(i, element) {
                if(i === 0) {
                    let code = $(element).text();
                    let Class = requireFromString(code, `server-${route}.js`);
                    component = new Class(route, service, {});
                }
            });

            selector.remove();
*/


            if (!req.isAPI && req.method === 'GET') {
                res.locals.data = router.component.data;

                res.locals.component = router.$.html();
            }

            if(!response.error) {
                response = {...response,
                    entities: res.locals.entities,
                    component: res.locals.component,
                };
            }

            delete res.locals.redirect;

            return res.end(JSON.stringify(response));

            console.log('END - ', req.originalUrl);

        }
    };

    return router;
};

let keys = void 0;

let getKeys = async function (service) {
    let file_path = path.join(__dirname, 'services', service);

    try {
        let privateKey = fs.readFileSync(path.join(file_path, 'private.pem'), 'utf8');
        let publicKey = fs.readFileSync(path.join(file_path, 'public.pem'), 'utf8');
        keys = privateKey && publicKey ? {privateKey, publicKey} : void 0;
    }
    catch (err) {
        if (!keys) {
            keys = {privateKey, publicKey} = await crypto.createKeyPair();

            fs.writeFileSync(path.join(file_path, 'private.pem'), privateKey, 'utf-8');
            fs.writeFileSync(path.join(file_path, 'public.pem'), publicKey, 'utf-8');
        }
    }
};

module.exports = {
    router: _router,
};