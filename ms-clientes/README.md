# ms-clientes · AgroRed S.A.S.

Microservicio de **clientes** de la aplicación de AgroRed: gestiona los distribuidores y comercios que le compran a AgroRed.
Responsable: **Juan José Osorio Reyes** · Puerto: **3003** · Base de datos propia: `clientes_db` (MySQL).

Construido con Node.js + Express en capas (rutas → controlador → servicio → repositorio → modelo). Versión del Taller 2: CRUD completo, filtros, persistencia en MySQL y seguridad con JWT.

## Cómo ejecutarlo

Requisitos: Node.js 22.9 o superior y MySQL 8 (o MariaDB).

**1. Crear la base de datos y su usuario** (una sola vez, conectado como `root` en MySQL Workbench o en la consola `mysql -u root -p`):

```sql
CREATE DATABASE clientes_db;
CREATE USER 'clientes_user'@'localhost' IDENTIFIED BY 'una-clave-segura';
GRANT ALL PRIVILEGES ON clientes_db.* TO 'clientes_user'@'localhost';
```

**2. Crear la tabla y los registros iniciales** (desde la carpeta `ms-clientes`):

```
mysql -u clientes_user -p clientes_db
mysql> SOURCE db/schema.sql;
```

**3. Configurar e iniciar el servicio:**

```
npm install
copy .env.example .env      # en Linux/Mac: cp .env.example .env
npm run dev
```

Variables del `.env` (el archivo nunca se sube al repositorio):

| Variable | Ejemplo | Para qué |
|---|---|---|
| PORT | 3003 | Puerto del microservicio |
| HOST | 127.0.0.1 | Solo acepta conexiones del mismo equipo |
| DB_HOST / DB_PORT | localhost / 3306 | Dónde está MySQL (en el Taller 3: la IP de servidor1) |
| DB_NAME / DB_USER / DB_PASSWORD | clientes_db / clientes_user / … | Base y usuario propios del microservicio |
| JWT_SECRET | (frase del grupo) | La misma en todos los microservicios; verifica los tokens |

Verificar: `http://localhost:3003/health` responde `{"servicio":"ms-clientes","estado":"ok"}`. Las demás rutas exigen un token de ms-usuarios.

## Representación

Así responde `GET /clientes/1`:

```json
{ "id": 1, "nombre": "Distribuidora El Valle", "nit": "900123456-7", "ciudad": "Cali", "telefono": "6023334455", "tipo": "distribuidor" }
```

| Atributo | Tipo | ¿Obligatorio al crear? | Reglas |
|---|---|---|---|
| id | entero | No: lo asigna el servicio | Positivo y único |
| nombre | texto | Sí | No vacío |
| nit | texto | Sí | Formato 900123456-7; único (409) |
| ciudad | texto | Sí | No vacía |
| telefono | texto | Sí | Solo dígitos, de 7 a 10 |
| tipo | texto | Sí | distribuidor o comercio |

**Regla de negocio:** El NIT identifica a la empresa cliente ante la DIAN: no puede repetirse (409). Además: formato del NIT, teléfono de 7 a 10 dígitos y tipo dentro de su lista (400).

## Endpoints

Todas las rutas (salvo `/health`) exigen la cabecera `Authorization: Bearer <token>`.

| Operación | Método | URI | Cuerpo | Respuesta exitosa | Errores posibles |
|---|---|---|---|---|---|
| Listar | GET | /clientes | — | 200 + arreglo | 401 |
| Filtrar | GET | /clientes?tipo=comercio | — | 200 + arreglo filtrado | 400 · 401 |
| Consultar por lotes | GET | /clientes?ids=1,3,8 | — | 200 + arreglo con esos registros | 400 ids inválidos · 401 |
| Obtener | GET | /clientes/:id | — | 200 + objeto | 400 id inválido · 401 · 404 |
| Crear | POST | /clientes | JSON sin id | 201 + objeto + cabecera Location | 400 · 401 · 403 · 409 NIT repetido |
| Actualizar | PUT | /clientes/:id | JSON completo sin id | 200 + objeto actualizado | 400 · 401 · 403 · 404 · 409 |
| Eliminar | DELETE | /clientes/:id | — | 204 sin cuerpo | 400 · 401 · 403 · 404 |

Ejemplo · crear:

```
POST /clientes
Authorization: Bearer <token>
Content-Type: application/json

{ "nombre": "Frutas del Pacífico", "nit": "901555222-4", "ciudad": "Buenaventura", "telefono": "3154442211", "tipo": "distribuidor" }

→ 201 Created · Location: /clientes/4
{ "id": 4, "nombre": "Frutas del Pacífico", "nit": "901555222-4", "ciudad": "Buenaventura", "telefono": "3154442211", "tipo": "distribuidor" }
```

Ejemplo · listar con filtro:

```
GET /clientes?tipo=comercio
→ 200 OK · arreglo con los registros que cumplen el filtro
```

Errores: siempre `{"error": "...", "detalles": [...]}` (detalles solo en validación).

## Seguridad

| Entidad | Consultan (GET) | Crean, modifican y eliminan |
|---|---|---|
| Clientes | administrador, comercial, produccion | administrador, comercial |

Sin token o con un token inválido: 401. Con un rol sin permiso: 403.

## Relaciones

ms-clientes no guarda referencias. **Es consultado** por ms-pedidos:

| Me consulta | Peticiones que me hace | Campos que no puedo cambiar sin avisar |
|---|---|---|
| ms-pedidos | GET /clientes/:id · GET /clientes?ids=… | id, nombre |

Por eso el filtro `?ids=` es parte de este contrato. Cada petición que llega se registra en la terminal del servicio.

## Pruebas

Colección de Postman en `docs/ms-clientes.postman_collection.json` (Import en Postman). Ejecute primero la carpeta 0 (inicio de sesión) con ms-usuarios corriendo.
