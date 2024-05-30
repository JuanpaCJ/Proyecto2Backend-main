const { throwCustomError } = require("../utils/functions");
const {
  createUsuarioMongo,
  getUsuarioMongo,
  getUsuariosMongo,
  updateUsuarioMongo,
  softDeleteUsuarioMongo,
} = require("./usuario.actions");
const Usuario = require("./usuario.model");

async function readUsuario(id, userId) {
  if (id !== userId) {
    throw new Error(JSON.stringify({ code: 403, msg: 'Usted no es el dueño de esta cuenta, no la puede ver' }));
  }
  const resultadosBusqueda = await getUsuarioMongo(id);
  return resultadosBusqueda;
}

async function createUsuario(userData) {
  if (!userData.password) {
      throwCustomError(400, 'Datos inválidos');
  }

  try {
      const usuario = await createUsuarioMongo(userData);
      return usuario;
  } catch (error) {
      throwCustomError(500, 'Error creando en la base de datos');
  }
}

async function updateUsuario(datos, userId) {
  const { _id, ...cambios } = datos;
  const usuario = await Usuario.findById(_id);
  if (!usuario) {
    throw new Error(JSON.stringify({ code: 404, msg: "Usuario no existe" }));
  }
  if (_id !== userId) {
    throw new Error(JSON.stringify({ code: 403, msg: 'Esta no es su cuenta, no puede modificarla' }));
  }
  const UsuarioCreado = await updateUsuarioMongo(_id, cambios);
  return UsuarioCreado;
}

async function deleteUsuario(id, userId) {
  const usuario = await getUsuarioMongo(id);
  if (!usuario) {
    throw new Error(JSON.stringify({ code: 404, msg: 'Usuario no encontrado' }));
  } else {
    if (id !== userId) {
      throw new Error(JSON.stringify({ code: 403, msg: 'Usted no es el dueño de esta cuenta, no la puede eliminar' }));
    }
  }
  const usuarioEliminado = await softDeleteUsuarioMongo(id);
  return usuarioEliminado;
}

module.exports = {
  readUsuario,
  createUsuario,
  updateUsuario,
  deleteUsuario,
};
