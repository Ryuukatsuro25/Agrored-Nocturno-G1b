// =====================================================================
// ESTRUCTURA COMÚN DE LAS PÁGINAS INTERNAS
// Menú lateral (solo con las páginas que el rol puede ver), barra superior
// con el nombre y el rol del usuario, cambio de tema y cerrar sesión.
// Cada página HTML solo trae su contenido dentro de <main class="contenido">.
// =====================================================================
import { CONFIG } from '../config.js';
import { Sesion } from '../core/sesion.js';
import { ROLES, puedeVer } from '../core/permisos.js';
import { html, iniciales } from '../core/formato.js';
import { icono } from './iconos.js';
import { notificar } from './aviso.js';

const MENU = [
  { pagina: 'inicio', texto: 'Inicio', href: 'inicio.html' },
  { pagina: 'pedidos', texto: 'Pedidos', href: 'pedidos.html', recurso: 'pedidos' },
  { pagina: 'clientes', texto: 'Clientes', href: 'clientes.html', recurso: 'clientes' },
  { pagina: 'productos', texto: 'Productos', href: 'productos.html', recurso: 'productos' },
  { pagina: 'usuarios', texto: 'Usuarios', href: 'usuarios.html', recurso: 'usuarios' },
];

export function alternarTema() {
  const raiz = document.documentElement;
  const oscuro = raiz.dataset.tema !== 'oscuro';
  raiz.dataset.tema = oscuro ? 'oscuro' : 'claro';
  try { localStorage.setItem('agrored.tema', raiz.dataset.tema); } catch { /* sin almacenamiento */ }
  return oscuro;
}

// Monta el menú y la barra superior. Devuelve el usuario de la sesión (o null si redirige).
export function montarLayout(pagina, recurso) {
  const usuario = Sesion.exigir(recurso);
  if (!usuario) return null;
  const rol = ROLES[usuario.rol] ?? { nombre: usuario.rol };

  const enlaces = MENU.filter((m) => !m.recurso || puedeVer(usuario.rol, m.recurso)).map((m) => `
    <a href="${m.href}" class="menu__enlace ${m.pagina === pagina ? 'menu__enlace--activo' : ''}"
       ${m.pagina === pagina ? 'aria-current="page"' : ''}>${icono(m.pagina)}<span>${m.texto}</span></a>`).join('');

  const lateral = document.createElement('aside');
  lateral.className = 'lateral';
  lateral.id = 'menu-lateral';
  lateral.innerHTML = `
    <a href="inicio.html" class="marca">
      <span class="marca__logo">${icono('hoja')}</span>
      <span class="marca__texto"><strong>AgroRed</strong><small>Gestión comercial</small></span>
    </a>
    <nav class="menu" aria-label="Menú principal">
      <p class="menu__titulo">Navegación</p>${enlaces}
    </nav>
    <div class="lateral__pie">
      <span class="etiqueta etiqueta--${CONFIG.DATOS_DE_EJEMPLO ? 'aviso' : 'exito'}">
        ${CONFIG.DATOS_DE_EJEMPLO ? 'Datos de ejemplo' : 'Conectado a la API'}</span>
      <small>${html(CONFIG.EMPRESA)} · ${new Date().getFullYear()}</small>
    </div>`;

  const superior = document.createElement('header');
  superior.className = 'superior';
  superior.innerHTML = `
    <button type="button" class="boton-icono superior__menu" aria-label="Abrir menú" aria-controls="menu-lateral" aria-expanded="false">${icono('menu')}</button>
    <div class="superior__titulo">${html(document.title.split('·')[0].trim())}</div>
    <div class="superior__acciones">
      <button type="button" class="boton-icono" data-cambiar-tema aria-label="Cambiar tema">${icono(document.documentElement.dataset.tema === 'oscuro' ? 'sol' : 'luna')}</button>
      <div class="perfil">
        <span class="perfil__avatar" aria-hidden="true">${html(iniciales(usuario.nombre))}</span>
        <span class="perfil__datos"><strong>${html(usuario.nombre)}</strong><small>${html(rol.nombre)}</small></span>
      </div>
      <button type="button" class="boton boton--fantasma" data-salir>${icono('salir')}<span>Salir</span></button>
    </div>`;

  const velo = document.createElement('div');
  velo.className = 'velo';

  const app = document.querySelector('.app');
  app.prepend(lateral);
  app.querySelector('.principal').prepend(superior);
  app.append(velo);

  // Menú en celular: se abre como cajón lateral
  const botonMenu = superior.querySelector('.superior__menu');
  const abrir = (si) => { app.classList.toggle('app--menu-abierto', si); botonMenu.setAttribute('aria-expanded', String(si)); };
  botonMenu.addEventListener('click', () => abrir(!app.classList.contains('app--menu-abierto')));
  velo.addEventListener('click', () => abrir(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') abrir(false); });

  superior.querySelector('[data-cambiar-tema]').addEventListener('click', (e) => {
    e.currentTarget.innerHTML = icono(alternarTema() ? 'sol' : 'luna');
  });
  superior.querySelector('[data-salir]').addEventListener('click', () => Sesion.cerrar());

  const aviso = Sesion.tomarAviso();
  if (aviso) notificar(aviso, 'info');
  return usuario;
}
