#!/usr/bin/env node
/*
 * server.js — admin backend for the /now page.
 *
 * The static terminal site (index.html) enters "admin mode" with Cmd/Ctrl+E and
 * posts here to compose & publish NOW.txt. On every write this server:
 *   1. mutates files under ./root (archiving the old NOW.txt into ./root/home/marcus/WAS/)
 *   2. runs `node server/build.js` to regenerate root/manifest.json + root/fs.js
 *   3. git add / commit / push   (so GitHub Pages redeploys)
 *
 * Run:
 *   node server/server.js         (from the project root)
 *
 * Env vars (all optional):
 *   PORT=8787            port to listen on
 *   ADMIN_TOKEN=secret   if set, mutating requests must send  X-Admin-Token: secret
 *   ALLOW_ORIGIN=*       CORS origin to allow (default *)
 *   GIT_BRANCH=main      branch to push (default: current branch)
 *   GIT_REMOTE=origin    remote to push to (default origin)
 *   NO_GIT=1             skip the git commit/push step (handy for local testing)
 *   NO_BUILD=1           skip running build.js
 *
 * No npm dependencies — Node standard library only.
 *
 * API (JSON in, JSON out):
 *   GET  /api/health              -> { ok, version }
 *   GET  /api/now                 -> { date, content, raw }
 *   PUT  /api/now                 -> overwrite NOW.txt in place        body { date, content }
 *   POST /api/now                 -> publish: archive current -> WAS,  body { date, content }
 *                                    then write the new NOW.txt
 *   GET  /api/was                 -> { items: [ { name, date, raw } ] }
 *   PUT  /api/was?name=NOW-….txt  -> overwrite an archived file        body { date, content }
 *   GET  /api/readme              -> { raw }
 *   PUT  /api/readme              -> overwrite README.txt in place     body { content }
 */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');   // project root (server.js lives in ./server)
const MARCUS_DIR = path.join(ROOT, 'root', 'home', 'marcus');
const NOW_FILE = path.join(MARCUS_DIR, 'NOW.txt');
const README_FILE = path.join(MARCUS_DIR, 'README.txt');
const WAS_DIR = path.join(MARCUS_DIR, 'WAS');
const BUILD_JS = path.join(__dirname, 'build.js');   // build.js sits next to this file in ./server

const PORT = parseInt(process.env.PORT || '8787', 10);
const TOKEN = process.env.ADMIN_TOKEN || '';
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || '*';
const GIT_BRANCH = process.env.GIT_BRANCH || '';
const GIT_REMOTE = process.env.GIT_REMOTE || 'origin';
const NO_GIT = process.env.NO_GIT === '1';
const NO_BUILD = process.env.NO_BUILD === '1';
const VERSION = 'now-admin/1.0';

const NOW_FOOTER = 'more: cat README.txt';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

// ---------- helpers ----------

function todayLabel() {
  const d = new Date();
  return MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
}

// Assemble the canonical NOW.txt text.
function buildNowText(date, content) {
  const body = String(content == null ? '' : content).replace(/\r/g, '').replace(/\s+$/, '');
  return 'last updated: ' + String(date).trim() + '\n\n' + body + '\n\n' + NOW_FOOTER + '\n';
}

// "July 1, 2026"  ->  "2026-07-01"   (accepts a full "last updated: …" line too)
function toISODate(input) {
  const m = /last updated:\s*(.+)/i.exec(input);
  const raw = (m ? m[1] : String(input)).trim();
  const d = new Date(raw);
  if (isNaN(d.getTime())) return null;
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

// Derive the archive date for an existing NOW.txt: first line, else file mtime, else today.
function archiveDateFor(rawText, filePath) {
  const firstLine = String(rawText).split('\n')[0] || '';
  let iso = toISODate(firstLine);
  if (iso) return iso;
  try {
    const d = fs.statSync(filePath).mtime;
    const p = (n) => String(n).padStart(2, '0');
    iso = d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  } catch (e) { /* ignore */ }
  return iso || toISODate(todayLabel());
}

function ensureDir(dir) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }

// Pick an unused WAS filename for a given ISO date (avoids clobbering same-day archives).
function uniqueArchivePath(iso) {
  ensureDir(WAS_DIR);
  let name = 'NOW-' + iso + '.txt';
  let full = path.join(WAS_DIR, name);
  let i = 2;
  while (fs.existsSync(full)) { name = 'NOW-' + iso + '-' + i + '.txt'; full = path.join(WAS_DIR, name); i++; }
  return { name: name, full: full };
}

function run(cmd, args) {
  return execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function runBuild() {
  if (NO_BUILD) return 'build skipped';
  run(process.execPath, [BUILD_JS]);   // same node binary that runs this server (nvm-safe under systemd)
  return 'built';
}

// git add -A ; commit ; push. Returns a short human summary; never throws.
function gitPublish(message) {
  if (NO_GIT) return 'git skipped';
  try {
    run('git', ['add', '-A']);
    // nothing staged? bail cleanly
    try { run('git', ['diff', '--cached', '--quiet']); return 'no changes to commit'; } catch (e) { /* there ARE changes */ }
    run('git', ['commit', '-m', message]);
    const branch = GIT_BRANCH || run('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
    run('git', ['push', GIT_REMOTE, branch]);
    return 'committed & pushed to ' + GIT_REMOTE + '/' + branch;
  } catch (e) {
    const detail = (e.stderr || e.stdout || e.message || '').toString().trim().split('\n').slice(-2).join(' ');
    return 'git error: ' + detail;
  }
}

function readNow() {
  if (!fs.existsSync(NOW_FILE)) return null;
  return fs.readFileSync(NOW_FILE, 'utf8');
}

function parseNow(raw) {
  const lines = String(raw == null ? '' : raw).replace(/\r/g, '').split('\n');
  const m = /last updated:\s*(.+)/i.exec(lines[0] || '');
  let body = lines.slice(m ? 1 : 0);
  while (body.length && body[0].trim() === '') body.shift();
  while (body.length && (body[body.length - 1].trim() === '' ||
    /^more:\s*cat\s+README\.txt/i.test(body[body.length - 1]))) body.pop();
  return { date: (m ? m[1].trim() : '') || todayLabel(), content: body.join('\n'), raw: raw };
}

function listWas() {
  if (!fs.existsSync(WAS_DIR)) return [];
  return fs.readdirSync(WAS_DIR)
    .filter((f) => /^NOW-.*\.txt$/.test(f))
    .sort((a, b) => b.localeCompare(a))
    .map((name) => {
      const raw = fs.readFileSync(path.join(WAS_DIR, name), 'utf8');
      return { name: name, date: parseNow(raw).date, raw: raw };
    });
}

// ---------- request handling ----------

function send(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': ALLOW_ORIGIN,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 1e6) { reject(new Error('body too large')); req.destroy(); } });
    req.on('end', () => { if (!data) return resolve({}); try { resolve(JSON.parse(data)); } catch (e) { reject(new Error('invalid JSON body')); } });
    req.on('error', reject);
  });
}

function authed(req) { return !TOKEN || req.headers['x-admin-token'] === TOKEN; }

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://localhost');
  const p = u.pathname.replace(/\/+$/, '') || '/';
  const method = req.method.toUpperCase();

  if (method === 'OPTIONS') { send(res, 204, {}); return; }

  try {
    if (p === '/api/health' && method === 'GET') {
      return send(res, 200, { ok: true, version: VERSION, git: !NO_GIT, build: !NO_BUILD });
    }

    if (p === '/api/now' && method === 'GET') {
      const raw = readNow();
      if (raw == null) return send(res, 404, { error: 'NOW.txt not found' });
      return send(res, 200, parseNow(raw));
    }

    if (p === '/api/was' && method === 'GET') {
      return send(res, 200, { items: listWas() });
    }

    if (p === '/api/readme' && method === 'GET') {
      if (!fs.existsSync(README_FILE)) return send(res, 404, { error: 'README.txt not found' });
      return send(res, 200, { raw: fs.readFileSync(README_FILE, 'utf8') });
    }

    // ---- mutations below require auth ----
    if (!authed(req)) return send(res, 401, { error: 'unauthorized (bad or missing X-Admin-Token)' });

    if (p === '/api/now' && method === 'POST') {
      // PUBLISH: archive the current NOW.txt, then write the new one.
      const body = await readBody(req);
      const date = String(body.date || todayLabel()).trim();
      let archived = null;
      const current = readNow();
      if (current != null && current.trim() !== '') {
        const iso = archiveDateFor(current, NOW_FILE);
        const dest = uniqueArchivePath(iso);
        fs.writeFileSync(dest.full, current, 'utf8');
        archived = 'WAS/' + dest.name;
      }
      fs.writeFileSync(NOW_FILE, buildNowText(date, body.content), 'utf8');
      const built = runBuild();
      const git = gitPublish('now: publish ' + date + (archived ? ' (archived ' + archived + ')' : ''));
      return send(res, 200, { ok: true, archived: archived, built: built, git: git, now: parseNow(readNow()) });
    }

    if (p === '/api/now' && method === 'PUT') {
      // EDIT in place — no archive.
      const body = await readBody(req);
      const date = String(body.date || todayLabel()).trim();
      fs.writeFileSync(NOW_FILE, buildNowText(date, body.content), 'utf8');
      const built = runBuild();
      const git = gitPublish('now: edit ' + date);
      return send(res, 200, { ok: true, built: built, git: git, now: parseNow(readNow()) });
    }

    if (p === '/api/was' && method === 'PUT') {
      const name = u.searchParams.get('name') || '';
      if (!/^NOW-[\w.-]+\.txt$/.test(name)) return send(res, 400, { error: 'bad archive name' });
      const full = path.join(WAS_DIR, name);
      if (!fs.existsSync(full)) return send(res, 404, { error: 'archive not found: ' + name });
      const body = await readBody(req);
      const date = String(body.date || parseNow(fs.readFileSync(full, 'utf8')).date).trim();
      fs.writeFileSync(full, buildNowText(date, body.content), 'utf8');
      const built = runBuild();
      const git = gitPublish('now: edit archive ' + name);
      return send(res, 200, { ok: true, built: built, git: git });
    }

    if (p === '/api/readme' && method === 'PUT') {
      // EDIT README.txt in place — freeform text, no date/footer wrapping.
      const body = await readBody(req);
      let text = String(body.content == null ? '' : body.content).replace(/\r/g, '');
      if (!/\n$/.test(text)) text += '\n';
      fs.writeFileSync(README_FILE, text, 'utf8');
      const built = runBuild();
      const git = gitPublish('now: edit README.txt');
      return send(res, 200, { ok: true, built: built, git: git });
    }

    return send(res, 404, { error: 'no such route: ' + method + ' ' + p });
  } catch (err) {
    return send(res, 500, { error: (err && err.message) || 'server error' });
  }
});

server.listen(PORT, () => {
  console.log('now-admin server.js listening on http://localhost:' + PORT);
  console.log('  root:      ' + ROOT);
  console.log('  NOW.txt:   ' + path.relative(ROOT, NOW_FILE));
  console.log('  archive:   ' + path.relative(ROOT, WAS_DIR) + '/');
  console.log('  auth:      ' + (TOKEN ? 'X-Admin-Token required' : 'OPEN (set ADMIN_TOKEN to lock down)'));
  console.log('  git push:  ' + (NO_GIT ? 'disabled (NO_GIT=1)' : 'enabled'));
  console.log('  build.js:  ' + (NO_BUILD ? 'disabled (NO_BUILD=1)' : 'enabled'));
});
