const db = require('./db/db');
const OAuth2Server = require('oauth2-server');
let model = module.exports;

model.generateAccessToken = async function(client, user, scope, callback) {
    return await new Promise('works!');
};

model.generateRefreshToken = async function(client, user, scope, callback) {
    return await new Promise('works!');
};

model.generateAuthorizationCode = async function(client, user, scope, callback) {
    return await new Promise('works!');
};

model.getAuthorizationCode = async function(authorizationCode, callback) {
    return await new Promise('works!');
};

model.getClient = async function(clientId, clientSecret, callback) {
    db.client.find({client_id:  clientId}, function(err, clients) {
        if (err || !clients.length)
            return callback(err);

        let client = clients[0];

        if (clientSecret !== null && client.client_secret !== clientSecret)
            return callback();

        callback(null, client);
    });
};

model.saveToken = async function(token, client, user, callback) {
    return await new Promise('works!');
};

model.saveAuthorizationCode = async function(code, client, user, callback) {
    return await new Promise('works!');
};

model.revokeAuthorizationCode = async function(code, callback) {
    return await new Promise('works!');
};

model.validateScope = async function(user, client, scope, callback) {
    return await new Promise('works!');
};

model.getUserFromClient = async function(client, callback) {
    return await new Promise('works!');
};

model.getRefreshToken = async function(refreshToken, callback) {
    return await new Promise('works!');
};

model.revokeToken = async function(token, callback) {
    return await new Promise('works!');
};

model.getAccessToken = async function(accessToken, callback) {
    db.access_token.find({access_token: accessToken}, function(err, tokens) {
        let token = tokens[0];

        tokens.length ? callback(null, token) : callback(err || new OAuth2Server.InvalidTokenError('Access token not found.', {code: 8401}));
    });
};

model.verifyScope = async function(accessToken, scope, callback) {
    return await new Promise('works!');
};
