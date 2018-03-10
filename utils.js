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

let _router = function(service) {
    const express = require('express');
    const bodyParser = require('body-parser');
    const expressSession = require('express-session');

    const config = require('./config');
    let patterns = config.route_patterns;

    let router = express.Router();

    class Api {
        constructor(routes) {
            this.routes = routes;
            this.map = {};
        }

        authentificate(req) {
            let self = this;
            let route = req.params;
            let method = req.method.toLowerCase();
            let {name, action} = route;

            return this.routes.find(function (item) {

                let result = name === item.name;

                result = result && item.actions.find(function (item) {
                    return item[`${action}.${method}`] || item[`*.${method}`] || item[`*.*`];
                });

                let key = Object.keys(result || {})[0];
                key && (self.map[JSON5.stringify(route)] = result[key]);

                return !!key;
            });
        }

        exec(req, res) {
            let route = req.params;
            return this.map[JSON5.stringify(route)](req, res);
        }

        request(url) {

        }
    }

    const routes = require(path.join(__dirname, 'services', service, 'api'));

    router.api = new Api(routes || []);

    const MemoryStore = expressSession.MemoryStore;

    router.use(expressSession({
        saveUninitialized: true,
        resave: true,
        secret: 'auth-api-secret',
        store: new MemoryStore(),
        cookie: {
            maxAge: 3600000 * 24 * 7 * 52
        },
    }));

    router.use(bodyParser.urlencoded({extended: false}));
    router.use(bodyParser.json());

    router.beginHandler = function(options) {
        let decode = function (token) {
            return JSON5.parse(token.replace(/bearer/i, ''));
        };

        return async function (req, res, next) {
            console.log('BEGIN - ', req.originalUrl);

            let route = {...req.params};
            route.ident = `${route.name}${route.id ? ':' + route.id : ''}`;
            route.url = `${route.name}${route.id ? ':' + route.id : ''}${route.action ? '.' + route.action : ''}`;

            res.locals.route = route;

            let authorization = req.headers['authorization'];
            res.locals.token = authorization ? decode(authorization) : {};
            req.session.user = res.locals.token.email;

            res.router = router;
            next();
        }
    };

    router.endHandler = function(options) {

        let encode = function (token) {
            return JSON5.stringify(token);
        };

        return async function (req, res) {
            let response = {
                error: res.locals.error,
                session: {
                    auth: req.session.user,
                    id: req.session.id,
                    token: encode(res.locals.token)
                }
            };

            if (req.method === 'GET') {
                let route = req.session.redirect || res.locals.route.name;

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
                    redirect: req.session.redirect,
                    data: res.locals.data,
                    entities: res.locals.entities,
                    component: res.locals.component,
                };
            }

            delete req.session.redirect;

            res.end(JSON.stringify(response));

            console.log('END - ', req.originalUrl);

        }
    };

    return router;
};


module.exports = {
    loadContent,
    readFile,
    parseRoute,
    //beginHandler,
    //endHandler,
    router: _router
};