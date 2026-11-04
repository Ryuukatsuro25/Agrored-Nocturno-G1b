// =====================================================================
// CONFIGURACIÓN GLOBAL DEL FRONTEND
// Es el ÚNICO archivo que se cambia en el Taller 3:
//   DATOS_DE_EJEMPLO = true  → las pantallas leen data/*.json (Taller 2)
//   DATOS_DE_EJEMPLO = false → las pantallas llaman a la API real por el gateway Apache
// =====================================================================
export const CONFIG = {
  DATOS_DE_EJEMPLO: true,
  API_URL: 'http://app.agrored.com/api',   // Apache reenvía /api/<recurso> a cada microservicio
  EMPRESA: 'AgroRed S.A.S.',
  FILAS_POR_PAGINA: 8,
};
