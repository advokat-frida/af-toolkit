import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const oracle = readFileSync(fileURLToPath(new URL('../dist/objection-oracle.html', import.meta.url)));

const server = createServer((request, response) => {
  if (request.url === '/' || request.url === '/objection-oracle.html') {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(oracle);
    return;
  }
  response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  response.end('not found');
});

server.listen(8794, () => console.log('oracle harness server on http://localhost:8794'));
