# Chasquigo Web Frontend

Este proyecto es una aplicación web desarrollada con Angular utilizando componentes standalone y siguiendo una arquitectura modular y escalable.

## Arquitectura del Proyecto

El proyecto sigue una arquitectura modular organizada en los siguientes directorios principales:

### Core (`/src/app/core`)
Contiene todos los módulos y componentes que no forman parte de la lógica de negocio principal. Incluye:
- Servicios base
- Interceptores
- Guards
- Configuraciones globales
- Componentes base reutilizables

### Features (`/src/app/features`)
Alberga los módulos relacionados con la lógica de negocio principal. Cada módulo de feature sigue la siguiente estructura:
```
feature/
├── components/         # Componentes específicos del módulo
├── services/          # Servicios del módulo
├── models/            # Interfaces y tipos
├── routes.ts          # Configuración de rutas
└── pages/             # Submódulos (si el módulo tiene múltiples rutas)
    └── submodule/
        ├── components/
        ├── services/
        ├── models/
```

### Shared (`/src/app/shared`)
Contiene código compartido entre diferentes módulos:
- Componentes reutilizables
- Directivas
- Pipes
- Servicios compartidos
- Utilidades comunes

### Utils (`/src/app/utils`)
Almacena funciones y código que no encaja en las otras categorías:
- Helpers
- Constantes
- Configuraciones
- Utilidades generales

## Estructura de Módulos

Cada módulo (tanto en features como en core) sigue una estructura consistente:

```
module/
├── components/        # Componentes del módulo
├── services/         # Servicios específicos
├── models/           # Interfaces y tipos
└── routes.ts         # Configuración de rutas
```

Si un módulo tiene múltiples rutas, se crea un directorio `pages/` que contiene submódulos, cada uno siguiendo la misma estructura.

## Tecnologías Principales

- Angular (última versión)
- Componentes Standalone
- Tabler Admin Template
- TypeScript
- RxJS

## Desarrollo

### Requisitos Previos

- Node.js (versión LTS recomendada)
- npm

### Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
ng s
```

### Estructura de Commits

Seguimos las convenciones de commits semánticos:
- feat: Nueva característica
- fix: Corrección de errores
- docs: Cambios en documentación
- style: Cambios que no afectan el significado del código
- refactor: Cambios que no arreglan errores ni añaden funcionalidad
- test: Añadir o corregir tests
- chore: Cambios en el proceso de build o herramientas auxiliares

## Convenciones de Código

- Uso de componentes standalone
- Lazy loading para módulos de features
- Servicios singleton cuando sea apropiado
- Tipado estricto de TypeScript
- Nombres descriptivos para componentes y servicios
- Documentación de código para funciones y clases complejas

## Licencia

[Incluir información de licencia]
