// =====================================================================
// PANTALLA CRUD REUTILIZABLE: listar, filtrar, buscar, crear, editar y eliminar.
// Cada responsable configura SU entidad (campos, columnas, filtros, reglas) en
// js/pages/<recurso>.js; este módulo hace el trabajo repetido igual para todos.
//
// Opciones principales:
//   recurso, singular ('cliente'), genero ('m'|'f'), campos(modo, fila), columnas,
//   filtros: [{ campo, etiqueta, opciones }], buscarEn: [(fila) => texto],
//   resumen(filas) → [{ etiqueta, valor, icono, tono }], puedeEditar(fila) → true | 'motivo',
//   prepararDatos(datos, modo, fila), alCargar(filas)
// =====================================================================
import { Api } from '../core/api.js';
import { Sesion } from '../core/sesion.js';
import { puedeGestionar } from '../core/permisos.js';
import { html, normalizar } from '../core/formato.js';
import { icono } from './iconos.js';
import { notificar } from './aviso.js';
import { abrirDialogo, confirmar } from './dialogo.js';
import { construirFormulario, leerFormulario, validarFormulario, mostrarErrores } from './formulario.js';
import { Tabla } from './tabla.js';

export function crearPaginaCrud(op) {
  const raiz = document.querySelector('#crud');
  const usuario = Sesion.usuario();
  const gestiona = puedeGestionar(usuario.rol, op.recurso);
  const art = op.genero === 'f' ? { el: 'la', un: 'una', o: 'a' } : { el: 'el', un: 'un', o: 'o' };
  let filas = [];          // lo que respondió la API con los filtros actuales
  let texto = '';          // búsqueda local

  // ---- estructura de la pantalla
  raiz.innerHTML = `
    <section class="resumen" aria-label="Resumen"></section>
    <div class="aviso-fijo" hidden></div>
    <section class="tarjeta">
      <div class="herramientas">
        <label class="buscador">${icono('buscar')}
          <input type="search" placeholder="Buscar ${html(op.plural ?? `${op.singular}s`)}…" aria-label="Buscar"></label>
        ${(op.filtros ?? []).map((f) => `
          <select class="filtro" data-filtro="${f.campo}" aria-label="${html(f.etiqueta)}">
            <option value="">${html(f.etiqueta)}: todos</option>
            ${f.opciones.map((o) => `<option value="${html(o.valor)}">${html(o.texto)}</option>`).join('')}
          </select>`).join('')}
        <button type="button" class="boton boton--fantasma" data-limpiar hidden>${icono('cerrar')} Limpiar</button>
        <span class="herramientas__espacio"></span>
        <button type="button" class="boton boton--secundario" data-exportar>${icono('descargar')}<span>Exportar CSV</span></button>
      </div>
      <div class="tabla-contenedor"></div>
    </section>`;

  const botonNuevo = document.querySelector('#btn-nuevo');
  if (botonNuevo) {
    botonNuevo.hidden = !gestiona;                       // el rol sin permiso no ve el botón
    botonNuevo.innerHTML = `${icono('mas')}<span>Nuev${art.o} ${html(op.singular)}</span>`;
    botonNuevo.addEventListener('click', () => abrirFormulario('crear'));
  }

  const tabla = new Tabla(raiz.querySelector('.tabla-contenedor'), {
    columnas: op.columnas,
    vacio: `No hay ${op.plural ?? `${op.singular}s`} que coincidan con la búsqueda o los filtros.`,
    acciones: gestiona ? (fila) => {
      const motivo = op.puedeEditar ? op.puedeEditar(fila) : true;
      return [
        { icono: 'editar', titulo: motivo === true ? 'Editar' : motivo, deshabilitado: motivo !== true, alHacerClic: (f) => abrirFormulario('editar', f) },
        { icono: 'eliminar', titulo: 'Eliminar', tipo: 'peligro', alHacerClic: eliminar },
      ];
    } : null,
  });

  // ---- carga desde la API (los filtros viajan como ?campo=valor, igual que en Postman)
  const filtrosActivos = () => Object.fromEntries(
    [...raiz.querySelectorAll('[data-filtro]')].map((s) => [s.dataset.filtro, s.value]).filter(([, v]) => v));

  async function cargar() {
    tabla.cargando();
    try {
      filas = await Api.listar(op.recurso, filtrosActivos());
      pintar();
      op.alCargar?.(filas, raiz.querySelector('.aviso-fijo'));
    } catch (error) {
      tabla.error(error.message, cargar);
    }
  }

  function pintar(reiniciarPagina = true) {
    const buscadas = texto
      ? filas.filter((f) => (op.buscarEn ?? []).some((obtener) => normalizar(obtener(f)).includes(texto)))
      : filas;
    tabla.mostrar(buscadas, { reiniciarPagina });
    const resumen = raiz.querySelector('.resumen');
    resumen.innerHTML = (op.resumen?.(filas) ?? []).map((r) => `
      <article class="indicador indicador--${r.tono ?? 'neutro'}">
        <span class="indicador__icono">${icono(r.icono ?? op.recurso)}</span>
        <div><p>${html(r.etiqueta)}</p><strong>${html(r.valor)}</strong></div>
      </article>`).join('');
    raiz.querySelector('[data-limpiar]').hidden = !texto && Object.keys(filtrosActivos()).length === 0;
  }

  // ---- crear y editar en una ventana modal
  function abrirFormulario(modo, fila = null) {
    const campos = op.campos(modo, fila);
    const form = construirFormulario(campos, fila ?? op.valoresIniciales?.() ?? {});
    form.insertAdjacentHTML('beforeend', `
      <div class="formulario__error" role="alert" hidden></div>
      <footer class="dialogo__pie campo--completo">
        <button type="button" class="boton boton--secundario" data-cancelar>Cancelar</button>
        <button type="submit" class="boton boton--primario">${icono('ok')}<span>${modo === 'crear' ? 'Crear' : 'Guardar cambios'}</span></button>
      </footer>`);
    const { cerrar } = abrirDialogo({
      titulo: modo === 'crear' ? `Nuev${art.o} ${op.singular}` : `Editar ${op.singular} #${fila.id}`,
      subtitulo: modo === 'crear' ? 'Los campos con * son obligatorios.' : 'PUT reemplaza el registro completo.',
      cuerpo: form,
    });
    op.alAbrirFormulario?.(form, modo, fila);
    form.querySelector('[data-cancelar]').addEventListener('click', cerrar);
    form.querySelector('input, select')?.focus();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      let datos = leerFormulario(form, campos);
      const errores = validarFormulario(datos, campos);
      mostrarErrores(form, errores);
      if (Object.keys(errores).length) return;
      if (op.prepararDatos) datos = op.prepararDatos(datos, modo, fila);

      const boton = form.querySelector('[type=submit]');
      boton.disabled = true;
      boton.classList.add('boton--cargando');
      try {
        if (modo === 'crear') await Api.crear(op.recurso, datos);
        else await Api.actualizar(op.recurso, fila.id, datos);
        cerrar();
        notificar(`${capital(op.singular)} ${modo === 'crear' ? `cread${art.o}` : `actualizad${art.o}`} correctamente`);
        await cargar();
      } catch (error) {
        // 400 con detalles, 409 por la regla de negocio, 503 si un servicio no responde
        const caja = form.querySelector('.formulario__error');
        caja.hidden = false;
        caja.innerHTML = `${icono('alerta')}<div><strong>${html(error.message)}</strong>
          ${error.detalles?.length ? `<ul>${error.detalles.map((d) => `<li>${html(d)}</li>`).join('')}</ul>` : ''}</div>`;
      } finally {
        boton.disabled = false;
        boton.classList.remove('boton--cargando');
      }
    });
  }

  async function eliminar(fila) {
    const nombre = op.nombreDe ? op.nombreDe(fila) : `#${fila.id}`;
    const ok = await confirmar({
      titulo: `Eliminar ${op.singular}`,
      mensaje: `¿Seguro que desea eliminar ${art.el} ${html(op.singular)} <strong>${html(nombre)}</strong>? Esta acción no se puede deshacer.`,
      textoConfirmar: 'Eliminar', peligro: true,
    });
    if (!ok) return;
    try {
      await Api.eliminar(op.recurso, fila.id);          // 204 No Content
      notificar(`${capital(op.singular)} eliminad${art.o}`);
    } catch (error) {
      notificar(error.status === 404 ? `${capital(art.el)} ${op.singular} ya no existe` : error.message, 'error');
    }
    await cargar();
  }

  // ---- exportar lo que se ve (búsqueda + filtros) a CSV para Excel
  function exportar() {
    const cols = op.columnas.filter((c) => c.exportar !== false);
    const valor = (c, f) => (c.texto ? c.texto(f) : f[c.campo]);
    const lineas = [cols.map((c) => c.titulo), ...tabla.filas.map((f) => cols.map((c) => valor(c, f)))]
      .map((l) => l.map((v) => `"${String(v ?? '').replaceAll('"', '""')}"`).join(';'));
    const archivo = new Blob([`﻿${lineas.join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
    const enlace = Object.assign(document.createElement('a'), { href: URL.createObjectURL(archivo), download: `${op.recurso}.csv` });
    enlace.click();
    URL.revokeObjectURL(enlace.href);
  }

  // ---- eventos de la barra de herramientas
  let espera;
  raiz.querySelector('[type=search]').addEventListener('input', (e) => {
    clearTimeout(espera);
    espera = setTimeout(() => { texto = normalizar(e.target.value.trim()); pintar(); }, 150);
  });
  raiz.querySelectorAll('[data-filtro]').forEach((s) => s.addEventListener('change', cargar));
  raiz.querySelector('[data-limpiar]').addEventListener('click', () => {
    raiz.querySelector('[type=search]').value = '';
    texto = '';
    raiz.querySelectorAll('[data-filtro]').forEach((s) => { s.value = ''; });
    cargar();
  });
  raiz.querySelector('[data-exportar]').addEventListener('click', exportar);

  cargar();
  return { recargar: cargar };
}

const capital = (t) => t.charAt(0).toUpperCase() + t.slice(1);
