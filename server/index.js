// Minimal logging server for development
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 8080;
const LOG_FILE = path.join(__dirname, 'logs.json');

app.use(express.json());
// Allow CORS from localhost development hosts
// Restrict CORS to allowed origins. For local development we allow localhost:3000 as well.
const allowedOrigins = [
  'https://www.yafumin-webapp.ddnsfree.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];
app.use((req, res, next) => {
  const origin = req.header('origin');
  if (origin && allowedOrigins.includes(origin)) {
    // echo back the allowed origin (do not use '*')
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-key');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Ensure log file exists
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, '[]', 'utf8');
}

function readLogs() {
  try {
    return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
  } catch (e) {
    return [];
  }
}

function writeLogs(logs) {
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2), 'utf8');
}

app.post('/log', (req, res) => {
  const { id, name, type } = req.body || {};
  const headerKey = req.header('x-key');

  // simple validation
  if (!id || !name || !type) {
    return res.status(400).json({ error: 'missing id, name or type in body' });
  }

  // use provided key or generate one
  const key = headerKey || crypto.randomBytes(12).toString('hex');

  const entry = {
    ts: new Date().toISOString(),
    id,
    name,
    type,
    key,
    ip: req.ip,
  };

  const logs = readLogs();
  logs.push(entry);
  try {
    writeLogs(logs);
  } catch (err) {
    console.error('failed to write logs', err);
  }

  // return a minimal response that the frontend expects (key + echo)
  res.json({ key, received: { id, name, type } });
});

app.get('/logs', (req, res) => {
  res.json(readLogs());
});

// Return a minimal runtime configuration to the client.
// The frontend `getConfiguration` expects a JSON object and will store an `x-key` if present.
app.get('/config', (req, res) => {
  const providedKey = req.header('x-key');

  // read logs once
  const logs = Array.isArray(readLogs()) ? readLogs() : [];

  // global: total number of recorded stickers across all users
  const global = logs.length;

  // total: number of stickers recorded by this specific user (identified by x-key)
  const total = providedKey ? logs.filter((e) => e.key === providedKey).length : 0;

  // return the provided key if present; otherwise generate a new key for client to store
  const key = providedKey || crypto.randomBytes(12).toString('hex');

  const runtimeConfig = {
    key,
    serverTime: new Date().toISOString(),
    total,
    global,
    // add any other runtime flags or URLs here if desired
  };

  res.json(runtimeConfig);
});

app.listen(PORT, () => {
  console.log(`Logging server listening on port ${PORT}`);
});
