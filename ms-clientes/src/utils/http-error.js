// Error con código de estado HTTP. La capa de servicio lo lanza
// y el manejador de errores de app.js lo convierte en respuesta JSON.
class HttpError extends Error {
  constructor(status, message, detalles) {
    super(message);
    this.status = status;
    this.detalles = detalles;
  }
}

module.exports = HttpError;
