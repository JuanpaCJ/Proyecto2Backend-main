const request = require('supertest');
const express = require('express');
const pedidoRoutes = require('../../pedido/pedido.route');
const Pedido = require('../../pedido/pedido.model');
const { verificarTokenJWT } = require('../../login/login.actions');
const { getLibroMongo } = require('../../libro/libro.actions');
const Libro = require('../../libro/libro.model');
const { createPedido, readPedidoConFiltros, readPedido, updatePedido } = require('../../pedido/pedido.controller');

jest.mock('../../pedido/pedido.model');
jest.mock('../../login/login.actions');
jest.mock('../../libro/libro.actions');
jest.mock('../../libro/libro.model');
jest.mock('../../pedido/pedido.controller'); // Mock the controller to add the validation

const app = express();
app.use(express.json());
app.use('/pedidos', pedidoRoutes);

verificarTokenJWT.mockImplementation((req, res, next) => {
  req.userId = 'usuario123'; // Configurar el userId que coincide con el usuario del pedido
  next();
});

describe('Pedido End-to-End Tests', () => {
  let server;

  beforeAll(() => {
    server = app.listen(3000);
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /pedidos', () => {
    it('debería crear un nuevo pedido', async () => {
      const newPedido = {
        libros: ['libro123'],
        total: 200,
        direccion: 'Calle de Prueba 123'
      };

      const mockLibro = {
        _id: 'libro123',
        vendedor: { toHexString: () => 'vendedor123' }
      };

      const mockPedidoCreado = {
        ...newPedido,
        idComprador: 'usuario123',
        _id: 'pedido123'
      };

      getLibroMongo.mockResolvedValue(mockLibro);
      Libro.findById.mockResolvedValue(mockLibro);
      createPedido.mockResolvedValue(mockPedidoCreado);

      const response = await request(app)
        .post('/pedidos')
        .send(newPedido)
        .expect(200);

      expect(response.body.pedido).toHaveProperty('idComprador', 'usuario123');
      expect(response.body.pedido.libros[0]).toBe('libro123');
      expect(response.body.pedido).toHaveProperty('total', newPedido.total);
      expect(response.body.pedido).toHaveProperty('direccion', newPedido.direccion);
      expect(response.body).toHaveProperty('mensaje', 'Pedido creado exitosamente. 👍');
    });

    it('debería lanzar un error si los datos del pedido son inválidos', async () => {
      const invalidPedido = {
        libros: ['libro123'],
        total: 200
        // Falta el campo "direccion"
      };

      createPedido.mockImplementation(() => {
        throw new Error(JSON.stringify({ code: 400, msg: 'Debe proporcionar una dirección para el pedido' }));
      });

      const response = await request(app)
        .post('/pedidos')
        .send(invalidPedido)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Debe proporcionar una dirección para el pedido');
    });
  });

  describe('GET /pedidos', () => {
    it('debería obtener todos los pedidos con filtros', async () => {
      const mockPedidos = [
        {
          _id: 'pedido123',
          libros: ['libro123'],
          idComprador: 'usuario123',
          total: 200,
          direccion: 'Calle de Prueba 123',
          isDeleted: false
        },
        {
          _id: 'pedido456',
          libros: ['libro456'],
          idComprador: 'usuario456',
          total: 300,
          direccion: 'Calle de Ejemplo 456',
          isDeleted: false
        }
      ];

      readPedidoConFiltros.mockResolvedValue(mockPedidos);

      const response = await request(app)
        .get('/pedidos')
        .expect(200);

      expect(response.body.resultadosBusqueda).toHaveLength(2);
      expect(response.body.resultadosBusqueda[0]).toHaveProperty('_id', 'pedido123');
      expect(response.body.resultadosBusqueda[1]).toHaveProperty('_id', 'pedido456');
    });

    it('debería obtener un pedido específico por ID', async () => {
      const mockPedido = {
        _id: 'pedido123',
        libros: ['libro123'],
        idComprador: 'usuario123',
        total: 200,
        direccion: 'Calle de Prueba 123'
      };

      readPedido.mockResolvedValue(mockPedido);

      const response = await request(app)
        .get('/pedidos/pedido123')
        .expect(200);

      expect(response.body.resultadosBusqueda).toHaveProperty('_id', 'pedido123');
      expect(response.body.resultadosBusqueda).toHaveProperty('libros', ['libro123']);
      expect(response.body.resultadosBusqueda).toHaveProperty('idComprador', 'usuario123');
      expect(response.body.resultadosBusqueda).toHaveProperty('total', 200);
      expect(response.body.resultadosBusqueda).toHaveProperty('direccion', 'Calle de Prueba 123');
    });
  });

  describe('PATCH /pedidos/:id', () => {
    it('debería actualizar un pedido existente', async () => {
      const updateData = {
        _id: 'pedido123',
        total: 250
      };

      const mockPedidoActualizado = {
        _id: 'pedido123',
        libros: ['libro123'],
        idComprador: 'usuario123',
        total: 250,
        direccion: 'Calle de Prueba 123'
      };

      updatePedido.mockResolvedValue(mockPedidoActualizado);

      const response = await request(app)
        .patch('/pedidos/pedido123')
        .send(updateData)
        .expect(200);

      expect(response.body.pedido).toHaveProperty('_id', 'pedido123');
      expect(response.body.pedido).toHaveProperty('total', updateData.total);
    });

    it('debería lanzar un error si los datos de la actualización son inválidos', async () => {
      const invalidUpdateData = {
        _id: 'pedido123',
        total: 'invalid'
      };

      updatePedido.mockImplementation(() => {
        throw new Error(JSON.stringify({ code: 400, msg: 'Total inválido para el pedido' }));
      });

      const response = await request(app)
        .patch('/pedidos/pedido123')
        .send(invalidUpdateData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Total inválido para el pedido');
    });
  });
});
