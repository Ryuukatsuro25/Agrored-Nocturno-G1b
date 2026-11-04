// =====================================================================
// ROLES Y PERMISOS (tabla de permisos del Taller 1)
// La misma regla que aplica cada microservicio con requiereRol(...).
// El frontend la usa solo para mostrar u ocultar botones: la seguridad real
// la hace el backend, que responde 403 aunque alguien fuerce la petición.
// =====================================================================
export const ROLES = {
  administrador: { nombre: 'Administrador', descripcion: 'Gestiona todo, incluidos los usuarios' },
  comercial: { nombre: 'Comercial', descripcion: 'Gestiona clientes y pedidos' },
  produccion: { nombre: 'Producción', descripcion: 'Gestiona el catálogo de productos' },
};

const TODOS = Object.keys(ROLES);

export const PERMISOS = {
  //            consultan (GET)        crean, modifican y eliminan
  productos: { ver: TODOS, gestionar: ['administrador', 'produccion'] },
  clientes: { ver: TODOS, gestionar: ['administrador', 'comercial'] },
  pedidos: { ver: TODOS, gestionar: ['administrador', 'comercial'] },
  usuarios: { ver: ['administrador'], gestionar: ['administrador'] },
};

export const puedeVer = (rol, recurso) => PERMISOS[recurso]?.ver.includes(rol) ?? false;
export const puedeGestionar = (rol, recurso) => PERMISOS[recurso]?.gestionar.includes(rol) ?? false;
