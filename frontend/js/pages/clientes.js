// =====================================================================
// PANTALLA DE CLIENTES · Responsable: Juan José Osorio Reyes (ms-clientes, puerto 3003)
// Distribuidores y comercios que le compran a AgroRed.
// Contrato: { id, nombre, nit, ciudad, telefono, tipo }
// Regla de negocio: el NIT es único (el backend responde 409 si se repite).
// =====================================================================
import { montarLayout } from '../ui/layout.js';
import { crearPaginaCrud } from '../ui/crud.js';
import { html, capitalizar } from '../core/formato.js';

const TIPOS = [
  { valor: 'distribuidor', texto: 'Distribuidor' },
  { valor: 'comercio', texto: 'Comercio' },
];
const CIUDADES = ['Bogotá', 'Buenaventura', 'Cali', 'Medellín', 'Palmira', 'Popayán'];

if (montarLayout('clientes', 'clientes')) {
  crearPaginaCrud({
    recurso: 'clientes',
    singular: 'cliente',
    genero: 'm',
    nombreDe: (c) => c.nombre,

    // Mismas validaciones del modelo de ms-clientes (src/models/cliente.js)
    campos: () => [
      { nombre: 'nombre', etiqueta: 'Razón social', tipo: 'texto', requerido: true, ancho: 'completo', placeholder: 'Frutas del Pacífico' },
      { nombre: 'nit', etiqueta: 'NIT', tipo: 'texto', requerido: true, placeholder: '900123456-7',
        patron: /^\d{6,10}-\d$/, mensaje: 'Formato 900123456-7: número, guion y dígito de verificación' },
      { nombre: 'tipo', etiqueta: 'Tipo de cliente', tipo: 'lista', requerido: true, opciones: TIPOS },
      { nombre: 'ciudad', etiqueta: 'Ciudad', tipo: 'texto', requerido: true, placeholder: 'Cali' },
      { nombre: 'telefono', etiqueta: 'Teléfono', tipo: 'texto', requerido: true, placeholder: '6023334455',
        patron: /^\d{7,10}$/, mensaje: 'Solo dígitos, de 7 a 10' },
    ],

    columnas: [
      { campo: 'id', titulo: 'ID', celda: (c) => `<span class="texto-tenue">#${c.id}</span>` },
      { campo: 'nombre', titulo: 'Cliente', celda: (c) => `<strong>${html(c.nombre)}</strong>` },
      { campo: 'nit', titulo: 'NIT', celda: (c) => `<code>${html(c.nit)}</code>` },
      { campo: 'ciudad', titulo: 'Ciudad' },
      { campo: 'telefono', titulo: 'Teléfono' },
      { campo: 'tipo', titulo: 'Tipo', texto: (c) => capitalizar(c.tipo),
        celda: (c) => `<span class="etiqueta etiqueta--${c.tipo === 'distribuidor' ? 'info' : 'neutra'}">${capitalizar(c.tipo)}</span>` },
    ],

    // Filtros que viajan a la API: GET /clientes?tipo=comercio&ciudad=Cali
    filtros: [
      { campo: 'tipo', etiqueta: 'Tipo', opciones: TIPOS },
      { campo: 'ciudad', etiqueta: 'Ciudad', opciones: CIUDADES.map((c) => ({ valor: c, texto: c })) },
    ],
    buscarEn: [(c) => c.nombre, (c) => c.nit, (c) => c.ciudad, (c) => c.telefono],

    resumen: (lista) => [
      { etiqueta: 'Clientes', valor: lista.length, icono: 'clientes', tono: 'primario' },
      { etiqueta: 'Distribuidores', valor: lista.filter((c) => c.tipo === 'distribuidor').length, icono: 'camion', tono: 'info' },
      { etiqueta: 'Comercios', valor: lista.filter((c) => c.tipo === 'comercio').length, icono: 'clientes', tono: 'acento' },
      { etiqueta: 'Ciudades', valor: new Set(lista.map((c) => c.ciudad)).size, icono: 'ubicacion', tono: 'neutro' },
    ],
  });
}
