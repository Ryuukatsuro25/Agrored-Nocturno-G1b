const ms = process.argv[2];
const mysql = require('./' + ms + '/node_modules/mysql2/promise');
mysql.createConnection({
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT),
  user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
}).then(async (c) => {
  const tabla = ms.replace('ms-', '');
  const [[r]] = await c.query('SELECT COUNT(*) AS n FROM ' + tabla);
  console.log('OK    ' + ms + ' -> ' + process.env.DB_NAME + ' -> ' + r.n + ' filas');
  await c.end();
}).catch((e) => console.log('ERROR ' + ms + ' -> ' + e.code + ' ' + (e.sqlMessage || e.message)));
