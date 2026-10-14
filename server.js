/**
 * Marz Studio Ledger (مرز حساب) — Production VPS Node.js Multi-Device Database + PWA Server
 * Creator: Marz
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_FILE = path.join(__dirname, 'marz_database.json');
const PORT = process.env.PORT || 3000;

function readDb() {
  if (!fs.existsSync(DB_FILE)) return { users: {} };
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    return { users: {} };
  }
}

function writeDb(data) {
  const tmpFile = DB_FILE + '.tmp';
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmpFile, DB_FILE);
}

function hashPassword(password, salt = 'marz_studio_salt_v1') {
  return crypto.scryptSync(String(password || ''), salt, 32).toString('hex');
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(fs.readFileSync(path.join(__dirname, 'index.html')));
  }

  if (req.method === 'GET' && req.url === '/manifest.json') {
    res.writeHead(200, { 'Content-Type': 'application/manifest+json; charset=utf-8' });
    return res.end(fs.readFileSync(path.join(__dirname, 'manifest.json')));
  }

  if (req.method === 'GET' && req.url === '/sw.js') {
    res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
    return res.end(fs.readFileSync(path.join(__dirname, 'sw.js')));
  }

  if (req.url.startsWith('/api/ledger') && req.method === 'GET') {
    const urlObj = new URL(req.url, `http://localhost:${PORT}`);
    const email = (urlObj.searchParams.get('email') || 'marz@studio.ir').toLowerCase().trim();
    const password = urlObj.searchParams.get('password') || '';
    const db = readDb();
    const record = db.users[email];

    if (!record) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ email, payload: null }));
    }

    if (record.passwordHash && password && record.passwordHash !== hashPassword(password)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'رمز عبور حساب صحیح نیست' }));
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ email, payload: record.payload, updatedAt: record.updatedAt }));
  }

  if (req.url === '/api/ledger' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) req.destroy();
    });
    req.on('end', () => {
      try {
        const { email, password, payload } = JSON.parse(body);
        const cleanEmail = (email || 'marz@studio.ir').toLowerCase().trim();
        const db = readDb();
        const existing = db.users[cleanEmail];

        if (existing && existing.passwordHash && password && existing.passwordHash !== hashPassword(password)) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'رمز عبور حساب صحیح نیست' }));
        }

        db.users[cleanEmail] = {
          passwordHash: password ? hashPassword(password) : (existing ? existing.passwordHash : ''),
          payload,
          updatedAt: new Date().toISOString()
        };
        writeDb(db);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, syncedAt: new Date().toISOString() }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Marz Studio Ledger running on http://127.0.0.1:${PORT}`);
});
