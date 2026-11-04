// =====================================================================
// Punto de arranque del microservicio.
// Lee la configuración (variables de entorno) y pone el servidor a escuchar.
// =====================================================================
const app = require('./app');

const PORT = Number(process.env.PORT) || 3003;
const HOST = process.env.HOST || '127.0.0.1';

app.listen(PORT, HOST, () => {
  console.log(`ms-clientes escuchando en http://${HOST}:${PORT}`);
});
