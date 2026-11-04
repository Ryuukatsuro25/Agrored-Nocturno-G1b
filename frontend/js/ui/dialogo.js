// =====================================================================
// VENTANAS MODALES con el elemento nativo <dialog>
// (accesible: atrapa el foco, se cierra con Esc y bloquea el fondo)
// =====================================================================
import { icono } from './iconos.js';
import { html } from '../core/formato.js';

export function abrirDialogo({ titulo, subtitulo = '', cuerpo, ancho = 'mediano' }) {
  const dialogo = document.createElement('dialog');
  dialogo.className = `dialogo dialogo--${ancho}`;
  dialogo.innerHTML = `
    <header class="dialogo__encabezado">
      <div><h2>${html(titulo)}</h2>${subtitulo ? `<p>${html(subtitulo)}</p>` : ''}</div>
      <button type="button" class="boton-icono" data-cerrar aria-label="Cerrar">${icono('cerrar')}</button>
    </header>
    <div class="dialogo__cuerpo"></div>`;
  dialogo.querySelector('.dialogo__cuerpo').append(cuerpo);
  const cerrar = () => { dialogo.close(); };
  dialogo.addEventListener('close', () => dialogo.remove());
  dialogo.querySelector('[data-cerrar]').addEventListener('click', cerrar);
  dialogo.addEventListener('click', (e) => { if (e.target === dialogo) cerrar(); });   // clic fuera
  document.body.append(dialogo);
  dialogo.showModal();
  return { dialogo, cerrar };
}

// Confirmación antes de una acción destructiva. Devuelve una promesa con true o false.
export function confirmar({ titulo, mensaje, textoConfirmar = 'Confirmar', peligro = false }) {
  return new Promise((resolver) => {
    const cuerpo = document.createElement('div');
    cuerpo.innerHTML = `
      <div class="confirmacion">
        <span class="confirmacion__icono ${peligro ? 'confirmacion__icono--peligro' : ''}">${icono(peligro ? 'eliminar' : 'info')}</span>
        <p>${mensaje}</p>
      </div>
      <footer class="dialogo__pie">
        <button type="button" class="boton boton--secundario" data-no>Cancelar</button>
        <button type="button" class="boton ${peligro ? 'boton--peligro' : 'boton--primario'}" data-si>${html(textoConfirmar)}</button>
      </footer>`;
    let respuesta = false;
    const { dialogo, cerrar } = abrirDialogo({ titulo, cuerpo, ancho: 'pequeno' });
    cuerpo.querySelector('[data-no]').addEventListener('click', cerrar);
    cuerpo.querySelector('[data-si]').addEventListener('click', () => { respuesta = true; cerrar(); });
    dialogo.addEventListener('close', () => resolver(respuesta));
    cuerpo.querySelector('[data-no]').focus();
  });
}
