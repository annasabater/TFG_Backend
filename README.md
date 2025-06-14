# Prova API

## Minimo 2 David Lamas
EN mi caso me ha tocado realizar el minimo sobre hacer follow y unfollow. En el backend si no me equivoco ya habia 2 rutas follow/unfollow aunque he tenido que hacer un hotfix (ya que habia un parametro mal en un controlador/servicio) y he añadido una ruta nueva de get followers de manera paginada. En el readme del front describiré que cambios he realizado en el. 



## Descripció
Una API per a un servei d'una app de drons, desenvolupada en Node.js amb TypeScript, utilitzant Express, Mongoose per a la gestió de dades en MongoDB, protecció de les routes amb Auth i encriptació de dades escencials amb JWT. A més, s'inclou documentació amb Swagger.

## Requisits previs
Abans d'executar el projecte, assegura't de tenir instal·lat:
- [Node.js](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/)

## Instal·lació
Clona el repositori i executa la següent comanda per instal·lar les dependències:

```sh
npm install
```
per ultim haurem de instalar bcrypt i jsonwebtoken i els seus tipats
```sh
npm install bcryptjs 
npm install jsonwebtoken
```

```sh
npm install @types/bcryptjs 
npm install @types/jsonwebtoken
```

## Configuració
Crea un fitxer `.env` a la arrel del projecte i defineix les següents variables d'entorn//canviar les strings directament en el codi a les línies 16 (Port) i 69 (uri mongo) :
```env
MONGO_URI=mongodb://localhost:27017/la_teva_base_de_dades
PORT=9000
JWT_SECRET=el-teu-secret
```

## Execució
Per iniciar l'API (tsc + cd ./build + node server.js):

```sh
npm start
```

## Documentació
Swagger està disponible a:
```
http://localhost:9000/api-docs
```

## Dependències Principals
- `dotenv`: Gestió de variables d'entorn.
- `mongodb` i `mongoose`: Base de dades MongoDB.
- `swagger-jsdoc` i `swagger-ui-express`: Generació de documentació.
- `express`: Framework per a l'API.

## Dependències de Desenvolupament
- `typescript`: Suport per a TypeScript.
- `@types/*`: Definicions de tipus per a biblioteques utilitzades.