# Documentación

**TODO: En revisión.**

## Formato

- La documentación debe estar disponible en un directorio **docs** en el primer nivel de el/los repositorios.
- El punto de entrada de la misma será un archivo README.md en el directorio docs y deberá estar linkeada en el README.md del proyecto.
- Los documentos de texto generados por los alumnos deben ser subidos en formato markdown.
- Los documentos que sean generados directamente con una tool o app y no lo exporten en formato markdown podrán ser incluidos en formato pdf. No se admitirán archivos binarios o no formateados como .doc, .odf, .rtf, .txt, etc.
- Los diagramas, esquemas y demás contenido gráfico puede ser incluido utilizando [Mermaid](https://mermaid.js.org) o directamente en formato gráfico que sea compatible con la plataforma de git utilizada; linkeándolos en el documento correspondiente

## Contenido

A continuación se detalla la documentación mínima a incluir para cada entrega
|Contenido - Secciones|Regularidad|Aprobación|
|:-|:-:|:-:|
|proposal actualizada|X|X|
|links a los PR/MR|X|X|
|instrucciones de instalacion|X|X|
|minutas de reunión y avance|X|X|
|tracking de features, bug e issues|X|X|
|documentacion de la API||X|
|evidencia de ejecución de test automáticos||X|
|demo de app en video|TBD|X|
|deploy|TBD|TBD|

## Links a Pull Requests / Merge Requests

El proyecto cuenta con los siguientes Pull Requests históricos:

- [PR #2 - Migración de la interfaz de viajes](https://github.com/Fossa273/tp-Dsw/pull/2) // Si bien solucionó errores asociados al codigo, se dispuso de la herramienta para la migracion a prisma.
- [PR #3 - Compatibilidad de tipos de Prisma](https://github.com/Fossa273/tp-Dsw/pull/3) // Ocurria un error en prisma y se recurrio a la herramienta GitHub Copilot
- [PR #4 - Finalización de la migración de viajes](https://github.com/Fossa273/tp-Dsw/pull/4) // Correccion final del error

El desarrollo posterior también incluyó commits realizados directamente sobre
la rama `main`.

- [Historial de commits de main](https://github.com/Fossa273/tp-Dsw/commits/main)
- [Todos los Pull Requests](https://github.com/Fossa273/tp-Dsw/pulls?q=is%3Apr)

## Documentación de la API

La referencia de endpoints, parámetros, cuerpos JSON, respuestas, errores y
ejemplos se encuentra en [api.md](./doc-api/api.md).

## Instrucciones de instalación

Las instrucciones para instalar, configurar y ejecutar el proyecto se
encuentran en [README.md](./README.md).

## Minutas de reunión y avance

Las minutas y los hitos de avance del grupo se encuentran en
[minutas.md](./minutas.md).

## Tracking de features, bugs e issues

El seguimiento de funcionalidades, bugs conocidos y tareas pendientes se
encuentra en [tracking.md](./tracking.md).
