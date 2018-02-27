const path = require('path');
var bodyParser = require('body-parser');
var express = require('express');
var oauthServer = require('express-oauth-server');
var render = require('co-views')('views');
var util = require('util');

const staticFileMiddleware = express.static(path.join(__dirname.replace(/services[\/|\\].*/, ''), 'public'), {});
const history = require('connect-history-api-fallback');
const loadContent = require('../../utils').loadContent;

// Create an Express application.
let service = 'provider';

let router = express.Router();

router.use(staticFileMiddleware);

router.use(history({
    disableDotRule: true,
    verbose: true
}));

router.use(staticFileMiddleware);

// Add body parser.
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));

// Add OAuth server.
router.oauth = new oauthServer({
    model: require('./model')
});

let client_id = 'WpF616jFKHs';
let redirect_uri = '/secret';
let user = 'asd';


// Post token.
router.post('/token', router.oauth.token());

// Get authorization.
router.get('/authorize', async function(req, res) {
    // Redirect anonymous users to login page.
    if (!user) {
        return res.redirect(`/provider/signin?client_id=${client_id}&redirect_uri=${redirect_uri}`);
    }

    let content = await loadContent('auth', res, service);

    res.end(content);
});

// Post authorization.
router.post('/authorize', router.oauth.authorize(), function(req, res) {
    // Redirect anonymous users to login page.
    if (!user) {
        return res.redirect(`/provider/signin?client_id=${client_id}&redirect_uri=${redirect_uri}`);
    }
    //return router.oauth.authorize();
});

// Get login.
router.get('/signin', async function(req, res) {
    let content = await loadContent('signin', res, service);

    res.end(content);

    /*
        return render('login', {
            redirect: req.query.redirect,
            client_id: client_id,
            redirect_uri: redirect_uri
        });
    */
});

// Post login.
router.post('/signin', function(req, res) {
    // @TODO: Insert your own login mechanism.
/*
    if (req.body.email !== 'thom@nightworld.com') {
        return render('login', {
            redirect: req.body.redirect,
            client_id: req.body.client_id,
            redirect_uri: req.body.redirect_uri
        });
    }
*/

    user = 'asdlajsldl';
    // Successful logins should send the user back to /oauth/authorize.
    var path = req.body.redirect || '/provider/secret';

    return res.redirect(`${path}?client_id=${client_id}&redirect_uri=${redirect_uri}`);
});

// Get secret.
router.get('/secret', router.oauth.authenticate(), function(req, res) {
    // Will require a valid access_token.
    res.send('Secret area');
});

router.get('/public', function(req, res) {
    // Does not require an access_token.
    res.send('Public area');
});

router.all('/:route', async function(req, res, next) {
    let route = req.params.route;

    let content = route && await loadContent(route, res, service);

    res.end(content);
});

// Start listening for requests.

const readFile = require('../../utils').readFile;

const {Pool} = require('pg');
const pgtools = require('pgtools');

const config = {
    user: 'postgres',
    password: '123',
    port: 5432,
    host: 'localhost'
};

let applySchema = async function() {
    try {
        let result = await pgtools.createdb(config, 'oauth_provider');
    }
    catch (err) {
        console.log(err);
    }

    let content = await readFile(__dirname + '/schema.sql');

    let schema = content.toString();

    config.database = 'oauth_provider';

    const pool = new Pool(config);

    try {
        let result = await pool.query(schema);
    }
    catch (err) {
        console.log(err);
    }

    pool.end();

};

applySchema();

module.exports = router;