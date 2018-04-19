let service = __dirname.split(/\/|\\/g);
service = service[service.length - 1];

const utils = require('../../utils');
const axios = require('axios');

let router = utils.router(service);

let begin = router.beginHandler();
let end = router.endHandler();

const config = require('./config');
let patterns = config.route_patterns;

let ensureSignedIn = function(req, res, next) {
    if (!req.session.isSignedIn) {

        req.session.redirect = 'unauthorized';

        return router.endHandler()(req, res);
    }
    else {
        res.locals.entities = {phones: db.phones};

        next();
    }
};

router.get('/authorize', async function(req, res, next) {
    //get this after client registered and save locally/db
    let client_id = 'one';
    let response_type = 'code';
    let redirect_uri = 'https://localhost:5000/phones/_code';
    let authorize_uri = 'https://localhost:5000/auth-api/oauthorize/';

    let url = path.join(authorize_uri, `?response_type=${response_type}&client_id=${client_id}&redirect_uri=${redirect_uri}`);
    res.redirect(url);

    next();
});

router.all('/_code', async function(req, res, next) {
    res.end();
});

router.all('/token', async function(req, res, next) {
    res.end();
});

router.all('/:route', function (req, res, next) {
    next()
});

router.all(patterns, begin);

function apiHandler(options) {
    return async function(req, res, next) {
        if(router.api.check(req)) {

            let data = await router.api.exec(req, res);

            res.locals = {...res.locals, ...data};

        }
        next();
    }
}

//router.all(patterns, apiHandler());


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

router.all(patterns, end);

let init = function () {
    return router;
};

module.exports = {
    init,
    router
};