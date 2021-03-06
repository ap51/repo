let collections = ['credential'];

const path = require('path');
const Datastore = require('nedb');

let db = module.exports;

for(let inx in collections) {
    let conn = collections[inx];
    db[conn] = new Datastore({filename: path.join(__dirname, `_${conn}.db`), autoload: true});
}

db.credential.find({client_id: 'one'}, function (err, credentials) {
    !credentials.length && db.credential.insert({
        client_id: 'one',
        client_secret: 'one_secret',
        redirect_uri: 'https://localhost:5000/phones/token',

        app_name: 'Phones book searcher',
        scopes: ['profile', 'phones'],
        resource_endpoint: 'https://localhost:5000/resource/',
        authorize_endpoint: 'https://localhost:5000/resource/oauthorize/'
    });
});

db.find = function(collenction, query) {
    return new Promise(function (resolve, reject) {
        db[collenction].find(query, function (err, results) {
            if(!results || err) {
                reject(err || new Error('Nothings found.'));
            }
            else {
                results && results.length && resolve(results);

                results && !results.length && reject(new Error('Nothings found.'));

                !results && reject(new Error('Results not difined.'));
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