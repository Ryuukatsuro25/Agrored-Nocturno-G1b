// =====================================================================
// PANTALLA DE USUARIOS · Grupo (consume ms-usuarios de la docente, puerto 3001)
// Solo el administrador entra a esta página.
// Contrato: { id, nombre, email, rol, activo }
// =====================================================================
import { montarLayout } from '../ui/layout.js';
import { crearPaginaCrud } from '../ui/crud.js';
import { ROLES } from '../core/permisos.js';
import { html, iniciales } from '../core/formato.js';

const OPCIONES_ROL = Object.entries(ROLES).map(([valor, r]) => ({ valor, texto: r.nombre }));

if (montarLayout('usuarios', 'usuarios')) {
  crearPaginaCrud({
    recurso: 'usuarios',
    singular: 'usuario',
    genero: 'm',
    nombreDe: (u) => u.email,
    campos: () => [
      { nombre: 'nombre', etiqueta: 'Nombre completo', tipo: 'texto', requerido: true, ancho: 'completo' },
      { nombre: 'email', etiqueta: 'Correo', tipo: 'correo', requerido: true, placeholder: 'nombre@agrored.com' },
      { nombre: 'rol', etiqueta: 'Rol', tipo: 'lista', requerido: true, opciones: OPCIONES_ROL },
      { nombre: 'activo', etiqueta: 'Estado', tipo: 'interruptor', textoInterruptor: 'Usuario activo (puede iniciar sesión)', ancho: 'completo' },
    ],
    prepararDatos: (d) => ({ ...d, email: d.email.toLowerCase() }),
    columnas: [
      { campo: 'nombre', titulo: 'Usuario', celda: (u) => `<div class="persona"><span class="perfil__avatar perfil__avatar--chico">${html(iniciales(u.nombre))}</span>
        <div><strong>${html(u.nombre)}</strong><small class="bloque texto-tenue">${html(u.email)}</small></div></div>` },
      { campo: 'rol', titulo: 'Rol', texto: (u) => ROLES[u.rol]?.nombre ?? u.rol,
        celda: (u) => `<span class="etiqueta etiqueta--${u.rol === 'administrador' ? 'primario' : 'neutra'}">${html(ROLES[u.rol]?.nombre ?? u.rol)}</span>` },
      { campo: 'activo', titulo: 'Estado', valor: (u) => (u.activo ? 1 : 0), texto: (u) => (u.activo ? 'Activo' : 'Inactivo'),
        celda: (u) => `<span class="punto punto--${u.activo ? 'exito' : 'apagado'}">${u.activo ? 'Activo' : 'Inactivo'}</span>` },
    ],
    filtros: [{ campo: 'rol', etiqueta: 'Rol', opciones: OPCIONES_ROL }],
    buscarEn: [(u) => u.nombre, (u) => u.email],
    resumen: (lista) => [
      { etiqueta: 'Usuarios', valor: lista.length, icono: 'usuarios', tono: 'primario' },
      { etiqueta: 'Activos', valor: lista.filter((u) => u.activo).length, icono: 'ok', tono: 'exito' },
      { etiqueta: 'Administradores', valor: lista.filter((u) => u.rol === 'administrador').length, icono: 'candado', tono: 'info' },
    ],
  });
}
