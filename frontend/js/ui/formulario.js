// =====================================================================
// FORMULARIOS DECLARATIVOS
// Cada pantalla describe sus campos como datos y este módulo construye el
// formulario, lee los valores con su tipo correcto y valida antes de enviar.
//
// Definición de un campo:
//   { nombre, etiqueta, tipo: 'texto'|'numero'|'entero'|'correo'|'fecha'|'lista'|'interruptor',
//     requerido, opciones: [{ valor, texto }], patron: /regex/, mensaje, min, max,
//     ayuda, placeholder, ancho: 'completo', soloLectura }
// =====================================================================
import { html } from '../core/formato.js';

const TIPO_INPUT = { texto: 'text', numero: 'number', entero: 'number', correo: 'email', fecha: 'date' };

function control(campo, valor) {
  const id = `campo-${campo.nombre}`;
  const comunes = `id="${id}" name="${campo.nombre}" ${campo.requerido ? 'required' : ''} ${campo.soloLectura ? 'disabled' : ''}`;

  if (campo.tipo === 'lista') {
    const opciones = campo.opciones.map((o) =>
      `<option value="${html(o.valor)}" ${String(o.valor) === String(valor ?? '') ? 'selected' : ''}>${html(o.texto)}</option>`).join('');
    return `<select ${comunes}><option value="">Seleccione…</option>${opciones}</select>`;
  }
  if (campo.tipo === 'interruptor') {
    return `<label class="interruptor"><input type="checkbox" ${comunes} ${valor !== false ? 'checked' : ''}>
      <span class="interruptor__pista"></span><span>${html(campo.textoInterruptor ?? 'Activo')}</span></label>`;
  }
  const extra = [
    campo.tipo === 'entero' ? 'step="1"' : '', campo.tipo === 'numero' ? 'step="any"' : '',
    campo.min !== undefined ? `min="${campo.min}"` : '', campo.max !== undefined ? `max="${campo.max}"` : '',
    campo.placeholder ? `placeholder="${html(campo.placeholder)}"` : '',
  ].join(' ');
  return `<input type="${TIPO_INPUT[campo.tipo] ?? 'text'}" ${comunes} ${extra} value="${html(valor ?? '')}" autocomplete="off">`;
}

export function construirFormulario(campos, valores = {}) {
  const form = document.createElement('form');
  form.className = 'formulario';
  form.noValidate = true;   // la validación la hacemos nosotros, con mensajes en español
  form.innerHTML = campos.map((c) => `
    <div class="campo ${c.ancho === 'completo' ? 'campo--completo' : ''}" data-campo="${c.nombre}">
      ${c.tipo === 'interruptor' ? '' : `<label for="campo-${c.nombre}">${html(c.etiqueta)}${c.requerido ? ' <span class="requerido">*</span>' : ''}</label>`}
      ${control(c, valores[c.nombre])}
      ${c.ayuda ? `<small class="campo__ayuda">${html(c.ayuda)}</small>` : ''}
      <small class="campo__error" aria-live="polite"></small>
    </div>`).join('');
  return form;
}

// Lee el formulario y convierte cada valor al tipo del contrato (números como número, etc.)
export function leerFormulario(form, campos) {
  const datos = {};
  for (const c of campos) {
    const el = form.elements[c.nombre];
    if (!el || c.soloLectura) continue;
    if (c.tipo === 'interruptor') { datos[c.nombre] = el.checked; continue; }
    const texto = el.value.trim();
    if (texto === '') continue;
    if (c.tipo === 'numero' || c.tipo === 'entero' || c.numerico) datos[c.nombre] = Number(texto);
    else datos[c.nombre] = texto;
  }
  return datos;
}

// Validación del lado del navegador (la definitiva la hace el microservicio)
export function validarFormulario(datos, campos) {
  const errores = {};
  for (const c of campos) {
    if (c.soloLectura || c.tipo === 'interruptor') continue;
    const v = datos[c.nombre];
    if (v === undefined) { if (c.requerido) errores[c.nombre] = 'Este campo es obligatorio'; continue; }
    if (c.tipo === 'entero' && !Number.isInteger(v)) errores[c.nombre] = 'Debe ser un número entero';
    else if ((c.tipo === 'numero' || c.tipo === 'entero') && Number.isNaN(v)) errores[c.nombre] = 'Debe ser un número';
    else if (c.min !== undefined && v < c.min) errores[c.nombre] = c.mensaje ?? `Debe ser mayor o igual a ${c.min}`;
    else if (c.max !== undefined && v > c.max) errores[c.nombre] = c.mensaje ?? `Debe ser menor o igual a ${c.max}`;
    else if (c.tipo === 'correo' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) errores[c.nombre] = 'Correo no válido';
    else if (c.patron && !c.patron.test(String(v))) errores[c.nombre] = c.mensaje ?? 'Formato no válido';
  }
  return errores;
}

export function mostrarErrores(form, errores) {
  form.querySelectorAll('.campo').forEach((div) => {
    const mensaje = errores[div.dataset.campo] ?? '';
    div.classList.toggle('campo--invalido', Boolean(mensaje));
    div.querySelector('.campo__error').textContent = mensaje;
  });
  const primero = form.querySelector('.campo--invalido input, .campo--invalido select');
  primero?.focus();
}
