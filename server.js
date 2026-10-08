#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 8005;
const REPO_ROOT = path.resolve(__dirname);
const SITE_DIR = path.join(REPO_ROOT, 'site');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

const lessonHandler = require('./api/lesson.js');

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  if (pathname.length > 1 && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }

  // Vercel-style rewrite: /lesson -> /api/lesson (internal, not redirect)
  if (pathname === '/lesson') {
    // Call handler with url set to /api/lesson to avoid redirect loop
    const apiUrl = '/api/lesson' + (parsedUrl.search || '');
    const reqWithQuery = { ...req, query: parsedUrl.query, url: apiUrl };
    return lessonHandler(reqWithQuery, res);
  }

  // Handle API routes first
  if (pathname === '/api/lesson') {
    const reqWithQuery = { ...req, query: parsedUrl.query, url: req.url };
    return lessonHandler(reqWithQuery, res);
  }

  if (pathname === '/api/certification' || pathname === '/certification') {
    // Serve static certifications.html for now
    pathname = '/site/certifications.html';
  }

  // Static file rewrites
  if (pathname === '/' || pathname === '/index') {
    pathname = '/site/index.html';
  } else if (pathname === '/catalog') {
    pathname = '/site/catalog.html';
  } else if (pathname === '/projects') {
    pathname = '/site/projects.html';
  } else if (pathname === '/glossary') {
    pathname = '/site/glossary.html';
  } else if (pathname === '/assessment') {
    pathname = '/site/assessment.html';
  } else if (pathname === '/learning-paths') {
    pathname = '/site/learning-paths.html';
  } else if (pathname === '/about') {
    pathname = '/site/about.html';
  }

  let filePath = path.join(REPO_ROOT, pathname);

  if (!pathname.startsWith('/site/')) {
    const siteCandidate = path.join(SITE_DIR, pathname);
    if (fs.existsSync(siteCandidate) && fs.statSync(siteCandidate).isFile()) {
      filePath = siteCandidate;
    }
  }

  if (!filePath.startsWith(REPO_ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      if (!path.extname(filePath)) {
        const withHtml = filePath + '.html';
        if (fs.existsSync(withHtml) && fs.statSync(withHtml).isFile()) {
          filePath = withHtml;
          return serveFile(filePath, res);
        }
      }
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found: ' + pathname);
    }
    serveFile(filePath, res);
  });
});

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': '*',
  });
  fs.createReadStream(filePath).pipe(res);
}

server.listen(PORT, () => {
  console.log(`Development server running at http://localhost:${PORT}/`);
});