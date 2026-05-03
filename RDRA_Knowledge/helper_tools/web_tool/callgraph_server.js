#!/usr/bin/env node
// callgraph_server.js
// 静的 http サーバー: callgraph.html / callgraph_data.json (実体: 3_RDRASdd/_callgraph/callgraph_data.json) / 3_RDRASdd/**/*.md を配信する。
// 前提: 3_RDRASdd/_callgraph/callgraph_data.json は 事前に生成済みであること。
// 本サーバーは callgraph_data.json が存在しない場合でも生成しない（404 を返す）。

'use strict';

const http = require('http');
const fs   = require('fs');
const path = require('path');

const WEB_ROOT = __dirname;
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm':  'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md':   'text/markdown; charset=utf-8',
  '.txt':  'text/plain; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.svg':  'image/svg+xml; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.ico':  'image/x-icon'
};

function resolveFromProjectRoot(reqUrl) {
  let urlPath;
  try {
    urlPath = decodeURIComponent(reqUrl.split('?')[0].split('#')[0]);
  } catch (_) {
    return null;
  }
  if (urlPath === '/' || urlPath === '' || urlPath === '/callgraph.html') {
    return path.join(WEB_ROOT, 'callgraph.html');
  }
  if (urlPath === '/callgraph_data.json') {
    return DATA_FILE;
  }
  // strip leading slashes
  const trimmed = urlPath.replace(/^[/\\]+/, '');
  const abs = path.resolve(PROJECT_ROOT, trimmed);
  // confine to project root
  const rootResolved = path.resolve(PROJECT_ROOT);
  if (!(abs === rootResolved || abs.startsWith(rootResolved + path.sep))) return null;
  return abs;
}

function send(res, status, body, headers) {
  const h = Object.assign({
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store'
  }, headers || {});
  res.writeHead(status, h);
  res.end(body);
}

function serveFile(res, abs) {
  fs.stat(abs, (err, stat) => {
    if (err || !stat.isFile()) {
      send(res, 404, 'Not Found: ' + path.relative(PROJECT_ROOT, abs));
      return;
    }
    const ext = path.extname(abs).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': mime,
      'Cache-Control': 'no-store',
      'Content-Length': stat.size
    });
    fs.createReadStream(abs).pipe(res);
  });
}

const DATA_FILE = path.join(PROJECT_ROOT, '3_RDRASdd', '_callgraph', 'callgraph_data.json');

const server = http.createServer((req, res) => {
  const reqPath = (req.url || '/').split('?')[0].split('#')[0];
  if (reqPath === '/__shutdown' || reqPath === '/__shutdown/') {
    send(res, 200, 'shutting down', { 'Access-Control-Allow-Origin': '*' });
    console.log('callgraph_server: shutdown requested via /__shutdown');
    setTimeout(() => process.exit(0), 50);
    return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    send(res, 405, 'Method Not Allowed', { 'Allow': 'GET, HEAD' });
    return;
  }
  const abs = resolveFromProjectRoot(req.url || '/');
  if (!abs) {
    send(res, 403, 'Forbidden');
    return;
  }
  if (abs === DATA_FILE && !fs.existsSync(DATA_FILE)) {
    send(res, 404,
      'callgraph_data.json が見つかりません。\n');
    return;
  }
  serveFile(res, abs);
});

server.listen(PORT, HOST, () => {
  const url = `http://${HOST}:${PORT}/`;
  console.log('callgraph_server: listening on ' + url);
  console.log('[info] projectRoot: ' + PROJECT_ROOT);
  if (!fs.existsSync(DATA_FILE)) {
    console.warn('[warn] callgraph_data.json が存在しません。');
  } else {
    console.log('[ok] callgraph_data.json: ' + path.relative(PROJECT_ROOT, DATA_FILE));
  }
  console.log('Open: ' + url + 'callgraph.html');
});

server.on('error', (err) => {
  console.error('callgraph_server error: ' + err.message);
  process.exit(1);
});
