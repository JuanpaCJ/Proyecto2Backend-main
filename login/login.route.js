const express = require('express');
const bcrypt = require('bcrypt'); // Para comparar la contraseña
const jwt = require('jsonwebtoken'); // Para crear el token JWT
const Usuario = require('../usuario/usuario.model'); // Modelo de usuario
const {crearTokenJWT}= require('./login.actions'); // Función para crear tokens

const router = express.Router();

// Endpoint POST para autenticar al usuario y crear el token JWT
router.post('/', async (req, res) => {
  try {
    const { email, password } = req.body; // Obtener credenciales del cuerpo de la solicitud

    // Encontrar al usuario por correo electrónico
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' }); // Error si el usuario no existe
    }

    // Comparar la contraseña proporcionada con la almacenada (hash)
    const passwordMatch = await bcrypt.compare(password, usuario.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' }); // Error si la contraseña no coincide
    }

    // Si la contraseña es correcta, crear el token JWT
    const token = crearTokenJWT(usuario._id); // Crear el token con el ID del usuario

    res.status(200).json({ token }); // Devolver el token en la respuesta
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' }); // Manejo de errores
  }
});

module.exports = router;
