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

describe("Pruebas de integración de pedido controlador-accion", () => {

    describe("create pedido", () => {

        test("Crear un pedido - válido", async () => {
            const datos = { libros: ['libro1', 'libro2'] };
            const libro = { vendedor: { toHexString: () => 'vendedor1' } };
            const datos2 = { nombre: 'Nuevo Pedido' };
            const pedidoCreado = { _id: '1', ...datos2 };


            Pedido.create.mockResolvedValue(pedidoCreado);

            getLibroMongo.mockResolvedValue(libro);
            Libro.findById.mockResolvedValue(libro);


            const result = await createPedido(datos);
            expect(result).toEqual(pedidoCreado);
        });

        test("Crear un pedido - inválido(datos invalidos)", async () => {
            const datos = {};
            const libro = { vendedor: { toHexString: () => 'vendedor1' } };
            const datos2 = { nombre: 'Nuevo Pedido' };
            const pedidoCreado = { _id: '1', ...datos2 };


            Pedido.create.mockResolvedValue(pedidoCreado);

            getLibroMongo.mockResolvedValue(libro);
            Libro.findById.mockResolvedValue(libro);


            await expect(createPedido(datos)).rejects.toThrow('datos.libros is not iterable');
        });

        test("Crear un pedido - inválido(error base de datos)", async () => {
            const datos = { libros: ['libro1', 'libro2'] };
            const libro = { vendedor: { toHexString: () => 'vendedor1' } };
            const datos2 = { nombre: 'Nuevo Pedido' };
            const pedidoCreado = { _id: '1', ...datos2 };


            Pedido.create.mockImplementation(() => { throw new Error('{"code":500,"msg":"Error creando en la base de datos"}') });
            getLibroMongo.mockResolvedValue(libro);
            Libro.findById.mockResolvedValue(libro);


            await expect(createPedido(datos)).rejects.toThrow('{"code":500,"msg":"Error creando en la base de datos"}');
        });
    });

    describe("read pedido", () => {

        test("leer un pedido - válido", async () => {
            const id = 'pedido1';
            const pedido = { _id: '1', nombre: 'Pedido 1', isDeleted: false };
            Pedido.findById.mockResolvedValue(pedido);
            
            const result = await readPedido(id);
            expect(result).toEqual(pedido);
        });

        test("leer un pedido - inválido(pedido borradp)", async () => {
            const id = 'pedido1';
            const pedido = { _id: '1', nombre: 'Pedido 1', isDeleted: true };
            Pedido.findById.mockResolvedValue(pedido);
            
            await expect(readPedido(id)).rejects.toThrow('{"code":404,"msg":"Pedido no existe"}');
        });

        test("leer un pedido - inválido(pedido no existe)", async () => {
            const id = 'pedido1';
            const pedido = { _id: '1', nombre: 'Pedido 1', isDeleted: true };
            Pedido.findById.mockResolvedValue(null);
            
            await expect(readPedido(id)).rejects.toThrow('{"code":404,"msg":"Pedido no existe"}');
        });

        test("leer pedidos con filtro - válido", async () => {
            const query = { estado: 'en progreso', fechainicio: '2021-01-01', fechafin: '2021-12-31' };
            const userId = 'usuario1';
            const pedidos = [
              { _id: 'pedido1', libros: ['libro1'], idComprador: { toHexString: () => 'usuario1' } },
              { _id: 'pedido2', libros: ['libro2'], idComprador: { toHexString: () => 'usuario2' } },
            ];
            const libro1 = { vendedor: { toHexString: () => 'usuario1' } };
            const libro2 = { vendedor: { toHexString: () => 'usuario2' } };


            Pedido.countDocuments.mockResolvedValue(2);
            Pedido.find.mockResolvedValue(pedidos);
            getLibroMongo
              .mockResolvedValueOnce(libro1)
              .mockResolvedValueOnce(libro2);
      
            const result = await readPedidoConFiltros(query, userId);
            expect(result).toEqual([pedidos[0]]);
        });
    });

    describe("update pedido", () => {

        test("actualizar un pedido - válido", async () => {
            const datos = { _id: 'pedido1', estado: 'completado' };
            const userId = 'vendedor1';
            const pedido = { _id: 'pedido1', estado: 'en progreso', libros: ['libro1'] };
            const libro = { vendedor: { toHexString: () => 'vendedor1' } };
            const cambios = { nombre: 'Pedido Actualizado' };
            const pedidoActualizado = { _id: '1', ...cambios };
            
            Pedido.findByIdAndUpdate.mockResolvedValue(pedidoActualizado);
            Pedido.findById.mockResolvedValue(pedido);
            Libro.findById.mockResolvedValue(libro);
      
            const result = await updatePedido(datos, userId);
            expect(result).toEqual(pedidoActualizado);
        });

        test("actualizar un pedido - inválido(datos erroneos)", async () => {
            const datos = { _id: 'pedido1', estado: 'completado' };
            const userId = 'vendedor1';
            const pedido = { _id: 'pedido1', estado: 'en progreso', libros: ['libro1'] };
            const libro = { vendedor: { toHexString: () => 'vendedor1' } };
            
            Pedido.findByIdAndUpdate.mockImplementation(() => { throw new Error('Datos inválidos') });
            Pedido.findById.mockResolvedValue(pedido);
            Libro.findById.mockResolvedValue(libro);
      
            await expect(updatePedido(datos, userId)).rejects.toThrow('Datos inválidos');
        });

    });


    describe("delete pedido", () => {

        test("borrar un pedido - válido", async () => {
            const id = 'pedido1';
            const userId = 'vendedor1';
            const pedido = { _id: id, vendedor: { toHexString: () => userId } };
            const pedidoEliminado = { _id: '1', isDeleted: true };

            Pedido.findByIdAndUpdate.mockResolvedValue(pedidoEliminado);
            Pedido.findById.mockResolvedValue(pedido);

      
            const result = await deletePedido(id, userId);
            expect(result).toEqual(pedidoEliminado);
        });

        test("borrar un pedido - inválido(id invalido)", async () => {
            const id = 'pedido1';
            const userId = 'vendedor1';
            const pedido = { _id: id, vendedor: { toHexString: () => userId } };
            const pedidoEliminado = { _id: '1', isDeleted: true };

            Pedido.findByIdAndUpdate.mockImplementation(() => { throw new Error('ID inválido') });
            Pedido.findById.mockResolvedValue(pedido);

      
            await expect(deletePedido(id, userId)).rejects.toThrow('ID inválido');
        });
    });
});

