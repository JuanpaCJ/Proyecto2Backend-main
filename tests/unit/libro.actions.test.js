const { getLibrosMongo, createLibroMongo, getLibroMongo, updateLibroMongo, softDeleteLibroMongo } = require('../../libro/libro.actions');
const Libro = require('../../libro/libro.model');

jest.mock('../../libro/libro.model');

describe('Libro Actions', () => {
  describe('getLibrosMongo', () => {
    it('debería devolver libros filtrados y la cantidad', async () => {
      const filtros = { titulo: 'Test' };
      const libros = [{ titulo: 'Test Libro 1' }, { titulo: 'Test Libro 2' }];
      Libro.countDocuments.mockResolvedValue(2);
      Libro.find.mockResolvedValue(libros);

      const result = await getLibrosMongo(filtros);

      expect(result.cantidadLibros).toBe(2);
      expect(result.resultados).toEqual(libros);
    });
  });

  describe('getLibroMongo', () => {
    it('debería devolver un libro por ID', async () => {
      const libro = { _id: '1', titulo: 'Test Libro', isDeleted: false };
      Libro.findById.mockResolvedValue(libro);

      const result = await getLibroMongo('1', false);

      expect(result).toEqual(libro);
    });

    it('debería lanzar un error si el libro no existe', async () => {
      Libro.findById.mockResolvedValue(null);

      await expect(getLibroMongo('1', false)).rejects.toThrow('{"code":400,"msg":"Libro no existe"}');
    });

    it('debería lanzar un error si el libro está marcado como eliminado y activate es true', async () => {
      const libro = { _id: '1', titulo: 'Test Libro', isDeleted: true };
      Libro.findById.mockResolvedValue(libro);

      await expect(getLibroMongo('1', true)).rejects.toThrow('{"code":400,"msg":"Libro no existe"}');
    });
  });

  describe('createLibroMongo', () => {
    it('debería crear un nuevo libro', async () => {
      const datos = { titulo: 'Nuevo Libro' };
      const libroCreado = { _id: '1', ...datos };
      Libro.create.mockResolvedValue(libroCreado);

      const result = await createLibroMongo(datos);

      expect(result).toEqual(libroCreado);
    });

    it('debería lanzar un error si los datos son inválidos', async () => {
      const datos = {}; // Datos inválidos
      Libro.create.mockImplementation(() => { throw new Error('Datos inválidos') });

      await expect(createLibroMongo(datos)).rejects.toThrow('Datos inválidos');
    });
  });

  describe('updateLibroMongo', () => {
    it('debería actualizar un libro existente', async () => {
      const cambios = { titulo: 'Libro Actualizado' };
      const libroActualizado = { _id: '1', ...cambios };
      Libro.findByIdAndUpdate.mockResolvedValue(libroActualizado);

      const result = await updateLibroMongo('1', cambios);

      expect(result).toEqual(libroActualizado);
    });

    it('debería lanzar un error si los datos de actualización son inválidos', async () => {
      const cambios = {};
      Libro.findByIdAndUpdate.mockImplementation(() => { throw new Error('Datos inválidos') });

      await expect(updateLibroMongo('1', cambios)).rejects.toThrow('Datos inválidos');
    });
  });

  describe('softDeleteLibroMongo', () => {
    it('debería marcar un libro como eliminado', async () => {
      const libroEliminado = { _id: '1', isDeleted: true };
      Libro.findByIdAndUpdate.mockResolvedValue(libroEliminado);

      const result = await softDeleteLibroMongo('1');

      expect(result).toEqual(libroEliminado);
    });

    it('debería lanzar un error si el ID es inválido', async () => {
      Libro.findByIdAndUpdate.mockImplementation(() => { throw new Error('ID inválido') });

      await expect(softDeleteLibroMongo('invalidID')).rejects.toThrow('ID inválido');
    });
  });
});
