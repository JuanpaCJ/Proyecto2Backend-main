const { throwCustomError } = require("../utils/functions");
const { createUsuarioMongo, getUsuarioMongo, getUsuariosMongo, updateUsuarioMongo, softDeleteUsuarioMongo } = require("./usuario.actions");
const Usuario = require("./usuario.model")


async function readUsuario(id, userId) {

  if (id !== userId) {
    throw new Error(JSON.stringify({code: 403, msg:'Usted no es el dueño de esta cuenta, no la puede ver'}));
  }
  const resultadosBusqueda = await getUsuarioMongo(id);
  return resultadosBusqueda;
}

async function createUsuario(datos) {

  // hacer llamado a base de datos con el filtro de tipo
  const UsuarioCreado = await createUsuarioMongo(datos);

  return UsuarioCreado;
}


async function updateUsuario(datos, userId) {
  const { _id, ...cambios } = datos;
  const usuario = await Usuario.findById(_id);
  if (!usuario) {
    throw new Error(JSON.stringify({code: 404, msg:"Usuario no existe"}));
  }
  if (_id !== userId) {
    throw new Error(JSON.stringify({code: 403, msg:'Esta no es su cuenta, no puede modificarla'}));
  }
  // hacer llamado a base de datos con el filtro de tipo
  const UsuarioCreado = await updateUsuarioMongo(_id, cambios);

  return UsuarioCreado;
}
async function deleteUsuario(id, userId) {

  const usuario = await getUsuarioMongo(id);

  if (!usuario) {
    throw new Error(JSON.stringify({code: 404, msg:'Usuario no encontrado'}));
  } else {

    if (id !== userId) {
      throw new Error(JSON.stringify({code: 403, msg:'Usted no es el dueño de esta cuenta, no la puede eliminar'}));
    }
  }

  // Usa `await` para asegurarte de que el error se propague adecuadamente
  const usuarioEliminado = await softDeleteUsuarioMongo(id);

  return usuarioEliminado; // Devuelve el usuario eliminado

}
module.exports = {

  readUsuario,
  createUsuario,
  updateUsuario,
  deleteUsuario
}