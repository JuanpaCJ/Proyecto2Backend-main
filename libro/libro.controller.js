const { throwCustomError } = require("../utils/functions");
const { createLibroMongo, getLibroMongo, getLibrosMongo, updateLibroMongo, softDeleteLibroMongo } = require("./libro.actions");
const Libro = require("./libro.model")

async function readLibroConFiltros(query) {
    const { genero, fechaPublicacion, editorial, titulo, autor, todo, ...resto } = query;

    if (Object.keys(resto).length > 0) {
        throw new Error(JSON.stringify({code: 400, msg:"No puedes filtrar por eso"}));
    }
    const { todo: todito, ...filtros } = query;
    var resultadosBusqueda;
    if (todo === "true") {
        resultadosBusqueda = await getLibrosMongo(filtros);

    } else {
        resultadosBusqueda = await getLibrosMongo({ ...filtros, isDeleted: false });
    }

    return resultadosBusqueda;
}
async function readLibro(id) {
    const resultadosBusqueda = await getLibroMongo(id, true);
    return resultadosBusqueda;
}

async function createLibro(datos) {
    // hacer llamado a base de datos con el filtro de tipo
    const LibroCreado = await createLibroMongo(datos);

    return LibroCreado;
}


async function updateLibro(datos, userId) {
    const { _id, ...cambios } = datos;
    const libro = await Libro.findById(_id);
    if (!libro) {
        throw new Error(JSON.stringify({code: 404, msg:'El libro no existe'}));
    }
    const dueño = libro.vendedor.toHexString();
    if (dueño !== userId) {
        throw new Error(JSON.stringify({code: 403, msg:'Usted no es el dueño de este libro'}));
    } else {
        const LibroCreado = await updateLibroMongo(_id, cambios);
        return LibroCreado;

    }

}
async function deleteLibro(id, userId) {

    const libro = await getLibroMongo(id, true);
    if (!libro) {
        throw new Error(JSON.stringify({code: 404, msg:'Libro no encontrado'}));
    } else {
        dueño = libro.vendedor.toHexString();
        if (dueño !== userId) {
            throw new Error(JSON.stringify({code: 403, msg:'Usted no es el dueño de este libro, no lo puede eliminar'}));
        }
    }
    // Usa `await` para asegurarte de que el error se propague adecuadamente
    const libroEliminado = await softDeleteLibroMongo(id, userId);

    return libroEliminado; // Devuelve el libro eliminado

}
module.exports = {
    readLibroConFiltros,
    readLibro,
    createLibro,
    updateLibro,
    deleteLibro
}