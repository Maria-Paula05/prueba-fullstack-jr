FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY backend/AuthCrud.Api/AuthCrud.Api.csproj backend/AuthCrud.Api/
RUN dotnet restore backend/AuthCrud.Api/AuthCrud.Api.csproj

COPY backend/AuthCrud.Api/ backend/AuthCrud.Api/
WORKDIR /src/backend/AuthCrud.Api

RUN dotnet publish AuthCrud.Api.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

COPY --from=build /app/publish .

EXPOSE 8080

ENTRYPOINT ["dotnet", "AuthCrud.Api.dll"]