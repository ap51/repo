const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const JSON5 = require('json5');

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

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

let _router = function(service) {
    const express = require('express');
    const bodyParser = require('body-parser');

    const config = require('./config');
    let patterns = config.route_patterns;

    let router = express.Router();

    router.jwt = jwt;

    let keys = {
        ECDH: crypto.createECDH('secp521r1')
    };

    keys = {...keys,
        public: keys.ECDH.generateKeys('hex'),
        private: keys.ECDH.getPrivateKey('hex')
    };


    router.encode = function (token) {
        token.verified = true;
        let encoded = jwt.sign(token, keys.private);
        return encoded;
    };

    router.decode = function (token) {
        token = token.replace(/bearer/i, '').trim();
        let decoded = {};
        try {
            decoded = token ? jwt.verify(token, keys.private) : {};
        }
        catch (err) {
            decoded = jwt.decode(token);
            decoded.verified = false;
        }

        decoded.count = decoded.count + 1 || 1;
        return decoded;
    };

    class RequestError extends Error {
        constructor(options) {
            super(options.message);
            this.code = options.code;
            this.redirect = options.redirect;
        }
    }

    class Api {
        constructor(routes, router) {
            this.routes = routes;
            this.map = {};
            this.router = router;
            this.tokens = {};
        }

        check(req) {
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

    router.use(bodyParser.urlencoded({extended: false}));
    router.use(bodyParser.json());

    router.get('/public-key', function (req, res, next) {
        //const sectet = router.keys.ECDH.computeSecret(body);
        res.setHeader(200).end(router.keys.public);
    });

    router.beginHandler = function(options) {

        return async function (req, res, next) {
            console.log('BEGIN - ', req.originalUrl);

            if(req.headers.referer) {
                let query = req.headers.referer.split('?').pop();
                query = query.split('&');

                query = query.reduce(function (memo, item) {
                    let [key, value] = item.split('=');
                    memo[key] = value;

                    return memo;
                }, {});

                req.query = query;
                //query.from && (req.headers.referer = query.from);
            }

            let route = {...req.params};
            route.ident = `${route.name}${route.id ? ':' + route.id : ''}`;
            route.url = `${route.name}${route.id ? ':' + route.id : ''}${route.action ? '.' + route.action : ''}`;

            res.locals.route = route;

            let authorization = req.headers['authorization'];
            res.locals.token = authorization ? router.decode(authorization) : {};

            next();
        }
    };


    router.endHandler = function(options) {

        return async function (req, res) {
            let response = {
                error: res.locals.error,
                redirect: res.locals.redirect,
                token: router.encode(res.locals.token)
            };

            if (!req.isAPI && req.method === 'GET') {
                let route = res.locals.redirect || req.params.name;

                let content = route && await loadContent(route, res, service);
                let $ = cheerio.load(content);

                let componentData = {};

                let selector = $('component-data');

                selector.each(function(i, element) {
                    let json = $(element).text();//.replace(/\n/g, '').replace(/\r/g, '');
                    let data = JSON5.parse(json);
                    componentData = Object.assign(componentData, data);
                });

                res.locals.data = (router.onComponentData && router.onComponentData(req, res, response, componentData)) || componentData;

                selector.remove();

                //res.locals.component = content.toString();
                res.locals.component = $.html();
            }

            if(!response.error) {
                response = {...response,
                    data: res.locals.data,
                    entities: res.locals.entities,
                    component: res.locals.component,
                };
            }

            delete res.locals.redirect;

            res.end(JSON.stringify(response));

            console.log('END - ', req.originalUrl);

        }
    };

    return router;
};


module.exports = {
    router: _router
};