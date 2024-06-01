const { getPedidosMongo, getPedidoMongo, createPedidoMongo, updatePedidoMongo, softDeletePedidoMongo } = require('../../pedido/pedido.actions');
const Pedido = require('../../pedido/pedido.model');

jest.mock('../../pedido/pedido.model');

describe('Pedido Actions', () => {
  describe('getPedidosMongo', () => {
    it('debería devolver una lista de pedidos con su cantidad', async () => {
      const filtros = {};
      const pedidos = [
        { _id: '1', nombre: 'Pedido 1' },
        { _id: '2', nombre: 'Pedido 2' }
      ];
      Pedido.countDocuments.mockResolvedValue(2);
      Pedido.find.mockResolvedValue(pedidos);

      const result = await getPedidosMongo(filtros);

      expect(result).toEqual({ resultados: pedidos, cantidadPedidos: 2 });
    });
  });

  describe('getPedidoMongo', () => {
    it('debería devolver un pedido por ID', async () => {
      const pedido = { _id: '1', nombre: 'Pedido 1', isDeleted: false };
      Pedido.findById.mockResolvedValue(pedido);

      const result = await getPedidoMongo('1');

      expect(result).toEqual(pedido);
    });

    it('debería lanzar un error si el pedido está eliminado', async () => {
      const pedido = { _id: '1', nombre: 'Pedido 1', isDeleted: true };
      Pedido.findById.mockResolvedValue(pedido);

      await expect(getPedidoMongo('1')).rejects.toThrow('{"code":404,"msg":"Pedido no existe"}');
    });

    it('debería lanzar un error si el pedido no existe', async () => {
      Pedido.findById.mockResolvedValue(null);

      await expect(getPedidoMongo('1')).rejects.toThrow('{"code":404,"msg":"Pedido no existe"}');
    });
  });

  describe('createPedidoMongo', () => {
    it('debería crear un nuevo pedido', async () => {
      const datos = { nombre: 'Nuevo Pedido' };
      const pedidoCreado = { _id: '1', ...datos };
      Pedido.create.mockResolvedValue(pedidoCreado);

      const result = await createPedidoMongo(datos);

      expect(result).toEqual(pedidoCreado);
    });

    it('debería lanzar un error si los datos son inválidos', async () => {
      const datos = {}; // Datos inválidos
      Pedido.create.mockImplementation(() => { throw new Error('{"code":500,"msg":"Error creando en la base de datos"}') });

      await expect(createPedidoMongo(datos)).rejects.toThrow('{"code":500,"msg":"Error creando en la base de datos"}');
    });

    it('debería lanzar un error si ocurre un problema al crear el pedido', async () => {
      const datos = { nombre: 'Nuevo Pedido' };
      Pedido.create.mockImplementation(() => { throw new Error('{"code":500,"msg":"Error creando en la base de datos"}') });

      await expect(createPedidoMongo(datos)).rejects.toThrow('{"code":500,"msg":"Error creando en la base de datos"}');
    });
  });

  describe('updatePedidoMongo', () => {
    it('debería actualizar un pedido existente', async () => {
      const cambios = { nombre: 'Pedido Actualizado' };
      const pedidoActualizado = { _id: '1', ...cambios };
      Pedido.findByIdAndUpdate.mockResolvedValue(pedidoActualizado);

      const result = await updatePedidoMongo('1', cambios);

      expect(result).toEqual(pedidoActualizado);
    });

    it('debería lanzar un error si los datos de actualización son inválidos', async () => {
      const cambios = {}; // Cambios inválidos
      Pedido.findByIdAndUpdate.mockImplementation(() => { throw new Error('Datos inválidos') });

      await expect(updatePedidoMongo('1', cambios)).rejects.toThrow('Datos inválidos');
    });
  });

  describe('softDeletePedidoMongo', () => {
    it('debería marcar un pedido como eliminado', async () => {
      const pedidoEliminado = { _id: '1', isDeleted: true };
      Pedido.findByIdAndUpdate.mockResolvedValue(pedidoEliminado);

      const result = await softDeletePedidoMongo('1');

      expect(result).toEqual(pedidoEliminado);
    });

    it('debería lanzar un error si el ID es inválido', async () => {
      Pedido.findByIdAndUpdate.mockImplementation(() => { throw new Error('ID inválido') });

      await expect(softDeletePedidoMongo('invalidID')).rejects.toThrow('ID inválido');
    });
  });
});
