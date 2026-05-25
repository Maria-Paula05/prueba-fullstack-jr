# Prueba Fullstack Jr - AuthCrud

Aplicación fullstack desarrollada como prueba técnica para una posición Junior.

El proyecto incluye una API REST en .NET 8, frontend en React, autenticación JWT, roles, CRUD de usuarios, refresh tokens, auditoría, carga de avatar, Docker Compose y CI básico con GitHub Actions.

---

## Tecnologías

### Backend

- .NET 8
- ASP.NET Core Web API
- Entity Framework Core
- SQL Server
- JWT Bearer Authentication
- BCrypt
- Serilog
- Swagger / OpenAPI
- Rate Limiting

### Frontend

- React
- Vite
- Axios
- CSS
- LocalStorage para manejo de sesión

### DevOps

- Docker Compose
- GitHub Actions
- Git

---

## Funcionalidades principales

- Registro de usuarios.
- Login con JWT.
- Roles `admin` y `user`.
- CRUD de usuarios para administradores.
- Usuario normal puede ver y editar solo su propio perfil.
- Activación y desactivación de usuarios.
- Refresh tokens con revocación.
- Bloqueo temporal tras 5 intentos fallidos.
- Política fuerte de contraseñas.
- Paginación, búsqueda y ordenamiento desde API.
- Auditoría con `CreatedAt`, `UpdatedAt`, `CreatedBy` y `UpdatedBy`.
- Carga de avatar con validación de tipo y tamaño.
- Logging con Serilog.
- Manejo de errores amigable en frontend.
- Docker Compose para levantar API, SQL Server y frontend.
- CI básico con GitHub Actions.

---

## Credenciales de prueba

### Administrador

```text
Email: admin@demo.com
Password: Admin123!
```
### Administrador
```text
Email: user@demo.com
Password: User123!
```
## Estructura 

prueba-fullstack-jr/

├── backend/

│   └── AuthCrud.Api/

├── frontend/

├── .github/

│   └── workflows/

├── docker-compose.yml

├── .dockerignore

├── .gitignore

└── README.md

## Ejecutar con Docker Compose:

**Desde la raíz del proyecto:**
```text
docker compose up --build -d
```
**Servicios Disponibles:**

Frontend: 
```
http://localhost:5173
```
Swagger: 
```
http://localhost:5118/swagger
```
SQL Server: 
```
localhost,14333
```
**Para detener los servicios:**
```
docker compose down
```
## Ejecutar backend localmente:

**Desde la carpeta del backend:(Powershell)**
```
cd backend/AuthCrud.Api
dotnet restore
dotnet ef database update
dotnet run
```
**Swagger:**
```
http://localhost:5118/swagger
```
## Ejecutar frontend localmente:

**Desde la carpeta del frontend:(Powershell)**
```
cd frontend
npm install
npm run dev
```
**Frontend**
```
http://localhost:5173
```
## Endpoints principales:

**Auth:**

POST /api/Auth/register

POST /api/Auth/login

POST /api/Auth/refresh

POST /api/Auth/logout

**Users:**

GET    /api/Users

GET    /api/Users/{id}

POST   /api/Users

PUT    /api/Users/{id}

DELETE /api/Users/{id}

POST   /api/Users/{id}/avatar

## Extras Implementados:

- Refresh tokens con revocación.
- Auditoría con CreatedBy y UpdatedBy.
- Logging con Serilog.
- Paginación, ordenamiento y filtrado en API.
- Carga de avatar con validación de tipo y tamaño.
- Accesibilidad básica con labels, aria-live y role="alert".
- Docker Compose.
- CI básico.
- Política de contraseñas.
- Bloqueo tras intentos fallidos.
- Rate limiting básico.
- UI con loaders, feedback y estados vacíos.

## Notas:

- Los avatars se almacenan localmente en wwwroot/uploads/avatars.
- El proyecto usa JWT Bearer, por lo que CSRF no aplica de la misma forma que en autenticación basada en cookies.
- Para producción se recomienda usar secretos seguros, almacenamiento externo para archivos y variables de entorno.

## Mejoras futuras:

- Separar completamente lógica de negocio en servicios.
- Agregar pruebas unitarias e integración.
- Implementar recuperación de contraseña.
- Agregar confirmación de email.
- Mejorar observabilidad y métricas.
- Agregar Lighthouse y lazy loading.


## Autor:

María Paula Fernández
