const request = require('supertest');
const express = require('express');
const usuarioRoutes = require('../../usuario/usuario.route');
const Usuario = require('../../usuario/usuario.model');
const { verificarTokenJWT } = require('../../login/login.actions');

jest.mock('../../usuario/usuario.model');
jest.mock('../../login/login.actions');

const app = express();
app.use(express.json());
app.use('/usuarios', usuarioRoutes);

verificarTokenJWT.mockImplementation((req, res, next) => {
  req.userId = '123';
  next();
});
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
    });
  });

  describe('GET /usuarios/:id', () => {
    it('debería devolver un usuario por ID', async () => {
      const userId = '123';
      const user = {
        _id: userId,
        nombre: 'Usuario de Prueba',
        email: 'usuario@prueba.com'
      };

      Usuario.findById.mockResolvedValue(user);

      const response = await request(app)
        .get(`/usuarios/${userId}`)
        .set('Authorization', `Bearer mockToken`)
        .expect(200);

      expect(response.body.resultadosBusqueda).toHaveProperty('_id', userId);
      expect(response.body.resultadosBusqueda).toHaveProperty('nombre', user.nombre);
      expect(response.body.resultadosBusqueda).toHaveProperty('email', user.email);
    });

    it('debería lanzar un error si el ID del usuario no es válido', async () => {
      const invalidUserId = '999';
    
      Usuario.findById.mockResolvedValue(null);
    
      const response = await request(app)
        .get(`/usuarios/${invalidUserId}`)
        .set('Authorization', `Bearer mockToken`);
    
      if (response.status !== 404) {
        console.log(response.body);
      }
    
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Usuario no encontrado');
    });
  });
  describe('PATCH /usuarios', () => {
    it('debería actualizar un usuario existente', async () => {
      const userId = '123';
      const updatedUser = {
        _id: userId,
        nombre: 'Usuario Actualizado',
        email: 'actualizado@prueba.com',
        password: 'newpassword123'
      };

      const mockUser = new Usuario(updatedUser);
      Usuario.findById.mockResolvedValue(mockUser);
      Usuario.findByIdAndUpdate.mockResolvedValue(updatedUser);

      const response = await request(app)
        .patch('/usuarios')
        .set('Authorization', 'Bearer mockToken')
        .send(updatedUser)
        .expect(200);

      expect(response.body).toHaveProperty('mensaje', 'Usuario modificado. 👍');
    });

    it('debería lanzar un error si los datos de actualización son inválidos', async () => {
      const userId = '123';
      const invalidUpdatedUser = {
        _id: userId,
        email: 'actualizado@prueba.com' // Falta el nombre y password
      };

      Usuario.findById.mockResolvedValue(invalidUpdatedUser);
      Usuario.findByIdAndUpdate.mockImplementation(() => {
        throw new Error(JSON.stringify({ code: 400, msg: 'Datos inválidos para la actualización' }));
      });

      const response = await request(app)
        .patch('/usuarios')
        .set('Authorization', 'Bearer mockToken')
        .send(invalidUpdatedUser)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Datos inválidos para la actualización');
    });
  });
  describe('DELETE /usuarios/:id', () => {
    it('debería eliminar un usuario existente', async () => {
      const userId = '123';
      const mockUser = {
        _id: userId,
        nombre: 'Usuario de Prueba',
        email: 'usuario@prueba.com',
        isDeleted: false
      };

      Usuario.findById.mockResolvedValue(mockUser);
      Usuario.findByIdAndUpdate.mockResolvedValue({ ...mockUser, isDeleted: true });

      const response = await request(app)
        .delete(`/usuarios/${userId}`)
        .set('Authorization', 'Bearer mockToken')
        .expect(200);

      expect(response.body).toHaveProperty('mensaje', 'Usuario eliminado. 👍');
    });


    it('debería lanzar un error si el usuario no es el dueño de la cuenta', async () => {
      const userId = '123';
      const anotherUserId = '456';
      const mockUser = {
        _id: anotherUserId,
        nombre: 'Otro Usuario',
        email: 'otro@prueba.com',
        isDeleted: false
      };

      Usuario.findById.mockResolvedValue(mockUser);

      const response = await request(app)
        .delete(`/usuarios/${anotherUserId}`)
        .set('Authorization', 'Bearer mockToken')
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Usted no es el dueño de esta cuenta, no la puede eliminar');
    });
  });
});
