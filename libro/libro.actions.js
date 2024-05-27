const Libro = require("./libro.model")

async function getLibrosMongo(filtros) {
  const cantidadLibros = await Libro.countDocuments(filtros);
  const LibrosFiltrados = await Libro.find(filtros);
  return {
    resultados: LibrosFiltrados,
    cantidadLibros: cantidadLibros
  };
}
async function getLibroMongo(id, activate) {

  const libro = await Libro.findById(id);
  if (!libro) {
    throw new Error(JSON.stringify({code: 400, msg:"Libro no existe"}));
  } else {
    if (libro.isDeleted && activate) {
      throw new Error(JSON.stringify({code: 400, msg:"Libro no existe"}));
    }
    return libro;

  }


}
async function createLibroMongo(datos) {



  // Si el vendedor es válido, crea el libro
  const libroCreado = await Libro.create(datos); // Crea el libro con los datos proporcionados

  return libroCreado; // Devuelve el libro creado


}
async function updateLibroMongo(id, cambios) {

  const resultado = await Libro.findByIdAndUpdate(id, cambios);
  return resultado;

}


async function softDeleteLibroMongo(id, userId) {

  // Encuentra el libro por ID y marca isDeleted como true
  const libroEliminado = await Libro.findByIdAndUpdate(
    id, // ID del libro
    { isDeleted: true }, // Campos a actualizar
    { new: true } // Devuelve el documento actualizado
  );
  return libroEliminado; // Devuelve el libro marcado como eliminado

}

module.exports = {
  getLibrosMongo,
  createLibroMongo,
  getLibroMongo,
  updateLibroMongo,
  softDeleteLibroMongo
};