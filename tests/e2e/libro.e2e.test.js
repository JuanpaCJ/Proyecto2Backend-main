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
  req.userId = '123';
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
        .set('userId', 'vendedor123') // Asegurar que el userId coincida con el vendedor
        .send(updatedLibro)
        .expect(200);


      expect(response.body).toHaveProperty('mensaje', 'Libro actualizado. 👍');
    }, 10000); // Aumentar el tiempo de espera a 10 segundos

    ;
  });

  
});
