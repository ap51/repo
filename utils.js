const fs = require('fs');
const path = require('path');

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

    router.use(bodyParser.json());

    router.beginHandler = function(options) {
        //let service = options.service;
        return async function (req, res, next) {
            let route = {...req.params};
            route.ident = `${route.name}${route.id ? ':' + route.id : ''}`;
            route.url = `${route.name}${route.id ? ':' + route.id : ''}${route.action ? '.' + route.action : ''}`;

            res.locals.route = route;

            next();
        }
    };

    router.endHandler = function(options) {
        //let service = options.service;
        return async function (req, res) {
            if (req.method === 'GET') {
                let route = req.session.redirect || res.locals.route.name;

                let content = route && await loadContent(route, res, service);

                res.locals.component = content.toString();
            }

            let response = {
                redirect: req.session.redirect,
                data: res.locals.data,
                error: res.locals.error,
                component: res.locals.component,
                session: {
                    auth: req.session.user,
                    id: req.session.id
                }
            };


            delete req.session.redirect;

            res.end(JSON.stringify(response));
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