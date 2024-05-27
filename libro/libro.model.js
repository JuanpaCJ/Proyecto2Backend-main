const mongoose = require('mongoose');

// Definición del esquema para libros usados
const schemaLibro = new mongoose.Schema({
  titulo: {
    type: String,
    required: true,
    trim: true,
  },
  autor: {
    type: String,
    required: true,
  },
  genero: {
    type: String,
  },
  fechaPublicacion: {
    type: Date,
  },
  editorial: {
    type: String,
  },
  precio: {
    type: Number,
    required: true,
  },
  vendedor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario', // Referencia al usuario que vende el libro
    required: true,
  },
  estado: {
    type: String,
    enum: ['como nuevo', 'bueno', 'aceptable', 'desgastado'], // Estado del libro usado
    default: 'bueno',
  },
  descripcion: {
    type: String,
    trim: true,
  },
  isDeleted: {
    type: Boolean,
    default: false, // Soft delete para desactivar sin eliminar
  },
}, {
  versionKey: false,
  timestamps: true, // Agrega createdAt y updatedAt automáticamente
});

// Crea el modelo llamado 'Libro' a partir del esquema definido
const Libro = mongoose.model('Libro', schemaLibro);

module.exports = Libro;
