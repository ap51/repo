let collections = ['access_token', 'client', "refresh_token", "user", 'code'];

const path = require('path');
const Datastore = require('nedb');

let db = {};

for(let inx in collections) {
    let conn = collections[inx];
    db[conn] = new Datastore({filename: path.join(__dirname, `_${conn}.db`), autoload: true});
}

db.client.find({client_id: 'one'}, function (err, clients) {
    !clients.length && db.client.insert({
        client_id: 'one',
        client_secret: 'one_secret',
        redirect_uri: 'https://localhost:5000/phones/token',
        app_name: 'Phones',
        scopes: ['profile', 'phones']
    });
});

db.user.find({email: 'user@user.com'}, function (err, users) {
    !users.length && db.user.insert({
        email: 'user@user.com',
        password: 'hash'
    });
});

module.exports = db;