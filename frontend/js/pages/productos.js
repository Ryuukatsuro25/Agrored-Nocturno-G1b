// =====================================================================
// PANTALLA DE PRODUCTOS · Responsable: Juan Pablo Rueda Sánchez (ms-productos, puerto 3002)
// Catálogo que AgroRed produce y comercializa.
// Contrato: { id, nombre, categoria, unidad, precio }
// Regla de negocio: el nombre es único sin distinguir mayúsculas (409).
// =====================================================================
import { montarLayout } from '../ui/layout.js';
import { crearPaginaCrud } from '../ui/crud.js';
import { html, pesos, capitalizar } from '../core/formato.js';

const CATEGORIAS = [
  { valor: 'fruta', texto: 'Fruta' },
  { valor: 'hortaliza', texto: 'Hortaliza' },
  { valor: 'procesado', texto: 'Procesado' },
];
const UNIDADES = [
  { valor: 'kg', texto: 'Kilogramo (kg)' },
  { valor: 'caja', texto: 'Caja' },
];
const TONO = { fruta: 'acento', hortaliza: 'exito', procesado: 'info' };

if (montarLayout('productos', 'productos')) {
  crearPaginaCrud({
    recurso: 'productos',
    singular: 'producto',
    genero: 'm',
    nombreDe: (p) => p.nombre,

    // Mismas validaciones del modelo de ms-productos (src/models/producto.js)
    campos: () => [
      { nombre: 'nombre', etiqueta: 'Nombre del producto', tipo: 'texto', requerido: true, ancho: 'completo', placeholder: 'Mango Tommy' },
      { nombre: 'categoria', etiqueta: 'Categoría', tipo: 'lista', requerido: true, opciones: CATEGORIAS },
      { nombre: 'unidad', etiqueta: 'Unidad de venta', tipo: 'lista', requerido: true, opciones: UNIDADES },
      { nombre: 'precio', etiqueta: 'Precio por unidad (COP)', tipo: 'numero', requerido: true, min: 1,
        mensaje: 'El precio debe ser mayor que 0', ancho: 'completo', ayuda: 'Valor en pesos colombianos, sin puntos.' },
    ],

    columnas: [
      { campo: 'id', titulo: 'ID', celda: (p) => `<span class="texto-tenue">#${p.id}</span>` },
      { campo: 'nombre', titulo: 'Producto', celda: (p) => `<strong>${html(p.nombre)}</strong>` },
      { campo: 'categoria', titulo: 'Categoría', texto: (p) => capitalizar(p.categoria),
        celda: (p) => `<span class="etiqueta etiqueta--${TONO[p.categoria]}">${capitalizar(p.categoria)}</span>` },
      { campo: 'unidad', titulo: 'Unidad' },
      { campo: 'precio', titulo: 'Precio', alinear: 'derecha', celda: (p) => `<span class="numero">${pesos(p.precio)}</span>` },
    ],

    // GET /productos?categoria=fruta (filtro implementado en ms-productos)
    filtros: [
      { campo: 'categoria', etiqueta: 'Categoría', opciones: CATEGORIAS },
      { campo: 'unidad', etiqueta: 'Unidad', opciones: UNIDADES },
    ],
    buscarEn: [(p) => p.nombre, (p) => p.categoria],

    resumen: (lista) => {
      const promedio = lista.length ? lista.reduce((s, p) => s + p.precio, 0) / lista.length : 0;
      return [
        { etiqueta: 'Productos', valor: lista.length, icono: 'productos', tono: 'primario' },
        { etiqueta: 'Frutas', valor: lista.filter((p) => p.categoria === 'fruta').length, icono: 'hoja', tono: 'acento' },
        { etiqueta: 'Hortalizas', valor: lista.filter((p) => p.categoria === 'hortaliza').length, icono: 'hoja', tono: 'exito' },
        { etiqueta: 'Precio promedio', valor: pesos(promedio), icono: 'dinero', tono: 'info' },
      ];
    },
  });
}
