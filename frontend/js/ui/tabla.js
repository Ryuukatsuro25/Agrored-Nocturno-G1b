// =====================================================================
// TABLA DE DATOS: ordenamiento por columna, paginación, estado de carga,
// estado vacío y botones de acción por fila.
//
// Columna: { campo, titulo, valor(fila) para ordenar, celda(fila) → HTML, alinear: 'derecha', ordenable }
// =====================================================================
import { CONFIG } from '../config.js';
import { icono } from './iconos.js';
import { html } from '../core/formato.js';

export class Tabla {
  constructor(contenedor, { columnas, acciones = null, vacio = 'No hay registros para mostrar.' }) {
    this.contenedor = contenedor;
    this.columnas = columnas;
    this.acciones = acciones;      // (fila) → [{ icono, titulo, tipo, alHacerClic, deshabilitado }]
    this.vacio = vacio;
    this.filas = [];
    this.orden = { campo: null, asc: true };
    this.pagina = 1;
  }

  cargando() {
    const columnas = this.columnas.length + (this.acciones ? 1 : 0);
    const fila = `<tr>${'<td><span class="esqueleto"></span></td>'.repeat(columnas)}</tr>`;
    this.contenedor.innerHTML = `<div class="tabla-envoltura"><table class="tabla">${this.#encabezado()}<tbody>${fila.repeat(5)}</tbody></table></div>`;
  }

  error(mensaje, reintentar) {
    this.contenedor.innerHTML = `
      <div class="estado-vacio estado-vacio--error">${icono('alerta', 'icono icono--grande')}
        <h3>No se pudieron cargar los datos</h3><p>${html(mensaje)}</p>
        <button class="boton boton--secundario">${icono('recargar')} Reintentar</button></div>`;
    this.contenedor.querySelector('button').addEventListener('click', reintentar);
  }

  mostrar(filas, { reiniciarPagina = true } = {}) {
    this.filas = filas;
    if (reiniciarPagina) this.pagina = 1;
    this.#pintar();
  }

  #ordenadas() {
    const col = this.columnas.find((c) => c.campo === this.orden.campo);
    if (!col) return this.filas;
    const valor = col.valor ?? ((f) => f[col.campo]);
    return [...this.filas].sort((a, b) => {
      const x = valor(a); const y = valor(b);
      const r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x ?? '').localeCompare(String(y ?? ''), 'es');
      return this.orden.asc ? r : -r;
    });
  }

  #encabezado() {
    const ths = this.columnas.map((c) => {
      const activa = this.orden.campo === c.campo;
      const flecha = activa ? icono(this.orden.asc ? 'arriba' : 'abajo', 'icono icono--mini') : icono('ordenar', 'icono icono--mini icono--tenue');
      const contenido = c.ordenable === false ? html(c.titulo)
        : `<button type="button" class="tabla__orden" data-orden="${c.campo}">${html(c.titulo)}${flecha}</button>`;
      return `<th class="${c.alinear === 'derecha' ? 'derecha' : ''}" ${activa ? `aria-sort="${this.orden.asc ? 'ascending' : 'descending'}"` : ''}>${contenido}</th>`;
    }).join('');
    return `<thead><tr>${ths}${this.acciones ? '<th class="derecha"><span class="solo-lector">Acciones</span></th>' : ''}</tr></thead>`;
  }

  #pintar() {
    if (this.filas.length === 0) {
      this.contenedor.innerHTML = `<div class="estado-vacio">${icono('buscar', 'icono icono--grande')}
        <h3>Sin resultados</h3><p>${html(this.vacio)}</p></div>`;
      return;
    }
    const porPagina = CONFIG.FILAS_POR_PAGINA;
    const paginas = Math.ceil(this.filas.length / porPagina);
    this.pagina = Math.min(this.pagina, paginas);
    const desde = (this.pagina - 1) * porPagina;
    const visibles = this.#ordenadas().slice(desde, desde + porPagina);

    const cuerpo = visibles.map((fila, i) => {
      const celdas = this.columnas.map((c) =>
        `<td class="${c.alinear === 'derecha' ? 'derecha' : ''}" data-titulo="${html(c.titulo)}">${c.celda ? c.celda(fila) : html(fila[c.campo])}</td>`).join('');
      const botones = this.acciones ? `<td class="derecha tabla__acciones">${this.acciones(fila).map((a, j) => `
        <button type="button" class="boton-icono ${a.tipo === 'peligro' ? 'boton-icono--peligro' : ''}"
          data-fila="${i}" data-accion="${j}" title="${html(a.titulo)}" aria-label="${html(a.titulo)}"
          ${a.deshabilitado ? 'disabled' : ''}>${icono(a.icono)}</button>`).join('')}</td>` : '';
      return `<tr>${celdas}${botones}</tr>`;
    }).join('');

    this.contenedor.innerHTML = `
      <div class="tabla-envoltura"><table class="tabla">${this.#encabezado()}<tbody>${cuerpo}</tbody></table></div>
      <footer class="paginacion">
        <span>Mostrando <strong>${desde + 1}–${desde + visibles.length}</strong> de <strong>${this.filas.length}</strong></span>
        <div class="paginacion__botones">
          <button type="button" class="boton-icono" data-pagina="-1" aria-label="Página anterior" ${this.pagina === 1 ? 'disabled' : ''}>${icono('izquierda')}</button>
          <span>Página ${this.pagina} de ${paginas}</span>
          <button type="button" class="boton-icono" data-pagina="1" aria-label="Página siguiente" ${this.pagina === paginas ? 'disabled' : ''}>${icono('derecha')}</button>
        </div>
      </footer>`;

    this.contenedor.querySelectorAll('[data-orden]').forEach((b) => b.addEventListener('click', () => {
      const campo = b.dataset.orden;
      this.orden = { campo, asc: this.orden.campo === campo ? !this.orden.asc : true };
      this.#pintar();
    }));
    this.contenedor.querySelectorAll('[data-pagina]').forEach((b) => b.addEventListener('click', () => {
      this.pagina += Number(b.dataset.pagina);
      this.#pintar();
    }));
    this.contenedor.querySelectorAll('[data-accion]').forEach((b) => b.addEventListener('click', () => {
      const fila = visibles[Number(b.dataset.fila)];
      this.acciones(fila)[Number(b.dataset.accion)].alHacerClic(fila);
    }));
  }
}
