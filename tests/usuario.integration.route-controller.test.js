const request = require("supertest");
const express = require("express");

const {readUsuario, createUsuario, updateUsuario, deleteUsuario } = require('../usuario/usuario.controller.js');
const { createUsuarioMongo, getUsuarioMongo, updateUsuarioMongo, softDeleteUsuarioMongo } = require('../usuario/usuario.actions.js');
const Usuario = require('../usuario/usuario.model');

jest.mock('../usuario/usuario.model');
jest.mock('../usuario/usuario.actions');
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


describe("Pruebas de integración de usuario ruta-controlador", () => {

    describe("create usuario", () => {
        
        test("Crear un usuario - válido", async () => {
                
            
            const test_body = { nombre: "sazumo", email: "sazumo@gmail.com", password: "123", direccion: "calle 25", telefono: "3053813566", isDeleted: false };
            const datos = { nombre: 'sazumo', email: 'sazumo@gmail.com' };
            const usuarioCreado = { _id: 'usuario2', ...datos };
            
            createUsuarioMongo.mockResolvedValue(usuarioCreado);

            const { status, body } = await request(app)
                .post("/usuarios")
                .send(test_body)
                .set("Accept", "application/json");
            
            
        
            expect(status).toBe(200);
            expect(body).toBeDefined();
            expect(body.mensaje).toBe("Usuario creado exitosamente. 👍");
            expect(body.usuario).toEqual(usuarioCreado);
        });
        
        test("Crear un usuario - inválido", async () => {

            
            const test_body = { nombre: "sazumo", password: "123", direccion: "calle 25", telefono: "3053813566", isDeleted: false };
            const datos = { nombre: 'sazumo', email: 'sazumo@gmail.com' };
            const usuarioCreado = { _id: 'usuario2', ...datos };
            
            createUsuarioMongo.mockResolvedValue(usuarioCreado);

            const { status, body } = await request(app)
                .post("/usuarios")
                .send(test_body)
                .set("Accept", "application/json");
            
            
        
            expect(status).toBe(400);
            expect(body).toBeDefined();
            expect(body.error).toBe("Debe proporcionar un correo electronico");
        });

    });
    describe("Read usuario", () => {
        
        test("Leer un usuario - válido", async () => {
                
            
            const usuarioId = 1;
            const usuario = { _id: usuarioId, nombre: 'sazumo' };
            
            getUsuarioMongo.mockResolvedValue(usuario);
    
            const { status, body } = await request(app)
            .get(`/usuarios/${usuarioId}`)
            .set("Accept", "application/json");

            expect(status).toBe(200);
            expect(body.resultadosBusqueda).toEqual(usuario);
        });

        test("Leer un usuario - inválido", async () => {
                
            
            const usuarioId = 2;
            const usuario = { _id: usuarioId, nombre: 'sazumo' };
            
            getUsuarioMongo.mockResolvedValue(usuario);
    
            const { status, body } = await request(app)
            .get(`/usuarios/${usuarioId}`)
            .set("Accept", "application/json");

            expect(status).toBe(403);
            expect(body.error).toEqual('Usted no es el dueño de esta cuenta, no la puede ver');
        });

    });

    describe("update usuario", () => {
        
        test("actualizar usuario - válido", async () => {
                
            
            const test_body = { _id: 1, nombre: "Rafael actualizado", email: "rafael_actualizado@gmail.com" };
            const datos = { _id: 'usuario1', nombre: 'Usuario Actualizado' }
            const usuario = { _id: 'usuario1', vendedor: { toHexString: () => userId } };

            Usuario.findById.mockResolvedValue(usuario);
            updateUsuarioMongo.mockResolvedValue(datos);
    
            const { status, body } = await request(app)
            .patch("/usuarios")
            .send(test_body)
            .set("Accept", "application/json");

            expect(status).toBe(200);
            expect(body.mensaje).toBe("Usuario modificado. 👍");
        });

        test("actualizar usuario - inválido(usuario no existe)", async () => {
                
            
            const test_body = { _id: 1, nombre: "Rafael actualizado", email: "rafael_actualizado@gmail.com" };
            const datos = { _id: 'usuario1', nombre: 'Usuario Actualizado' }
            const usuario = { _id: 'usuario1', vendedor: { toHexString: () => userId } };

            Usuario.findById.mockResolvedValue(null);
            updateUsuarioMongo.mockResolvedValue(datos);
    
            const { status, body } = await request(app)
            .patch("/usuarios")
            .send(test_body)
            .set("Accept", "application/json");

            expect(status).toBe(404);
            expect(body.error).toBe("Usuario no existe");
        });

        test("actualizar usuario - inválido(cuenta ajena)", async () => {
                
            
            const test_body = { _id: 2, nombre: "Rafael actualizado", email: "rafael_actualizado@gmail.com" };
            const datos = { _id: 'usuario1', nombre: 'Usuario Actualizado' }
            const usuario = { _id: 'usuario1', vendedor: { toHexString: () => userId } };

            Usuario.findById.mockResolvedValue(usuario);
            updateUsuarioMongo.mockResolvedValue(datos);
    
            const { status, body } = await request(app)
            .patch("/usuarios")
            .send(test_body)
            .set("Accept", "application/json");

            expect(status).toBe(403);
            expect(body.error).toBe("Esta no es su cuenta, no puede modificarla");
        });
    

    });

    describe("delete usuario", () => {
    
        test("borrar usuario - válido", async () => {
                
            const usuarioId = 1;
            const usuario = { _id: usuarioId, vendedor: { toHexString: () => userId } };
  
            getUsuarioMongo.mockResolvedValue(usuario);
            softDeleteUsuarioMongo.mockResolvedValue(usuario);
    
            const { status, body } = await request(app)
            .delete(`/usuarios/${usuarioId}`)
            .set("Accept", "application/json");

            expect(status).toBe(200);
            expect(body.mensaje).toBe("Usuario eliminado. 👍");
        });
    
        test("borrar usuario - inválido(usuario no existe)", async () => {
                
            const usuarioId = 1;
            const usuario = { _id: usuarioId, vendedor: { toHexString: () => userId } };
  
            getUsuarioMongo.mockResolvedValue(null);
            softDeleteUsuarioMongo.mockResolvedValue(usuario);
    
            const { status, body } = await request(app)
            .delete(`/usuarios/${usuarioId}`)
            .set("Accept", "application/json");

            expect(status).toBe(404);
            expect(body.error).toBe("Usuario no encontrado");
        });

        test("borrar usuario - inválido(cuenta ajena)", async () => {
                
            const usuarioId = 2;
            const usuario = { _id: usuarioId, vendedor: { toHexString: () => userId } };
  
            getUsuarioMongo.mockResolvedValue(usuario);
            softDeleteUsuarioMongo.mockResolvedValue(usuario);
    
            const { status, body } = await request(app)
            .delete(`/usuarios/${usuarioId}`)
            .set("Accept", "application/json");

            expect(status).toBe(403);
            expect(body.error).toBe("Usted no es el dueño de esta cuenta, no la puede eliminar");
        });
    });
});
