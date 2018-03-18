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

    router.use(bodyParser.urlencoded({extended: false}));
    router.use(bodyParser.json());

    router.token = jwt;

    let encryptRSA = async function(data, publicKey) {let buffer = new Buffer(data);
        let encrypted = await crypto.encrypt.rsa(data, publicKey);
        return encrypted;
    };

    let decryptRSA = async function(data, privateKey) {
        let decrypted = await crypto.decrypt.rsa(data, privateKey);
        return decrypted;
    };

    let keys = void 0;

    router.encode = async function (token) {
        token[router.service].verified = true;

        token[router.service].data = token[router.service].data || {session: await crypto.createPassword()};

        token[router.service].access && (token[router.service].access = await encryptRSA(token[router.service].access, token.public || keys.publicKey));

        let encoded = jwt.sign(token, keys.privateKey);
        return encoded;
    };

    router.decode = async function (token) {
        let decoded = {};

        decoded[router.service] = {};
        let verified = true;

        try {
            decoded = token ? jwt.verify(token, keys.privateKey) : decoded;
        }
        catch (err) {
            decoded = jwt.decode(token);
            verified = false;
        }

        decoded[router.service] = decoded[router.service] || {};
        decoded[router.service].verified = verified;

        decoded[router.service].access && (decoded[router.service].access = await decryptRSA(decoded[router.service].access, keys.privateKey));

        decoded[router.service].count = decoded[router.service].count + 1 || 1;
        return decoded;
    };

    router.jwtHandler = function(options) {
        getKeys(service, true);
        keys = _keys[service];

        return async function (req, res, next) {
            router.req = req;
            router.res = res;

            let token = req.headers['token'];
            if(token) {
                req._token = token;

                req._token = await router.decode(req._token);
                req.token = req._token[router.service];

                req.headers['authorization'] = req.token.access && `Bearer ${req.token.access}`;
            }
            next();
        }
    };

    router.beginHandler = function(options) {
        return async function (req, res, next) {
            console.log('BEGIN - ', req.originalUrl);
/*
            router.req = req;
            router.res = res;

            let token = req.headers['token'];
            req._token = token;

            req._token = await router.decode(req._token);
            req.token = req._token[router.service];

            req.headers['authorization'] = req.token.access && `Bearer ${req.token.access}`;
*/

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

        return async function (req, res, next) {
            req.params.action && router.component[req.params.action] && await router.component[req.params.action](req, res);

            req._token[router.service] = req.token;

            let response = {
                error: res.locals.error,
                redirect_remote: res.redirect_remote,
                redirect_local: res.redirect_local,
                token: await router.encode(req._token),
                auth: req.token.auth,
                data: router.component.data
            };

            if(res.redirect_remote || res.redirect_local) {
                return res.end(JSON.stringify(response));
            }

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

            res.json(response);
            return res.end();
            //res.send(JSON.stringify(response));

            console.log('END - ', req.originalUrl);

        }
    };

    return router;
};

let _keys = {};

let getKeys = async function (service) {
    let file_path = path.join(__dirname, 'services', service);

    try {
        let privateKey = fs.readFileSync(path.join(file_path, 'private.pem'), 'utf8');
        let publicKey = fs.readFileSync(path.join(file_path, 'public.pem'), 'utf8');
        _keys[service] = privateKey && publicKey ? {privateKey, publicKey} : void 0;
    }
    catch (err) {
        if (!_keys[service]) {
            _keys[service] = {privateKey, publicKey} = await crypto.createKeyPair();

            fs.writeFileSync(path.join(file_path, 'private.pem'), privateKey, 'utf-8');
            fs.writeFileSync(path.join(file_path, 'public.pem'), publicKey, 'utf-8');
        }
    }
};

module.exports = {
    router: _router,
};