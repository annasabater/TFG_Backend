# TFG: Implementació d'un joc de combat de drons amb Flutter, Node.js i Python

Una API REST per la Contribució al Drone Engineering Ecosystem, implementada amb Node.js i TypeScript, Express i MongoDB. Inclou autenticació amb JWT i documentació automàtica via Swagger.


## Taula de continguts

1. [Requisits previs](#requisits-previs)  
2. [Instal·lació de dependències](#instal·lacio-de-dependencies)  
3. [Configuració](#configuracio)  
4. [Execució](#execucio)  
5. [Documentació Swagger](#documentacio-swagger)  
6. [Vídeo](#vídeo)  
7. [Principals dependències](#principals-dependencies)  
8. [Dependències de desenvolupament](#dependencies-de-desenvolupament)  


## Requisits previs

- **Node.js** ≥ 16.x (https://nodejs.org/)
- **MongoDB** (https://www.mongodb.com/)


## Instal·lació

Clona el repositori i executa la següent comanda per instal·lar les dependències: 
npm install

cal afegir els paquets per a la seguretat i tipus de JWT i bcrypt:
npm install bcryptjs jsonwebtoken
npm install --save-dev @types/bcryptjs @types/jsonwebtoken


## Execució

Per iniciar l'API (tsc + cd ./build + node server.js): 
npm start


## Documentació
Un cop l’API està en funcionament, la documentació interactiva està disponible a:
http://localhost:9000/api-docs


## Vídeo
Enllaç del vídeo del recorregut pel codi: https://www.youtube.com/watch?v=DVfZwvJzVrI


## Dependències Principals
- `dotenv`: Gestió de variables d'entorn.
- `mongodb` i `mongoose`: Base de dades MongoDB.
- `swagger-jsdoc` i `swagger-ui-express`: Generació de documentació.
- `express`: Framework per a l'API.


## Dependències de Desenvolupament
- `typescript`: Suport per a TypeScript.
- `@types/*`: Definicions de tipus per a biblioteques utilitzades.