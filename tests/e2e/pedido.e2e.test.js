const request = require('supertest');
const express = require('express');
const pedidoRoutes = require('../../pedido/pedido.route');
const Pedido = require('../../pedido/pedido.model');
const { verificarTokenJWT } = require('../../login/login.actions');
const { softDeletePedidoMongo, getPedidoMongo } = require('../../pedido/pedido.actions');
const { getLibroMongo } = require('../../libro/libro.actions');
const Libro = require('../../libro/libro.model');
const { createPedido, readPedidoConFiltros, readPedido, updatePedido } = require('../../pedido/pedido.controller');

jest.mock('../../pedido/pedido.model');
jest.mock('../../pedido/pedido.actions', () => ({
  getPedidosMongo: jest.fn(),
  createPedidoMongo: jest.fn(),
  getPedidoMongo: jest.fn(),
  updatePedidoMongo: jest.fn(),
  softDeletePedidoMongo: jest.fn(),
}));
jest.mock('../../login/login.actions', () => ({
  verificarTokenJWT: (req, res, next) => {
    req.userId = 'usuario123'; // Mock user ID
    next();
  },
}));
jest.mock('../../libro/libro.actions');
jest.mock('../../libro/libro.model');
jest.mock('../../pedido/pedido.controller'); // Mock the controller to add the validation

const app = express();
app.use(express.json());
app.use('/pedidos', pedidoRoutes);

jest.mock('../../login/login.actions', () => ({
  verificarTokenJWT: (req, res, next) => {
    req.userId = 'usuario123'; // Mock user ID
    next();
  },
}));
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

  describe('PATCH /pedidos', () => {
    it('debería actualizar un pedido existente', async () => {
        const updateData = {
            _id: 'pedido123',
            total: 250
        };

        const mockPedido = {
            _id: 'pedido123',
            libros: ['libro123'],
            idComprador: 'usuario123',
            total: 200,
            direccion: 'Calle de Prueba 123',
            estado: 'en progreso'
        };

        const mockPedidoActualizado = {
            ...mockPedido,
            total: 250
        };

        // Mocking the readPedido function to return the existing pedido
        readPedido.mockResolvedValue(mockPedido);

        // Mocking the updatePedido function to return the updated pedido
        updatePedido.mockResolvedValue(mockPedidoActualizado);

        const response = await request(app)
            .patch('/pedidos')
            .send(updateData)
            .expect(200);

        // Dado que tu controlador actualmente solo devuelve un mensaje, verifica esto
        expect(response.body).toHaveProperty('mensaje', 'Pedido modificado. 👍');
    });

    it('debería lanzar un error si los datos de la actualización son inválidos', async () => {
        const invalidUpdateData = {
            _id: 'pedido123',
            total: 'invalid'
        };

        // Mocking the readPedido function to return an existing pedido
        const mockPedido = {
            _id: 'pedido123',
            libros: ['libro123'],
            idComprador: 'usuario123',
            total: 200,
            direccion: 'Calle de Prueba 123',
            estado: 'en progreso'
        };

        readPedido.mockResolvedValue(mockPedido);

        // Mocking the updatePedido function to throw an error
        updatePedido.mockImplementation(() => {
            throw new Error(JSON.stringify({ code: 400, msg: 'Total inválido para el pedido' }));
        });

        const response = await request(app)
            .patch('/pedidos')
            .send(invalidUpdateData)
            .expect(400);

        expect(response.body).toHaveProperty('error', 'Total inválido para el pedido');
    });
  });

  describe('DELETE /pedidos/:id', () => {
    it('debería eliminar un pedido existente', async () => {
        const mockPedido = {
            _id: 'pedido123',
            libros: ['libro123'],
            idComprador: 'usuario123',
            total: 200,
            direccion: 'Calle de Prueba 123',
            estado: 'en progreso',
            vendedor: { toHexString: () => 'usuario123' }
        };
        readPedido.mockResolvedValue(mockPedido);
        const mockPedidoEliminado = {
            ...mockPedido,
            isDeleted: true
        };
        softDeletePedidoMongo.mockResolvedValue(mockPedidoEliminado);

        const response = await request(app)
            .delete('/pedidos/pedido123')
            .expect(200);

        expect(response.body).toHaveProperty('mensaje', 'Pedido eliminado. 👍');
    });

    
  });
});
