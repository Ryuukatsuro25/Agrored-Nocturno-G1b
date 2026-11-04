# AgroRed S.A.S. · Aplicación web con microservicios (Módulo 3)

Redes y Servicios Multimedia · Universidad Autónoma de Occidente · Jornada nocturna · Grupo 1 · Agroindustria y distribución.
Docente: Zeida María Solarte Astaiza.

Aplicación web de **AgroRed S.A.S.** para gestionar productos, clientes y pedidos, con inicio de
sesión por rol. Está construida con microservicios REST en **Node.js + Express**, organizados en
capas, cada uno con su propia base de datos **MySQL** y protegido con tokens **JWT**. Se despliega
sobre el ambiente del Módulo 2 (servidor1 172.16.1.198 y servidor2 172.16.1.199, dominio `agrored.com`).

## Integrantes

| Integrante | Usuario de GitHub | Microservicio | Puerto |
|---|---|---|---|
| Juan Pablo Rueda Sánchez | [Juanrueda236](https://github.com/Juanrueda236) | [ms-productos](ms-productos) | 3002 |
| Juan José Osorio Reyes | [Ryuukatsuro25](https://github.com/Ryuukatsuro25) | [ms-clientes](ms-clientes) | 3003 |
| Valeria Polanco Muñoz | [Val-polanco](https://github.com/Val-polanco) | [ms-pedidos](ms-pedidos) | 3004 |
| Docente | — | [ms-usuarios](ms-usuarios) | 3001 |

El grupo tiene 3 integrantes, por lo que implementa las tres primeras entidades de AgroRed
(productos, clientes y pedidos), como indica el documento del microproyecto. Cada integrante sube
su microservicio y su página del frontend con su propia cuenta: el historial de commits es la
evidencia del trabajo individual.

## Microservicios

| Microservicio | Entidad | Responsable | Puerto | Base de datos | Referencia a |
|---|---|---|---|---|---|
| ms-usuarios | Usuario (entregado por la docente) | Docente | 3001 | usuarios_db | — |
| ms-productos | Producto | Juan Pablo Rueda Sánchez | 3002 | productos_db | — |
| ms-clientes | Cliente | Juan José Osorio Reyes | 3003 | clientes_db | — |
| ms-pedidos | Pedido | Valeria Polanco Muñoz | 3004 | pedidos_db | ms-clientes (`cliente_id`), ms-productos (`producto_id`) |

| Microservicio | Qué gestiona | Filtros | Regla de negocio |
|---|---|---|---|
| ms-usuarios | Usuarios que inician sesión y su rol | `?rol=`, `?ids=` | El email es único (409) |
| ms-productos | Catálogo: nombre, categoría, unidad y precio | `?categoria=`, `?ids=` | El nombre es único sin distinguir mayúsculas (409) |
| ms-clientes | Distribuidores y comercios: nombre, NIT, ciudad, teléfono y tipo | `?tipo=`, `?ciudad=`, `?ids=` | El NIT es único (409) y tiene formato `900123456-7` |
| ms-pedidos | Pedidos: cliente, producto, cantidad, centro de distribución, estado y fecha | `?estado=`, `?cliente_id=` | Todo pedido nuevo empieza en `recibido` (400 si llega otro estado); sin fecha usa la de hoy; un pedido `entregado` no se modifica (409) |

Todos ofrecen CRUD completo: `GET` (listar y obtener), `POST` (201 + `Location`), `PUT` (reemplazo
completo, 200) y `DELETE` (204). El contrato de cada uno (atributos, endpoints, errores y
relaciones) está en el README de su carpeta.

Cada microservicio es dueño exclusivo de su base de datos y de su usuario de MySQL: ninguno lee la
base de otro, y por eso no hay llaves foráneas entre bases.

## Relaciones entre microservicios

La única relación es **Pedidos → Clientes y Productos**. ms-pedidos guarda solo los ids
(`cliente_id`, `producto_id`) y consulta a los otros dos por REST, reenviando el token del usuario:

| ms-pedidos consulta | Petición | Cuándo | Qué usa |
|---|---|---|---|
| ms-clientes | `GET /clientes/:id` | Al crear o editar un pedido | Si existe (200) o no (404 → el pedido responde 400) |
| ms-clientes | `GET /clientes?ids=1,2,3` | Al consultar pedidos | `id` y `nombre` del cliente |
| ms-productos | `GET /productos/:id` | Al crear o editar un pedido | Si existe (200) o no (404 → el pedido responde 400) |
| ms-productos | `GET /productos?ids=1,2,3` | Al consultar pedidos | `id`, `nombre` y `precio` del producto |

Al listar se hace **una sola** petición `?ids=` por servicio, no una por pedido. Si el servicio
consultado no responde en 3 segundos, ms-pedidos devuelve **503** al escribir y, al leer, el objeto
relacionado en `null` con un campo `aviso` (degradación controlada). Nadie consulta a ms-usuarios:
cada microservicio verifica el token JWT por su cuenta con la misma `JWT_SECRET`.

## Roles y permisos

Roles de la aplicación: `administrador`, `comercial`, `produccion`. Cualquier usuario autenticado
consulta (GET); solo los roles indicados crean, modifican o eliminan. Sin token o con token
inválido: **401**. Rol sin permiso: **403**.

| Entidad | Consultan (GET) | Crean, modifican y eliminan |
|---|---|---|
| Usuarios | administrador | administrador |
| Productos | administrador, comercial, produccion | administrador, produccion |
| Clientes | administrador, comercial, produccion | administrador, comercial |
| Pedidos | administrador, comercial, produccion | administrador, comercial |

## Arquitectura y despliegue

| Pieza | Dónde corre | Tecnología |
|---|---|---|
| Cliente | Anfitrión Windows (172.16.1.193) | Navegador, Postman |
| DNS | servidor1 (172.16.1.198) | bind9, registro `app.agrored.com` → 172.16.1.199 |
| Base de datos | servidor1 | MySQL, una base por microservicio, acceso solo desde servidor2 |
| API Gateway + frontend | servidor2 (172.16.1.199) | Apache: host virtual `app.agrored.com` y proxy inverso `/api/<recurso>` |
| Microservicios | servidor2 | Node.js + Express como servicios systemd, escuchando solo en 127.0.0.1 |
| Seguridad | servidor1 y servidor2 | ufw; tokens JWT emitidos por ms-usuarios |

En los Talleres 1 y 2 todo corre en el PC de cada integrante (MySQL local o XAMPP); el despliegue en
servidor1 y servidor2 es el Taller 3.

## Estructura del repositorio

```
agrored-nocturno-g1/
├── README.md            ← este archivo
├── .gitignore           ← excluye node_modules, .env y .vscode
├── ms-usuarios/         ← entregado por la docente (no se modifica)
├── ms-productos/        ← Juan Pablo Rueda Sánchez
├── ms-clientes/         ← Juan José Osorio Reyes
├── ms-pedidos/          ← Valeria Polanco Muñoz (además src/clients/ para las relaciones)
└── frontend/            ← interfaz web (base grupal + una página por integrante)
```

Cada microservicio tiene la misma organización en capas:

```
ms-<recurso>/
├── README.md            ← contrato de la API
├── package.json         ← express, mysql2, jsonwebtoken
├── .env.example         ← variables sin claves reales (el .env no se sube)
├── db/schema.sql        ← crea la tabla y 3 registros iniciales
├── docs/ms-<recurso>.postman_collection.json
└── src/
    ├── index.js · app.js · db.js
    ├── routes/          ← método + URI → controlador, y permisos por rol
    ├── controllers/     ← lee la petición y arma la respuesta
    ├── services/        ← validaciones y reglas de negocio
    ├── repositories/    ← consultas SQL parametrizadas
    ├── models/          ← atributos y validación de la entidad
    ├── middlewares/     ← auth.js: verificarToken (401) y requiereRol (403)
    └── utils/           ← HttpError
```

## Cómo ejecutar el proyecto en su PC

Requisitos: Node.js LTS 22 (22.9 o superior), npm, Git y MySQL 8 o MariaDB (por ejemplo, XAMPP).

**1. Bases de datos** (una por microservicio). Conectado como root, por cada microservicio:

```sql
CREATE DATABASE clientes_db;
CREATE USER 'clientes_user'@'localhost' IDENTIFIED BY 'su-clave';
GRANT ALL PRIVILEGES ON clientes_db.* TO 'clientes_user'@'localhost';
```

Luego ejecutar `db/schema.sql` de esa carpeta sobre su base (en phpMyAdmin: seleccionar la base →
**Importar**). Repetir con `usuarios_db`, `productos_db` y `pedidos_db`.

**2. Configurar e iniciar cada microservicio**, cada uno en su propia terminal:

```
cd ms-clientes              # o la carpeta del microservicio
npm install
copy .env.example .env      # en Linux/Mac: cp .env.example .env
npm run dev
```

En cada `.env`: `DB_NAME`, `DB_USER` y `DB_PASSWORD` de su base, y la **misma `JWT_SECRET`** en los
cuatro. En ms-usuarios además `ROLES=administrador,comercial,produccion`. ms-pedidos usa
`CLIENTES_URL=http://127.0.0.1:3003` y `PRODUCTOS_URL=http://127.0.0.1:3002`.

Orden recomendado: ms-usuarios (3001) → ms-productos (3002) → ms-clientes (3003) → ms-pedidos (3004).
Verificar en el navegador: `http://localhost:<puerto>/health`.

**3. Pruebas con Postman.** Importar `ms-<recurso>/docs/ms-<recurso>.postman_collection.json`.
Ejecutar primero la carpeta **0 · Iniciar sesión** (obtiene los tokens) y después las carpetas de
CRUD, seguridad y relaciones.

**4. Frontend.** Abrir `frontend/index.html` con la extensión Live Server de VS Code (o
`npx http-server frontend`). En el Taller 2 usa datos de ejemplo; en el Taller 3 se conecta a la API
cambiando solo `frontend/js/config.js`.

## Convenciones del grupo

- Atributos en `snake_case`, iguales en el JSON de la API y en las columnas de MySQL.
- Cada integrante trabaja solo en su carpeta y sube sus cambios con su propia cuenta de GitHub.
- Commits pequeños con el formato `ms-<recurso>: qué cambió` o `frontend: qué cambió`.
- La migración a MySQL de cada microservicio está en un solo commit: `ms-<recurso>: persistencia en MySQL`.
- Nunca se suben `node_modules` ni `.env` (los excluye el `.gitignore`). La `JWT_SECRET` se comparte por un medio privado.
- El repositorio no contiene contraseñas ni datos reales: todos los datos son ficticios.

## Avance

- [x] Taller 1: modelo de dominio, contratos y esqueleto en capas con datos en memoria
- [x] Taller 2 · semana 1: CRUD completo, filtros, `?ids=`, persistencia en MySQL, contrato en el README y colección de Postman
- [ ] Taller 2 · semana 2: seguridad JWT por rol, relaciones de ms-pedidos y frontend por integrante
- [ ] Taller 3: despliegue en servidor1 y servidor2, API Gateway Apache e integración del frontend con la API
