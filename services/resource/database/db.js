let collections = ['token', 'client', 'user', 'code', 'scope', 'client_user'];

const path = require('path');
const Datastore = require('nedb');

let db = module.exports;

for(let inx in collections) {
    let conn = collections[inx];
    db[conn] = new Datastore({filename: path.join(__dirname, `_${conn}.db`), autoload: true});
}

db.client.find({client_id: 'one'}, function (err, clients) {
    !clients.length && db.client.insert(
        {
            "client_id":"one",
            "client_secret":"one_secret",
            "redirectUris":["https://localhost:5000/phones/token"],
            "app_name":"Phones",
            "grants":["authorization_code"],
            "scope":["profile","phones"],
            "authorize_uri":"https://localhost:5000/auth-api/oauthorize",
        },
        {
            client_id: 'self',
            client_secret: 'self_secret',
            redirect_uri: 'https://localhost:5000/resouce/token',
            app_name: 'Administrator app',
            scopes: ['profile', 'admin-api.*'],
            grants:["authorization_code"]
        },
        {
            client_id: 'one',
            client_secret: 'one_secret',
            redirect_uri: 'https://localhost:5000/phones/token',
            app_name: 'Phones app',
            scopes: ['profile', 'phones-api.*'],
            grants:["authorization_code"]
        },
    );
});

/*
db.user.find({email: 'user@user.com'}, function (err, users) {
    !users.length && db.user.insert({
        email: 'user@user.com',
        password: 'hash'
    });
});
*/

class NotFoundError extends Error {
    constructor(collection) {
        super(`Nothing has been found in "${collection}".`);
        this.code = 404;
    }
}
db.find = function(collenction, query) {
    return new Promise(function (resolve, reject) {
        db[collenction].find(query, function (err, results) {
            if(!results || err) {
                reject(err || new NotFoundError(collenction));
            }
            else {
                results && results.length && resolve(results);

                results && !results.length && reject(new NotFoundError(collenction));

                !results && reject(new NotFoundError(collenction));
            }
        })
    });
};

db.findOne = function(collenction, query) {
    return new Promise(async function (resolve, reject) {
        try {
            let results = await db.find(collenction, query);
            resolve(results[0]);
        }
        catch (err) {
            reject(err);
        }
    })
};

db.remove = function(collenction, query) {
    return new Promise(function (resolve, reject) {
        db[collenction].remove(query, {}, function (err, results) {
            console.log(results);
            if(!results || err) {
                reject(err || new NotFoundError(collenction));
            }
            else {
                results && resolve(results);
            }
        });

    });
};
