// =====================================================================
// CAPA DE PRESENTACIÓN (rutas)
// Asocia cada método HTTP + URI con una función del controlador y aplica
// la tabla de permisos del Taller 1 para Clientes:
//   consultan (GET): cualquier usuario autenticado
//   crean, modifican y eliminan: administrador y comercial
// =====================================================================
const { Router } = require('express');
const controller = require('../controllers/clientes.controller');
const { verificarToken, requiereRol } = require('../middlewares/auth');

const router = Router();

router.use(verificarToken);                                                          // todas exigen token (401)

router.get('/', controller.listar);                                                  // listar, filtrar, ?ids=
router.get('/:id', controller.obtener);                                              // obtener por id
router.post('/', requiereRol('administrador', 'comercial'), controller.crear);       // crear (403 otros roles)
router.put('/:id', requiereRol('administrador', 'comercial'), controller.actualizar);
router.delete('/:id', requiereRol('administrador', 'comercial'), controller.eliminar);

module.exports = router;
