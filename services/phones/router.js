const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const expressSession = require('express-session');
const staticFileMiddleware = express.static(path.join(__dirname.replace(/services[\/|\\].*/, ''), 'public'), {});
const history = require('connect-history-api-fallback');

const loadContent = require('../../utils').loadContent;

let service = 'phones';

let router = express.Router();

const MemoryStore = expressSession.MemoryStore;
router.use(expressSession({
    saveUninitialized: true,
    resave: true,
    secret: 'ljeklfjwlekjf',
    store: new MemoryStore(),
    cookie: {
        maxAge: 3600000 * 24 * 7 * 52
    },
}));

router.use(staticFileMiddleware);

router.use(history({
    disableDotRule: true,
    verbose: true
}));

router.use(staticFileMiddleware);

router.use(bodyParser.json());

let ensureSignedIn = function(req, res, next) {
    if (!req.session.isSignedIn) {

        req.session.redirect = 'unauthorized';

        return end(req, res);
    }
    else {
        res.locals.data = {phones: db.phones};

        next();
    }
};

router.all('/:route', async function(req, res, next) {
    next();
});

router.post('/signout', function(req, res, next){
    let data = req.body;

    req.session.isSignedIn = false;

    req.session.redirect = data.location;

    req.session.user = void 0;

    next();
});

router.post('/signin', function(req, res, next){
    let data = req.body;

    if(data.email === '123') {
        req.session.isSignedIn = true;

        req.session.redirect = data.location;

        req.session.user = 'bob@tv.com';
    }
    else {
        res.locals.error = 'User not found.';
    }

    next();
});

let db = {};

db.phones = [];

if(!db.phones.length) {
    for (let i = 0; i < 70; i++) {
        digits = Math.floor(Math.random() * 90000000000) + 10000000000;
        db.phones.push({
            id: i,
            number: digits,
            owner: 'joe dou ' + digits
        });
    }
}

router.all('/find-phone', ensureSignedIn, function(req, res, next){
    next();
});

router.all('/phones-database', ensureSignedIn, function(req, res, next){
    next();
});

router.post('/phone', ensureSignedIn, function(req, res, next){
    let appended = req.body;
    let id = db.phones.push(appended) - 1;
    db.phones[id].id = id;

    res.locals.data = {phones: db.phones};
    next();
});

router.delete('/phone', ensureSignedIn, function(req, res, next){
    let removed = req.body;

    db.phones = db.phones.reduce(function (memo, item) {
        !removed.find(phone => parseInt(phone.number) === parseInt(item.number)) && memo.push(item);
        return memo;
    }, []);

    res.locals.data = {phones: db.phones};

    next();
});

router.patch('/phone', ensureSignedIn, function(req, res, next){
    let edited = req.body;
    db.phones[edited.id] = edited;

    res.locals.data = {phones: db.phones};
    next();
});

let end = async function(req, res, next) {
    if(req.method === 'GET') {
        let route = req.session.redirect || req.params.route;

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
};

router.all('/:route', end);

module.exports = router;