-- db/schema.sql · ms-clientes · AgroRed S.A.S.
-- Se ejecuta conectado como clientes_user sobre la base clientes_db:
--   mysql -u clientes_user -p clientes_db
--   mysql> SOURCE db/schema.sql;
SET NAMES utf8mb4;            -- para que las tildes y la ñ se guarden bien

DROP TABLE IF EXISTS clientes;

CREATE TABLE clientes (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  nombre    VARCHAR(120) NOT NULL,
  nit       VARCHAR(15)  NOT NULL UNIQUE,
  ciudad    VARCHAR(60)  NOT NULL,
  telefono  VARCHAR(10)  NOT NULL,
  tipo      VARCHAR(20)  NOT NULL
);

INSERT INTO clientes (nombre, nit, ciudad, telefono, tipo) VALUES
  ('Distribuidora El Valle', '900123456-7', 'Cali',     '6023334455', 'distribuidor'),
  ('Fruver La Sabana',       '901234567-1', 'Bogotá',   '6017654321', 'comercio'),
  ('Supermercado Los Andes', '800987654-3', 'Medellín', '6045556677', 'comercio');
