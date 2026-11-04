// =====================================================================
// SEGURIDAD (middleware)
// IMPORTANTE: este archivo debe ser IDÉNTICO al src/middlewares/auth.js
// de ms-usuarios que entrega la docente. Si el de la docente es distinto,
// cópienlo encima de este sin cambios.
//
// verificarToken: exige un token JWT válido (401 si falta, es inválido o venció)
//                 y deja los datos del usuario en req.usuario.
// requiereRol(...): deja pasar solo los roles indicados (403 para los demás).
// =====================================================================
const jwt = require('jsonwebtoken');
const HttpError = require('../utils/http-error');

function verificarToken(req, res, next) {
  const [tipo, token] = (req.headers.authorization || '').split(' ');
  if (tipo !== 'Bearer' || !token) {
    return next(new HttpError(401, 'Se requiere un token de acceso'));
  }
  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (error) {
    return next(new HttpError(401, 'Token inválido o vencido'));
  }
}

function requiereRol(...roles) {
  return (req, res, next) => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      return next(new HttpError(403, 'Su rol no tiene permiso para esta operación'));
    }
    return next();
  };
}

module.exports = { verificarToken, requiereRol };
