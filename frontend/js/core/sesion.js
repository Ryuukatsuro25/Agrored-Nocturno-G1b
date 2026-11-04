// =====================================================================
// SESIÓN DEL USUARIO
// Guarda el usuario y su token en sessionStorage (se borra al cerrar la pestaña).
// En el Taller 2 el token es simulado; en el Taller 3 lo entrega ms-usuarios.
// =====================================================================
import { puedeVer } from './permisos.js';

const CLAVE = 'agrored.sesion';
const CLAVE_AVISO = 'agrored.aviso';
let enMemoria = null;   // respaldo si el navegador bloquea el almacenamiento

function leer() {
  try { return JSON.parse(sessionStorage.getItem(CLAVE)) ?? enMemoria; } catch { return enMemoria; }
}

export const Sesion = {
  iniciar(usuario, token) {
    enMemoria = { usuario, token };
    try { sessionStorage.setItem(CLAVE, JSON.stringify(enMemoria)); } catch { /* sin almacenamiento */ }
  },
  usuario: () => leer()?.usuario ?? null,
  token: () => leer()?.token ?? null,

  cerrar(mensaje) {
    enMemoria = null;
    try { sessionStorage.removeItem(CLAVE); } catch { /* sin almacenamiento */ }
    if (mensaje) Sesion.avisoPendiente(mensaje);
    location.href = 'index.html';
  },

  // Protege una página: sin sesión → login; sin permiso → inicio
  exigir(recurso) {
    const usuario = Sesion.usuario();
    if (!usuario) { location.replace('index.html'); return null; }
    if (recurso && !puedeVer(usuario.rol, recurso)) {
      Sesion.avisoPendiente('Su rol no tiene acceso a esa página.');
      location.replace('inicio.html');
      return null;
    }
    return usuario;
  },

  // Mensaje que se muestra en la siguiente página (por ejemplo, "acceso denegado")
  avisoPendiente(texto) {
    try { sessionStorage.setItem(CLAVE_AVISO, texto); } catch { /* sin almacenamiento */ }
  },
  tomarAviso() {
    try {
      const texto = sessionStorage.getItem(CLAVE_AVISO);
      sessionStorage.removeItem(CLAVE_AVISO);
      return texto;
    } catch { return null; }
  },
};
