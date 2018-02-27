const fs = require('fs');
const path = require('path');

let readFile = function(path, callback){
    return new Promise(function (resolve, reject) {
        fs.readFile(path, function (err, content){
            err ? reject(err) : resolve(content);
        });
    });
};

/*
let getSFC = function(name, service){
    return new Promise(function (resolve, reject) {
        fs.readFile(path.join(__dirname, 'services', service, 'components', name + '.vue'), function (err, content){
            err ? reject(err) : resolve(content);
        });
    });
};
*/

/*
let getSFC = function(name, service){
    return new Promise(function (resolve, reject) {
        readFile(path.join(__dirname, 'services', service, 'components', name + '.vue'), function (err, content){
            err ? reject(err) : resolve(content);
        });
    });
};
*/

let getSFC = function(name, service){
    return readFile(path.join(__dirname, 'services', service, 'components', name + '.vue'))
};

let loadContent = async function (name, res, service) {
    let content = '';
    try {
        content = await getSFC(name, service);
    }
    catch (err) {
        content = await getSFC('not-found', service);
    }

    return content;
};

module.exports = {
    loadContent,
    readFile
};