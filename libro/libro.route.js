const express = require('express')
const router = express.Router();
const { readLibroConFiltros, readLibro, createLibro, updateLibro, deleteLibro } = require("./libro.controller");
const { respondWithError } = require('../utils/functions');
const { verificarTokenJWT } = require('../login/login.actions'); // Función para crear tokens

async function GetLibros(req, res) {
    try {

        resultadosBusqueda = await readLibroConFiltros(req.query);

        res.status(200).json({
            ...resultadosBusqueda
        });
    } catch (e) {
        const errorObj = JSON.parse(e.message);
        res.status(errorObj.code).json({ error: errorObj.msg });
    }
}
async function GetLibrosId(req, res) {
    try {
       
        const resultadosBusqueda = await readLibro(req.params.id);
     
        res.status(200).json({
            resultadosBusqueda
        });
    } catch (e) {
    
        const errorObj = JSON.parse(e.message);
        res.status(errorObj.code).json({ error: errorObj.msg });
    }
}
async function PostLibro(req, res) {
    try {
        // Agrega el ID del usuario (vendedor) a los datos del libro
        const libroData = {
            ...req.body,
            vendedor: req.userId, // El ID del usuario autenticado
        };
        // Llamada a la función para crear el libro con el ID del vendedor
        const libroCreado = await createLibro(libroData);

        res.status(200).json({ mensaje: 'Libro creado exitosamente. 👍', libro: libroCreado }); // Respuesta exitosa
    } catch (error) {
        const errorObj = JSON.parse(error.message);
        res.status(errorObj.code).json({ error: errorObj.msg });
    }
}

async function PatchLibros(req, res) {
    try {
        // llamada a controlador con los datos
        await updateLibro(req.body, req.userId);

        res.status(200).json({
            mensaje: "Libro actualizado. 👍"
        });
    } catch (e) {
        const errorObj = JSON.parse(e.message);
        res.status(errorObj.code).json({ error: errorObj.msg });
    }
}


async function DeleteLibros(req, res) {
    try {
        // llamada a controlador con los datos
        await deleteLibro(req.params.id, req.userId);
        res.status(200).json({
            mensaje: "Libro eliminado. 👍"
        });
    } catch (e) {
        const errorObj = JSON.parse(e.message);
        res.status(errorObj.code).json({ error: errorObj.msg });
    }
}

router.get("/", GetLibros);
router.get("/:id", GetLibrosId);
router.post("/", verificarTokenJWT, PostLibro);
router.patch("/", verificarTokenJWT, PatchLibros);
router.delete("/:id", verificarTokenJWT, DeleteLibros);


module.exports = router;