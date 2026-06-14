// Production logging server and static asset distributor
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();

// Required so Express correctly extracts client IPs forwarded by Nginx
app.set('trust proxy', true);

const PORT = process.env.PORT || 8080;
const LOG_FILE = path.join(__dirname, 'logs.json');

// Path where the multi-stage Dockerfile drops the built React files
const BUILD_PATH = path.join(__dirname, '../build'); 

app.use(express.json());

// Strict Production CORS definitions
const allowedOrigins = [
  'https://www.yafumin-webapp.ddnsfree.com',
  'https://yafumin-webapp.ddnsfree.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

app.use((req, res, next) => {
  const origin = req.header('origin');
  if (origin && allowedOrigins.includes(origin)) {
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

// =========================================================
// API ENDPOINTS
// =========================================================

app.post('/log', (req, res) => {
  const { id, name, type } = req.body || {};
  const headerKey = req.header('x-key');

  if (!id || !name || !type) {
    return res.status(400).json({ error: 'missing id, name or type in body' });
  }

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

  res.json({ key, received: { id, name, type } });
});

app.get('/logs', (req, res) => {
  res.json(readLogs());
});

app.get('/config', (req, res) => {
  const providedKey = req.header('x-key');
  const logs = Array.isArray(readLogs()) ? readLogs() : [];

  const global = logs.length;
  const total = providedKey ? logs.filter((e) => e.key === providedKey).length : 0;
  const key = providedKey || crypto.randomBytes(12).toString('hex');

  res.json({
    key,
    serverTime: new Date().toISOString(),
    total,
    global,
  });
});

// =========================================================
// FRONTEND STATIC FILE DISTRIBUTION
// =========================================================

// 1. Instantly look up and serve JS, CSS, images, and manifest files from /app/build
app.use(express.static(BUILD_PATH));

// 2. Catch-all fallback router: Serves index.html for any direct page hits or refreshes
app.get('*', (req, res) => {
  const indexPath = path.join(BUILD_PATH, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend application assets are missing inside the workspace.');
  }
});

app.listen(PORT, () => {
  console.log(`Unified production server listening on port ${PORT}`);
});