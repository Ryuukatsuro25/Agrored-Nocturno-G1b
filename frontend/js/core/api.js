// =====================================================================
// CAPA DE ACCESO A DATOS DEL FRONTEND
// Es el único lugar que sabe DE DÓNDE salen los datos y CÓMO se envía el token.
// Las pantallas solo llaman a Api.listar('clientes', { tipo: 'comercio' }), etc.
//
// · Modo real (Taller 3): fetch a CONFIG.API_URL con "Authorization: Bearer <token>".
// · Modo ejemplo (Taller 2): lee data/*.json y simula las respuestas del backend,
//   incluidas sus reglas (400, 404, 409) y la composición de pedidos, para que
//   las pantallas ya manejen los mismos errores que verán con la API real.
// =====================================================================
import { CONFIG } from '../config.js';
import { Sesion } from './sesion.js';
import { normalizar } from './formato.js';

export class ApiError extends Error {
  constructor(status, mensaje, detalles = []) {
    super(mensaje);
    this.status = status;
    this.detalles = detalles;
  }
}

// ---------------------------------------------------------------- modo real
async function peticion(metodo, ruta, cuerpo) {
  let respuesta;
  try {
    respuesta = await fetch(CONFIG.API_URL + ruta, {
      method: metodo,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Sesion.token()}` },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
  } catch {
    throw new ApiError(0, 'No hay conexión con el servidor. Intente de nuevo.');
  }
  if (respuesta.status === 401) Sesion.cerrar('Su sesión venció. Inicie sesión de nuevo.');
  if (respuesta.status === 204) return null;
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new ApiError(respuesta.status, datos.error || `Error ${respuesta.status}`, datos.detalles);
  return datos;
}

const consulta = (filtros = {}) => {
  const params = new URLSearchParams(Object.entries(filtros).filter(([, v]) => v !== '' && v != null));
  return params.toString() ? `?${params}` : '';
};

// ---------------------------------------------------------------- modo ejemplo
const memoria = {};                                       // datos cargados (duran hasta recargar)
const espera = (ms = 250) => new Promise((r) => setTimeout(r, ms));   // simula la red

async function tabla(recurso) {
  if (!memoria[recurso]) {
    const r = await fetch(`data/${recurso}.json`);
    memoria[recurso] = await r.json();
  }
  return memoria[recurso];
}

// Lo que hace ms-pedidos al consultar: agrega cliente {id, nombre} y producto {id, nombre, precio}
async function componer(pedido) {
  const c = (await tabla('clientes')).find((x) => x.id === pedido.cliente_id);
  const p = (await tabla('productos')).find((x) => x.id === pedido.producto_id);
  return {
    ...pedido,
    cliente: c ? { id: c.id, nombre: c.nombre } : null,
    producto: p ? { id: p.id, nombre: p.nombre, precio: p.precio } : null,
  };
}

// Reglas de negocio de cada microservicio (las mismas del backend)
const REGLAS = {
  productos: async (datos, id) => {
    const repetido = (await tabla('productos')).find((x) => x.id !== id && normalizar(x.nombre) === normalizar(datos.nombre));
    if (repetido) throw new ApiError(409, `Ya existe un producto con el nombre ${datos.nombre}`);
  },
  clientes: async (datos, id) => {
    const repetido = (await tabla('clientes')).find((x) => x.id !== id && x.nit === datos.nit);
    if (repetido) throw new ApiError(409, `Ya existe un cliente con el NIT ${datos.nit}`);
  },
  usuarios: async (datos, id) => {
    const repetido = (await tabla('usuarios')).find((x) => x.id !== id && x.email === datos.email);
    if (repetido) throw new ApiError(409, `Ya existe un usuario con el email ${datos.email}`);
  },
  pedidos: async (datos, id, actual) => {
    if (!id && datos.estado && datos.estado !== 'recibido') throw new ApiError(400, 'Un pedido nuevo debe empezar en estado recibido');
    if (actual?.estado === 'entregado') throw new ApiError(409, `El pedido ${id} ya fue entregado y no se puede modificar`);
    if (!(await tabla('clientes')).some((c) => c.id === datos.cliente_id)) throw new ApiError(400, `No existe el cliente ${datos.cliente_id}`);
    if (!(await tabla('productos')).some((p) => p.id === datos.producto_id)) throw new ApiError(400, `No existe el producto ${datos.producto_id}`);
  },
};

function filtrar(lista, filtros) {
  return lista.filter((fila) => Object.entries(filtros).every(([campo, valor]) => {
    if (valor === '' || valor == null) return true;
    if (campo === 'ids') return String(valor).split(',').map(Number).includes(fila.id);
    return String(fila[campo]) === String(valor);
  }));
}

const Ejemplo = {
  async listar(recurso, filtros) {
    await espera();
    const lista = filtrar(await tabla(recurso), filtros);
    return recurso === 'pedidos' ? Promise.all(lista.map(componer)) : lista.map((x) => ({ ...x }));
  },
  async obtener(recurso, id) {
    await espera();
    const fila = (await tabla(recurso)).find((x) => x.id === id);
    if (!fila) throw new ApiError(404, `No existe el registro con id ${id}`);
    return recurso === 'pedidos' ? componer(fila) : { ...fila };
  },
  async crear(recurso, datos) {
    await espera();
    const lista = await tabla(recurso);
    await REGLAS[recurso]?.(datos, null, null);
    let nuevo = { id: Math.max(0, ...lista.map((x) => x.id)) + 1, ...datos };
    if (recurso === 'pedidos') nuevo = { ...nuevo, estado: 'recibido', fecha: datos.fecha || new Date().toLocaleDateString('en-CA') };
    if (recurso === 'usuarios') nuevo.activo = datos.activo ?? true;
    lista.push(nuevo);
    return recurso === 'pedidos' ? componer(nuevo) : { ...nuevo };
  },
  async actualizar(recurso, id, datos) {
    await espera();
    const lista = await tabla(recurso);
    const i = lista.findIndex((x) => x.id === id);
    if (i < 0) throw new ApiError(404, `No existe el registro con id ${id}`);
    await REGLAS[recurso]?.(datos, id, lista[i]);
    lista[i] = { id, ...datos };
    return recurso === 'pedidos' ? componer(lista[i]) : { ...lista[i] };
  },
  async eliminar(recurso, id) {
    await espera();
    const lista = await tabla(recurso);
    const i = lista.findIndex((x) => x.id === id);
    if (i < 0) throw new ApiError(404, `No existe el registro con id ${id}`);
    lista.splice(i, 1);
    return null;
  },
};

// ---------------------------------------------------------------- interfaz pública
export const Api = {
  listar: (recurso, filtros = {}) =>
    (CONFIG.DATOS_DE_EJEMPLO ? Ejemplo.listar(recurso, filtros) : peticion('GET', `/${recurso}${consulta(filtros)}`)),
  obtener: (recurso, id) =>
    (CONFIG.DATOS_DE_EJEMPLO ? Ejemplo.obtener(recurso, id) : peticion('GET', `/${recurso}/${id}`)),
  crear: (recurso, datos) =>
    (CONFIG.DATOS_DE_EJEMPLO ? Ejemplo.crear(recurso, datos) : peticion('POST', `/${recurso}`, datos)),
  actualizar: (recurso, id, datos) =>
    (CONFIG.DATOS_DE_EJEMPLO ? Ejemplo.actualizar(recurso, id, datos) : peticion('PUT', `/${recurso}/${id}`, datos)),
  eliminar: (recurso, id) =>
    (CONFIG.DATOS_DE_EJEMPLO ? Ejemplo.eliminar(recurso, id) : peticion('DELETE', `/${recurso}/${id}`)),

  // Inicio de sesión real (Taller 3): POST /api/usuarios/login → { token, usuario }
  async login(email, password) {
    const r = await fetch(`${CONFIG.API_URL}/usuarios/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }),
    }).catch(() => null);
    if (!r) throw new ApiError(0, 'No hay conexión con el servidor.');
    const datos = await r.json().catch(() => ({}));
    if (!r.ok) throw new ApiError(r.status, datos.error || 'Credenciales inválidas');
    return datos;
  },
};
