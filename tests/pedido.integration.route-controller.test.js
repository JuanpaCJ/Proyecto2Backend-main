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

        test("Crear un pedido - válido", async () => {
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
        test("Crear un pedido - inválido", async () => {
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

        test("leer un pedido - válido", async () => {
            const pedidoId = 1;
            const mockPedido = {idComprador:1, libros: [{ titulo: "100 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 500},{ titulo: "200 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 1500}]};

  
  
            getPedidoMongo.mockResolvedValue(mockPedido);   
            
            const { status, body } = await request(app)
            .get(`/pedido/${pedidoId}`)
            .set("Accept", "application/json");

            expect(status).toBe(200);
            expect(body.resultadosBusqueda).toEqual(mockPedido);
            
        });

        test("leer un pedido - inválido", async () => {
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

        test("leer pedidos con filtros - válido", async () => {

            const mockPedido = [
                {idComprador: { toHexString: () => 1 } , libros: [{ titulo: "100 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 500},{ titulo: "200 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 1500}]},
                {idComprador: { toHexString: () => 1 } , libros: [{ titulo: "300 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 500},{ titulo: "400 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 1500}]},
            ];
            const mockesperado = [
                {idComprador: {} , libros: [{ titulo: "100 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 500},{ titulo: "200 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 1500}]},
                {idComprador: {} , libros: [{ titulo: "300 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 500},{ titulo: "400 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 1500}]},
            ];
            const query = { estado: 'en progreso', fechainicio: '2021-01-01', fechafin: '2021-12-31' };
            const libro1 = { vendedor: { toHexString: () => '1' } };
            const libro2 = { vendedor: { toHexString: () => '2' } };
  
            getPedidosMongo.mockResolvedValue({ resultados: mockPedido });  
            getLibroMongo
            .mockResolvedValueOnce(libro1)
            .mockResolvedValueOnce(libro2);
            const { status, body } = await request(app)
            .get("/pedido")
            .query(query)
            .set("Accept", "application/json");

            expect(status).toBe(200);
            expect(body).toBeDefined();
            expect(body.resultadosBusqueda).toEqual(mockesperado);
            
        });

        test("leer pedidos con filtros - inválido", async () => {

            const mockPedido = [
                {idComprador: { toHexString: () => 1 } , libros: [{ titulo: "100 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 500},{ titulo: "200 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 1500}]},
                {idComprador: { toHexString: () => 1 } , libros: [{ titulo: "300 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 500},{ titulo: "400 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 1500}]},
            ];
            const mockesperado = [
                {idComprador: {} , libros: [{ titulo: "100 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 500},{ titulo: "200 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 1500}]},
                {idComprador: {} , libros: [{ titulo: "300 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 500},{ titulo: "400 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 1500}]},
            ];
            const query = { estado: 'en progreso', fechainicio: '2021-01-01', fechafin: '2021-12-31', novalido: 'novvalido' };
            const libro1 = { vendedor: { toHexString: () => '1' } };
            const libro2 = { vendedor: { toHexString: () => '2' } };
  
            getPedidosMongo.mockResolvedValue({ resultados: mockPedido });  
            getLibroMongo
            .mockResolvedValueOnce(libro1)
            .mockResolvedValueOnce(libro2);
            const { status, body } = await request(app)
            .get("/pedido")
            .query(query)
            .set("Accept", "application/json");

            expect(status).toBe(400);
            expect(body).toBeDefined();
            expect(body.error).toEqual('no puedes filtrar por eso');
            
        });

    });

    describe("update pedido", () => {

        test("actualizar un pedido - válido", async () => {
            const test_body = {idComprador:1, estado: 'completado' ,libros: [{ titulo: "100 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 500},{ titulo: "200 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 1500}]};
            const pedido = { _id: 'pedido1', estado: 'en progreso', libros: ['libro1'] };
            const libro = { vendedor: { toHexString: () => 1 } };
            const datos = { _id: 'pedido1', estado: 'completado' };


            getPedidoMongo.mockResolvedValue(pedido);
            Libro.findById.mockResolvedValue(libro);
            updatePedidoMongo.mockResolvedValue(datos);


            const { status, body } = await request(app)
            .patch("/pedido")
            .send(test_body)
            .set("Accept", "application/json");

            expect(status).toBe(200);
            expect(body.mensaje).toBe("Pedido modificado. 👍");
            
        });

        test("actualizar un pedido - inválido(pedido no en progreso)", async () => {
            const test_body = {idComprador:1, estado: 'completado' ,libros: [{ titulo: "100 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 500},{ titulo: "200 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 1500}]};
            const pedido = { _id: 'pedido1', estado: 'completado', libros: ['libro1'] };
            const libro = { vendedor: { toHexString: () => 1 } };
            const datos = { _id: 'pedido1', estado: 'completado' };


            getPedidoMongo.mockResolvedValue(pedido);
            Libro.findById.mockResolvedValue(libro);
            updatePedidoMongo.mockResolvedValue(datos);


            const { status, body } = await request(app)
            .patch("/pedido")
            .send(test_body)
            .set("Accept", "application/json");

            expect(status).toBe(403);
            expect(body.error).toBe("No puede modificar un pedido que no esté en progreso");
            
        });

        test("actualizar un pedido - inválido(acción invalida en pedido)", async () => {
            const test_body = {idComprador:1, estado: 'completado' ,libros: [{ titulo: "100 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 500},{ titulo: "200 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 1500}]};
            const pedido = { _id: 'pedido1', estado: 'en progreso', libros: ['libro1'] };
            const libro = { vendedor: { toHexString: () => 3 } };
            const datos = { _id: 'pedido1', estado: 'completado' };


            getPedidoMongo.mockResolvedValue(pedido);
            Libro.findById.mockResolvedValue(libro);
            updatePedidoMongo.mockResolvedValue(datos);


            const { status, body } = await request(app)
            .patch("/pedido")
            .send(test_body)
            .set("Accept", "application/json");

            expect(status).toBe(403);
            expect(body.error).toBe("Usted no es el dueño de los libros por lo que no puede completar el pedido");
            
        });
    });


    describe("delete pedido", () => {

        test("borrar un pedido - válido", async () => {
            const pedidoId = 1;
            const pedido = { _id: pedidoId, vendedor: { toHexString: () => 1 } };
  
            Pedido.findById.mockResolvedValue(pedido);
            softDeletePedidoMongo.mockResolvedValue(pedido);


            const { status, body } = await request(app)
            .delete(`/pedido/${pedidoId}`)
            .set("Accept", "application/json");

            expect(status).toBe(200);
            expect(body.mensaje).toBe("Pedido eliminado. 👍");
            
        });

        test("borrar un pedido - inválido(usuario no es el dueño)", async () => {
            const pedidoId = 1;
            const pedido = { _id: pedidoId, vendedor: { toHexString: () => 2 } };
  
            Pedido.findById.mockResolvedValue(pedido);
            softDeletePedidoMongo.mockResolvedValue(pedido);


            const { status, body } = await request(app)
            .delete(`/pedido/${pedidoId}`)
            .set("Accept", "application/json");

            expect(status).toBe(403);
            expect(body.error).toBe("Usted no es el dueño de este pedido, no puede eliminarlo");
            
        });

    });
});