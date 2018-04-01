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
    db.user.find({email:  username}, function(err, users) {
        if (err || !users.length)
            return callback(err);

        let user = users[0];

        if (password !== null && user.password !== password)
            return callback();

        callback(null, user);
    });
};

model.getClient = async function(clientId, clientSecret, callback) {
    db.client.find({client_id:  clientId}, function(err, clients) {
        if (err || !clients.length)
            return callback(err);

        let client = clients[0];

        if (clientSecret !== null && client.client_secret !== clientSecret)
            return callback();

        client.id = client._id;
        callback(null, client);
    });
};

model.saveToken = async function(token, client, user, callback) {
    token.client = {_id: client._id, scope: client.scope};//{id: client.client_id};
    let {_id, name, group, public_id} = user;
    token.user = {_id, name, group, public_id};
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
    db.token.find({refreshToken}, async function(err, tokens) {
        let token = tokens[0];
        if(token) {
            token.user = await db.findOne('user', {_id: token.user._id});
            token.client = await db.findOne('client', {_id: token.client._id});
        }
        tokens.length ? callback(null, token) : callback(err || new OAuth2Server.InvalidTokenError());
    });

};

model.revokeToken = async function(token, callback) {
    db.token.remove({accessToken: token.accessToken}, {}, function (err, removed) {
        callback(err, removed);
    });

};

model.getAccessToken = function(accessToken, callback) {
    db.token.find({accessToken}, async function(err, tokens) {
        let token = tokens[0];
        if(token) {
            token.user = await db.findOne('user', {_id: token.user._id});
            token.client = await db.findOne('client', {_id: token.client._id});
        }
        tokens.length ? callback(null, token) : callback(err || new OAuth2Server.InvalidTokenError());
    });
};

model.verifyScope = function(accessToken, scope, callback) {
    callback(null, !!accessToken.client.scope);
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
