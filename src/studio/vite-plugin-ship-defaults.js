import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function run(cmd, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    const stdout = [];
    const stderr = [];
    child.stdout.on('data', (d) => stdout.push(d));
    child.stderr.on('data', (d) => stderr.push(d));
    child.on('error', reject);
    child.on('close', (code) => {
      const out = Buffer.concat(stdout).toString('utf8');
      const err = Buffer.concat(stderr).toString('utf8');
      if (code === 0) resolve({ out, err });
      else reject(new Error(err.trim() || `${cmd} ${args.join(' ')} failed (${code})`));
    });
  });
}

function matchRoute(url) {
  const pathOnly = (url || '').split('?')[0];
  return pathOnly === '/__studio/preset-defaults' || pathOnly === '/coinsncards/__studio/preset-defaults';
}

async function readMap(file) {
  try {
    const raw = await fs.readFile(file, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

async function writeMap(file, map) {
  await fs.writeFile(file, `${JSON.stringify(map, null, 2)}\n`, 'utf8');
}

async function publishDefaults(root, file) {
  const rel = path.relative(root, file);
  await run('git', ['add', '--', rel], root);
  const status = await run('git', ['status', '--porcelain', '--', rel], root);
  if (!status.out.trim()) return { published: false, reason: 'unchanged' };
  await run(
    'git',
    ['commit', '-m', 'Save preset defaults so every machine opens on the same look.', '--', rel],
    root,
  );
  await run('git', ['push'], root);
  return { published: true };
}

export function shipPresetDefaults({ root, file }) {
  return {
    name: 'ship-preset-defaults',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!matchRoute(req.url)) return next();
        res.setHeader('Content-Type', 'application/json');
        try {
          if (req.method === 'GET') {
            res.end(JSON.stringify(await readMap(file)));
            return;
          }
          if (req.method === 'POST' || req.method === 'DELETE') {
            const body = JSON.parse((await readBody(req)) || '{}');
            const name = typeof body.name === 'string' ? body.name : '';
            if (!name) {
              res.statusCode = 400;
              res.end(JSON.stringify({ ok: false, error: 'Missing preset name' }));
              return;
            }
            const map = await readMap(file);
            if (req.method === 'DELETE') delete map[name];
            else if (body.state && typeof body.state === 'object') map[name] = body.state;
            else {
              res.statusCode = 400;
              res.end(JSON.stringify({ ok: false, error: 'Missing preset state' }));
              return;
            }
            await writeMap(file, map);
            let published = false;
            let error = '';
            try {
              const result = await publishDefaults(root, file);
              published = !!result.published;
            } catch (err) {
              error = err instanceof Error ? err.message : String(err);
            }
            res.end(JSON.stringify({ ok: true, published, error: error || undefined }));
            return;
          }
          res.statusCode = 405;
          res.end(JSON.stringify({ ok: false }));
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }));
        }
      });
    },
  };
}
