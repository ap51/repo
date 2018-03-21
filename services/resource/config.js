const fs = require('fs');
const path = require('path');

let config = module.exports;

config.api_patterns = ['/api/:name\::id\.:action', '/api/:name\.:action', '/api/:name\::id', '/api/:name'];
config.ui_patterns = ['/ui/:name\::id\.:action', '/ui/:name\.:action', '/ui/:name\::id', '/ui/:name'];

let matrix = {
    'ui': [
        {
            patterns: ['about'],
            secured: true,
            access: ['users']
        },
        {
            patterns: ['clients'],
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
/*         {
            patterns: ['about.*'],
            secured: true,
            access: ['users'],
            actions: {
                'about.get': function() {
                    return {action: 'about.get'}
                }
            }
        },
 */
        {
            patterns: ['profile.*', 'phones*'],
            secured: true,
            access: ['*'],
            actions: {
                'profile.get': function() {
                    return {text: 'ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ'};
                }
            }
        },
        {
            patterns: ['clients.*'],
            secured: true,
            access: ['admins'],
            actions: {
                'clients.get': function() {
                    return {action: 'clients.get'}
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
            })

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
            })

            patterns && (found = unit);
            return patterns;
        });

        return granted ? found : false;
    },
    action(endpoint, params, unit) {
        let {name, action} = params;
        
        let value = `${name}${action ? '.' + action : ''}`;

        return unit ? unit.actions[value] : function() {
            return {action: 'not found'};
        };
    }
}

