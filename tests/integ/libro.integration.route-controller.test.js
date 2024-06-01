const request = require("supertest");
const express = require("express");

const {
    readLibroConFiltros,
    readLibro,
    createLibro,
    updateLibro,
    deleteLibro,
} = require('../../libro/libro.controller.js');
const {
   createLibroMongo,
   getLibroMongo,
   getLibrosMongo,
   updateLibroMongo,
   softDeleteLibroMongo,
} = require('../../libro/libro.actions.js');

const Libro = require('../../libro/libro.model.js');

jest.mock('../../libro/libro.actions');
jest.mock('../../libro/libro.model');
jest.mock('../../login/login.actions', () => ({
    verificarTokenJWT: (req, res, next) => {
        req.userId = 1; // Asignar un valor de userId por defecto para los tests
        next();
    }
}));

const app = express();
app.use(express.json());
const libroRuta = require("../../libro/libro.route.js");
app.use("/libro", libroRuta);


describe("Pruebas de integración de libro ruta-controlador", () => {

    describe("create libro", () => {
        
        test("Crear un libro - válido", async () => {
                
            const test_body = { titulo: "100 mosqueteros", vendedor: 'vendedor1', autor: "Gabriel", precio: 500};
            const datos = { titulo: '100 mosqueteros', vendedor: 'vendedor1' };
            const libroCreado = { _id: 'libro1', ...datos };
      
            createLibroMongo.mockResolvedValue(libroCreado);

            const { status, body } = await request(app)
                .post("/libro")
                .send(test_body)
                .set("Accept", "application/json");


            expect(status).toBe(200);
            expect(body).toBeDefined();
            expect(body.mensaje).toBe("Libro creado exitosamente. 👍");
        });

        test("Crear un libro - inválido", async () => {
                
            const test_body = { vendedor: 'vendedor1', autor: "Gabriel", precio: 500};
            const datos = { titulo: '100 mosqueteros', vendedor: 'vendedor1' };
            const libroCreado = { _id: 'libro1', ...datos };
      
            createLibroMongo.mockResolvedValue(libroCreado);

            const { status, body } = await request(app)
                .post("/libro")
                .send(test_body)
                .set("Accept", "application/json");


            expect(status).toBe(400);
            expect(body).toBeDefined();
            expect(body.error).toBe("Debe proporcionar un titulo para el libro");
        });
        
    });

    describe("Read libro", () => {

        test("leer un libro - válido", async () => {
                
            const libroId = 1;
            const libro = { _id: libroId, titulo: 'Libro de Prueba' };
      
            getLibroMongo.mockResolvedValue(libro);

            const { status, body } = await request(app)
            .get(`/libro/${libroId}`)
            .set("Accept", "application/json");

            expect(status).toBe(200);
            expect(body.resultadosBusqueda).toEqual(libro);
        });

        test("leer un libro - inválido", async () => {
                
            const libroId = 1;
            const libro = { _id: libroId, titulo: 'Libro de Prueba' };
      
            getLibroMongo.mockRejectedValue(new Error(JSON.stringify({ code: 400, msg: 'Libro no existe' })));

            const { status, body } = await request(app)
            .get(`/libro/${libroId}`)
            .set("Accept", "application/json");

            expect(status).toBe(400);
            expect(body.error).toEqual('Libro no existe');
        });

        test("leer libros con filtros - válido", async () => {
                
            const query = { genero: 'Ficción', todo: 'true' };
            const mockLibro = [
                { titulo: "100 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 500 },
                { titulo: "200 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 1500 }
            ];
      
            getLibrosMongo.mockResolvedValue({ resultados: mockLibro });

            const { status, body } = await request(app)
            .get("/libro")
            .query(query)
            .set("Accept", "application/json");


            expect(status).toBe(200);
            expect(body).toBeDefined();
            expect(Object.values(body)[0]).toEqual(mockLibro);
        });

        test("leer libros con filtros - inválido", async () => {
                
            const query = { genero: 'Ficción', todo: 'true', filtroInvalido: 'valor' };
            const mockLibro = [
                { titulo: "100 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 500 },
                { titulo: "200 mosqueteros", vendedor: 20, autor: "Gabriel", precio: 1500 }
            ];
      
            getLibrosMongo.mockResolvedValue({ resultados: mockLibro });

            const { status, body } = await request(app)
            .get("/libro")
            .query(query)
            .set("Accept", "application/json");


            expect(status).toBe(400);
            expect(body).toBeDefined();
            expect(body.error).toEqual('No puedes filtrar por eso');
        });

    });

    describe("update libro", () => {

        test("actualizar un libro - válido", async () => {
                
            const test_body = { id: 1, nombre: "Libro Actualizado", email: "rafael_actualizado@gmail.com" };
            const userId = 1;
            const libro = { _id: 1, vendedor: { toHexString: () => userId } };
            const datos = { _id: 1, titulo: 'Libro Actualizado' };

            updateLibroMongo.mockResolvedValue(datos);
            Libro.findById.mockResolvedValue(libro);

            const { status, body } = await request(app)
            .patch("/libro")
            .send(test_body)
            .set("Accept", "application/json");

            expect(status).toBe(200);
            expect(body.mensaje).toBe("Libro actualizado. 👍");
        });

        test("actualizar un libro - inválido(libro ajeno)", async () => {
                
            const test_body = { id: 1, nombre: "Libro Actualizado", email: "rafael_actualizado@gmail.com" };
            const userId = 'vendedor2';
            const libro = { _id: 'libro1', vendedor: { toHexString: () => 'vendedor1' } };
            const datos = { _id: 'libro1', titulo: 'Libro Actualizado' };

            updateLibroMongo.mockResolvedValue(datos);
            Libro.findById.mockResolvedValue(libro);

            const { status, body } = await request(app)
            .patch("/libro")
            .send(test_body)
            .set("Accept", "application/json");

            expect(status).toBe(403);
            expect(body.error).toBe("Usted no es el dueño de este libro");
        });

        test("actualizar un libro - inválido(libro no existe)", async () => {
                
            const test_body = { id: 1, nombre: "Libro Actualizado", email: "rafael_actualizado@gmail.com" };
            const userId = '1';
            const libro = { _id: 'libro1', vendedor: { toHexString: () => 'vendedor1' } };
            const datos = { _id: 'libro1', titulo: 'Libro Actualizado' };

            updateLibroMongo.mockResolvedValue(datos);
            Libro.findById.mockResolvedValue(null);

            const { status, body } = await request(app)
            .patch("/libro")
            .send(test_body)
            .set("Accept", "application/json");

            expect(status).toBe(404);
            expect(body.error).toBe("El libro no existe");
        });

    });

    describe("delete libro", () => {

        test("borrar un libro - válido", async () => {
                
            const libroId = 1;
            const userId = 1;
            const libro = { _id: libroId, vendedor: { toHexString: () => userId } };

            getLibroMongo.mockResolvedValue(libro);
            softDeleteLibroMongo.mockResolvedValue(libro);

            const { status, body } = await request(app)
            .delete(`/libro/${libroId}`)
            .set("Accept", "application/json");

            expect(status).toBe(200);
            expect(body.mensaje).toBe("Libro eliminado. 👍");
        }); 

        test("borrar un libro - inválido(libro ajeno)", async () => {
                
            const libroId = 1;
            const userId = 'vendedor2';
            const libro = { _id: libroId, vendedor: { toHexString: () => userId } };

            getLibroMongo.mockResolvedValue(libro);
            softDeleteLibroMongo.mockResolvedValue(libro);

            const { status, body } = await request(app)
            .delete(`/libro/${libroId}`)
            .set("Accept", "application/json");

            expect(status).toBe(403);
            expect(body.error).toBe('Usted no es el dueño de este libro, no lo puede eliminar');
        }); 

        test("borrar un libro - inválido(libro no existe)", async () => {
                
            const libroId = 1;
            const userId = 1;
            const libro = { _id: libroId, vendedor: { toHexString: () => userId } };

            getLibroMongo.mockResolvedValue(null);
            softDeleteLibroMongo.mockResolvedValue(libro);

            const { status, body } = await request(app)
            .delete(`/libro/${libroId}`)
            .set("Accept", "application/json");

            expect(status).toBe(404);
            expect(body.error).toBe('Libro no encontrado');
        }); 
    });

});