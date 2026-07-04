1. Sobre la estructura de datos y reglas de negocio
───────────────────────────────────────────────────

Roles
 1. ¿Los roles aplican:
  ◦ a nivel global (mismos roles para toda la organización)?
  ◦ o por área (role "Líder" en Área A y también "Líder" en Área B pero son cosas independientes)?
  - respuesta: hay roles globales y hay roles particulares de cada area

 2. El límite máximo de personas por rol:
  ◦ ¿es global para toda la organización? (ej: máximo 3 “Coordinadores” en todo el sistema)
  ◦ ¿o por área? (ej: cada área puede tener máximo 3 “Coordinadores”)
  - respuesta: limites globales para roles globales asi como limites de roles de area

 3. El rol ADMIN:
  ◦ ¿Es un solo usuario específico?
  ◦ ¿O cualquier persona que tenga el rol "ADMIN" tiene superpoderes?
  - respuesta: un grupo de usuarios seran ADMIN pero tienen que pertenecer al area principal, es decir, el area que esta sobre todas las areas

Áreas y jerarquías
 4. Las sub-áreas:
  ◦ ¿pueden tener sub-sub-áreas (árbol profundo) o solo 1 nivel (área -> sub-área)?
  ◦ ¿Una persona puede ser responsable de varias áreas al mismo tiempo?
  - respuesta: arbol profundo, pero para iniciar todo debe haber un area raiz de la cual parten las demas
  - respuesta: una persona puede ser responsable de varias areas al mismo tiempo

 5. Cuando dices: "otra persona de otra area no puede asistir a un evento de otra area"
  ◦ ¿Sub-áreas cuentan como la misma área para este caso?
    ▪ Ej: Persona pertenece al Área A1 (sub-área de A). ¿Puede ir a un evento del Área A?
      ▫ a) Sí, porque es de la misma rama
      ▫ b) No, solo eventos del área exacta a la que pertenece
    - respuesta: una persona de una sub-area puede asistir a eventos de areas mas arriba

 6. Cada área:
  ◦ ¿Puede tener más de un responsable?
  ◦ Tú dijiste: “una persona como responsable y opcional un ayudante” → entiendo:
    ▪ exactamente 1 responsable
    ▪ 0 o 1 ayudante
   ¿Correcto?
   - respuesta: es correcto este razonamiento

Personas / Identidad
 7. CURP “casera”:
  ◦ ¿Quieres que yo implemente la generación automática de esa variante (a partir de nombre + apellidos + fecha de nacimiento)?
  ◦ ¿O tú solo quieres que ese campo exista y sea único, y el usuario lo escriba manualmente?
  - respuesta: implemanta de manera automatica

 8. Si dos personas tienen mismo nombre completo y misma fecha de nacimiento:
  ◦ ¿No se pueden registrar? (porque el identificador sería igual)
  ◦ ¿O permitimos duplicados agregando, no sé, un sufijo aleatorio?
  - respuesta: no debe haber duplicados, estos casos los debe poder revisar el administrador y generar un sufijo aleatorio pero con aprobacion
    de un admin

 9. ¿Necesitas manejo de validación “en vivo”?
   Ej: mientras el usuario escribe, ya le diga si esa persona/rol/área ya existe, o con que sea al guardar está bien.
   - respuesta: validación en vivo

───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

2. Relaciones entre Personas, Roles y Áreas
───────────────────────────────────────────

10. Dijiste:
  ◦ “cada persona puede pertenecer a uno o mas roles pero no puede estar dos veces en el mismo rol”
  ◦ “cada persona puede pertenecer a uno o mas grupos de personas pero no puede estar dos veces en el mismo grupo con el mismo rol”

   Entonces, para pertenecer a un área, ¿la relación es:
   Persona + Área + Rol (como una membresía con rol)?
   Ejemplo: Juan es “Coordinador” en Área A y “Miembro” en Área B.
   ¿Es ese el modelo que quieres?
   - respuesta: Si

11. ¿Una persona puede pertenecer a un área sin ningún rol asignado?
  ◦ Yo sugeriría que NO, pero quiero confirmarlo.
  - respuesta: hay un rol por default llamado ASISTENTE, si no se le asigna un rol este sera su rol, en ese sentido

12. Para responsable/ayudante del área:
  ◦ ¿su rol se define por un rol especial? (ej: rol “RESPONSABLE_DE_AREA”)
  ◦ ¿o simplemente marcamos en el área: responsable = Persona X, ayudante = Persona Y, independientemente de sus roles?
  - respuesta: pienso que al crear un area se deben definir tambien los roles validos para esta area y en ese sentido la persona responsable
    tendra un rol especifico

───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

3. Eventos y Asistencia
───────────────────────

13. “cada responsable o ayudante de un area puede crear un evento”
  ◦ ¿Desde la app vamos a simular login de usuarios (auth básica) para saber “quién soy”?
  ◦ ¿O simplemente en el formulario de crear evento se selecciona el área y asumimos que el backend validaría que el usuario puede hacerlo?
  - respuesta: simular una autenticacion basica


14. “a cada evento pueden asistir las personas que pertenecen a esta area del encargado del area”
  ◦ ¿Eso significa que solo las personas miembros del área (o sub-área, si aplica) pueden ser agregadas a la lista de asistencia?
  - respuesta: asi es
  ◦ ¿Permitimos registrar asistencia manual (checklist) solo de los miembros? (o sea, el selector deja elegir solo miembros del área)
  - respuesta: si

15. Si alguien deja de pertenecer a un área:
  ◦ ¿qué pasa con sus asistencias históricas a eventos de esa área?
  - respuesta: soft delete, existe en la base pero no se visualiza
  ◦ Asumo: se mantienen (histórico no se borra), ¿te late?

16. Fechas del evento:
  ◦ ¿requiere validación de que fecha_fin >= fecha_inicio? (yo asumo que sí)
  - respuesta: si
  ◦ ¿Manejo de zonas horarias? ¿O nos quedamos simple: solo fechas (sin hora) por ahora?
  - respuesta: por ahora solo horario del centro de mexico

───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

4. Nivel de prototipo / UI / Tecnologías
────────────────────────────────────────

17. Sobre el stack React + Redux:
  ◦ ¿Te parece bien usar Redux Toolkit (RTK) en lugar de Redux pelón? (mucho menos boilerplate, mucho más sano)
  - respuesta: si
  ◦ ¿Quieres React Router para tener pantallas separadas (Personas, Roles, Áreas, Eventos, etc.)?
  - respuesta: si

18. Estilo/UI:
  ◦ ¿Alguna preferencia?
    ▪ a) Nada de librerías, solo CSS simple
    ▪ b) Tailwind
    ▪ c) MUI / Ant Design / Chakra UI
   (Para un prototipo yo tiraría por MUI o similar, pero tú mandas.)
   - respuesta: MUI esta bien

19. Idioma de la app:
  ◦ ¿Todo en español? (labels, mensajes, etc.)
  ◦ ¿Te da igual y lo ponemos en inglés técnico?
  - respuesta: idioma en español pero codigo en ingles

20. ¿Quieres que haya:
  ◦ búsquedas / filtros en listas?
  - respuesta: si
  ◦ paginación (aunque sea fake)?
  - respuesta: si
  ◦ o con tener listas sencillas y formularios de alta/edición/borrado te basta para este prototipo?

───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

5. Mocks del backend
────────────────────

21. Para simular el backend:
  ◦ ¿Prefieres:
    ▪ a) Estado en memoria con “fake API calls” (promesas con setTimeout)?
    ▪ b) Algo tipo json-server o MSW (Mock Service Worker)?
   Para un prototipo rápido yo usaría servicios fake en memoria con Promises, así es más simple y auto-contenido.
    - respuesta: haz algo que simule la funcionalidad pero que sea facil de migrar cuando ya se tenga el backend real

22. ¿Quieres que simulemos también errores del backend?
  ◦ Ej: si intentas agregar persona a un rol que ya está lleno, que la fake-API regrese error y Redux lo maneje.
  - respusta: si

───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

6. Persistencia y migración a backend real
──────────────────────────────────────────

- En la fase de solo frontend usamos un "fake backend" en `src/api/fakeApi.js`.
- Ese fake backend mantiene un objeto `db` en memoria con:
  - users, roles, areas, areaCategories, people, events, attendances.
- Para no perder los datos al recargar el navegador:
  - Se persiste `{ db, idCounter }` en `localStorage` bajo la clave `managant-db-v1`.
  - En el arranque se intenta leer ese JSON y, si existe, se usa en lugar del seed por defecto.
  - Cada vez que se crea/actualiza/borra algo relevante (roles, áreas, personas, eventos, asistencias):
    - Se actualiza `db` en memoria.
    - Se vuelve a guardar en `localStorage`.
- Esto NO forma parte del diseño del backend real, es solo una ayuda de desarrollo:
  - Cuando tengamos backend Java, el origen de verdad será la BD.
  - El contrato de la API se basará en las funciones públicas de `fakeApi` y sus reglas de negocio.

───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

7. Reglas de autorización actuales (fase frontend/fakeApi)
──────────────────────────────────────────────────────────

- Solo usuarios con rol ADMIN (en el modelo de negocio) deberían poder:
  - acceder y operar sobre módulos de:
    ▪ Personas (`/personas`),
    ▪ Roles (`/roles`),
    ▪ Áreas (`/areas`),
  - crear usuarios de acceso (`/usuarios`).
- La creación de eventos está permitida para:
  - el responsable del área,
  - el ayudante del área,
  - y también usuarios con rol ADMIN.
- En la implementación actual de solo frontend:
  - Usamos `username === 'admin'` como aproximación de "usuario con rol ADMIN".
  - La pantalla de administración de usuarios (`/usuarios`) y el menú de Roles/Áreas
    solo son accesibles si `currentUser.username === 'admin'`.
  - Las rutas `/roles`, `/areas`, `/usuarios` están protegidas en el router
    con un `AdminRoute` que redirige a `/eventos` si el usuario no es admin.
  - La ruta `/personas` es accesible a cualquier usuario autenticado, pero:
    ▪ Si es ADMIN, ve y puede editar/crear a todas las personas.
    ▪ Si NO es ADMIN pero es responsable (o ayudante) de una o más áreas, puede:
      · seleccionar una de sus áreas como raíz y ver las personas asignadas a esa área y a todas sus sub-áreas.
      · no tiene opciones de creación/edición desde esta vista.
    ▪ Si no es ADMIN ni responsable de ninguna área, ve un mensaje de "sin permiso".
  - Los botones de creación/edición/borrado en Personas/Roles/Áreas quedan, por diseño,
    solo al alcance del rol ADMIN.
  - En el módulo de eventos (`/eventos`):
    - Cualquier usuario autenticado puede abrir el formulario de "Nuevo evento".
    - El fake backend valida que solo responsable/ayudante/ADMIN puedan realmente crear el evento.
  - En el módulo de reportes (`/reportes`):
    - ADMIN puede seleccionar cualquier área como raíz y ver personas/eventos de toda su rama.
    - Un responsable de área puede seleccionar solo entre las áreas donde es responsable/ayudante,
      y ve el resumen de personas/eventos de esa rama.
  - Las reglas de backend simulado (`fakeApi`) incluyen además:
    - Para crear eventos (`createEvent`):
      ▪ Permitido si el `createdByPersonId` es responsable del área,
        ayudante del área, **o** tiene rol `ADMIN`.
- Cuando se implemente el backend real en Java:
  - Esta lógica de autorización deberá moverse al backend
    usando el rol ADMIN real (no basándonos en el `username`).

