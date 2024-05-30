const request = require('supertest');
const express = require('express');
const usuarioRoutes = require('..//usuario/usuario.route');
const Usuario = require('../usuario/usuario.model');

// Crear una aplicación Express para las pruebas
const app = express();
app.use(express.json());
app.use('/usuarios', usuarioRoutes);

jest.mock('../usuario/usuario.model');

describe('User End-to-End Tests', () => {
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

  describe('POST /usuarios', () => {
    it('debería crear un nuevo usuario', async () => {
      const newUser = {
        nombre: 'Usuario de Prueba',
        email: 'usuario@prueba.com',
        password: 'password123'
      };

      Usuario.create.mockResolvedValue(newUser);

      const response = await request(app)
        .post('/usuarios')
        .send(newUser)
        .expect(200);

      expect(response.body.usuario).toHaveProperty('nombre', newUser.nombre);
      expect(response.body.usuario).toHaveProperty('email', newUser.email);
    });

    it('debería lanzar un error si los datos del usuario son inválidos', async () => {
      const invalidUser = {
        nombre: 'Usuario de Prueba',
        email: 'usuario@prueba.com'

      };

      Usuario.create.mockImplementation(() => {
        throw new Error(JSON.stringify({ code: 400, msg: 'Datos inválidos' }));
      });

      const response = await request(app)
        .post('/usuarios')
        .send(invalidUser)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Datos inválidos');
    }, 15000);
  });
});
