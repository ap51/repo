const fs = require('fs');
const path = require('path');

let config = module.exports;

config.api_patterns = ['/ui/:name\::id\.:action', '/ui/:name\.:action', '/ui/:name\::id', '/ui/:name'];
config.ui_patterns = ['/ui/:name\::id\.:action', '/ui/:name\.:action', '/ui/:name\::id', '/ui/:name'];

config.route_patterns = ['/ui/:name\::id\.:action', '/ui/:name\.:action', '/ui/:name\::id', '/ui/:name'];

