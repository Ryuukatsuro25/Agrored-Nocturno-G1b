// src/db.js — conexión a MySQL con los datos del archivo .env
// Un pool reutiliza conexiones abiertas en lugar de abrir una nueva en cada petición.
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  dateStrings: true,      // fechas como texto '2026-10-26', no como objetos Date
  decimalNumbers: true,   // los DECIMAL llegan como números, no como texto
});

module.exports = pool;
