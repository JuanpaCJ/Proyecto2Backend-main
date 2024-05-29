const {
    readLibroConFiltros,
    readLibro,
    createLibro,
    updateLibro,
    deleteLibro,
  } = require('../libro/libro.controller');
  const {
    createLibroMongo,
    getLibroMongo,
    getLibrosMongo,
    updateLibroMongo,
    softDeleteLibroMongo,
  } = require('../libro/libro.actions');
  const Libro = require('../libro/libro.model');
  
  jest.mock('../libro/libro.actions');
  jest.mock('../libro/libro.model');
  
  describe('Libros Controller', () => {
    describe('readLibroConFiltros', () => {
      it('debería devolver libros con filtros válidos', async () => {
        const query = { genero: 'Ficción', todo: 'true' };
        const libros = [
          { _id: 'libro1', titulo: 'Libro de Ficción' },
          { _id: 'libro2', titulo: 'Otro Libro de Ficción' },
        ];
  
        getLibrosMongo.mockResolvedValue({ resultados: libros });
  
        const result = await readLibroConFiltros(query);
        expect(result.resultados).toEqual(libros);
      });
  
      it('debería lanzar un error si se pasan filtros no permitidos', async () => {
        const query = { genero: 'Ficción', filtroInvalido: 'valor' };
  
        await expect(readLibroConFiltros(query)).rejects.toThrow(
          JSON.stringify({ code: 400, msg: 'No puedes filtrar por eso' })
        );
      });
    });
  
    describe('readLibro', () => {
      it('debería devolver un libro válido por ID', async () => {
        const id = 'libro1';
        const libro = { _id: id, titulo: 'Libro de Prueba' };
  
        getLibroMongo.mockResolvedValue(libro);
  
        const result = await readLibro(id);
        expect(result).toEqual(libro);
      });
  
      it('debería lanzar un error si no se encuentra el libro', async () => {
        const id = 'libro1';
  
        getLibroMongo.mockRejectedValue(new Error(JSON.stringify({ code: 400, msg: 'Libro no existe' })));
  
        await expect(readLibro(id)).rejects.toThrow(JSON.stringify({ code: 400, msg: 'Libro no existe' }));
      });
    });
  
    describe('createLibro', () => {
      it('debería crear un libro válido', async () => {
        const datos = { titulo: 'Nuevo Libro', vendedor: 'vendedor1' };
        const libroCreado = { _id: 'libro1', ...datos };
  
        createLibroMongo.mockResolvedValue(libroCreado);
  
        const result = await createLibro(datos);
        expect(result).toEqual(libroCreado);
      });
    });
  
    describe('updateLibro', () => {
      it('debería actualizar un libro válido', async () => {
        const datos = { _id: 'libro1', titulo: 'Libro Actualizado' };
        const userId = 'vendedor1';
        const libro = { _id: 'libro1', vendedor: { toHexString: () => userId } };
  
        Libro.findById.mockResolvedValue(libro);
        updateLibroMongo.mockResolvedValue(datos);
  
        const result = await updateLibro(datos, userId);
        expect(result).toEqual(datos);
      });
  
      it('debería lanzar un error si el usuario no es el dueño del libro', async () => {
        const datos = { _id: 'libro1', titulo: 'Libro Actualizado' };
        const userId = 'vendedor2';
        const libro = { _id: 'libro1', vendedor: { toHexString: () => 'vendedor1' } };
  
        Libro.findById.mockResolvedValue(libro);
  
        await expect(updateLibro(datos, userId)).rejects.toThrow(
          JSON.stringify({ code: 403, msg: 'Usted no es el dueño de este libro' })
        );
      });
  
      it('debería lanzar un error si el libro no existe', async () => {
        const datos = { _id: 'libro1', titulo: 'Libro Actualizado' };
        const userId = 'vendedor1';
  
        Libro.findById.mockResolvedValue(null);
  
        await expect(updateLibro(datos, userId)).rejects.toThrow(
          JSON.stringify({ code: 404, msg: 'El libro no existe' })
        );
      });
    });
  
    describe('deleteLibro', () => {
      it('debería eliminar un libro válido', async () => {
        const id = 'libro1';
        const userId = 'vendedor1';
        const libro = { _id: id, vendedor: { toHexString: () => userId } };
  
        getLibroMongo.mockResolvedValue(libro);
        softDeleteLibroMongo.mockResolvedValue(libro);
  
        const result = await deleteLibro(id, userId);
        expect(result).toEqual(libro);
      });
  
      it('debería lanzar un error si el usuario no es el dueño del libro', async () => {
        const id = 'libro1';
        const userId = 'vendedor2';
        const libro = { _id: id, vendedor: { toHexString: () => 'vendedor1' } };
  
        getLibroMongo.mockResolvedValue(libro);
  
        await expect(deleteLibro(id, userId)).rejects.toThrow(
          JSON.stringify({ code: 403, msg: 'Usted no es el dueño de este libro, no lo puede eliminar' })
        );
      });
  
      it('debería lanzar un error si el libro no existe', async () => {
        const id = 'libro1';
        const userId = 'vendedor1';
  
        getLibroMongo.mockResolvedValue(null);
  
        await expect(deleteLibro(id, userId)).rejects.toThrow(
          JSON.stringify({ code: 404, msg: 'Libro no encontrado' })
        );
      });
    });
  });
  