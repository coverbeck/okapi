const urlTool = require('url');
const queryTool = require('querystring');
const rx = require('rxjs');
const session = require('./jwtSession');
const http = require('../httprx');

const stateMessage = state => {
    if (state === 'ready') {
        return 'Server is ready';
    }
    return 'Server is running but not authenticated';
};

const startServer = (port, ssoEndpoint, apigeeEndpoint, basePath) => {
    // Keep the state in an object
    const state = session(http.secureRequest, ssoEndpoint);

    const server = http.createServer((req, res) => {
        const url = req.url;
        // Terminate server on `/kill` path:
        if (url.indexOf('/stop-server') === 0) {
            res.end(`Server at port: ${port} was terminated at ${new Date().toISOString()}`);
            server.close();
            process.exit();
            return;
        }
        // Server status
        if (url.indexOf('/status') === 0) {
            res.end(stateMessage(state.status()));
            return;
        }
        // Token
        if (url.indexOf('/token') === 0) {
            state.getToken().subscribe(
                data => { res.end(data); },
                error => { res.end(error); }
            );
            return;
        }
        // Authenticate
        if (url.indexOf('/authenticate') === 0) {
            const query = queryTool.parse(urlTool.parse(url).query);
            state.authenticate(query.user, query.pwd, query.mfa)
                .subscribe(
                    data => { res.end('You are now authenticated'); },
                    e => {
                        console.log('Error during authentication: ' + JSON.stringify(e));
                        res.end(`We got an error: ${e.error}\n`);
                    }
                );
            return;
        }
        // Proxy calls
        if (url.indexOf('/api') === 0) {
            // Remove /api from url
            req.url = url.substr('/api'.length);
            state.getToken().subscribe(
                token => {
                    http.secureProxy(req, res, apigeeEndpoint, basePath, token);
                },
                error => {
                    res.end(`Error: ${error.message}\n`);
                }
            );
            return;
        }

        res.end('404');
    });
    server.listen(port);
};

module.exports = startServer;