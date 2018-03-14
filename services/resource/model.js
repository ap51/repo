const db = require('./database/db');
const OAuth2Server = require('oauth2-server');
const crypto = require('crypto');
const randomBytes = require('bluebird').promisify(require('crypto').randomBytes);

let model = module.exports;

let generateRandomToken = function() {
    return randomBytes(256).then(function(buffer) {
        return crypto
            .createHash('sha1')
            .update(buffer)
            .digest('hex');
    });
};

/*
model.generateAccessToken = async function(client, user, scope, callback) {
    return await new Promise('generateAccessToken!');
};
*/

/*
model.generateRefreshToken = async function(client, user, scope, callback) {
    return await new Promise('generateRefreshToken!');
};
*/

model.generateAuthorizationCode = async function(client, user, scope, callback) {
    user = user && user._id;
    callback(!user && new Error(401, 'no user'), await generateRandomToken());
};

model.getAuthorizationCode = async function(authorizationCode, callback) {
    db.code.find({authorizationCode}, function(err, codes) {
        if (err || !codes.length)
            return callback(err);

        let code = codes[0];// && codes[0].user;

        callback(null, code);
    });
};

model.getUser = async function(username, password, callback) {
    return await new Promise('works!');
};

model.getClient = async function(clientId, clientSecret, callback) {
    db.client.find({client_id:  clientId}, function(err, clients) {
        if (err || !clients.length)
            return callback(err);

        let client = clients[0];

        if (clientSecret !== null && client.client_secret !== clientSecret)
            return callback();

        client.id = client.client_id;
        callback(null, client);
    });
};

model.saveToken = async function(token, client, user, callback) {
    token.client = {id: client.client_id};
    token.user = user;
    db.token.insert(token, function (err, inserted) {
        callback(err, inserted);
    });
};

model.saveAuthorizationCode = async function(code, client, user, callback) {
    code.client = {id: client.client_id};
    code.user = user._id;
    db.code.insert(code, function (err, inserted) {
        callback(err, inserted);
    });
    //return await new Promise('works!');
};

model.revokeAuthorizationCode = async function(code, callback) {
    db.code.remove({_id: code._id}, {}, function (err, removed) {
        callback(err, removed);
    });
};

model.validateScope = async function(user, client, scope, callback) {
    model.getClient(client.client_id, client.client_secret, function (err, client) {
        scope = scope.split(',');
        let valid = scope.every(s => client.scope.indexOf(s) !== -1);

        callback(err, valid);
    });
};

model.getUserFromClient = async function(client, callback) {
    return await new Promise('getUserFromClient!');
};

model.getRefreshToken = async function(refreshToken, callback) {
    return await new Promise('getRefreshToken!');
};

model.revokeToken = async function(token, callback) {
    return await new Promise('revokeToken!');
};

model.getAccessToken = async function(accessToken, callback) {
    db.token.find({accessToken}, function(err, tokens) {
        let token = tokens[0];
        //callback(null, token);
        tokens.length ? callback(null, token) : callback(err || new OAuth2Server.InvalidTokenError());
    });
};

model.verifyScope = async function(accessToken, scope, callback) {
    model.getAccessToken(accessToken, function (err, token) {
        console.log(token.scopes);
        callback(err, token);
    });
};
