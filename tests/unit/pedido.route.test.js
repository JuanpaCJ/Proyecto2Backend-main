const request = require("supertest");
const express = require("express");
jest.mock('../../pedido/pedido.controller.js');
jest.mock('../../login/login.actions', () => ({
    verificarTokenJWT: (req, res, next) => {
        req.userId = 1; // Asignar un valor de userId por defecto para los tests
        next();
    }
}));

const pedidoRuta = require("../../pedido/pedido.route.js");
const { createPedido, readPedido, updatePedido, deletePedido, readPedidoConFiltros } = require("../../pedido/pedido.controller.js");

// Crear una instancia de la aplicación Express
const app = express();
app.use(express.json());
app.use("/pedido", pedidoRuta);

describe("Pruebas de rutas de pedido", () => {
    test("Crear un pedido - válido", async () => {
        const test_body = {idComprador:1, libros: [{ titulo: "100 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 500},{ titulo: "200 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 1500}]};

        createPedido.mockImplementation(() => {
            return Promise.resolve(1);
        });

        const { status, body } = await request(app)
            .post("/pedido")
            .send(test_body)
            .set("Accept", "application/json");

        expect(status).toBe(200);
        expect(body).toBeDefined();
        expect(body.mensaje).toBe("Pedido creado exitosamente. 👍");
    });

    test("Crear un pedido - inválido", async () => {
        const invalid_body = { nombre: "Rafael" }; // Datos incompletos

        createPedido.mockImplementation(() => {
            return Promise.reject(new Error(JSON.stringify({ code: 400, msg: "Datos de pedido inválidos" })));
        });

        const { status, body } = await request(app)
            .post("/pedido")
            .send(invalid_body)
            .set("Accept", "application/json");

        expect(status).toBe(400);
        expect(body).toBeDefined();
        expect(body.error).toBe("Datos de pedido inválidos");
    });

    test("Leer un pedido por ID - válido", async () => {
        const pedidoId = 1;
        const mockPedido = {idComprador:1, libros: [{ titulo: "100 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 500},{ titulo: "200 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 1500}]};


        readPedido.mockImplementation((id) => {
            if (id == pedidoId ) {
                return Promise.resolve(mockPedido);
            } else {
                return Promise.reject(new Error(JSON.stringify({ code: 404, msg: "pedido no encontrado" })));
            }
        });

        const { status, body } = await request(app)
            .get(`/pedido/${pedidoId}`)
            .set("Accept", "application/json");

        expect(status).toBe(200);
        expect(body.resultadosBusqueda).toEqual(mockPedido);
    });
    test("Leer varios pedidos", async () => {
        const mockPedido = [
            {idComprador:1, libros: [{ titulo: "100 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 500},{ titulo: "200 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 1500}]},
            {idComprador:1, libros: [{ titulo: "300 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 500},{ titulo: "400 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 1500}]},
        ];

        readPedidoConFiltros.mockImplementation(() => {
            return Promise.resolve(mockPedido);
        });

        const { status, body } = await request(app)
            .get("/pedido")
            .set("Accept", "application/json");

        expect(status).toBe(200);
        expect(body).toBeDefined();
        expect(body.resultadosBusqueda).toEqual(mockPedido); // Convert received response into an array before comparing
    }, 10000);

    test("Actualizar un pedido - válido", async () => {
        const test_body = {idComprador:1, libros: [{ titulo: "100 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 500},{ titulo: "200 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 1500}]};

        updatePedido.mockImplementation((body, userId) => {
            if (body.idComprador == 1 && userId === 1) {
                return Promise.resolve();
            } else {
                return Promise.reject(new Error(JSON.stringify({ code: 400, msg: "Error al actualizar pedido" })));
            }
        });

        const { status, body } = await request(app)
            .patch("/pedido")
            .send(test_body)
            .set("Accept", "application/json");

        expect(status).toBe(200);
        expect(body.mensaje).toBe("Pedido modificado. 👍");
    });

    test("Actualizar un pedido - inválido", async () => {
        const invalid_body = {idComprador:999, libros: [{ titulo: "100 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 500},{ titulo: "200 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 1500}]};

        updatePedido.mockImplementation(() => {
            return Promise.reject(new Error(JSON.stringify({ code: 400, msg: "Error al actualizar pedido" })));
        });

        const { status, body } = await request(app)
            .patch("/pedido")
            .send(invalid_body)
            .set("Accept", "application/json");

        expect(status).toBe(400);
        expect(body).toBeDefined();
        expect(body.error).toBe("Error al actualizar pedido");
    });

    test("Eliminar un pedido - válido", async () => {
        const pedidoId = 1;

        deletePedido.mockImplementation((id, userId) => {
            if (id == pedidoId && userId === 1) {
                return Promise.resolve();
            } else {
                return Promise.reject(new Error(JSON.stringify({ code: 400, msg: "Error al eliminar pedido" })));
            }
        });

        const { status, body } = await request(app)
            .delete(`/pedido/${pedidoId}`)
            .set("Accept", "application/json");

        expect(status).toBe(200);
        expect(body.mensaje).toBe("Pedido eliminado. 👍");
    });

    test("Eliminar un pedido - inválido", async () => {
        const pedidoId = 999; // ID no existente

        deletePedido.mockImplementation(() => {
            return Promise.reject(new Error(JSON.stringify({ code: 400, msg: "Error al eliminar pedido" })));
        });

        const { status, body } = await request(app)
            .delete(`/pedido/${pedidoId}`)
            .set("Accept", "application/json");

        expect(status).toBe(400);
        expect(body).toBeDefined();
        expect(body.error).toBe("Error al eliminar pedido");
    });
});
