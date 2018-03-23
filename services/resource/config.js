'use strict'

const fs = require('fs');
const path = require('path');
const database = require('./database/db');
const normalizer = require('normalizr');

let config = module.exports;

config.api_patterns = ['/api/:name\::id\.:action', '/api/:name\.:action', '/api/:name\::id', '/api/:name'];
config.ui_patterns = ['/ui/:name\::id\.:action', '/ui/:name\.:action', '/ui/:name\::id', '/ui/:name'];

class CustomError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}

let matrix = {
    'ui': [
        {
            patterns: ['about'],
            secured: true,
            access: ['users']
        },
        {
            patterns: ['clients', 'users'],
            secured: true,
            access: ['admins']
        },
        {
            patterns: ['profile', 'phones'],
            secured: true,
            access: ['*']
        }
    ],
    'api': [
        {
            patterns: ['profile.*', 'phones*'],
            secured: true,
            access: ['*'],
            actions: {
                'profile.get': function() {
                    return {profile: {id: 2121, text: 'ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ'}};
                },
                'phones.get': async function(token) {
                    return {user: [{id: 'current', phone: await database.find('phone', {user: token.user.id})}]};
                },
                'phones.save': async function(token, data) {
                    if(data.number === '00000000000') {
                        throw new CustomError(406, 'Not allowed phone number.');
                    }
                    else {
                        data.user = token.user.id;

                        let updates = await database.update('phone', {_id: data.id}, data);
                        return {user: [{id: 'current', phone: updates}]};
                    }
                },
                'phones.remove': async function(token, data) {
/*
                    let ids = [];
                    for(let inx in data) {
                        ids.push(data[inx].id);
                    }
*/

                    data = Array.isArray(data) ? data : [data];

                    let ids = data.map(phone => phone.id);

                    let updates = await database.remove('phone', {_id: { $in: ids }}, data);
                    return {user: [{id: 'current', phone: data}]};
                }

            }
        },
        {
            patterns: ['clients.*', 'users.*'],
            secured: true,
            access: ['admins'],
            actions: {
                'clients.get': async function() {
                    return {client: await database.find('client', {})};
                }
            }
        }
    ]

};

config.endpoints = {
    api: 'api',
    ui: 'ui',
    patterns(endpoint) {
        return [':name\::id\.:action', ':name\.:action', ':name\::id', ':name'].map(pattern => `/${endpoint}/${pattern}`);
    },
    secured(endpoint, params) {
        let {name, action} = params;
        
        let value = `${name}${action ? '.' + action : ''}`;

        let secured = matrix[endpoint].some(function(unit){

            let patterns = unit.patterns.some(function(pattern) {

                let expression = pattern.replace(/\./gi, '\\.').replace(/\*/gi, '.*').replace(/\+/gi, '.+');
                let regexp = new RegExp(expression, 'gi');
                let match = regexp.test(value);
                
                return match && unit.secured;
            });

            return patterns;
        });

        return secured;
    },
    access(endpoint, params, access_group) {
        let {name, action} = params;
        
        let value = `${name}${action ? '.' + action : ''}`;
        
        let found = void 0;

        let granted = matrix[endpoint].some(function(unit){

            let patterns = unit.patterns.some(function(pattern) {

                let expression = pattern.replace(/\./gi, '\\.').replace(/\*/gi, '.*').replace(/\+/gi, '.+');
                let regexp = new RegExp(expression, 'gi');
                let match = regexp.test(value);
                
                return match && unit.access.some(group => group === '*' || access_group === group);
            });

            patterns && (found = unit);
            return patterns;
        });

        return granted ? found : false;
    },
    action(endpoint, params, unit) {
        let {name, action} = params;
        
        let value = `${name}${action ? '.' + action : ''}`;

        let notFound = function () {
            return {action: {name: 'not found', id: 1, request: params}};
        };

        return unit ? unit.actions[value] || notFound: notFound;
    },
    entities(data) {
        return normalize(data);
    }
};

let normalize = function(data) {
    let schema = normalizer.schema;
    
    const _action = new schema.Entity('action', {});

    const _profile = new schema.Entity('profile', {});

    const _phone = new schema.Entity('phone', {});

    const _user = new schema.Entity('user', {
        phone: [ _phone ]
    });

    const _client = new schema.Entity('client', {}, {
        //idAttribute: '_id' // to use not standard ID
    });
    
    const db = new schema.Entity('database', { 
        action: _action,
        client: [ _client ],
        user: [ _user ],
        profile: _profile
      }, {
        idAttribute: 'api'
      });
    
    let entities = normalizer.normalize(data, db);
    entities = {...entities, entry: 'database'};

    return entities;
}
