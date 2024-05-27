const Libro = require("../libro/libro.model");
const Pedido = require("./pedido.model")

async function getPedidosMongo(filtros) {
  const cantidadPedidos = await Pedido.countDocuments(filtros);
  const PedidosFiltrados = await Pedido.find(filtros);
  return {
    resultados: PedidosFiltrados,
    cantidadPedidos: cantidadPedidos
  };
}
async function getPedidoMongo(id) {
  const pedido = await Pedido.findById(id);
  if (pedido.isDeleted) {
    throw new Error(JSON.stringify({code: 404, msg:"Pedido no existe"}));
  } else {
    return pedido;

  }
}
async function createPedidoMongo(datos) {

  const pedidoCreado = await Pedido.create(datos); // Crea el pedido con los datos proporcionados
  return pedidoCreado; // Devuelve el pedido creado

}
async function updatePedidoMongo(id, cambios) {

  const resultado = await Pedido.findByIdAndUpdate(id, cambios);
  return resultado;

}


async function softDeletePedidoMongo(id, userId) {

  // Encuentra el pedido por ID y marca isDeleted como true
  const pedidoEliminado = await Pedido.findByIdAndUpdate(
    id, // ID del pedido
    { isDeleted: true }, // Campos a actualizar
    { new: true } // Devuelve el documento actualizado
  );


  return pedidoEliminado; // Devuelve el pedido marcado como eliminado

}

module.exports = {
  getPedidosMongo,
  createPedidoMongo,
  getPedidoMongo,
  updatePedidoMongo,
  softDeletePedidoMongo
};