const fs = require('fs');
const path = require('path');

let config = module.exports;

config.api_patterns = ['/api/:name\::id\.:action', '/api/:name\.:action', '/api/:name\::id', '/api/:name'];
config.ui_patterns = ['/ui/:name\::id\.:action', '/ui/:name\.:action', '/ui/:name\::id', '/ui/:name'];

