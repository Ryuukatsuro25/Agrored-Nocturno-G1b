# Frontend · AgroRed S.A.S.

Interfaz web de AgroRed para gestionar productos, clientes, pedidos y usuarios según el rol.
Es **HTML, CSS y JavaScript sin dependencias ni compilación**: son archivos estáticos que Apache
sirve tal cual en el Taller 3. Funciona en computador y en celular, con tema claro y oscuro.

## Cómo abrirlo

Usa módulos de JavaScript (`import`/`export`), así que debe abrirse desde un servidor, no con doble clic:

- **VS Code:** clic derecho en `frontend/index.html` → *Open with Live Server*.
- **Terminal:** `npx http-server frontend -p 5500` y abrir `http://localhost:5500`.

En el Taller 2 el inicio de sesión es simulado: se elige el rol (administrador, comercial o producción).

## Quién hizo qué

| Archivos | Responsable |
|---|---|
| `productos.html` · `js/pages/productos.js` | Juan Pablo Rueda Sánchez (ms-productos) |
| `clientes.html` · `js/pages/clientes.js` | Juan José Osorio Reyes (ms-clientes) |
| `pedidos.html` · `js/pages/pedidos.js` | Valeria Polanco Muñoz (ms-pedidos) |
| `index.html`, `inicio.html`, `usuarios.html`, `assets/`, `data/`, `js/config.js`, `js/core/`, `js/ui/`, `js/pages/login.js`, `js/pages/inicio.js`, `js/pages/usuarios.js` | Grupo |

## Estructura

```
frontend/
├── index.html              ← inicio de sesión
├── inicio.html             ← página de inicio de cada rol
├── productos.html · clientes.html · pedidos.html · usuarios.html
├── assets/
│   ├── css/
│   │   ├── variables.css   ← colores, tipografía y espacios (tema claro y oscuro)
│   │   ├── base.css        ← reinicio y utilidades
│   │   ├── componentes.css ← botones, tablas, formularios, modales, avisos
│   │   ├── layout.css      ← menú lateral, barra superior, diseño adaptable
│   │   └── login.css       ← página de inicio de sesión
│   └── img/logo.svg
├── data/                   ← datos de ejemplo con la MISMA forma de los contratos
│   ├── productos.json · clientes.json · usuarios.json
│   └── pedidos.json        ← incluye cliente {id, nombre} y producto {id, nombre, precio}
└── js/
    ├── config.js           ← ÚNICO archivo que cambia en el Taller 3
    ├── core/               ← lógica sin pantalla
    │   ├── api.js          ← único lugar que sabe de dónde salen los datos y cómo va el token
    │   ├── sesion.js       ← usuario y token de la sesión; protege las páginas
    │   ├── permisos.js     ← tabla de permisos por rol (igual a la del backend)
    │   └── formato.js      ← pesos, fechas, texto seguro
    ├── ui/                 ← componentes reutilizables
    │   ├── layout.js       ← menú según el rol, barra superior, tema, cerrar sesión
    │   ├── crud.js         ← pantalla de listar/crear/editar/eliminar
    │   ├── tabla.js        ← tabla con orden, paginación y estados de carga
    │   ├── formulario.js   ← formularios declarativos con validación
    │   ├── dialogo.js      ← ventanas modales y confirmaciones
    │   ├── aviso.js        ← notificaciones
    │   └── iconos.js       ← íconos SVG
    └── pages/              ← un archivo por pantalla
        ├── login.js · inicio.js · usuarios.js
        ├── productos.js    ← Juan Pablo
        ├── clientes.js     ← Juanjo
        └── pedidos.js      ← Valeria
```

La organización es la misma idea de capas del backend: **pages** (qué muestra cada pantalla) →
**ui** (cómo se muestra) → **core/api.js** (de dónde salen los datos).

## Qué hace cada pantalla

| Pantalla | Funciones |
|---|---|
| Inicio de sesión | Taller 2: elegir el rol. Taller 3: correo y contraseña contra `POST /api/usuarios/login` |
| Inicio | Administrador: totales, pedidos recientes, pedidos por estado y usuarios. Comercial: pedidos en curso con cliente y producto, y clientes con más compras. Producción: unidades pendientes por producto y catálogo por categoría |
| Productos, Clientes, Pedidos, Usuarios | Listar, buscar, filtrar (los filtros viajan a la API como `?campo=valor`), ordenar por columna, paginar, crear, editar (PUT), eliminar con confirmación y exportar a CSV |

## Roles y permisos

| Entidad | Consultan | Crean, modifican y eliminan |
|---|---|---|
| Productos | todos | administrador, produccion |
| Clientes | todos | administrador, comercial |
| Pedidos | todos | administrador, comercial |
| Usuarios | administrador | administrador |

El menú solo muestra las páginas que el rol puede ver, y los botones de crear, editar y eliminar
solo aparecen si el rol puede gestionar. Si alguien entra por la URL a una página sin permiso,
vuelve al inicio con un aviso. **Esto es solo presentación:** la seguridad real la hace cada
microservicio, que responde 403 aunque alguien fuerce la petición.

## Errores que muestra la interfaz

| Código del backend | Qué ve el usuario |
|---|---|
| 400 | El mensaje y la lista de `detalles` dentro del formulario |
| 401 | Se cierra la sesión: "Su sesión venció. Inicie sesión de nuevo." |
| 404 al eliminar | "El registro ya no existe" |
| 409 | La regla de negocio (NIT o nombre repetido, pedido entregado) dentro del formulario |
| 503 / sin conexión | Mensaje de error con botón Reintentar |
| `aviso` en pedidos | Banner "Información incompleta" y el cliente o producto como "No disponible" |

En modo de ejemplo, `api.js` simula estas mismas respuestas (incluidas las reglas 409), así que
la interfaz ya está probada contra los mismos errores que dará la API real.

## Paso al Taller 3

En `js/config.js`:

```js
DATOS_DE_EJEMPLO: false,
API_URL: 'http://app.agrored.com/api',
```

Nada más cambia: `api.js` empieza a enviar `Authorization: Bearer <token>` a la API por el
gateway Apache, y `index.html` muestra el formulario de correo y contraseña.
