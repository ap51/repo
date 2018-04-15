const db = require('./database/db');
const OAuth2Server = require('oauth2-server');
const crypto = require('crypto');
const randomBytes = require('bluebird').promisify(require('crypto').randomBytes);

class NotFoundError extends Error {
    constructor(collection) {
        super(`Nothing has been found in "${collection}".`);
        this.code = 404;
    }
}

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
    user = user && user.id;
    callback(!user && new Error(401, 'no user'), await generateRandomToken());
};

model.getAuthorizationCode = async function(authorizationCode, callback) {
    try {
        let code = await db.findOne('code', {authorizationCode});
        callback(null, code);
    }
    catch(err) {
        callback(err);
    }


/*     db.find('code', {authorizationCode}, function(err, codes) {
        if (err || !codes.length)
            return callback(err);

        let code = codes[0];// && codes[0].user;

        callback(null, code);
    }); */
};

model.getUser = async function(username, password, callback) {
    try {
        let user = await db.findOne('user', {email:  username});
        let profile = await db.findOne('profile', {user:  user.id});
        user.public_id = profile.public_id;

        if (password !== null && user.password !== password)
            callback();
            else callback(null, user);
    }
    catch(err) {
        callback(err);
    }

    /* db.find('user', {email:  username}, function(err, users) {
        if (err || !users.length)
            return callback(err);

        let user = users[0];

        if (password !== null && user.password !== password)
            return callback();

        callback(null, user);
    }); */
};

model.getClient = async function(clientId, clientSecret, callback) {
    try {
        let client = await db.findOne('client', {client_id:  clientId});

        if (clientSecret !== null && client.client_secret !== clientSecret)
            callback();    
            else callback(null, client);
    }
    catch(err) {
        callback(err);
    }

    /* db.find('client', {client_id:  clientId}, function(err, clients) {
        if (err || !clients.length)
            return callback(err);

        let client = clients[0];

        if (clientSecret !== null && client.client_secret !== clientSecret)
            return callback();

        client.id = client._id;
        callback(null, client);
    }); */
};

model.saveToken = async function(token, client, user, callback) {
    token.client = {id: client.id, scope: client.scope};//{id: client.client_id};
    let {id, name, group, public_id} = user;
    token.user = {id, name, group, public_id};
    try {
        let inserted = await db.insert('token', token);
        callback(null, inserted);
    }
    catch(err) {
        callback(err);
    }
};

model.getAccessToken = async function(accessToken, callback) {
    try {
        let token = await db.findOne('token', {accessToken});
        token.user = await db.findOne('user', {_id: token.user.id}, {not_clear_result: true});
        let profile = await db.findOne('profile', {user: token.user.id});
        token.user.public_id = profile.public_id;

        token.client = await db.findOne('client', {_id: token.client.id}, {not_clear_result: true});

        callback(null, token);
    }
    catch(err) {
        callback(err);
    }

    /* db.find('token', {accessToken}, async function(err, tokens) {
        let token = tokens[0];
        if(token) {
            token.user = await db.findOne('user', {_id: token.user._id}, {not_clear_result: true});
            token.client = await db.findOne('client', {_id: token.client._id}, {not_clear_result: true});
        }
        tokens.length ? callback(null, token) : callback(err || new OAuth2Server.InvalidTokenError());
    }); */
};

model.getRefreshToken = async function(refreshToken, callback) {
    try {
        let token = await db.findOne('token', {refreshToken});
        token.user = await db.findOne('user', {_id: token.user.id}, {not_clear_result: true});
        let profile = await db.findOne('profile', {user: token.user.id});
        token.user.public_id = profile.public_id;

        token.client = await db.findOne('client', {_id: token.client.id}, {not_clear_result: true});

        callback(null, token);
    }
    catch(err) {
        callback(err);
    }

    /* db.find('token', {refreshToken}, async function(err, tokens) {
        let token = tokens[0];
        if(token) {
            token.user = await db.findOne('user', {_id: token.user._id}, {not_clear_result: true});
            token.client = await db.findOne('client', {_id: token.client._id});
        }
        tokens.length ? callback(null, token) : callback(err || new OAuth2Server.InvalidTokenError());
    }); */

};

model.saveAuthorizationCode = async function(code, client, user, callback) {
    code.client = {id: client.client_id};
    code.user = user.id;
    db.insert('code', code, function (err, inserted) {
        callback(err, inserted);
    });
    //return await new Promise('works!');
};

model.revokeAuthorizationCode = async function(code, callback) {
    db.remove('code', {_id: code.id}, {}, function (err, removed) {
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

model.revokeToken = async function(token, callback) {
    db.remove('token', {accessToken: token.accessToken}, {}, function (err, removed) {
        callback(err, removed);
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
