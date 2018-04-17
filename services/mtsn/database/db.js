let collections = ['token', 'client', 'user', 'code', 'scope', 'client_user', 'phone', 'profile', 'friend', 'post', 'chat', 'message'];

const cluster = require('cluster');
const path = require('path');
const Datastore = require('nedb');
//const normalizer = require('normalizr');
//const JSON5 = require('json5');

/*
Date.prototype.toISOString = function() {
    return new Date(this);
};
*/

class NotFoundError extends Error {
    constructor(collection) {
        super(`Nothing has been found in "${collection}".`);
        this.code = 404;
    }
}

if(cluster.isMaster) {
    //console.log('module:', module);

    let db = module.exports;

    for(let inx in collections) {
        let conn = collections[inx];
        db[conn] = new Datastore({filename: path.join(__dirname, `_${conn}.db`), autoload: true});
    }

    db.find = function(collection, query, options) {
        let {not_clear_result, allow_empty} = options || {};

        return new Promise(function (resolve, reject) {
            db[collection].find(query).sort({created: 1}).exec(function (err, results) {
                if(!results || err) {
                    reject(err || new NotFoundError(collection));
                }
                else {
                    results && results.length && resolve(results.map(record => {
                        if(!not_clear_result) {
                            record.id = record._id;
                            let {_id, ...clean} = record;
                            return clean;
                        }
                        return record;
                    }));

                    results && !results.length && (!allow_empty ? reject(new NotFoundError(collection)) : resolve(results));

                    !results && reject(new NotFoundError(collection));
                }
            })
        });
    };

    db.findOne = function(collection, query, options) {
        return new Promise(async function (resolve, reject) {
            try {
                let results = await db.find(collection, query, options);
                resolve(results[0]);
            }
            catch (err) {
                reject(err);
            }
        });
    };

    db.remove = function(collection, query, options) {
        let {allow_empty} = options || {};

        return new Promise(function (resolve, reject) {
            db[collection].remove(query, {multi: true}, function (err, results) {
                //console.log(results);
                if(!results || err) {
                    reject(err || (!allow_empty ? reject(new NotFoundError(collection)) : resolve(results)));
                }
                else {
                    results && resolve(results);
                }
            });

        });
    };

    db.update = function(collection, query, body) {
        return new Promise(async function (resolve, reject) {

            body.created = body.created || new Date() / 1;
            body.updated = new Date() / 1;

            let object = await db.findOne(collection, query, {allow_empty: true});
            object && (body = {...object, ...body});
            body && (delete body.id);
            
            db[collection].update(query, body, { upsert: true }, async function (err, results, upsert) {
                if(!results || err) {
                    reject(err || new NotFoundError(collection));
                }
                else {
                    results = upsert ? await db.find(collection, {_id: upsert._id}) : await db.find(collection, query);
                    results && resolve(results);
                    //reject(err || new NotFoundError(collection));
                }
            });

        });
    };

    db.insert = function(collection, data) {
        return new Promise(async function (resolve, reject) {
            
            db[collection].insert(data, function (err, inserted) {
                err ? reject(err) : resolve(inserted);
            });

        });
    };
}
else {
    let exports = ['insert', 'find', 'findOne', 'remove', 'update']; //get from env??

    exports = exports.reduce(function (memo, name) {
        let method = function(...args) {
            return new Promise(async function (resolve, reject) {
                let uid = new Date() / 1;

                process.once('message', function(msg){
                    if(msg.uid === uid) {
                        msg.err ? reject(msg.err) : resolve(msg.result);
                    }
                });

                process.send({
                    action: 'execute',
                    module: module.filename,
                    method: name,
                    args,
                    uid
                });
            });
        };

        memo[name] = method;
        return memo;
    }, {});

    module.exports = exports;
}