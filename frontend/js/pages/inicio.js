// =====================================================================
// PÁGINA DE INICIO DE CADA ROL · Grupo
//   administrador → panel general: totales de cada entidad y usuarios
//   comercial     → pedidos con el nombre del cliente y del producto
//   produccion    → producción pendiente por producto y catálogo
// Regla del microproyecto: datos independientes (los totales) se piden por
// separado a cada microservicio; los relacionados ya vienen compuestos.
// =====================================================================
import { montarLayout } from '../ui/layout.js';
import { Api } from '../core/api.js';
import { ROLES } from '../core/permisos.js';
import { html, pesos, numero, fecha, capitalizar, iniciales } from '../core/formato.js';
import { icono } from '../ui/iconos.js';

const panel = document.querySelector('#panel');
const TONO_ESTADO = { recibido: 'aviso', despachado: 'info', entregado: 'exito' };
const totalPedido = (p) => (p.producto ? p.cantidad * p.producto.precio : 0);

function saludo() {
  const h = new Date().getHours();
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
}

const indicador = (etiqueta, valor, iconoNombre, tono, enlace) => `
  <a class="indicador indicador--${tono} indicador--enlace" ${enlace ? `href="${enlace}"` : ''}>
    <span class="indicador__icono">${icono(iconoNombre)}</span>
    <div><p>${etiqueta}</p><strong>${valor}</strong></div>
  </a>`;

// Barras horizontales simples (valor relativo al máximo)
function barras(items, formato = numero) {
  const max = Math.max(1, ...items.map((i) => i.valor));
  return `<ul class="barras">${items.map((i) => `
    <li><div class="barras__fila"><span>${html(i.etiqueta)}</span><strong>${formato(i.valor)}</strong></div>
      <div class="barras__pista"><span class="barras__relleno barras__relleno--${i.tono ?? 'primario'}" style="width:${(i.valor / max) * 100}%"></span></div></li>`).join('')}</ul>`;
}

function tablaPedidos(pedidos) {
  if (!pedidos.length) return '<div class="estado-vacio"><p>No hay pedidos para mostrar.</p></div>';
  return `<div class="tabla-envoltura"><table class="tabla tabla--compacta">
    <thead><tr><th>Pedido</th><th>Cliente</th><th>Producto</th><th class="derecha">Total</th><th>Estado</th></tr></thead>
    <tbody>${pedidos.map((p) => `<tr>
      <td data-titulo="Pedido"><strong>#${p.id}</strong><small class="bloque texto-tenue">${fecha(p.fecha)}</small></td>
      <td data-titulo="Cliente">${html(p.cliente?.nombre ?? 'No disponible')}</td>
      <td data-titulo="Producto">${html(p.producto?.nombre ?? 'No disponible')}<small class="bloque texto-tenue">${numero(p.cantidad)} unidades</small></td>
      <td data-titulo="Total" class="derecha numero">${pesos(totalPedido(p))}</td>
      <td data-titulo="Estado"><span class="etiqueta etiqueta--${TONO_ESTADO[p.estado]}">${capitalizar(p.estado)}</span></td>
    </tr>`).join('')}</tbody></table></div>`;
}

const porEstado = (pedidos) => ['recibido', 'despachado', 'entregado'].map((e) => ({
  etiqueta: capitalizar(e), valor: pedidos.filter((p) => p.estado === e).length, tono: TONO_ESTADO[e],
}));
const recientes = (pedidos, n = 6) => [...pedidos].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id).slice(0, n);

// Si un microservicio no responde, el panel sigue funcionando con los demás
// (la misma idea de "degradación controlada" que aplica ms-pedidos).
const caidos = [];
async function listarSeguro(recurso, filtros) {
  try { return await Api.listar(recurso, filtros); } catch { caidos.push(`ms-${recurso}`); return null; }
}
const contar = (lista, filtro = () => true) => (lista ? lista.filter(filtro).length : '—');
const avisoCaidos = () => (caidos.length
  ? `<div class="aviso-fijo">${icono('alerta')}<p><strong>Información incompleta:</strong> no respondió ${caidos.join(', ')}. Se muestran los demás datos.</p></div>` : '');

// ------------------------------------------------------------------ administrador
async function panelAdministrador() {
  const [productos, clientes, pedidosR, usuariosR] = await Promise.all(
    ['productos', 'clientes', 'pedidos', 'usuarios'].map((r) => listarSeguro(r)));
  const pedidos = pedidosR ?? [];
  const usuarios = usuariosR ?? [];
  const valor = pedidos.reduce((s, p) => s + totalPedido(p), 0);
  return `${avisoCaidos()}
    <section class="resumen">
      ${indicador('Productos', contar(productos), 'productos', 'acento', 'productos.html')}
      ${indicador('Clientes', contar(clientes), 'clientes', 'info', 'clientes.html')}
      ${indicador('Pedidos', contar(pedidosR), 'pedidos', 'primario', 'pedidos.html')}
      ${indicador('Usuarios activos', contar(usuariosR, (u) => u.activo), 'usuarios', 'neutro', 'usuarios.html')}
    </section>
    <div class="rejilla rejilla--2-1">
      <section class="tarjeta">
        <header class="tarjeta__encabezado"><div><h2>Pedidos recientes</h2><p>Con el cliente y el producto ya compuestos por ms-pedidos</p></div>
          <a class="boton boton--secundario" href="pedidos.html">Ver todos ${icono('flecha')}</a></header>
        ${tablaPedidos(recientes(pedidos))}
      </section>
      <div class="pila">
        <section class="tarjeta">
          <header class="tarjeta__encabezado"><div><h2>Pedidos por estado</h2><p>Valor total: <strong>${pesos(valor)}</strong></p></div></header>
          ${barras(porEstado(pedidos))}
        </section>
        <section class="tarjeta">
          <header class="tarjeta__encabezado"><div><h2>Usuarios</h2><p>${usuarios.length} registrados</p></div>
            <a class="boton boton--fantasma" href="usuarios.html">Gestionar</a></header>
          ${usuariosR ? '' : '<div class="estado-vacio"><p>ms-usuarios no respondió.</p></div>'}
          <ul class="lista-personas">${usuarios.slice(0, 5).map((u) => `
            <li><span class="perfil__avatar perfil__avatar--chico">${html(iniciales(u.nombre))}</span>
              <div><strong>${html(u.nombre)}</strong><small>${html(ROLES[u.rol]?.nombre ?? u.rol)}</small></div>
              <span class="punto punto--${u.activo ? 'exito' : 'apagado'}" title="${u.activo ? 'Activo' : 'Inactivo'}"></span></li>`).join('')}</ul>
        </section>
      </div>
    </div>`;
}

// ------------------------------------------------------------------ comercial
async function panelComercial() {
  const pedidos = await Api.listar('pedidos');
  const activos = pedidos.filter((p) => p.estado !== 'entregado');
  const porCliente = Object.values(pedidos.reduce((acc, p) => {
    const nombre = p.cliente?.nombre ?? `Cliente ${p.cliente_id}`;
    acc[nombre] = acc[nombre] ?? { etiqueta: nombre, valor: 0 };
    acc[nombre].valor += totalPedido(p);
    return acc;
  }, {})).sort((a, b) => b.valor - a.valor).slice(0, 5);
  return `
    <section class="resumen">
      ${indicador('Por despachar', pedidos.filter((p) => p.estado === 'recibido').length, 'reloj', 'aviso', 'pedidos.html')}
      ${indicador('En camino', pedidos.filter((p) => p.estado === 'despachado').length, 'camion', 'info', 'pedidos.html')}
      ${indicador('Entregados', pedidos.filter((p) => p.estado === 'entregado').length, 'ok', 'exito', 'pedidos.html')}
      ${indicador('Valor en curso', pesos(activos.reduce((s, p) => s + totalPedido(p), 0)), 'dinero', 'primario', 'pedidos.html')}
    </section>
    <div class="rejilla rejilla--2-1">
      <section class="tarjeta">
        <header class="tarjeta__encabezado"><div><h2>Pedidos en curso</h2><p>Recibidos y despachados, del más reciente al más antiguo</p></div>
          <a class="boton boton--primario" href="pedidos.html">${icono('mas')} Gestionar pedidos</a></header>
        ${tablaPedidos(recientes(activos, 10))}
      </section>
      <section class="tarjeta">
        <header class="tarjeta__encabezado"><div><h2>Clientes con más compras</h2><p>Valor total de sus pedidos</p></div></header>
        ${barras(porCliente, pesos)}
      </section>
    </div>`;
}

// ------------------------------------------------------------------ produccion
async function panelProduccion() {
  const [pedidos, productos] = await Promise.all([Api.listar('pedidos', { estado: 'recibido' }), Api.listar('productos')]);
  const pendiente = Object.values(pedidos.reduce((acc, p) => {
    const nombre = p.producto?.nombre ?? `Producto ${p.producto_id}`;
    acc[nombre] = acc[nombre] ?? { etiqueta: nombre, valor: 0, tono: 'acento' };
    acc[nombre].valor += p.cantidad;
    return acc;
  }, {})).sort((a, b) => b.valor - a.valor);
  const categorias = ['fruta', 'hortaliza', 'procesado'].map((c) => ({
    etiqueta: capitalizar(c), valor: productos.filter((p) => p.categoria === c).length, tono: { fruta: 'acento', hortaliza: 'exito', procesado: 'info' }[c],
  }));
  return `
    <section class="resumen">
      ${indicador('Pedidos por producir', pedidos.length, 'fabrica', 'aviso', 'pedidos.html')}
      ${indicador('Unidades pendientes', numero(pedidos.reduce((s, p) => s + p.cantidad, 0)), 'productos', 'acento')}
      ${indicador('Productos en catálogo', productos.length, 'hoja', 'exito', 'productos.html')}
    </section>
    <div class="rejilla rejilla--2-1">
      <section class="tarjeta">
        <header class="tarjeta__encabezado"><div><h2>Producción pendiente por producto</h2><p>Unidades de los pedidos en estado recibido</p></div></header>
        ${pendiente.length ? barras(pendiente) : '<div class="estado-vacio"><p>No hay pedidos pendientes de producción.</p></div>'}
      </section>
      <section class="tarjeta">
        <header class="tarjeta__encabezado"><div><h2>Catálogo por categoría</h2></div>
          <a class="boton boton--secundario" href="productos.html">Gestionar ${icono('flecha')}</a></header>
        ${barras(categorias)}
      </section>
    </div>`;
}

const PANELES = { administrador: panelAdministrador, comercial: panelComercial, produccion: panelProduccion };

async function iniciar() {
  const usuario = montarLayout('inicio');
  if (!usuario) return;
  const hoyTexto = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  document.querySelector('#saludo').innerHTML = `
    <div><p class="encabezado-pagina__ante">${capitalizar(hoyTexto)}</p>
      <h1>${saludo()}, ${html(usuario.nombre.split(' ')[0])}</h1>
      <p>${html(ROLES[usuario.rol]?.descripcion ?? '')}.</p></div>
    <span class="etiqueta etiqueta--primario etiqueta--grande">${html(ROLES[usuario.rol]?.nombre ?? usuario.rol)}</span>`;
  panel.innerHTML = '<div class="resumen">' + '<div class="indicador"><span class="esqueleto esqueleto--bloque"></span></div>'.repeat(4) + '</div>';
  try {
    panel.innerHTML = await PANELES[usuario.rol]();
  } catch (error) {
    panel.innerHTML = `<div class="estado-vacio estado-vacio--error">${icono('alerta', 'icono icono--grande')}<h3>No se pudo cargar el panel</h3><p>${html(error.message)}</p></div>`;
  }
}

iniciar();
