const request = require("supertest");
const express = require("express");
jest.mock('../usuario/usuario.controller.js');
jest.mock('../login/login.actions', () => ({
    verificarTokenJWT: (req, res, next) => {
        req.userId = 1; // Asignar un valor de userId por defecto para los tests
        next();
    }
}));

const usuarioRuta = require("../usuario/usuario.route.js");
const { createUsuario, readUsuario, updateUsuario, deleteUsuario } = require("../usuario/usuario.controller.js");

// Crear una instancia de la aplicación Express
const app = express();
app.use(express.json());
app.use("/usuarios", usuarioRuta);

describe("Pruebas de rutas de usuario", () => {
    test("Crear un usuario - válido", async () => {
        const test_body = { nombre: "Rafael", email: "rafael@gmail.com", password: "123", direccion: "calle 25", telefono: "3053813566", isDeleted: false };

        createUsuario.mockImplementation(() => {
            return Promise.resolve(1);
        });

        const { status, body } = await request(app)
            .post("/usuarios")
            .send(test_body)
            .set("Accept", "application/json");

        expect(status).toBe(200);
        expect(body).toBeDefined();
        expect(body.mensaje).toBe("Usuario creado exitosamente. 👍");
    });

    test("Crear un usuario - inválido", async () => {
        const invalid_body = { nombre: "Rafael" }; // Datos incompletos

        createUsuario.mockImplementation(() => {
            return Promise.reject(new Error(JSON.stringify({ code: 400, msg: "Datos de usuario inválidos" })));
        });

        const { status, body } = await request(app)
            .post("/usuarios")
            .send(invalid_body)
            .set("Accept", "application/json");

        expect(status).toBe(400);
        expect(body).toBeDefined();
        expect(body.error).toBe("Datos de usuario inválidos");
    });

    test("Leer un usuario por ID - válido", async () => {
        const usuarioId = 1;
        const mockUsuario = { id: usuarioId, nombre: "Rafael", email: "rafael@gmail.com" };

        readUsuario.mockImplementation((id, userId) => {
            if (id == usuarioId && userId === 1) {
                return Promise.resolve(mockUsuario);
            } else {
                return Promise.reject(new Error(JSON.stringify({ code: 404, msg: "Usuario no encontrado" })));
            }
        });

        const { status, body } = await request(app)
            .get(`/usuarios/${usuarioId}`)
            .set("Accept", "application/json");

        expect(status).toBe(200);
        expect(body.resultadosBusqueda).toEqual(mockUsuario);
    });

    test("Leer un usuario por ID - inválido", async () => {
        const usuarioId = 999; // ID no existente

        readUsuario.mockImplementation((id, userId) => {
            return Promise.reject(new Error(JSON.stringify({ code: 404, msg: "Usuario no encontrado" })));
        });

        const { status, body } = await request(app)
            .get(`/usuarios/${usuarioId}`)
            .set("Accept", "application/json");

        expect(status).toBe(404);
        expect(body).toBeDefined();
        expect(body.error).toBe("Usuario no encontrado");
    });

    test("Actualizar un usuario - válido", async () => {
        const test_body = { id: 1, nombre: "Rafael actualizado", email: "rafael_actualizado@gmail.com" };

        updateUsuario.mockImplementation((body, userId) => {
            if (body.id === 1 && userId === 1) {
                return Promise.resolve();
            } else {
                return Promise.reject(new Error(JSON.stringify({ code: 400, msg: "Error al actualizar usuario" })));
            }
        });

        const { status, body } = await request(app)
            .patch("/usuarios")
            .send(test_body)
            .set("Accept", "application/json");

        expect(status).toBe(200);
        expect(body.mensaje).toBe("Usuario modificado. 👍");
    });

    test("Actualizar un usuario - inválido", async () => {
        const invalid_body = { id: 999, nombre: "Rafael actualizado" }; // ID no existente

        updateUsuario.mockImplementation(() => {
            return Promise.reject(new Error(JSON.stringify({ code: 400, msg: "Error al actualizar usuario" })));
        });

        const { status, body } = await request(app)
            .patch("/usuarios")
            .send(invalid_body)
            .set("Accept", "application/json");

        expect(status).toBe(400);
        expect(body).toBeDefined();
        expect(body.error).toBe("Error al actualizar usuario");
    });

    test("Eliminar un usuario - válido", async () => {
        const usuarioId = 1;

        deleteUsuario.mockImplementation((id, userId) => {
            if (id == usuarioId && userId === 1) {
                return Promise.resolve();
            } else {
                return Promise.reject(new Error(JSON.stringify({ code: 400, msg: "Error al eliminar usuario" })));
            }
        });

        const { status, body } = await request(app)
            .delete(`/usuarios/${usuarioId}`)
            .set("Accept", "application/json");

        expect(status).toBe(200);
        expect(body.mensaje).toBe("Usuario eliminado. 👍");
    });

    test("Eliminar un usuario - inválido", async () => {
        const usuarioId = 999; // ID no existente

        deleteUsuario.mockImplementation(() => {
            return Promise.reject(new Error(JSON.stringify({ code: 400, msg: "Error al eliminar usuario" })));
        });

        const { status, body } = await request(app)
            .delete(`/usuarios/${usuarioId}`)
            .set("Accept", "application/json");

        expect(status).toBe(400);
        expect(body).toBeDefined();
        expect(body.error).toBe("Error al eliminar usuario");
    });
});
