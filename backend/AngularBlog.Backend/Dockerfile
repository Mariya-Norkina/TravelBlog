
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app

EXPOSE 10000

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["AngularBlog.Backend.csproj", "./"]
RUN dotnet restore "AngularBlog.Backend.csproj"

COPY . .
RUN dotnet publish "AngularBlog.Backend.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app

COPY --from=build /app/publish .

ENTRYPOINT ["sh", "-c", "dotnet AngularBlog.Backend.dll --urls http://0.0.0.0:${PORT:-10000}"]
