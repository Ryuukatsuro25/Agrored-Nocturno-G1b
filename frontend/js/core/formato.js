// =====================================================================
// UTILIDADES DE FORMATO (moneda, fechas, texto seguro)
// =====================================================================
const pesosFmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const numeroFmt = new Intl.NumberFormat('es-CO');
const fechaFmt = new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });

export const pesos = (valor) => pesosFmt.format(Number(valor) || 0);
export const numero = (valor) => numeroFmt.format(Number(valor) || 0);
export const fecha = (texto) => (texto ? fechaFmt.format(new Date(`${texto}T00:00:00Z`)) : '—');
export const hoy = () => new Date().toLocaleDateString('en-CA');   // AAAA-MM-DD en hora local

export const capitalizar = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : '');
export const iniciales = (nombre = '') =>
  nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');

// Escapa el texto antes de insertarlo como HTML (evita inyectar etiquetas)
export function html(texto) {
  return String(texto ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

// Quita tildes y pasa a minúsculas: sirve para buscar "bogota" y encontrar "Bogotá"
export const normalizar = (t) => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
