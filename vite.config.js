import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    {
      name: 'api-dev-middleware',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const url = req.url || '';
          if (!url.startsWith('/api/')) {
            return next();
          }

          const [pathname] = url.split('?');
          let handlerFile = null;

          if (pathname === '/api/auth/status') {
            handlerFile = './api/auth/status.js';
          } else if (pathname === '/api/auth/send-code') {
            handlerFile = './api/auth/send-code.js';
          } else if (pathname === '/api/auth/verify-code') {
            handlerFile = './api/auth/verify-code.js';
          } else if (pathname === '/api/auth/me') {
            handlerFile = './api/auth/me.js';
          } else if (pathname === '/api/saves') {
            handlerFile = './api/saves.js';
          }

          if (!handlerFile) {
            return next();
          }

          try {
            // Buffer POST body
            let bodyStr = '';
            for await (const chunk of req) {
              bodyStr += chunk;
            }
            if (bodyStr) {
              try {
                req.body = JSON.parse(bodyStr);
              } catch {
                req.body = bodyStr;
              }
            } else {
              req.body = {};
            }

            // Polyfill Express-style status & json methods for dev server
            res.status = function (code) {
              res.statusCode = code;
              return res;
            };
            res.json = function (payload) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(payload));
              return res;
            };

            const mod = await import(handlerFile);
            await mod.default(req, res);
          } catch (err) {
            console.error('Dev API Error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      }
    }
  ]
});
