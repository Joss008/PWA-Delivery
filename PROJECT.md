````
## Stack técnico

### PWA Repartidor

Next.js
TypeScript
Tailwind CSS
shadcn/ui
SQLite
Service Worker

La PWA utilizará Next.js tanto para frontend como para backend.

Las APIs necesarias para autenticación, solicitudes, estados y ubicación se implementarán utilizando Route Handlers de Next.js.

SQLite será utilizado como base de datos de la aplicación.

## Arquitectura

La PWA del repartidor será una aplicación independiente construida con Next.js.

Arquitectura:

Repartidor
→ PWA Next.js
→ API Next.js
→ SQLite

La aplicación deberá integrarse con la plataforma web existente para compartir información de pedidos y ubicación.

Flujo de ubicación:

GPS del dispositivo
→ PWA
→ API Next.js
→ SQLite
→ Plataforma Web
→ Mapa

Mientras el repartidor tenga la PWA abierta, la aplicación utilizará `navigator.geolocation.watchPosition()` para detectar cambios de ubicación y enviarlos al backend.

## Funcionalidades principales

### Repartidor

- Iniciar sesión.
- Permitir acceso a ubicación GPS.
- Enviar ubicación en tiempo real mientras la PWA esté activa.
- Visualizar bandeja de pedidos.
- Visualizar detalle del pedido.
- Aceptar o rechazar pedidos.
- Actualizar estado del pedido.
- Consultar pedidos anteriores.
- Recibir alertas mediante Telegram.

## Estados de pedido

Los estados serán:

- `PENDIENTE`
- `ASIGNADO`
- `EN_CAMINO`
- `ENTREGADO`

Flujo principal:

`PENDIENTE → ASIGNADO → EN_CAMINO → ENTREGADO`

Un pedido rechazado no se asigna al repartidor y continúa disponible para otro repartidor.

## Pantallas de la PWA

### Login

Inicio de sesión del repartidor.

### Inicio

Mostrar:

- Estado del repartidor.
- Estado del GPS.
- Pedido activo, si existe.
- Acceso rápido a solicitudes.

### Solicitudes

Bandeja de pedidos con filtros:

- Pendientes
- Asignados
- En camino
- Entregados

Cada pedido deberá mostrar:

- Código.
- Empresa.
- Dirección de recojo.
- Dirección de entrega.
- Fecha.
- Estado.

### Detalle del pedido

Según el estado mostrar:

`PENDIENTE`

- Aceptar
- Rechazar

`ASIGNADO`

- Iniciar entrega

`EN_CAMINO`

- Marcar como entregado

`ENTREGADO`

- Solo consulta

### Perfil

Mostrar:

- Nombre del repartidor.
- Estado.
- Estado del GPS.
- Cerrar sesión.

## Geolocalización

Al iniciar sesión o abrir la aplicación se solicitará permiso de ubicación.

Utilizar:

`navigator.geolocation.watchPosition()`

Enviar:

- repartidorId
- latitude
- longitude
- accuracy
- timestamp

La ubicación deberá actualizarse mientras la PWA se encuentre activa.

No enviar coordenadas en cada cambio mínimo. Aplicar un intervalo o una distancia mínima para evitar actualizaciones innecesarias.

## API

Crear Route Handlers de Next.js para:

- `/api/auth/login`
- `/api/pedidos`
- `/api/pedidos/[id]`
- `/api/pedidos/[id]/aceptar`
- `/api/pedidos/[id]/rechazar`
- `/api/pedidos/[id]/estado`
- `/api/repartidor/ubicacion`

## Base de datos

SQLite deberá almacenar como mínimo:

### repartidores

- id
- nombre
- telefono
- usuario
- password
- estado
- latitude
- longitude
- ultimaUbicacion

### pedidos

- id
- codigo
- empresa
- direccionRecojo
- direccionEntrega
- observaciones
- estado
- repartidorId
- createdAt
- updatedAt

### ubicaciones

Opcionalmente registrar historial:

- id
- repartidorId
- latitude
- longitude
- accuracy
- timestamp

Para el MVP puede mantenerse únicamente la última ubicación en `repartidores`.

## Instrucciones para el agente de código

Construye exclusivamente la PWA para repartidores.

No reconstruyas el panel web existente mostrado en el proyecto.

La aplicación debe utilizar:

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- SQLite

Utiliza Next.js como frontend y backend mediante Route Handlers.

Prioriza diseño mobile-first.

Implementar primero:

1. Login.
2. Layout móvil.
3. Geolocalización.
4. Envío de ubicación.
5. Bandeja de pedidos.
6. Detalle de pedido.
7. Aceptar/rechazar.
8. Cambio de estados.
9. Integración con Telegram.
10. Manifest y Service Worker.
````