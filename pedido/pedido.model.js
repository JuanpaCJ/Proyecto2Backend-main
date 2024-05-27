const mongoose = require('mongoose');

// Definición del esquema para pedidos
const schemaPedido = new mongoose.Schema({
  idComprador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario', // Referencia al modelo Usuario
    required: true,
  },
  libros: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Libro', // Referencia al modelo Libro
      required: true,
    },
  ],
  estado: {
    type: String,
    enum: ['en progreso', 'completado', 'cancelado'],
    default: 'en progreso',
  },
  isDeleted: {
    type: Boolean,
    default: false, // Soft delete para inhabilitar sin borrar
  },
}, {
  versionKey: false,
  timestamps: true, // Agrega createdAt y updatedAt automáticamente
});

// Crea el modelo llamado 'Pedido' basado en el esquema definido
const Pedido = mongoose.model('Pedido', schemaPedido);

module.exports = Pedido;
