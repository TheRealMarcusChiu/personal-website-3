#!/usr/bin/env node
/*
 * mirror.js — copy this repo's tracked files into a clone of the GitHub Pages repo
 * (therealmarcuschiu.github.io), then commit & push there. Everything tracked is copied
 * except .gitignore; the mirror's own CNAME and .gitignore are left alone.
 *
 * The mirror is a plain file sync, not a git history push: the github.io repo has its
 * own history and a CNAME this repo doesn't. Anything listed in KEEP is never written,
 * overwritten, or deleted in the mirror.
 *
 * Run by server.js after every successful push, or by hand:
 *   node server/mirror.js ["commit message"]
 *
 * Env vars (optional):
 *   MIRROR_DIR=/path/to/therealmarcuschiu.github.io   (default: sibling of this repo)
 *   MIRROR_REMOTE=origin                               (default origin)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SRC = path.join(__dirname, '..');   // project root (mirror.js lives in ./server)
const MIRROR_DIR = process.env.MIRROR_DIR || path.join(SRC, '..', 'therealmarcuschiu.github.io');
const MIRROR_REMOTE = process.env.MIRROR_REMOTE || 'origin';
const KEEP = new Set(['CNAME', '.gitignore']);   // never copied, overwritten, or deleted in the mirror (.git is never walked)

function git(cwd, args) {
  return execFileSync('git', args, { cwd: cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
function tracked(cwd) {
  const out = git(cwd, ['ls-files', '-z']);
  return out ? out.split('\0').filter(Boolean) : [];
}
function isKept(rel) { return KEEP.has(rel.split('/')[0]); }

// Sync and publish. Returns a short human summary; never throws.
function mirror(message) {
  if (!fs.existsSync(path.join(MIRROR_DIR, '.git'))) return 'mirror skipped (no repo at ' + MIRROR_DIR + ')';
  try {
    git(MIRROR_DIR, ['pull', '--ff-only', MIRROR_REMOTE]);

    const srcFiles = tracked(SRC).filter((f) => !isKept(f));
    const want = new Set(srcFiles);

    // remove files the source no longer has (CNAME excluded)
    for (const rel of tracked(MIRROR_DIR)) {
      if (isKept(rel) || want.has(rel)) continue;
      fs.rmSync(path.join(MIRROR_DIR, rel), { force: true });
    }
    // copy every tracked source file over
    for (const rel of srcFiles) {
      const from = path.join(SRC, rel), to = path.join(MIRROR_DIR, rel);
      if (!fs.existsSync(from)) continue;   // deleted in the working tree but not yet committed
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.copyFileSync(from, to);
    }

    git(MIRROR_DIR, ['add', '-A', '--', '.'].concat(Array.from(KEEP, (k) => ':(exclude)' + k)));
    try { git(MIRROR_DIR, ['diff', '--cached', '--quiet']); return 'mirror: no changes'; } catch (e) { /* there ARE changes */ }
    git(MIRROR_DIR, ['commit', '-m', message || 'sync from personal-website-3']);
    const branch = git(MIRROR_DIR, ['rev-parse', '--abbrev-ref', 'HEAD']);
    git(MIRROR_DIR, ['push', MIRROR_REMOTE, branch]);
    return 'mirrored to ' + path.basename(MIRROR_DIR) + ' (' + MIRROR_REMOTE + '/' + branch + ')';
  } catch (e) {
    const detail = (e.stderr || e.stdout || e.message || '').toString().trim().split('\n').slice(-2).join(' ');
    return 'mirror error: ' + detail;
  }
}

module.exports = { mirror: mirror };

if (require.main === module) console.log(mirror(process.argv[2]));
