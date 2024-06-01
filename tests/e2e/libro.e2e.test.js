const request = require('supertest');
const express = require('express');
const libroRoutes = require('../../libro/libro.route');
const Libro = require('../../libro/libro.model');
const { verificarTokenJWT } = require('../../login/login.actions');

jest.mock('../../libro/libro.model');
jest.mock('../../login/login.actions');

const app = express();
app.use(express.json());
app.use('/libros', libroRoutes);

verificarTokenJWT.mockImplementation((req, res, next) => {
  req.userId = 'vendedor123'; // Configurar el userId que coincide con el vendedor del libro
  next();
});

describe('Libro End-to-End Tests', () => {
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

  describe('POST /libros', () => {
    it('debería crear un nuevo libro', async () => {
      const newLibro = {
        titulo: 'Libro de Prueba',
        autor: 'Autor de Prueba',
        precio: 100,
        vendedor: '123'
      };

      Libro.create.mockResolvedValue(newLibro);

      const response = await request(app)
        .post('/libros')
        .send(newLibro)
        .expect(200);

      expect(response.body.libro).toHaveProperty('titulo', newLibro.titulo);
      expect(response.body.libro).toHaveProperty('autor', newLibro.autor);
    });

    it('debería lanzar un error si los datos del libro son inválidos', async () => {
      const invalidLibro = {
        autor: 'Autor de Prueba',
        precio: 100,
      };

      const response = await request(app)
        .post('/libros')
        .send(invalidLibro)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Debe proporcionar un titulo para el libro');
    });
  });

  describe('GET /libros/:id', () => {
    it('debería devolver un libro por ID', async () => {
      const libroId = '123';
      const libro = {
        _id: libroId,
        titulo: 'Libro de Prueba',
        autor: 'Autor de Prueba'
      };

      Libro.findById.mockResolvedValue(libro);

      const response = await request(app)
        .get(`/libros/${libroId}`)
        .set('Authorization', `Bearer mockToken`)
        .expect(200);

      expect(response.body.resultadosBusqueda).toHaveProperty('_id', libroId);
      expect(response.body.resultadosBusqueda).toHaveProperty('titulo', libro.titulo);
      expect(response.body.resultadosBusqueda).toHaveProperty('autor', libro.autor);
    });

    it('debería lanzar un error si el libro no existe', async () => {
      const libroId = '999';

      Libro.findById.mockResolvedValue(null);

      const response = await request(app)
        .get(`/libros/${libroId}`)
        .set('Authorization', `Bearer mockToken`)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Libro no existe');
    });
  });

  describe('PATCH /libros', () => {
    it('debería actualizar un libro existente', async () => {
      const libroId = '123';
      const updatedLibro = {
        _id: libroId,
        titulo: 'Libro Actualizado',
        autor: 'Autor Actualizado',
        precio: 200,
        vendedor: 'vendedor123' // Esto debería coincidir con el mock de vendedor
      };

      const mockLibro = {
        _id: libroId,
        titulo: 'Libro Original',
        autor: 'Autor Original',
        precio: 100,
        vendedor: {
          toHexString: () => 'vendedor123', // Simulación del método toHexString
        }
      };

      // Mock para encontrar el libro por ID
      Libro.findById.mockResolvedValue(mockLibro);

      // Mock para actualizar el libro
      Libro.findByIdAndUpdate.mockResolvedValue(updatedLibro);

      const response = await request(app)
        .patch('/libros')
        .set('Authorization', 'Bearer mockToken')
        .send(updatedLibro)
        .expect(200);

      expect(response.body).toHaveProperty('mensaje', 'Libro actualizado. 👍');
    }, 10000); // Aumentar el tiempo de espera a 10 segundos

    it('debería lanzar un error si los datos del libro son inválidos', async () => {
      const libroId = '123';
      const invalidLibro = {
        _id: libroId,
        titulo: '', // Titulo vacío, lo cual es inválido
        autor: 'Autor Actualizado',
        precio: 200,
        vendedor: 'vendedor123' // Esto debería coincidir con el mock de vendedor
      };

      const mockLibro = {
        _id: libroId,
        titulo: 'Libro Original',
        autor: 'Autor Original',
        precio: 100,
        vendedor: {
          toHexString: () => 'vendedor123', // Simulación del método toHexString
        }
      };

      // Mock para encontrar el libro por ID
      Libro.findById.mockResolvedValue(mockLibro);

      // Mock para simular validación fallida
      Libro.findByIdAndUpdate.mockImplementation(() => {
        const error = new Error(JSON.stringify({ code: 400, msg: 'Datos inválidos para la actualización del libro.' }));
        return Promise.reject(error);
      });

      const response = await request(app)
        .patch('/libros')
        .set('Authorization', 'Bearer mockToken')
        .send(invalidLibro)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Datos inválidos para la actualización del libro.');
    }, 10000); // Aumentar el tiempo de espera a 10 segundos
  });
  describe('DELETE /libros/:id', () => {
    it('debería eliminar un libro existente', async () => {
        const libroId = '123';

        const mockLibro = {
            _id: libroId,
            titulo: 'Libro de Prueba',
            autor: 'Autor de Prueba',
            precio: 100,
            vendedor: {
                toHexString: () => 'vendedor123', // Simulación del método toHexString
            }
        };

        // Mock para encontrar el libro por ID
        Libro.findById.mockResolvedValue(mockLibro);

        // Mock para eliminar el libro (soft delete)
        Libro.findByIdAndUpdate.mockResolvedValue({ ...mockLibro, isDeleted: true });

        const response = await request(app)
            .delete(`/libros/${libroId}`)
            .set('Authorization', 'Bearer mockToken')
            .expect(200);

        expect(response.body).toHaveProperty('mensaje', 'Libro eliminado. 👍');
    });

    it('debería lanzar un error si el libro no existe', async () => {
        const libroId = '999';

        // Mock para simular que el libro no se encuentra
        Libro.findById.mockResolvedValue(null);

        try {
            const response = await request(app)
                .delete(`/libros/${libroId}`)
                .set('Authorization', 'Bearer mockToken')
                .expect(400); // Esperar un código 400 "Bad Request" ya que el controlador lanza este error

            expect(response.body).toHaveProperty('error', 'Libro no existe'); // Ajustar el mensaje de error
        } catch (err) {
            if (err.response) {
                console.error('Response status:', err.response.status);
                console.error('Response body:', err.response.body);
                expect(err.response.status).toBe(400); // Asegurarse de que el estado de respuesta sea 400
                expect(err.response.body).toHaveProperty('error', 'Libro no existe'); // Ajustar el mensaje de error
            } else {
                console.error('Error without response:', err);
                throw err; // Re-lanzar el error para que el test falle como se esperaba
            }
        }
    });
});

});
