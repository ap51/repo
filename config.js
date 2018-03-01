const fs = require('fs');
const path = require('path');

let config = module.exports;

config.route_patterns = ['/:name\::id\.:action', '/:name\.:action', '/:name\::id', '/:name'];

