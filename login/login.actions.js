const jwt = require('jsonwebtoken');
require('dotenv').config();
// Clave secreta y tiempo de expiración para el token JWT
const SECRET_KEY = process.env.SECRET_KEY; // Cambia a algo seguro
const EXPIRATION_TIME = '5h'; // Token expira en 1 hora

// Función para crear el token JWT
function crearTokenJWT(usuarioId) {
  const payload = {
    userId: usuarioId, // El ID del usuario
  };

  // Firma el token con el secreto y el tiempo de expiración
  return jwt.sign(payload, SECRET_KEY, { expiresIn: EXPIRATION_TIME });
}


function verificarTokenJWT(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Suponiendo que el token viene como 'Bearer <token>'

  if (!token) {
      return res.status(403).json({ error: 'Ingrese un token' }); // No autorizado
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
      if (err) {
          return res.status(401).json({ error: 'Token inválido, no autorizado' }); // Prohibido
      }
      req.userId = user.userId; // Puedes adjuntar la información del usuario al objeto `req`
      next(); // Continua con la siguiente función middleware o ruta
  });
}
module.exports = {
  crearTokenJWT,
    verificarTokenJWT
};