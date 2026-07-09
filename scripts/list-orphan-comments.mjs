#!/usr/bin/env node
/**
 * List archived comment .inc files that no post can load.
 * Uses the same path rules as config/shortcodes/index.js (getCommentText).
 *
 * Usage: node scripts/list-orphan-comments.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fm from 'front-matter';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const commentsRoot = path.join(root, 'src/_includes/comments');
const postsDir = path.join(root, 'src/posts');

function stripCommentUrl(raw) {
  if (!raw) return null;
  return raw
    .replace(/^https?:\/\/(www\.)?raymondcamden\.com/i, '')
    .replace(/\/index\.html$/i, '')
    .replace(/\.html$/i, '')
    .replace(/\/$/, '');
}

/** Keep in sync with config/shortcodes/index.js */
function commentPathCandidates(urlPath) {
  const base = stripCommentUrl(urlPath);
  if (!base) return [];

  const candidates = [];
  const add = (p) => {
    if (p && !candidates.includes(p)) candidates.push(p);
  };

  add(base);

  const m = base.match(/^(\/\d{4})\/(\d{1,2})\/(\d{1,2})(\/.*)$/);
  if (m) {
    const [, year, month, day, rest] = m;
    const mi = parseInt(month, 10);
    const di = parseInt(day, 10);
    add(`${year}/${String(mi).padStart(2, '0')}/${String(di).padStart(2, '0')}${rest}`);
    add(`${year}/${String(mi)}/${String(di)}${rest}`);
    add(`${year}/${String(mi).padStart(2, '0')}/${String(di)}${rest}`);
    add(`${year}/${String(mi)}/${String(di).padStart(2, '0')}${rest}`);
  }

  return candidates;
}

function commentIncExists(relPath) {
  return fs.existsSync(path.join(commentsRoot, relPath + '.inc'));
}

function resolveCommentPath(pagePath, old) {
  for (const source of [pagePath, old]) {
    if (!source) continue;
    for (const candidate of commentPathCandidates(source)) {
      if (commentIncExists(candidate)) return candidate;
    }
  }
  return null;
}

function walkPosts(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkPosts(p, out);
    else if (ent.name.endsWith('.md')) out.push(p);
  }
  return out;
}

function walkInc(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkInc(p, out);
    else if (ent.name.endsWith('.inc')) out.push(p);
  }
  return out;
}

const posts = walkPosts(postsDir);
const usedIncPaths = new Set();

for (const postFile of posts) {
  const { attributes: d } = fm(fs.readFileSync(postFile, 'utf8'));
  const url = d.permalink
    ? d.permalink.startsWith('/')
      ? d.permalink
      : '/' + d.permalink
    : null;
  if (!url) continue;

  const hit = resolveCommentPath(url, d.oldurl);
  if (hit) usedIncPaths.add(hit);
}

const orphans = [];
for (const incPath of walkInc(commentsRoot)) {
  const rel =
    '/' +
    path
      .relative(commentsRoot, incPath)
      .replace(/\.inc$/, '')
      .split(path.sep)
      .join('/');

  if (!usedIncPaths.has(rel)) orphans.push(rel);
}

orphans.sort();

console.log(`Orphan comment files: ${orphans.length} (of ${walkInc(commentsRoot).length} total)\n`);
for (const p of orphans) {
  console.log(path.join('src/_includes/comments', p.slice(1) + '.inc'));
}

if (orphans.length > 0) process.exit(1);
