const request = require("supertest");
const express = require("express");

const {
    readLibroConFiltros,
    readLibro,
    createLibro,
    updateLibro,
    deleteLibro,
} = require('../libro/libro.controller.js');
const {
   createLibroMongo,
   getLibroMongo,
   getLibrosMongo,
   updateLibroMongo,
   softDeleteLibroMongo,
} = require('../libro/libro.actions.js');

const Libro = require('../libro/libro.model.js');

jest.mock('../libro/libro.model');
jest.mock('../login/login.actions', () => ({
    verificarTokenJWT: (req, res, next) => {
        req.userId = 1; // Asignar un valor de userId por defecto para los tests
        next();
    }
}));

const app = express();
app.use(express.json());
const libroRuta = require("../libro/libro.route.js");
app.use("/libro", libroRuta);

describe("Pruebas de integración de libro controlador-acción", () => {

    describe("create libro", () => {

        test("Crear un libro - válido", async () => {
                            
            const datos = { titulo: 'Nuevo Libro', vendedor: 'vendedor1' };
            const libroCreado = { _id: 'libro1', ...datos };
            

            Libro.create.mockResolvedValue(libroCreado);

            const result = await createLibro(datos);
            expect(result).toEqual(libroCreado);

        });

        test("Crear un libro - inválido", async () => {
                            
            const datos = { titulo: 'Nuevo Libro'};
            const libroCreado = { _id: 'libro1', ...datos };
            

            Libro.create.mockImplementation(() => { throw new Error('Datos inválidos') });

            expect(createLibro(datos)).rejects.toThrow('Datos inválidos');

        });
    });

    describe("Read libro", () => {

        test("leer un libro - válido", async () => {
                            
            const id = 'libro1';
            const libro = { _id: id, titulo: 'Libro de Prueba' };
            

            Libro.findById.mockResolvedValue(libro);

            const result = await readLibro(id);
            expect(result).toEqual(libro);

        });

        test("leer un libro - inválido(no existe)", async () => {
                            
            const id = 'libro1';
            const libro = { _id: id, titulo: 'Libro de Prueba' };
            

            Libro.findById.mockResolvedValue(null);

            await expect(readLibro(id)).rejects.toThrow('{"code":400,"msg":"Libro no existe"}')

        });

        test("leer un libro - inválido(eliminado)", async () => {
                            
            const id = 'libro1';
            const libro = { _id: id, titulo: 'Libro de Prueba', isDeleted: true  };
            

            Libro.findById.mockResolvedValue(libro);

            await expect(readLibro(id)).rejects.toThrow('{"code":400,"msg":"Libro no existe"}')

        });

        test("leer libros con filtros - válido", async () => {
                            
            const query = { genero: 'Ficción', todo: 'true' };
            const libros = [
              { _id: 'libro1', titulo: 'Libro de Ficción' },
              { _id: 'libro2', titulo: 'Otro Libro de Ficción' },
            ];
            

            Libro.countDocuments.mockResolvedValue(2);
            Libro.find.mockResolvedValue(libros);

            const result = await readLibroConFiltros(query);
            expect(result.resultados).toEqual(libros);

        });

        test("leer libros con filtros - inválido(sin coincidencias)", async () => {
                            
            const query = { genero: 'Ficción', todo: 'true' };
            const libros = [
              { _id: 'libro1', titulo: 'Libro de Ficción' },
              { _id: 'libro2', titulo: 'Otro Libro de Ficción' },
            ];
            

            Libro.countDocuments.mockResolvedValue(0);
            Libro.find.mockResolvedValue(null);

            const result = await readLibroConFiltros(query);
            expect(result.cantidadLibros).toEqual(0);
            expect(result.resultados).toEqual(null);

        });

    });

    describe("update libro", () => {

        test("actualizar un libro - válido", async () => {
                            
            const datos = { _id: 'libro1', titulo: 'Libro Actualizado' };
            const userId = 'vendedor1';
            const libro = { _id: 'libro1', vendedor: { toHexString: () => userId } };
            const libroActualizado = { _id: 'libro1', titulo: 'Libro Actualizado ya'};
            
            Libro.findById.mockResolvedValue(libro);
            Libro.findByIdAndUpdate.mockResolvedValue(libroActualizado);


            const result = await updateLibro(datos, userId);
            expect(result).toEqual(libroActualizado);

        });

        test("actualizar un libro - inválido", async () => {
                            
            const datos = { };
            const userId = 'vendedor1';
            const libro = { _id: 'libro1', vendedor: { toHexString: () => userId } };
            
            Libro.findById.mockResolvedValue(libro);
            Libro.findByIdAndUpdate.mockImplementation(() => { throw new Error('Datos inválidos') });


            await expect(updateLibro(datos, userId)).rejects.toThrow('Datos inválidos');

        });

    });

    describe("delete libro", () => {

        test("borrar un libro - válido", async () => {
                            
            const id = 'libro1';
            const userId = 'vendedor1';
            const libro = { _id: id, vendedor: { toHexString: () => userId } };
            const libroEliminado = { _id: id, isDeleted: true };

            Libro.findByIdAndUpdate.mockResolvedValue(libroEliminado);
            Libro.findById.mockResolvedValue(libro);


            const result = await deleteLibro(id, userId);
            expect(result).toEqual(libroEliminado);

        });

        test("borrar un libro - inválido", async () => {
                            
            const id = 'id invalida';
            const userId = 'vendedor1';
            const libro = { _id: id, vendedor: { toHexString: () => userId } };
            const libroEliminado = { _id: id, isDeleted: true };

            Libro.findByIdAndUpdate.mockImplementation(() => { throw new Error('ID inválido') });
            Libro.findById.mockResolvedValue(libro);
            await expect(deleteLibro(id, userId)).rejects.toThrow('ID inválido');

        });


        
    });

});