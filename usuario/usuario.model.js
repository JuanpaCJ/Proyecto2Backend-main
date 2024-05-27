const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // Para hash de contraseñas

// Definición del esquema para usuarios
const schemaUsuario = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // Cada usuario debe tener un correo único
    lowercase: true, // Asegura que sea todo en minúsculas
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // Valida formato de correo
  },
  password: {
    type: String,
    required: true,
  },
  direccion: {
    type: String,
  },
  telefono: {
    type: String,
  },
  isDeleted: {
    type: Boolean,
    default: false, // Soft delete
  },
}, {
  versionKey: false,
  timestamps: true,
});

// Middleware para hash de contraseñas antes de guardar el usuario
schemaUsuario.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10); // Genera sal para el hash
    this.password = await bcrypt.hash(this.password, salt); // Aplica el hash
  }
  next();
});
schemaUsuario.pre('findOneAndUpdate', async function (next) {
  if (this.getUpdate().password) {
    const salt = await bcrypt.genSalt(10); // Genera sal para el hash
    const hashedPassword = await bcrypt.hash(this.getUpdate().password, salt); // Aplica el hash a la nueva contraseña
    this.getUpdate().password = hashedPassword; // Actualiza la contraseña hasheada en los datos de actualización
  }
  next();
});
// Método para verificar la contraseña
schemaUsuario.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password); // Compara hash
};

// Crea el modelo llamado 'Usuario' a partir del esquema definido
const Usuario = mongoose.model('Usuario', schemaUsuario);

module.exports = Usuario;