// =====================================================================
// CAPA DE ACCESO A DATOS (repositorio) — versión MySQL (Taller 2)
// Única capa que sabe DÓNDE se guardan los datos. Las funciones conservan
// el mismo nombre, los mismos parámetros y el mismo tipo de resultado que
// la versión en memoria del Taller 1: por eso las demás capas no cambian.
// Todas las consultas son parametrizadas (?): evitan la inyección SQL.
// =====================================================================
const pool = require('../db');

async function findAll(filtros = {}) {
  let sql = 'SELECT * FROM clientes';
  const condiciones = [];
  const valores = [];
  if (filtros.tipo) {                       // ?tipo=distribuidor
    condiciones.push('tipo = ?');
    valores.push(filtros.tipo);
  }
  if (filtros.ciudad) {                     // ?ciudad=Cali
    condiciones.push('ciudad = ?');
    valores.push(filtros.ciudad);
  }
  if (filtros.ids) {                        // ?ids=1,2,3 → WHERE id IN (1, 2, 3)
    condiciones.push('id IN (?)');
    valores.push(filtros.ids);
  }
  if (condiciones.length > 0) sql += ' WHERE ' + condiciones.join(' AND ');
  const [filas] = await pool.query(sql + ' ORDER BY id', valores);
  return filas;
}

async function findById(id) {
  const [filas] = await pool.query('SELECT * FROM clientes WHERE id = ?', [id]);
  return filas.length > 0 ? filas[0] : null;
}

async function findByNit(nit) {
  const [filas] = await pool.query('SELECT * FROM clientes WHERE nit = ?', [nit]);
  return filas.length > 0 ? filas[0] : null;
}

async function create(cliente) {
  const [resultado] = await pool.query(
    'INSERT INTO clientes (nombre, nit, ciudad, telefono, tipo) VALUES (?, ?, ?, ?, ?)',
    [cliente.nombre, cliente.nit, cliente.ciudad, cliente.telefono, cliente.tipo]);
  return findById(resultado.insertId);     // MySQL devuelve el id generado
}

async function update(id, cliente) {
  const [resultado] = await pool.query(
    'UPDATE clientes SET nombre = ?, nit = ?, ciudad = ?, telefono = ?, tipo = ? WHERE id = ?',
    [cliente.nombre, cliente.nit, cliente.ciudad, cliente.telefono, cliente.tipo, id]);
  return resultado.affectedRows > 0 ? findById(id) : null;
}

async function remove(id) {
  const [resultado] = await pool.query('DELETE FROM clientes WHERE id = ?', [id]);
  return resultado.affectedRows > 0;       // true si borró una fila
}

module.exports = { findAll, findById, findByNit, create, update, remove };
