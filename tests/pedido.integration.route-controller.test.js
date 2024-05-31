const request = require("supertest");
const express = require("express");

const {
    readPedidoConFiltros,
    readPedido,
    createPedido,
    updatePedido,
    deletePedido,
  } = require('../pedido/pedido.controller.js');
const {
    createPedidoMongo,
    getPedidoMongo,
    getPedidosMongo,
    updatePedidoMongo,
    softDeletePedidoMongo,
} = require('../pedido/pedido.actions.js');
const {
    getLibroMongo,
    updateLibroMongo,
} = require('../libro/libro.actions');

jest.mock('../libro/libro.actions');
jest.mock('../pedido/pedido.actions');
jest.mock('../libro/libro.model');
jest.mock('../pedido/pedido.model');
jest.mock('../login/login.actions', () => ({
    verificarTokenJWT: (req, res, next) => {
        req.userId = 1; // Asignar un valor de userId por defecto para los tests
        next();
    }
}));

const Libro = require('../libro/libro.model.js');
const Pedido = require('../pedido/pedido.model.js');

const app = express();
app.use(express.json());
const pedidoRuta = require("../pedido/pedido.route.js");
app.use("/pedido", pedidoRuta);

describe("Pruebas de integración de pedido ruta-controlador", () => {

    describe("create pedido", () => {

        test("Crear un libro - válido", async () => {
            const test_body = {idComprador:1, libros: [{ titulo: "100 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 500},{ titulo: "200 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 1500}]};
            
            const libro = { vendedor: { toHexString: () => 'vendedor1' } };
  
            getLibroMongo.mockResolvedValue(libro);
            Libro.findById.mockResolvedValue(libro);
            createPedidoMongo.mockResolvedValue(test_body);
            
            const { status, body } = await request(app)
            .post("/pedido")
            .send(test_body)
            .set("Accept", "application/json");

            expect(status).toBe(200);
            expect(body).toBeDefined();
            expect(body.mensaje).toBe("Pedido creado exitosamente. 👍");
            
        });
        test("Crear un libro - inválido", async () => {
            const test_body = {idComprador:1, libros: [{ titulo: "100 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 500},{ titulo: "200 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 1500}]};
            
            const libro1 = { vendedor: { toHexString: () => 'vendedor1' } };
            const libro2 = { vendedor: { toHexString: () => 'vendedor2' } };
  
            getLibroMongo
                .mockResolvedValueOnce(libro1)
                .mockResolvedValueOnce(libro2);
            Libro.findById
                .mockResolvedValueOnce(libro1)
                .mockResolvedValueOnce(libro2);
            createPedidoMongo.mockResolvedValue(test_body);
            
            const { status, body } = await request(app)
            .post("/pedido")
            .send(test_body)
            .set("Accept", "application/json");

            expect(status).toBe(403);
            expect(body).toBeDefined();
            expect(body.error).toBe("Libros de vendedores diferentes");
            
        });


    });

    describe("Read pedido", () => {

        test("leer un libro - válido", async () => {
            const pedidoId = 1;
            const mockPedido = {idComprador:1, libros: [{ titulo: "100 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 500},{ titulo: "200 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 1500}]};

  
  
            getPedidoMongo.mockResolvedValue(mockPedido);   
            
            const { status, body } = await request(app)
            .get(`/pedido/${pedidoId}`)
            .set("Accept", "application/json");

            expect(status).toBe(200);
            expect(body.resultadosBusqueda).toEqual(mockPedido);
            
        });

        test("leer un libro - inválido", async () => {
            const pedidoId = 1;
            const mockPedido = {idComprador:1, libros: [{ titulo: "100 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 500},{ titulo: "200 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 1500}]};

  
  
            getPedidoMongo.mockRejectedValue(new Error(JSON.stringify({ code: 404, msg: 'Pedido no existe' })));
            
            const { status, body } = await request(app)
            .get(`/pedido/${pedidoId}`)
            .set("Accept", "application/json");

            expect(status).toBe(404);
            expect(body).toBeDefined();
            expect(body.error).toEqual('Pedido no existe');
            
        });

    });
});