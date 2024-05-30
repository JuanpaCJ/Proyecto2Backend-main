const express = require('express');
const router = express.Router();
const { readUsuario, createUsuario, updateUsuario, deleteUsuario } = require("./usuario.controller");
const { respondWithError } = require('../utils/functions');
const { verificarTokenJWT } = require('../login/login.actions'); // Función para crear tokens

async function GetUsuariosId(req, res) {
    try {
        const resultadosBusqueda = await readUsuario(req.params.id, req.userId);
        res.status(200).json({ resultadosBusqueda });
    } catch (e) {
        const errorObj = JSON.parse(e.message);
        const statusCode = Number(errorObj.code) || 500;
        res.status(statusCode).json({ error: errorObj.msg });
    }
}

async function PostUsuario(req, res) {
    try {
        const usuarioCreado = await createUsuario(req.body);
        res.status(200).json({
            mensaje: 'Usuario creado exitosamente. 👍',
            usuario: usuarioCreado,
        });
    } catch (error) {
        console.log(error);
        try {
            const errorObj = JSON.parse(error.message);
            const statusCode = Number(errorObj.code) || 500;
            res.status(statusCode).json({ error: errorObj.msg });
        } catch (jsonError) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

async function PatchUsuarios(req, res) {
    try {
        await updateUsuario(req.body, req.userId);
        res.status(200).json({ mensaje: "Usuario modificado. 👍" });
    } catch (e) {
        console.log(e);
        const errorObj = JSON.parse(e.message);
        const statusCode = Number(errorObj.code) || 500;
        res.status(statusCode).json({ error: errorObj.msg });
    }
}

async function DeleteUsuarios(req, res) {
    try {
        await deleteUsuario(req.params.id, req.userId);
        res.status(200).json({ mensaje: "Usuario eliminado. 👍" });
    } catch (e) {
        const errorObj = JSON.parse(e.message);
        const statusCode = Number(errorObj.code) || 500;
        res.status(statusCode).json({ error: errorObj.msg });
    }
}

router.get("/:id", verificarTokenJWT, GetUsuariosId);
router.post("/", PostUsuario);
router.patch("/", verificarTokenJWT, PatchUsuarios);
router.delete("/:id", verificarTokenJWT, DeleteUsuarios);

module.exports = router;
