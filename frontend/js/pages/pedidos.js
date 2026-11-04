// =====================================================================
// PANTALLA DE PEDIDOS · Responsable: Valeria Polanco Muñoz (ms-pedidos, puerto 3004)
// Contrato: { id, cliente_id, producto_id, cantidad, centro_distribucion, estado, fecha,
//             cliente: { id, nombre }, producto: { id, nombre, precio } }   ← compuestos por el backend
// Reglas: un pedido nuevo empieza en "recibido"; uno "entregado" no se modifica (409).
// =====================================================================
import { montarLayout } from '../ui/layout.js';
import { crearPaginaCrud } from '../ui/crud.js';
import { Api } from '../core/api.js';
import { html, pesos, numero, fecha, hoy, capitalizar } from '../core/formato.js';
import { icono } from '../ui/iconos.js';

const CENTROS = ['Bogotá', 'Cali'].map((c) => ({ valor: c, texto: c }));
const ESTADOS = [
  { valor: 'recibido', texto: 'Recibido' },
  { valor: 'despachado', texto: 'Despachado' },
  { valor: 'entregado', texto: 'Entregado' },
];
const TONO_ESTADO = { recibido: 'aviso', despachado: 'info', entregado: 'exito' };
const total = (p) => (p.producto ? p.cantidad * p.producto.precio : 0);

async function iniciar() {
  if (!montarLayout('pedidos', 'pedidos')) return;

  // Opciones de las listas: una sola petición por recurso (no una por pedido)
  const [clientes, productos] = await Promise.all([Api.listar('clientes'), Api.listar('productos')]);
  const opcionesClientes = clientes.map((c) => ({ valor: c.id, texto: `${c.nombre} · ${c.ciudad}` }));
  const opcionesProductos = productos.map((p) => ({ valor: p.id, texto: `${p.nombre} · ${pesos(p.precio)}/${p.unidad}` }));

  crearPaginaCrud({
    recurso: 'pedidos',
    singular: 'pedido',
    genero: 'm',
    nombreDe: (p) => `#${p.id} de ${p.cliente?.nombre ?? `cliente ${p.cliente_id}`}`,
    valoresIniciales: () => ({ fecha: hoy() }),

    // Al crear no se elige el estado: el backend lo pone en "recibido".
    // Al editar (PUT reemplaza todo) el estado y la fecha son obligatorios.
    campos: (modo) => [
      { nombre: 'cliente_id', etiqueta: 'Cliente', tipo: 'lista', numerico: true, requerido: true, opciones: opcionesClientes, ancho: 'completo' },
      { nombre: 'producto_id', etiqueta: 'Producto', tipo: 'lista', numerico: true, requerido: true, opciones: opcionesProductos, ancho: 'completo' },
      { nombre: 'cantidad', etiqueta: 'Cantidad', tipo: 'entero', requerido: true, min: 1, mensaje: 'Debe ser un entero mayor que 0' },
      { nombre: 'centro_distribucion', etiqueta: 'Centro de distribución', tipo: 'lista', requerido: true, opciones: CENTROS },
      ...(modo === 'editar' ? [{ nombre: 'estado', etiqueta: 'Estado', tipo: 'lista', requerido: true, opciones: ESTADOS }] : []),
      { nombre: 'fecha', etiqueta: 'Fecha del pedido', tipo: 'fecha', requerido: modo === 'editar',
        ayuda: modo === 'crear' ? 'Si la deja vacía, el sistema usa la fecha de hoy.' : '' },
    ],

    // Muestra el total estimado mientras se llena el formulario
    alAbrirFormulario(form) {
      form.querySelector('.formulario__error').insertAdjacentHTML('beforebegin', '<div class="total-estimado campo--completo" aria-live="polite"></div>');
      const actualizar = () => {
        const p = productos.find((x) => x.id === Number(form.elements.producto_id.value));
        const cantidad = Number(form.elements.cantidad.value);
        form.querySelector('.total-estimado').innerHTML = p && cantidad > 0
          ? `${icono('dinero')}<span>Total estimado</span><strong>${pesos(p.precio * cantidad)}</strong><small>${numero(cantidad)} ${p.unidad} × ${pesos(p.precio)}</small>`
          : '';
      };
      form.addEventListener('input', actualizar);
      form.addEventListener('change', actualizar);
      actualizar();
    },

    puedeEditar: (p) => (p.estado === 'entregado' ? 'Un pedido entregado no se puede modificar' : true),

    columnas: [
      { campo: 'id', titulo: 'Pedido', celda: (p) => `<strong>#${p.id}</strong>` },
      { campo: 'cliente', titulo: 'Cliente', valor: (p) => p.cliente?.nombre, texto: (p) => p.cliente?.nombre ?? 'No disponible',
        celda: (p) => (p.cliente ? html(p.cliente.nombre) : '<span class="texto-tenue">No disponible</span>') },
      { campo: 'producto', titulo: 'Producto', valor: (p) => p.producto?.nombre, texto: (p) => p.producto?.nombre ?? 'No disponible',
        celda: (p) => (p.producto ? html(p.producto.nombre) : '<span class="texto-tenue">No disponible</span>') },
      { campo: 'cantidad', titulo: 'Cantidad', alinear: 'derecha', celda: (p) => `<span class="numero">${numero(p.cantidad)}</span>` },
      { campo: 'total', titulo: 'Total', alinear: 'derecha', valor: total, texto: total,
        celda: (p) => `<span class="numero">${p.producto ? pesos(total(p)) : '—'}</span>` },
      { campo: 'centro_distribucion', titulo: 'Centro' },
      { campo: 'estado', titulo: 'Estado', texto: (p) => capitalizar(p.estado),
        celda: (p) => `<span class="etiqueta etiqueta--${TONO_ESTADO[p.estado]}">${capitalizar(p.estado)}</span>` },
      { campo: 'fecha', titulo: 'Fecha', celda: (p) => `<span class="numero">${fecha(p.fecha)}</span>` },
    ],

    // GET /pedidos?estado=recibido&cliente_id=2 (filtros implementados en ms-pedidos)
    filtros: [
      { campo: 'estado', etiqueta: 'Estado', opciones: ESTADOS },
      { campo: 'cliente_id', etiqueta: 'Cliente', opciones: clientes.map((c) => ({ valor: c.id, texto: c.nombre })) },
    ],
    buscarEn: [(p) => p.cliente?.nombre, (p) => p.producto?.nombre, (p) => p.centro_distribucion, (p) => `#${p.id}`],

    resumen: (lista) => [
      { etiqueta: 'Pedidos', valor: lista.length, icono: 'pedidos', tono: 'primario' },
      { etiqueta: 'Por despachar', valor: lista.filter((p) => p.estado === 'recibido').length, icono: 'reloj', tono: 'aviso' },
      { etiqueta: 'En camino', valor: lista.filter((p) => p.estado === 'despachado').length, icono: 'camion', tono: 'info' },
      { etiqueta: 'Valor total', valor: pesos(lista.reduce((s, p) => s + total(p), 0)), icono: 'dinero', tono: 'exito' },
    ],

    // Si ms-clientes o ms-productos no respondió, el backend manda el objeto en null y un "aviso"
    alCargar(lista, caja) {
      const aviso = lista.find((p) => p.aviso)?.aviso;
      caja.hidden = !aviso;
      caja.innerHTML = aviso ? `${icono('alerta')}<p><strong>Información incompleta:</strong> ${html(aviso)}. Los demás datos se muestran normalmente.</p>` : '';
    },
  });
}

iniciar();
