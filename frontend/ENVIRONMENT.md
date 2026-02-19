# Configuracion de Environments (Angular)

Este proyecto usa archivos de `environment` para centralizar URLs de APIs y evitar endpoints hardcodeados en servicios.

## Archivos

- `src/environments/environment.ts`
- `src/environments/environment.development.ts`
- `src/environments/environment.production.ts`

Cada uno define:

```ts
const apiBaseUrl = 'https://localhost:7163';

export const environment = {
  production: false, // true en production
  apiBaseUrl,
  apiUrl: `${apiBaseUrl}/api`,
  geoApiUrl: 'https://apis.datos.gob.ar/georef/api'
};
```

## Como funciona

Los servicios consumen:

- `environment.apiUrl` para endpoints del backend (`/api/...`)
- `environment.apiBaseUrl` para mensajes o referencia de host
- `environment.geoApiUrl` para el servicio georeferencial externo

Ejemplo de uso en un service:

```ts
private apiUrl = `${environment.apiUrl}/Cliente`;
```

## Seleccion del archivo segun build

En `angular.json` se configuraron `fileReplacements`:

- Build `production` usa `environment.production.ts`
- Build `development` usa `environment.development.ts`

## Que cambiar cuando tengas la API deployada

1. Editar `src/environments/environment.production.ts`
2. Cambiar:

```ts
const apiBaseUrl = 'https://localhost:7163';
```

por tu URL deployada, por ejemplo:

```ts
const apiBaseUrl = 'https://mi-api.midominio.com';
```

No hace falta tocar los servicios.

## Flujo recomendado

1. Local:
   - Mantener `localhost` en `environment.development.ts`
2. Deploy:
   - Poner URL real en `environment.production.ts`
3. Build de produccion:
   - `npm run build`

## Nota

Si en el futuro agregas un nuevo servicio, siempre usar `environment.apiUrl` para construir su endpoint base.
