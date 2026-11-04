// =====================================================================
// INICIO DE SESIÓN · Grupo
// Taller 2 (DATOS_DE_EJEMPLO = true): simulado, se elige el rol para entrar.
// Taller 3 (DATOS_DE_EJEMPLO = false): formulario real contra POST /api/usuarios/login.
// =====================================================================
import { CONFIG } from '../config.js';
import { Api } from '../core/api.js';
import { Sesion } from '../core/sesion.js';
import { ROLES } from '../core/permisos.js';
import { html } from '../core/formato.js';
import { icono } from '../ui/iconos.js';

const ICONO_ROL = { administrador: 'candado', comercial: 'pedidos', produccion: 'fabrica' };

if (Sesion.usuario()) location.replace('inicio.html');   // ya tiene sesión

const zona = document.querySelector('#acceso');
const error = document.querySelector('#acceso-error');
const mostrarError = (m) => { error.hidden = !m; error.innerHTML = m ? `${icono('alerta')}<span>${html(m)}</span>` : ''; };

async function modoSimulado() {
  const usuarios = (await (await fetch('data/usuarios.json')).json()).filter((u) => u.activo);
  const porRol = Object.keys(ROLES).map((rol) => usuarios.find((u) => u.rol === rol)).filter(Boolean);
  zona.innerHTML = `
    <p class="acceso__nota">${icono('info')}<span><strong>Modo demostración.</strong> Elija el rol con el que desea entrar.
      En el Taller 3 aquí aparece el formulario con correo y contraseña.</span></p>
    <form class="roles" id="form-rol">
      ${porRol.map((u, i) => `
        <label class="rol">
          <input type="radio" name="rol" value="${u.id}" ${i === 0 ? 'checked' : ''}>
          <span class="rol__icono">${icono(ICONO_ROL[u.rol])}</span>
          <span class="rol__texto"><strong>${html(ROLES[u.rol].nombre)}</strong><small>${html(ROLES[u.rol].descripcion)}</small></span>
          <span class="rol__marca">${icono('ok')}</span>
        </label>`).join('')}
      <button class="boton boton--primario boton--bloque" type="submit">Entrar ${icono('flecha')}</button>
    </form>`;
  zona.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const usuario = porRol.find((u) => u.id === Number(new FormData(e.target).get('rol')));
    Sesion.iniciar(usuario, 'token-simulado');
    location.href = 'inicio.html';
  });
}

function modoReal() {
  zona.innerHTML = `
    <form class="formulario formulario--una-columna" id="form-login" novalidate>
      <div class="campo"><label for="email">Correo</label>
        <div class="campo__con-icono">${icono('correo')}<input id="email" name="email" type="email" required autocomplete="username" placeholder="nombre@agrored.com"></div></div>
      <div class="campo"><label for="password">Contraseña</label>
        <div class="campo__con-icono">${icono('candado')}<input id="password" name="password" type="password" required autocomplete="current-password"></div></div>
      <button class="boton boton--primario boton--bloque" type="submit">Iniciar sesión ${icono('flecha')}</button>
    </form>`;
  zona.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const { email, password } = Object.fromEntries(new FormData(e.target));
    if (!email || !password) { mostrarError('Escriba su correo y su contraseña.'); return; }
    const boton = e.target.querySelector('button');
    boton.disabled = true;
    try {
      const { token, usuario } = await Api.login(email.trim().toLowerCase(), password);
      Sesion.iniciar(usuario, token);
      location.href = 'inicio.html';
    } catch (err) {
      mostrarError(err.status === 401 ? 'Correo o contraseña incorrectos.' : err.message);   // mismo mensaje en ambos casos
    } finally { boton.disabled = false; }
  });
}

const aviso = Sesion.tomarAviso();
if (aviso) mostrarError(aviso);
(CONFIG.DATOS_DE_EJEMPLO ? modoSimulado() : modoReal());
