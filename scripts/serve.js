#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 8005;
const REPO_ROOT = path.resolve(__dirname, '..');
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

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Clean trailing slashes except for root
  if (pathname.length > 1 && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }

  // 1. Clean URL rewrites (like Vercel)
  if (pathname === '/' || pathname === '/index') {
    pathname = '/site/index.html';
  } else if (pathname === '/lesson') {
    pathname = '/site/lesson.html';
  } else if (pathname === '/certification' || pathname === '/certifications') {
    pathname = '/site/certifications.html';
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

  // 2. Resolve file from disk: check site/ first if requested as top-level file
  let filePath = path.join(REPO_ROOT, pathname);

  // If path doesn't start with /site and exists inside site/ (e.g. /style.css -> site/style.css)
  if (!pathname.startsWith('/site/')) {
    const siteCandidate = path.join(SITE_DIR, pathname);
    if (fs.existsSync(siteCandidate) && fs.statSync(siteCandidate).isFile()) {
      filePath = siteCandidate;
    }
  }

  // Security check: ensure path is within REPO_ROOT
  if (!filePath.startsWith(REPO_ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Check if html extension helps
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
