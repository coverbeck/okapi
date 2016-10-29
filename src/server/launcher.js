const rx = require('rxjs');
const cp = require('child_process');
const fs = require('fs');

const launch = conf => {
    const out = fs.openSync('./logs/out.log', 'a');
    const err = fs.openSync('./logs/out.log', 'a');
    const child = cp.spawn(
        'node',
        [
            './src/server/main.js',
            '-p', conf.port,
            '--sso', conf.ssoEndpoint,
            '--api', conf.apigeeEndpoint,
            '--path', conf.basePath
        ],
        { detached: true, stdio: ['ignore', out, err] }
    );
    child.unref();

    return rx.Observable.of(`Okapi server has been launched at port ${conf.port}`);
};

module.exports = launch;
