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
    content = await getSFC(name, service);
/*     try {
        content = await getSFC(name, service);
    }
    catch (err) {
        content = await getSFC('not-found', service);
    }
 */
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

    let service_path = path.join(__dirname, 'services', service);

    const favicon = require('serve-favicon');
    //const database = require(path.join(service_path, 'database', 'db'));
/*
    const config = require(path.join(service_path, `config`));
    let patterns = config.route_patterns;
*/

    let router = express.Router();
    router.service = service;
    //router.database = require(path.join(service_path, 'database', 'db'));
    router.use(favicon(path.join(service_path, 'favicon.ico')));

    const multer = require('multer');
    router.upload = multer();

    router.use(bodyParser.json());
    router.use(bodyParser.urlencoded({extended: false}));

    router.token = jwt;

    let encryptRSA = async function(data, publicKey) {
        let buffer = new Buffer(data);
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

        token[router.service].access && (token[router.service].access = await encryptRSA(JSON5.stringify(token[router.service].access), token.public || keys.publicKey));

        let encoded = jwt.sign(token, keys.privateKey);
        return encoded;
    };

    router.decode = async function (token) {
        let decoded = {};

        decoded[router.service] = {};
        let verified = true;

        //decoded = token ? jwt.verify(token, keys.privateKey) : decoded;

        try {
            decoded = token ? jwt.verify(token, keys.privateKey) : decoded;
        }
        catch (err) {
            decoded = jwt.decode(token);
            verified = false;
        }

        decoded.verified = verified;
        decoded[router.service] = decoded[router.service] || {};

        decoded[router.service].access && (decoded[router.service].access = JSON5.parse(await decryptRSA(decoded[router.service].access, keys.privateKey)));
/*
        let access = decoded[router.service].access ? await router.database.findOne('token', {accessToken: decoded[router.service].access.token}, {allow_empty: true}) : void 0;
        access && (access = {
            token: access.accessToken,
            user: access.user,
            client: access.client,
            expired: access.accessTokenExpiresAt,
            refresh_token: access.refreshToken
        });
        decoded[router.service].access = access;
*/

        decoded[router.service].count = decoded[router.service].count + 1 || 1;
        return decoded;
    };

    router.jwtHandler = function(options) {
        getKeys(service, true);
        keys = _keys[service];

        return async function (req, res, next) {
            console.log('ORIGIN:', req.originalUrl);
            
            let token = req.headers['token'] || '';

            req._token = token;

            req._token = await router.decode(req._token);
            
            if(!req._token.verified)
                throw new CustomError(401, 'Invalid signature');

            req.token = req._token[router.service];

            let access = (req.token.access && req.token.access.token) || req.query.access_token;
            req.query.access_token = void 0;

            //token = access && await database.findOne('token', {accessToken: access}, {allow_empty: true});
            // req.user = token && token.user;
            req.user = req.token && req.token.access && req.token.access.user;
            req.client = req.token && req.token.access && req.token.access.client;


            req.headers['authorization'] = access && `Bearer ${access}`;

            next();
        }
    };

    router.beginHandler = function(options) {
        return async function (req, res, next) {
            //console.log('BEGIN - ', req.originalUrl);

/*             req.params = res.locals.params || req.params;
            let name = req.params.name;

            let content = name && await loadContent(name, res, service);
            res.$ = cheerio.load(content);
 */
/*
            router.components = router.components || {};
            res.component = router.components[name];

            if(!res.component) {
                let selector = res.$('server-script');

                //res.component = res.component || void 0;
                selector.each(function (i, element) {
                    if (i === 0) {
                        let code = res.$(element).text();
                        let Class = requireFromString(code, `server-${name}.js`);
                        res.component = Class && new Class(router, req, res);
                    }
                });

                selector.remove();

                res.component = res.component || new Component(router, req, res);

                router.components[name] = res.component;
            }
*/

            //console.log('FLOW CONSTRUCTOR: ', name);

            next();
        }
    };

    router.endHandler = function(options) {

        return async function (req, res, next) {
            //req.params.action && res.component[req.params.action] && await res.component[req.params.action](req, res);


/*             let response = {
                error: res.locals.error,
                redirect_remote: res.redirect_remote,
                redirect_local: res.redirect_local,
                token: await router.encode(req._token),
                auth: req.token.auth,
            };

            if(res.redirect_remote || res.redirect_local) {
                return res.end(JSON.stringify(response));
            }

            if (!req.params.action && !req.isAPI && req.method === 'GET') {
                //res.locals.data = res.component.data;
                //res.locals.shared = res.component.shared;

                res.locals.component = res.$.html();
            }
 */
/*
            router.shared = {};

            for(let name in router.components) {
                let component = router.components[name];

                Object.assign(router.shared, merge(router.shared, component.shared(req, res), {
                    arrayMerge: function (destinationArray, sourceArray, options) {

                        let convert = function (item) {
                            typeof item === 'object' && (item = JSON5.stringify(item));
                            return item;
                        };

                        let destination = destinationArray.map(convert);

                        let source = sourceArray.map(convert);

                        let a = new Set(destination);
                        let b = new Set(source);
                        let union = Array.from(new Set([...a, ...b]));

                        union = union.map(item => JSON5.parse(item));

                        return union;
                    }
                }));
            }
*/

/*
            res.locals.shared = res.locals.shared || {};
            !res.locals.shared.location && (res.locals.shared.location = '');
*/

/*             if(!response.error) {
                response = {...response,
                    data: res.locals.data,
                    shared: res.locals.shared,
                    //entities: res.locals.entities,
                    component: res.locals.component,
                };
            }

            delete res.locals.redirect;

            res.status(221).json(response);
 */

            req._token[router.service] = req.token;

            let response = res.locals.response;
            response.token = await router.encode(req._token);

            res.status(response.status).json(response);
            return res.end();
            //res.send(JSON.stringify(response));

            //console.log('END - ', req.originalUrl);

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
    loadContent
};