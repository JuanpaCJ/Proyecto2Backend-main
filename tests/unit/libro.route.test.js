const request = require("supertest");
const express = require("express");
jest.mock('../../libro/libro.controller.js');
jest.mock('../../login/login.actions', () => ({
    verificarTokenJWT: (req, res, next) => {
        req.userId = 1; // Asignar un valor de userId por defecto para los tests
        next();
    }
}));

const libroRuta = require("../../libro/libro.route.js");
const { createLibro, readLibro, updateLibro, deleteLibro, readLibroConFiltros } = require("../../libro/libro.controller.js");

// Crear una instancia de la aplicación Express
const app = express();
app.use(express.json());
app.use("/libro", libroRuta);

describe("Pruebas de rutas de libro", () => {
    test("Crear un libro - válido", async () => {
        const test_body = { titulo: "100 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 500};

        createLibro.mockImplementation(() => {
            return Promise.resolve(1);
        });

        const { status, body } = await request(app)
            .post("/libro")
            .send(test_body)
            .set("Accept", "application/json");

        expect(status).toBe(200);
        expect(body).toBeDefined();
        expect(body.mensaje).toBe("Libro creado exitosamente. 👍");
    });

    test("Crear un libro - inválido", async () => {
        const invalid_body = { nombre: "Rafael" }; // Datos incompletos

        createLibro.mockImplementation(() => {
            return Promise.reject(new Error(JSON.stringify({ code: 400, msg: "Datos de libro inválidos" })));
        });

        const { status, body } = await request(app)
            .post("/libro")
            .send(invalid_body)
            .set("Accept", "application/json");

        expect(status).toBe(400);
        expect(body).toBeDefined();
        expect(body.error).toBe("Datos de libro inválidos");
    });

    test("Leer un libro por ID - válido", async () => {
        const libroId = 1;
        const mockLibro = { titulo: "100 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 500}

        readLibro.mockImplementation((id) => {
            if (id == libroId ) {
                return Promise.resolve(mockLibro);
            } else {
                return Promise.reject(new Error(JSON.stringify({ code: 404, msg: "libro no encontrado" })));
            }
        });

        const { status, body } = await request(app)
            .get(`/libro/${libroId}`)
            .set("Accept", "application/json");

        expect(status).toBe(200);
        expect(body.resultadosBusqueda).toEqual(mockLibro);
    });
    test("Leer varios libros por ID", async () => {
        const mockLibro = [
            { titulo: "100 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 500 },
            { titulo: "200 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 1500 }
        ];

        readLibroConFiltros.mockImplementation(() => {
            return Promise.resolve(mockLibro);
        });

        const { status, body } = await request(app)
            .get("/libro")
            .set("Accept", "application/json");

        expect(status).toBe(200);
        expect(body).toBeDefined();
        expect(Object.values(body)).toEqual(mockLibro); // Convert received response into an array before comparing
    }, 10000);

    test("Actualizar un libro - válido", async () => {
        const test_body = { id: 1, nombre: "Rafael actualizado", email: "rafael_actualizado@gmail.com" };

        updateLibro.mockImplementation((body, userId) => {
            if (body.id == 1 && userId === 1) {
                return Promise.resolve();
            } else {
                return Promise.reject(new Error(JSON.stringify({ code: 400, msg: "Error al actualizar libro" })));
            }
        });

        const { status, body } = await request(app)
            .patch("/libro")
            .send(test_body)
            .set("Accept", "application/json");

        expect(status).toBe(200);
        expect(body.mensaje).toBe("Libro actualizado. 👍");
    });

    test("Actualizar un libro - inválido", async () => {
        const invalid_body = { id: 999, nombre: "Rafael actualizado" }; // ID no existente

        updateLibro.mockImplementation(() => {
            return Promise.reject(new Error(JSON.stringify({ code: 400, msg: "Error al actualizar libro" })));
        });

        const { status, body } = await request(app)
            .patch("/libro")
            .send(invalid_body)
            .set("Accept", "application/json");

        expect(status).toBe(400);
        expect(body).toBeDefined();
        expect(body.error).toBe("Error al actualizar libro");
    });

    test("Eliminar un libro - válido", async () => {
        const libroId = 1;

        deleteLibro.mockImplementation((id, userId) => {
            if (id == libroId && userId === 1) {
                return Promise.resolve();
            } else {
                return Promise.reject(new Error(JSON.stringify({ code: 400, msg: "Error al eliminar libro" })));
            }
        });

        const { status, body } = await request(app)
            .delete(`/libro/${libroId}`)
            .set("Accept", "application/json");

        expect(status).toBe(200);
        expect(body.mensaje).toBe("Libro eliminado. 👍");
    });

    test("Eliminar un libro - inválido", async () => {
        const libroId = 999; // ID no existente

        deleteLibro.mockImplementation(() => {
            return Promise.reject(new Error(JSON.stringify({ code: 400, msg: "Error al eliminar libro" })));
        });

        const { status, body } = await request(app)
            .delete(`/libro/${libroId}`)
            .set("Accept", "application/json");

        expect(status).toBe(400);
        expect(body).toBeDefined();
        expect(body.error).toBe("Error al eliminar libro");
    });
});
