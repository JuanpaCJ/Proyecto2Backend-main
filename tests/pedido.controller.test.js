const {
    readPedidoConFiltros,
    readPedido,
    createPedido,
    updatePedido,
    deletePedido,
  } = require('../pedido/pedido.controller');
  const {
    getLibroMongo,
    updateLibroMongo,
  } = require('../libro/libro.actions');
  const {
    createPedidoMongo,
    getPedidoMongo,
    getPedidosMongo,
    updatePedidoMongo,
    softDeletePedidoMongo,
  } = require('../pedido/pedido.actions');
  const Libro = require('../libro/libro.model');
  const Pedido = require('../pedido/pedido.model');
  
  jest.mock('../libro/libro.actions');
  jest.mock('../pedido/pedido.actions');
  jest.mock('../libro/libro.model');
  jest.mock('../pedido/pedido.model');
  
  describe('Pedidos Controller', () => {
    describe('createPedido', () => {
      it('Crear un pedido válido', async () => {
        const datos = { libros: ['libro1', 'libro2'] };
        const libro = { vendedor: { toHexString: () => 'vendedor1' } };
  
        getLibroMongo.mockResolvedValue(libro);
        Libro.findById.mockResolvedValue(libro);
        createPedidoMongo.mockResolvedValue(datos);
  
        const result = await createPedido(datos);
        expect(result).toEqual(datos);
      });
      it('debería lanzar un error si los libros pertenecen a diferentes vendedores', async () => {
        const datos = { libros: ['libro1', 'libro2'] };
        const libro1 = { vendedor: { toHexString: () => 'vendedor1' } };
        const libro2 = { vendedor: { toHexString: () => 'vendedor2' } };
  
        getLibroMongo
          .mockResolvedValueOnce(libro1)
          .mockResolvedValueOnce(libro2);
        Libro.findById
          .mockResolvedValueOnce(libro1)
          .mockResolvedValueOnce(libro2);
  
        await expect(createPedido(datos)).rejects.toThrow(
          JSON.stringify({ code: 403, msg: 'Libros de vendedores diferentes' })
        );
      });
    });
  
    describe('readPedido', () => {
      it('debería devolver un pedido válido por ID', async () => {
        const id = 'pedido1';
        const pedido = { _id: id };
  
        getPedidoMongo.mockResolvedValue(pedido);
  
        const result = await readPedido(id);
        expect(result).toEqual(pedido);
      });
  
      it('debería lanzar un error si no se encuentra el pedido', async () => {
        const id = 'pedido1';
  
        getPedidoMongo.mockRejectedValue(new Error(JSON.stringify({ code: 404, msg: 'Pedido no existe' })));
  
        await expect(readPedido(id)).rejects.toThrow(JSON.stringify({ code: 404, msg: 'Pedido no existe' }));
      });
    });
  
    describe('readPedidoConFiltros', () => {
      it('debería devolver pedidos con filtros válidos', async () => {
        const query = { estado: 'en progreso', fechainicio: '2021-01-01', fechafin: '2021-12-31' };
        const userId = 'usuario1';
        const pedidos = [
          { _id: 'pedido1', libros: ['libro1'], idComprador: { toHexString: () => 'usuario1' } },
          { _id: 'pedido2', libros: ['libro2'], idComprador: { toHexString: () => 'usuario2' } },
        ];
        const libro1 = { vendedor: { toHexString: () => 'usuario1' } };
        const libro2 = { vendedor: { toHexString: () => 'usuario2' } };
  
        getPedidosMongo.mockResolvedValue({ resultados: pedidos });
        getLibroMongo
          .mockResolvedValueOnce(libro1)
          .mockResolvedValueOnce(libro2);
  
        const result = await readPedidoConFiltros(query, userId);
        expect(result).toEqual([pedidos[0]]);
      });
  
      it('debería filtrar los pedidos que no coinciden con el userId', async () => {
        const query = { estado: 'en progreso', fechainicio: '2021-01-01', fechafin: '2021-12-31' };
        const userId = 'usuario1';
        const pedidos = [
          { _id: 'pedido1', libros: ['libro1'], idComprador: { toHexString: () => 'usuario1' } },
          { _id: 'pedido2', libros: ['libro2'], idComprador: { toHexString: () => 'usuario2' } },
        ];
        const libro1 = { vendedor: { toHexString: () => 'usuario1' } };
        const libro2 = { vendedor: { toHexString: () => 'usuario2' } };
  
        getPedidosMongo.mockResolvedValue({ resultados: pedidos });
        getLibroMongo
          .mockResolvedValueOnce(libro1)
          .mockResolvedValueOnce(libro2);
  
        const result = await readPedidoConFiltros(query, userId);
        expect(result).toEqual([pedidos[0]]);
      });
    });
  
    describe('updatePedido', () => {
      it('debería actualizar un pedido válido', async () => {
        const datos = { _id: 'pedido1', estado: 'completado' };
        const userId = 'vendedor1';
        const pedido = { _id: 'pedido1', estado: 'en progreso', libros: ['libro1'] };
        const libro = { vendedor: { toHexString: () => 'vendedor1' } };
  
        getPedidoMongo.mockResolvedValue(pedido);
        Libro.findById.mockResolvedValue(libro);
        updatePedidoMongo.mockResolvedValue(datos);
  
        const result = await updatePedido(datos, userId);
        expect(result).toEqual(datos);
      });
  
      it('debería lanzar un error si el pedido no está en progreso', async () => {
        const datos = { _id: 'pedido1', estado: 'completado' };
        const userId = 'vendedor1';
        const pedido = { _id: 'pedido1', estado: 'completado', libros: ['libro1'] };
  
        getPedidoMongo.mockResolvedValue(pedido);
  
        await expect(updatePedido(datos, userId)).rejects.toThrow(
          JSON.stringify({ code: 403, msg: 'No puede modificar un pedido que no esté en progreso' })
        );
      });
  
      it('debería lanzar un error si el usuario no está involucrado en el pedido', async () => {
        const datos = { _id: 'pedido1', estado: 'cancelado' };
        const userId = 'usuario1';
        const pedido = { _id: 'pedido1', estado: 'en progreso', idComprador: { toHexString: () => 'usuario2' }, libros: ['libro1'] };
        const libro = { vendedor: { toHexString: () => 'vendedor1' } };
  
        getPedidoMongo.mockResolvedValue(pedido);
        Libro.findById.mockResolvedValue(libro);
  
        await expect(updatePedido(datos, userId)).rejects.toThrow(
          JSON.stringify({ code: 403, msg: 'Usted no está involucrado en este pedido, no puede cancelarlo' })
        );
      });
    });
  
    describe('deletePedido', () => {
      it('debería eliminar un pedido válido', async () => {
        const id = 'pedido1';
        const userId = 'vendedor1';
        const pedido = { _id: id, vendedor: { toHexString: () => userId } };
  
        Pedido.findById.mockResolvedValue(pedido);
        softDeletePedidoMongo.mockResolvedValue(pedido);
  
        const result = await deletePedido(id, userId);
        expect(result).toEqual(pedido);
      });
  
      it('debería lanzar un error si el usuario no es el dueño', async () => {
        const id = 'pedido1';
        const userId = 'usuario1';
        const pedido = { _id: id, vendedor: { toHexString: () => 'vendedor1' } };
  
        Pedido.findById.mockResolvedValue(pedido);
  
        await expect(deletePedido(id, userId)).rejects.toThrow(
          JSON.stringify({ code: 403, msg: 'Usted no es el dueño de este pedido, no puede eliminarlo' })
        );
      });
    });
  });
  