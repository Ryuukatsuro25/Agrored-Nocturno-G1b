// =====================================================================
// iniciar-todo.js · AgroRed S.A.S. · Arranca TODA la aplicación en su PC
//
//   node iniciar-todo.js          →  abra http://localhost:8080
//
// Qué hace (lo mismo que hará Apache en servidor2 en el Taller 3):
//   1. Arranca los 4 microservicios (3001, 3002, 3003, 3004), cada uno con su .env.
//   2. Sirve el frontend en http://localhost:8080.
//   3. Reenvía /api/<recurso>/... al microservicio de ese recurso (proxy inverso),
//      así el frontend guarda y lee de verdad en MySQL.
//   4. Le entrega al navegador el config.js en modo API real SIN modificar el archivo
//      del repositorio (en GitHub sigue en modo datos de ejemplo, como pide el Taller 2).
//   5. Inicio de sesión: si ms-usuarios todavía no tiene POST /usuarios/login (versión
//      semana 1 de la docente), emite un token PROVISIONAL buscando el email en
//      ms-usuarios y firmándolo con la JWT_SECRET del grupo. No valida contraseña.
//      Cuando la docente entregue el login real, se usa el de ella automáticamente.
//
// Ctrl+C detiene todo. Este archivo es solo para su PC: no se sube al repositorio.
// =====================================================================
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const RAIZ = __dirname;
const PUERTO_WEB = Number(process.env.PUERTO_WEB) || 8080;
const SERVICIOS = { usuarios: 3001, productos: 3002, clientes: 3003, pedidos: 3004 };
const COLOR = { usuarios: 35, productos: 33, clientes: 36, pedidos: 32 };
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
};

function leerEnv(ms) {
  const f = path.join(RAIZ, `ms-${ms}`, '.env');
  if (!fs.existsSync(f)) return {};
  return Object.fromEntries(fs.readFileSync(f, 'utf8').split(/\r?\n/)
    .map((l) => l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/)).filter(Boolean).map((m) => [m[1], m[2]]));
}

// ------------------------------------------------------------ 1. microservicios
const procesos = [];
function arrancar(ms) {
  const carpeta = path.join(RAIZ, `ms-${ms}`);
  if (!fs.existsSync(path.join(carpeta, 'node_modules'))) {
    console.log(`\x1b[31m✗ ms-${ms}: falta node_modules. Ejecute: cd ms-${ms}; npm.cmd install\x1b[0m`);
    return;
  }
  if (!fs.existsSync(path.join(carpeta, '.env'))) console.log(`\x1b[31m✗ ms-${ms}: no tiene .env\x1b[0m`);
  const p = spawn(process.execPath, ['--env-file-if-exists=.env', 'src/index.js'], { cwd: carpeta });
  const prefijo = `\x1b[${COLOR[ms]}m[ms-${ms}]\x1b[0m `;
  const escribir = (d) => d.toString().split(/\r?\n/).filter(Boolean).forEach((l) => console.log(prefijo + l));
  p.stdout.on('data', escribir);
  p.stderr.on('data', escribir);
  p.on('exit', (c) => console.log(`${prefijo}\x1b[31mse detuvo (código ${c})\x1b[0m`));
  procesos.push(p);
}
Object.keys(SERVICIOS).forEach(arrancar);

// ------------------------------------------------------------ 2. login provisional
let jwt = null;
for (const ms of Object.keys(SERVICIOS)) {
  try { jwt = require(path.join(RAIZ, `ms-${ms}`, 'node_modules', 'jsonwebtoken')); break; } catch { /* sigue */ }
}
const JWT_SECRET = leerEnv('clientes').JWT_SECRET || leerEnv('productos').JWT_SECRET;

function pedirInterno(puerto, metodo, ruta, cuerpo) {
  return new Promise((resolver) => {
    const r = http.request({ host: '127.0.0.1', port: puerto, method: metodo, path: ruta,
      headers: { 'Content-Type': 'application/json' } }, (res) => {
      let datos = '';
      res.on('data', (d) => { datos += d; });
      res.on('end', () => resolver({ status: res.statusCode, cuerpo: datos }));
    });
    r.on('error', () => resolver(null));
    if (cuerpo) r.write(cuerpo);
    r.end();
  });
}

async function login(req, res, cuerpo) {
  const real = await pedirInterno(SERVICIOS.usuarios, 'POST', '/usuarios/login', cuerpo);
  if (!real) return responder(res, 503, { error: 'ms-usuarios no está disponible' });
  if (real.status !== 404) {                       // la docente ya entregó el login: se usa el de ella
    res.writeHead(real.status, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(real.cuerpo);
  }
  // Login provisional (ms-usuarios semana 1 no tiene /login)
  if (!jwt || !JWT_SECRET) return responder(res, 500, { error: 'Falta jsonwebtoken o JWT_SECRET en el .env' });
  let email = '';
  try { email = String(JSON.parse(cuerpo || '{}').email || '').trim().toLowerCase(); } catch { /* vacío */ }
  const lista = await pedirInterno(SERVICIOS.usuarios, 'GET', '/usuarios');
  const usuario = lista && lista.status === 200 ? JSON.parse(lista.cuerpo).find((u) => u.email === email) : null;
  if (!usuario || usuario.activo === false) return responder(res, 401, { error: 'Credenciales inválidas' });
  const token = jwt.sign({ id: usuario.id, nombre: usuario.nombre, rol: usuario.rol }, JWT_SECRET, { expiresIn: '8h' });
  console.log(`\x1b[90m[gateway] login provisional: ${email} (${usuario.rol})\x1b[0m`);
  return responder(res, 200, { token, usuario });
}

function responder(res, status, objeto) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(objeto));
}

// ------------------------------------------------------------ 3. gateway + frontend
const FRONTEND = path.join(RAIZ, 'frontend');

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  // /api/<recurso>/... → microservicio (igual que el ProxyPass de Apache en el Taller 3)
  const api = url.pathname.match(/^\/api\/(usuarios|productos|clientes|pedidos)(\/.*)?$/);
  if (api) {
    const [, recurso, resto = ''] = api;
    if (recurso === 'usuarios' && resto === '/login' && req.method === 'POST') {
      let cuerpo = '';
      req.on('data', (d) => { cuerpo += d; });
      req.on('end', () => login(req, res, cuerpo));
      return;
    }
    const destino = http.request({
      host: '127.0.0.1', port: SERVICIOS[recurso], method: req.method,
      path: `/${recurso}${resto}${url.search}`, headers: { ...req.headers, host: `127.0.0.1:${SERVICIOS[recurso]}` },
    }, (r) => { res.writeHead(r.statusCode, r.headers); r.pipe(res); });
    destino.on('error', () => responder(res, 503, { error: `ms-${recurso} no está disponible` }));
    req.pipe(destino);
    return;
  }

  // config.js en modo API real (el archivo del repositorio no se toca)
  if (url.pathname === '/js/config.js') {
    const original = fs.readFileSync(path.join(FRONTEND, 'js', 'config.js'), 'utf8');
    const real = original
      .replace(/DATOS_DE_EJEMPLO:\s*true/, 'DATOS_DE_EJEMPLO: false')
      .replace(/API_URL:\s*'[^']*'/, "API_URL: '/api'");
    res.writeHead(200, { 'Content-Type': TIPOS['.js'], 'Cache-Control': 'no-store' });
    return res.end(real);
  }

  // Archivos estáticos del frontend
  let archivo = path.normalize(path.join(FRONTEND, decodeURIComponent(url.pathname)));
  if (!archivo.startsWith(FRONTEND)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(archivo) && fs.statSync(archivo).isDirectory()) archivo = path.join(archivo, 'index.html');
  fs.readFile(archivo, (error, datos) => {
    if (error) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('No encontrado'); }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(archivo)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(datos);
  });
}).listen(PUERTO_WEB, () => {
  console.log('\n\x1b[1m AgroRed S.A.S. · aplicación completa\x1b[0m');
  console.log(` Frontend + gateway:  \x1b[4mhttp://localhost:${PUERTO_WEB}\x1b[0m`);
  console.log(' Los datos se leen y guardan en MySQL a través de cada microservicio.');
  console.log(' Usuario: admin@empresa.com (con el login provisional cualquier contraseña sirve).');
  console.log(' Ctrl+C para detener todo.\n');
}).on('error', (e) => {
  console.log(`\x1b[31m✗ El puerto ${PUERTO_WEB} está ocupado (${e.code}). Cierre lo que lo usa o ejecute: $env:PUERTO_WEB=8090; node iniciar-todo.js\x1b[0m`);
});

process.on('SIGINT', () => { procesos.forEach((p) => p.kill()); process.exit(0); });
