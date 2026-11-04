// =====================================================================
// CAPA DE MODELO (entidad)
// Define qué campos tiene un Cliente y qué reglas deben cumplir.
// No sabe nada de HTTP ni de bases de datos.
// =====================================================================

// Valores y formatos permitidos (los mismos del contrato de la API)
const TIPOS = ['distribuidor', 'comercio'];
const NIT_VALIDO = /^\d{6,10}-\d$/;     // ej.: 900123456-7 (número + dígito de verificación)
const TELEFONO_VALIDO = /^\d{7,10}$/;   // solo dígitos, de 7 a 10

// Devuelve una lista de errores de validación (vacía si todo está bien)
function validarCliente(datos) {
  const errores = [];
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
    return ['Se esperaba un objeto JSON con los datos del cliente'];
  }
  if (typeof datos.nombre !== 'string' || datos.nombre.trim() === '') {
    errores.push('nombre es obligatorio');
  }
  if (typeof datos.nit !== 'string' || !NIT_VALIDO.test(datos.nit.trim())) {
    errores.push('nit es obligatorio y debe tener el formato 900123456-7');
  }
  if (typeof datos.ciudad !== 'string' || datos.ciudad.trim() === '') {
    errores.push('ciudad es obligatoria');
  }
  if (typeof datos.telefono !== 'string' || !TELEFONO_VALIDO.test(datos.telefono.trim())) {
    errores.push('telefono es obligatorio y debe tener de 7 a 10 dígitos');
  }
  if (!TIPOS.includes(datos.tipo)) {
    errores.push(`tipo debe ser uno de: ${TIPOS.join(', ')}`);
  }
  return errores;
}

// Construye un cliente "limpio" solo con los campos permitidos
function construirCliente(datos) {
  return {
    nombre: datos.nombre.trim(),
    nit: datos.nit.trim(),
    ciudad: datos.ciudad.trim(),
    telefono: datos.telefono.trim(),
    tipo: datos.tipo,
  };
}

module.exports = { validarCliente, construirCliente };
