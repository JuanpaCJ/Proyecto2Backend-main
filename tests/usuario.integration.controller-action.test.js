const request = require("supertest");
const express = require("express");

const {readUsuario, createUsuario, updateUsuario, deleteUsuario } = require('../usuario/usuario.controller.js');
const { createUsuarioMongo, getUsuarioMongo, updateUsuarioMongo, softDeleteUsuarioMongo } = require('../usuario/usuario.actions.js');

const Usuario = require('../usuario/usuario.model');

jest.mock('../usuario/usuario.model');
jest.mock('../login/login.actions', () => ({
    verificarTokenJWT: (req, res, next) => {
        req.userId = 1; // Asignar un valor de userId por defecto para los tests
        next();
    }
}));


const app = express();
app.use(express.json());
const usuarioRuta = require("../usuario/usuario.route.js");
app.use("/usuarios", usuarioRuta);


describe("Pruebas de integración de usuario controlador-acción", () => {

    describe("create usuario", () => {
        
        test("Crear un usuario - válido", async () => {
                            
            const datos = { nombre: 'Nuevo Usuario', email: 'usuario@nueva.com' };
            const usuarioCreado = { _id: 'usuario1', ...datos };
            
            Usuario.create.mockResolvedValue(usuarioCreado);

            const result = await createUsuario(datos);
            expect(result).toEqual(usuarioCreado);

        });
        
        test("Crear un usuario - inválido", async () => {

            const datos = {email: 'usuario@nueva.com'};
            const usuarioCreado = { _id: 'usuario1', ...datos };
            
            Usuario.create.mockImplementation(() => { throw new Error(JSON.stringify({"code":500,"msg":"Error creando en la base de datos"})) });

            await expect(createUsuario(datos)).rejects.toThrow(JSON.stringify({"code":500,"msg":"Error creando en la base de datos"}));

        });

    });

    describe("Read usuario", () => {

        test("leer un usuario - válido", async () => {
                            
            const id = 'usuario1';
            const userId = 'usuario1';
            
            const usuario = { _id: id, nombre: 'Usuario de Prueba', isDeleted: false };
            Usuario.findById.mockResolvedValue(usuario);

            const result = await readUsuario(id, userId);
            expect(result).toEqual(usuario);

        });

        test("leer un usuario - inválido(usuario eliminado)", async () => {
                            
            const id = 'usuario1';
            const userId = 'usuario1';
            
            const usuario = { _id: id, nombre: 'Usuario de Prueba', isDeleted: true };
            Usuario.findById.mockResolvedValue(usuario);

            await expect(readUsuario(id,userId)).rejects.toThrow('{"code":404,"msg":"Usuario no existe"}');

        });

        test("leer un usuario - inválido(usuario no existe)", async () => {
                            
            const id = 'usuario1';
            const userId = 'usuario1';
            
            Usuario.findById.mockResolvedValue(null);

            await expect(readUsuario(id,userId)).rejects.toThrow('{"code":404,"msg":"Usuario no existe"}');

        });
    
    });

    describe("update usuario", () => {

        test("actualizar un usuario - válido", async () => {
                            
            const datos = { _id: 'usuario1', nombre: 'Usuario no Actualizado' };
            const userId = 'usuario1';
            const usuario = { _id: 'usuario1', vendedor: { toHexString: () => userId } };
            const usuarioActualizado = { _id: 'usuario1', nombre: 'Usuario Actualizado' };

            Usuario.findByIdAndUpdate.mockResolvedValue(usuarioActualizado);
            Usuario.findById.mockResolvedValue(usuario);

            const result = await updateUsuario(datos, userId);
            expect(result).toEqual(usuarioActualizado);

        });    
        
        test("actualizar un usuario - inválido(datos invalidos)", async () => {
                            
            const datos = { _id: 'usuario1', nombre: 'Usuario no Actualizado' };
            const userId = 'usuario1';
            const usuario = { _id: 'usuario1', vendedor: { toHexString: () => userId } };

            Usuario.findByIdAndUpdate.mockImplementation(() => { throw new Error('Datos inválidos')});
                                                
            Usuario.findById.mockResolvedValue(usuario);

            expect(updateUsuario(datos, userId)).rejects.toThrow('Datos inválidos');

        }); 

    });

    describe("delete usuario", () => {
    
        test("borrar un usuario - válido", async () => {
                            
            const id = 'usuario1';
            const userId = 'usuario1';
            const usuario = { _id: id, vendedor: { toHexString: () => userId } };
            const usuarioEliminado = { _id: 'usuario1', isDeleted: true };

            Usuario.findByIdAndUpdate.mockResolvedValue(usuarioEliminado);
            Usuario.findById({isDeleted: false, ...usuario});

            const result = await deleteUsuario(id, userId);
            expect(result).toEqual(usuarioEliminado);

        });   

        test("borrar un usuario - inválido", async () => {
                            
            const id = 'usuario1';
            const userId = 'usuario1';
            const usuario = { _id: id, vendedor: { toHexString: () => userId } };
            const usuarioEliminado = { _id: 'usuario1', isDeleted: true };

            Usuario.findByIdAndUpdate.mockImplementation(() => { throw new Error('ID inválido') });
            Usuario.findById({isDeleted: false, ...usuario});

            expect(deleteUsuario(id, userId)).rejects.toThrow('ID inválido');

        }); 

    });
});