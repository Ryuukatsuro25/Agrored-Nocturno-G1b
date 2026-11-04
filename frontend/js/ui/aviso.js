// =====================================================================
// NOTIFICACIONES TEMPORALES ("toasts")
// Uso: notificar('Cliente creado', 'exito')   tipos: exito · error · info
// =====================================================================
import { icono } from './iconos.js';
import { html } from '../core/formato.js';

const ICONO = { exito: 'ok', error: 'alerta', info: 'info' };

function contenedor() {
  let zona = document.querySelector('.avisos');
  if (!zona) {
    zona = document.createElement('div');
    zona.className = 'avisos';
    zona.setAttribute('role', 'status');
    zona.setAttribute('aria-live', 'polite');
    document.body.append(zona);
  }
  return zona;
}

export function notificar(mensaje, tipo = 'exito', duracion = 4000) {
  const aviso = document.createElement('div');
  aviso.className = `aviso aviso--${tipo}`;
  aviso.innerHTML = `${icono(ICONO[tipo])}<p>${html(mensaje)}</p>
    <button class="aviso__cerrar" aria-label="Cerrar">${icono('cerrar')}</button>`;
  const quitar = () => { aviso.classList.add('aviso--saliendo'); setTimeout(() => aviso.remove(), 200); };
  aviso.querySelector('button').addEventListener('click', quitar);
  contenedor().append(aviso);
  setTimeout(quitar, duracion);
}
