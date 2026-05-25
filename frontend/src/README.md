# AuthCrud Fullstack Jr

Proyecto fullstack desarrollado como prueba técnica para una posición Junior.  
Incluye una API REST en .NET 8 con autenticación JWT, roles, CRUD de usuarios, refresh tokens, bloqueo por intentos fallidos, auditoría, carga de avatar y un frontend en React conectado a la API.

---

## Tecnologías utilizadas

### Backend

- .NET 8
- ASP.NET Core Web API
- Entity Framework Core
- SQL Server
- JWT Bearer Authentication
- BCrypt para hash de contraseñas
- Serilog para logging
- Swagger / OpenAPI
- Rate limiting
- Docker

### Frontend

- React
- Vite
- Axios
- CSS
- LocalStorage para manejo de sesión
- Refresh token flow

### DevOps

- Docker Compose
- GitHub Actions CI
- Git

---

## Funcionalidades principales

### Autenticación y autorización

- Registro de usuarios.
- Login con JWT.
- Roles `admin` y `user`.
- Rutas protegidas.
- Autorización por rol.
- Usuario normal solo puede ver y editar su propio perfil.
- Admin puede gestionar usuarios.

### Seguridad

- Hash de contraseñas con BCrypt.
- Política de contraseñas:
  - mínimo 8 caracteres,
  - mayúscula,
  - minúscula,
  - número,
  - carácter especial.
- Bloqueo temporal tras 5 intentos fallidos.
- Rate limiting básico.
- Refresh tokens con revocación.
- Refresh tokens almacenados hasheados.
- Rotación de refresh token en `/api/Auth/refresh`.
- Revocación de refresh token en `/api/Auth/logout`.

### CRUD de usuarios

El administrador puede:

- Listar usuarios.
- Crear usuarios.
- Ver detalle de usuario.
- Editar usuarios.
- Activar/desactivar usuarios.
- Eliminar usuarios.

### Paginación, búsqueda y ordenamiento

La API soporta:

- Paginación por `page` y `size`.
- Búsqueda por nombre o email.
- Ordenamiento por:
  - fecha de creación,
  - nombre,
  - email,
  - rol,
  - estado.

### Auditoría

El sistema registra:

- `CreatedAt`
- `UpdatedAt`
- `CreatedBy`
- `UpdatedBy`

### Avatar

- Carga de avatar por usuario.
- Almacenamiento local en `wwwroot/uploads/avatars`.
- Validación de tipo de archivo:
  - JPG,
  - JPEG,
  - PNG,
  - WEBP.
- Validación de tamaño máximo: 2 MB.
- Visualización del avatar desde frontend.

### Manejo de errores

- Mensajes amigables en frontend.
- Manejo de backend caído.
- Respuestas claras para:
  - email duplicado,
  - usuario no autorizado,
  - token inválido,
  - datos inválidos,
  - usuario bloqueado.

### Accesibilidad básica

- Inputs con labels.
- Mensajes con `aria-live`.
- Errores con `role="alert"`.
- Navegación por botones y formularios.

---

## Credenciales de prueba

### Admin

```text
Email: admin@demo.com
Password: Admin123!

```
### Admin¨
```text
Email: user@demo.com
Password: User123!
```
### Estructura del proyecto 

prueba-fullstack-jr/
├── backend/
│   └── AuthCrud.Api/
│       ├── Controllers/
│       ├── Data/
│       ├── Dtos/
│       ├── Helpers/
│       ├── Migrations/
│       ├── Models/
│       ├── Program.cs
│       └── AuthCrud.Api.csproj
├── frontend/
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── .github/
│   └── workflows/
│       └── ci.yml
├── docker-compose.yml
├── .dockerignore
├── .gitignore
└── README.md

---

## Requisitos previos

Para correr el proyecto localmente se necesita:

- .NET 8 SDK
- Node.js
- SQL Server
- Docker Desktop opcional
- Git

---

## Configuración del backend

Ubicación del backend:

```text
backend/AuthCrud.Api
```

Archivo de configuración principal:

```text
appsettings.json
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

## Variables de entorno del frontend

Archivo:

```text
frontend/.env
```

Contenido:

```env
VITE_API_URL=http://localhost:5118/api
```

---

## Ejecutar con Docker Compose

Desde la raíz del proyecto:

```powershell
docker compose up --build -d
```

Servicios:

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

## Escenarios de prueba

### 1. Registro, login y acceso

- Registrar un usuario.
- Iniciar sesión correctamente.
- Verificar que un usuario normal no pueda acceder al CRUD general de usuarios.

### 2. Admin CRUD

Con `admin@demo.com`:

- Crear usuario.
- Editar nombre.
- Desactivar usuario.
- Activar usuario.
- Eliminar usuario.

### 3. Autorización

- Un usuario con rol `user` intentando editar otro usuario recibe `403 Forbidden`.

### 4. Tokens

- El login genera `accessToken` y `refreshToken`.
- El refresh token permite renovar sesión.
- El logout revoca el refresh token.

### 5. Validaciones

- Email duplicado devuelve error entendible.
- Contraseña débil devuelve mensaje claro.
- Avatar inválido devuelve error por tipo o tamaño.

### 6. Resiliencia

- Si el backend está apagado, el frontend muestra error amigable.

---

## Extras implementados

- Refresh tokens con revocación.
- Auditoría con `CreatedBy` y `UpdatedBy`.
- Logging con Serilog.
- Paginación, ordenamiento y filtrado en API.
- Carga de avatar con validación de tipo y tamaño.
- Accesibilidad básica.
- Docker Compose con API, SQL Server y frontend.
- CI básico con GitHub Actions.
- Política de contraseñas.
- Bloqueo tras intentos fallidos.
- Rate limiting básico.
- Manejo consistente de errores.
- DTOs y separación por carpetas.
- UI con loaders, feedback, estados vacíos y mensajes claros.

---

## CI

El proyecto incluye GitHub Actions en:

```text
.github/workflows/ci.yml
```

El pipeline realiza:

- Restore y build del backend.
- Instalación y build del frontend.

---

## Logs

Los logs del backend se generan con Serilog en:

```text
backend/AuthCrud.Api/Logs
```

La carpeta de logs está ignorada por Git.

---

## Notas importantes

- El proyecto usa JWT Bearer, por lo que CSRF no aplica de la misma forma que en autenticación basada en cookies.
- Los avatars se almacenan localmente en `wwwroot/uploads/avatars`.
- Para producción se recomienda mover archivos a almacenamiento externo y usar secretos seguros para JWT y conexión a base de datos.

---

## Mejoras futuras

- Separar completamente la lógica de negocio en servicios.
- Implementar pruebas unitarias e integración.
- Agregar recuperación de contraseña.
- Agregar confirmación de email.
- Almacenar avatars en cloud storage.
- Mejorar métricas y observabilidad.
- Agregar Lighthouse y lazy loading.

---

## Autor

 María Paula Fernández Jiménez

Desarrollado como prueba técnica Fullstack Junior.