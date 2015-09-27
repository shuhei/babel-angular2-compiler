import { readFileSync } from 'fs';
import { get } from 'http';
import express from 'express';
import serveStatic from 'serve-static';
import babelify from 'babelify';
import stripAnsi from 'strip-ansi';

import streamBrowserify from './stream-browserify';
import externals from './externals';

const PORT = process.env.PORT || 3000;
const BABEL_OPTIONS = {
  optional: ['es7.decorators'],
  plugins: [
    'angular2-annotations',
    'type-assertion'
  ]
};

const app = express();

app.use(serveStatic('public', { setHeaders }));

app.get('/compile', (req, res) => {
  res.type('application/javascript');

  const sourceUrl = req.query.source;
  if (!sourceUrl) {
    showError(res, `Set 'source' parameter`);
    return;
  }

  get(sourceUrl, (sourceRes) => {
    if (sourceRes.statusCode !== 200) {
      showError(res, `Failed to get source at ${sourceUrl}: ${sourceRes.statusCode}`);
      return;
    }

    streamToPromise(bundle(sourceRes))
      .then((compiled) => {
        res.status(200).send(compiled);
      })
      .catch((e) => {
        showError(res, `Failed to compile source at ${sourceUrl}`, e);
      })
      .catch((e) => {
        console.log('Error on error handler');
        console.log(e.stack);
      });
  }).on('error', (e) => {
    showError(res, `Failed to get source at ${sourceUrl}`, e);
  });
});

const server = app.listen(PORT, () => {
  const { address, port } = server.address();
  console.log('Listening at %s:%s', address, port);
});

function setHeaders(res, path) {
  if (path.indexOf('lib.js') >= 0) {
    res.setHeader('Content-Encoding', 'gzip');
  }
}

function showError(res, message, e) {
  const lines = []
  if (message) {
    console.log(message);
    lines.push(`console.error('${escapeLiteral(message)}');`);
  }
  if (e) {
    console.log(e.stack);
    lines.push(`console.error('${escapeLiteral(stripAnsi(e.stack))}');`);
  }
  res.status(200).send(lines.join('\n'));
}

function escapeLiteral(str) {
  return str.replace(/\n/g, '\\n').replace(/'/g, '\\\'');
}

function streamToPromise(readable) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readable.on('data', (chunk) => {
      chunks.push(chunk);
    });
    readable.on('end', () => {
      resolve(Buffer.concat(chunks).toString());
    });
    readable.on('error', (e) => {
      reject(e);
    });
  });
}

function bundle(readable) {
  return streamBrowserify(readable)
    .external(externals)
    .transform(babelify.configure(BABEL_OPTIONS))
    .bundle();
}
