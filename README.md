# Prueba Fullstack Jr - AuthCrud

Aplicación fullstack desarrollada como prueba técnica para una posición Junior.

El proyecto incluye una API REST en .NET 8, frontend en React, autenticación JWT, roles, CRUD de usuarios, refresh tokens, auditoría, carga de avatar, Docker Compose y CI básico con GitHub Actions.

---

## Repositorio

El repositorio está organizado en dos carpetas principales:

```text
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
```

- `backend/`: contiene la API en .NET 8.
- `frontend/`: contiene la aplicación React con Vite.

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

## Requisitos previos

Para ejecutar el proyecto localmente se necesita:

- .NET 8 SDK
- Node.js
- npm
- SQL Server local o SQL Server en Docker
- Docker Desktop, opcional pero recomendado
- Git

---

## Variables de entorno y configuración

### Backend

La configuración principal del backend está en:

```text
backend/AuthCrud.Api/appsettings.json
```

Ejemplo de configuración:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=AuthCrudDb;Trusted_Connection=True;TrustServerCertificate=True"
  },
  "Jwt": {
    "Key": "EstaEsUnaClaveSuperSecretaParaJWT123456789!",
    "Issuer": "AuthCrudApi",
    "Audience": "AuthCrudFrontend",
    "ExpiresInMinutes": "60"
  }
}
```

### Frontend

El frontend usa la variable:

```env
VITE_API_URL=http://localhost:5118/api
```

Si se desea usar archivo `.env`, debe crearse en:

```text
frontend/.env
```

con este contenido:

```env
VITE_API_URL=http://localhost:5118/api
```

---

## Conexión a SQL Server

El proyecto puede usar SQL Server local o el SQL Server levantado con Docker Compose.

### SQL Server local

Ejemplo de connection string:

```json
"DefaultConnection": "Server=localhost;Database=AuthCrudDb;Trusted_Connection=True;TrustServerCertificate=True"
```

### SQL Server con Docker Compose

Cuando se ejecuta con Docker Compose, SQL Server queda disponible en:

```text
localhost,14333
```

Y la API se conecta internamente al servicio `sqlserver` definido en `docker-compose.yml`.

---

## Migraciones y creación de base de datos

El proyecto usa migraciones de Entity Framework Core.

Las migraciones están en:

```text
backend/AuthCrud.Api/Migrations
```

Para crear o actualizar la base de datos localmente:

```powershell
cd backend/AuthCrud.Api
dotnet ef database update
```

Este comando crea la base de datos y aplica todas las migraciones necesarias.

También se incluye un seeder que crea usuarios de prueba al iniciar la API.

---

## Credenciales de prueba

### Administrador

```text
Email: admin@demo.com
Password: Admin123!
```

### Usuario normal

```text
Email: user@demo.com
Password: User123!
```

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

## Ejecutar con Docker Compose

Desde la raíz del proyecto:

```powershell
docker compose up --build -d
```

Servicios disponibles:

```text
Frontend: http://localhost:5173
Swagger:  http://localhost:5118/swagger
SQL Server: localhost,14333
```

Para detener los servicios:

```powershell
docker compose down
```

---

## Ejecutar backend localmente

Desde la carpeta del backend:

```powershell
cd backend/AuthCrud.Api
dotnet restore
dotnet ef database update
dotnet run
```

Swagger estará disponible en:

```text
http://localhost:5118/swagger
```

---

## Ejecutar frontend localmente

Desde la carpeta del frontend:

```powershell
cd frontend
npm install
npm run dev
```

Frontend disponible en:

```text
http://localhost:5173
```

---

## Instrucciones Swagger para probar la API

Swagger está disponible en:

```text
http://localhost:5118/swagger
```

### 1. Login

Abrir el endpoint:

```text
POST /api/Auth/login
```

Usar las credenciales de administrador:

```json
{
  "email": "admin@demo.com",
  "password": "Admin123!"
}
```

La respuesta devuelve:

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": {}
}
```

### 2. Autorizar Swagger

Copiar el `accessToken`.

Luego hacer clic en el botón:

```text
Authorize
```

Pegar el token JWT y confirmar.

### 3. Probar endpoints protegidos

Con el token autorizado se pueden probar endpoints como:

```text
GET /api/Users
POST /api/Users
PUT /api/Users/{id}
DELETE /api/Users/{id}
POST /api/Users/{id}/avatar
```

---

## Endpoints principales

### Auth

```text
POST /api/Auth/register
POST /api/Auth/login
POST /api/Auth/refresh
POST /api/Auth/logout
```

### Users

```text
GET    /api/Users
GET    /api/Users/{id}
POST   /api/Users
PUT    /api/Users/{id}
DELETE /api/Users/{id}
POST   /api/Users/{id}/avatar
```

---

## Extras implementados

- Refresh tokens con revocación.
- Auditoría con `CreatedBy` y `UpdatedBy`.
- Logging con Serilog.
- Paginación, ordenamiento y filtrado en API.
- Carga de avatar con validación de tipo y tamaño.
- Accesibilidad básica con labels, `aria-live` y `role="alert"`.
- Docker Compose.
- CI básico.
- Política de contraseñas.
- Bloqueo tras intentos fallidos.
- Rate limiting básico.
- UI con loaders, feedback y estados vacíos.

---

## Notas

- Los avatars se almacenan localmente en `wwwroot/uploads/avatars`.
- El proyecto usa JWT Bearer, por lo que CSRF no aplica de la misma forma que en autenticación basada en cookies.
- Para producción se recomienda usar secretos seguros, almacenamiento externo para archivos y variables de entorno.

---

## Mejoras futuras

- Separar completamente lógica de negocio en servicios.
- Agregar pruebas unitarias e integración.
- Implementar recuperación de contraseña.
- Agregar confirmación de email.
- Mejorar observabilidad y métricas.
- Agregar Lighthouse y lazy loading.

---

## Autor

María Paula Fernández