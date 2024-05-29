const {
    readUsuario,
    createUsuario,
    updateUsuario,
    deleteUsuario,
  } = require('../usuario/usuario.controller');
  const {
    createUsuarioMongo,
    getUsuarioMongo,
    updateUsuarioMongo,
    softDeleteUsuarioMongo,
  } = require('../usuario/usuario.actions');
  const Usuario = require('../usuario/usuario.model');
  
  jest.mock('../usuario/usuario.actions');
  jest.mock('../usuario/usuario.model');
  
  describe('Usuarios Controller', () => {
    describe('readUsuario', () => {
      it('debería devolver un usuario válido por ID si es el dueño', async () => {
        const id = 'usuario1';
        const userId = 'usuario1';
        const usuario = { _id: id, nombre: 'Usuario de Prueba' };
  
        getUsuarioMongo.mockResolvedValue(usuario);
  
        const result = await readUsuario(id, userId);
        expect(result).toEqual(usuario);
      });
  
      it('debería lanzar un error si el usuario no es el dueño de la cuenta', async () => {
        const id = 'usuario1';
        const userId = 'usuario2';
  
        await expect(readUsuario(id, userId)).rejects.toThrow(
          JSON.stringify({ code: 403, msg: 'Usted no es el dueño de esta cuenta, no la puede ver' })
        );
      });
    });
  
    describe('createUsuario', () => {
      it('debería crear un usuario válido', async () => {
        const datos = { nombre: 'Nuevo Usuario', email: 'usuario@nueva.com' };
        const usuarioCreado = { _id: 'usuario1', ...datos };
  
        createUsuarioMongo.mockResolvedValue(usuarioCreado);
  
        const result = await createUsuario(datos);
        expect(result).toEqual(usuarioCreado);
      });
    });
  
    describe('updateUsuario', () => {
      it('debería actualizar un usuario válido', async () => {
        const datos = { _id: 'usuario1', nombre: 'Usuario Actualizado' };
        const userId = 'usuario1';
        const usuario = { _id: 'usuario1', vendedor: { toHexString: () => userId } };
  
        Usuario.findById.mockResolvedValue(usuario);
        updateUsuarioMongo.mockResolvedValue(datos);
  
        const result = await updateUsuario(datos, userId);
        expect(result).toEqual(datos);
      });
  
      it('debería lanzar un error si el usuario no es el dueño de la cuenta', async () => {
        const datos = { _id: 'usuario1', nombre: 'Usuario Actualizado' };
        const userId = 'usuario2';
        const usuario = { _id: 'usuario1', vendedor: { toHexString: () => 'usuario1' } };
  
        Usuario.findById.mockResolvedValue(usuario);
  
        await expect(updateUsuario(datos, userId)).rejects.toThrow(
          JSON.stringify({ code: 403, msg: 'Esta no es su cuenta, no puede modificarla' })
        );
      });
  
      it('debería lanzar un error si el usuario no existe', async () => {
        const datos = { _id: 'usuario1', nombre: 'Usuario Actualizado' };
        const userId = 'usuario1';
  
        Usuario.findById.mockResolvedValue(null);
  
        await expect(updateUsuario(datos, userId)).rejects.toThrow(
          JSON.stringify({ code: 404, msg: 'Usuario no existe' })
        );
      });
    });
  
    describe('deleteUsuario', () => {
      it('debería eliminar un usuario válido', async () => {
        const id = 'usuario1';
        const userId = 'usuario1';
        const usuario = { _id: id, vendedor: { toHexString: () => userId } };
  
        getUsuarioMongo.mockResolvedValue(usuario);
        softDeleteUsuarioMongo.mockResolvedValue(usuario);
  
        const result = await deleteUsuario(id, userId);
        expect(result).toEqual(usuario);
      });
  
      it('debería lanzar un error si el usuario no es el dueño de la cuenta', async () => {
        const id = 'usuario1';
        const userId = 'usuario2';
        const usuario = { _id: id, vendedor: { toHexString: () => 'usuario1' } };
  
        getUsuarioMongo.mockResolvedValue(usuario);
  
        await expect(deleteUsuario(id, userId)).rejects.toThrow(
          JSON.stringify({ code: 403, msg: 'Usted no es el dueño de esta cuenta, no la puede eliminar' })
        );
      });
  
      it('debería lanzar un error si el usuario no existe', async () => {
        const id = 'usuario1';
        const userId = 'usuario1';
  
        getUsuarioMongo.mockResolvedValue(null);
  
        await expect(deleteUsuario(id, userId)).rejects.toThrow(
          JSON.stringify({ code: 404, msg: 'Usuario no encontrado' })
        );
      });
    });
  });
  