\*\*\*\*# Manual de Usuario – Sistema de Gestión Neploy

Este manual está diseñado para orientar a los usuarios en el uso correcto del sistema, desde la configuración inicial hasta la gestión completa de gateways y equipos de trabajo.

---

## 1. Configuración Inicial

La configuración inicial se realiza una única vez, justo después del despliegue del sistema. Tiene como propósito establecer los parámetros fundamentales del entorno y registrar al **usuario administrador principal** que liderará la gestión.

Esta configuración solo está disponible si **el sistema aún no ha sido inicializado**.

### 🔐 Paso 1: Conexión con GitHub o GitLab

El sistema permite autenticar al primer usuario mediante una cuenta de:

- GitHub
- GitLab

Una vez autorizada la conexión, el sistema recupera automáticamente:

- Nombre de usuario (`username`)
- Correo electrónico (`email`)
- Proveedor (`provider` = `github` o `gitlab`)

> 📌 Este usuario será registrado como **administrador principal**.

### 🧍 Paso 2: Datos del Administrador

Además del correo y proveedor, el sistema solicitará completar los siguientes datos del administrador:

| Campo                     | Validación                            |
| ------------------------- | ------------------------------------- |
| Nombre                    | Requerido, mínimo 2, máximo 64 chars  |
| Apellido                  | Requerido, mínimo 2, máximo 64 chars  |
| Fecha de nacimiento (DOB) | Requerido                             |
| Dirección                 | Requerido, mínimo 2, máximo 128 chars |
| Teléfono                  | Exactamente 10 dígitos                |
| Contraseña                | Requerida, entre 8 y 64 caracteres    |

### 🧱 Paso 3: Creación de Roles Iniciales

Durante la configuración, el sistema te pedirá definir al menos un rol inicial, además del del administrador.

Cada rol incluye:

| Campo       | Descripción                                       |
| ----------- | ------------------------------------------------- |
| Nombre      | Nombre único del rol                              |
| Descripción | Explicación de la función del rol                 |
| Ícono       | Clave de ícono (por ejemplo: `shield`, `user`)    |
| Color       | Color de referencia para UI (ej. `blue`, `green`) |

> ✅ Puedes definir múltiples roles. Ej: `Desarrollador`, `Auditor`, `Infra`, `DevOps`, etc.

### 🧾 Paso 4: Metadatos del Equipo

Para identificar el entorno de trabajo, se solicitan los siguientes datos:

| Campo              | Descripción                                        |
| ------------------ | -------------------------------------------------- |
| Nombre del equipo  | Nombre interno que agrupará a todos los usuarios   |
| Logo del equipo    | URL o imagen cargada que se mostrará en el sistema |
| Idioma del sistema | Idioma por defecto (`es`, `en`, `pt`, `fr`, `zh`)  |

> 🌐 El idioma afectará toda la interfaz inicial, pero puede cambiarse por usuario luego.

### ✅ Finalizar configuración

Una vez completados los pasos anteriores:

- Revisa el resumen de la configuración.
- Haz clic en **Finalizar configuración**.

El sistema:

1. Guarda el administrador y los roles definidos.
2. Establece los metadatos.
3. Redirige al login para comenzar a trabajar.

### Consideraciones importantes

- **Este paso solo se realiza una vez**. Luego, la ruta de configuración inicial estará deshabilitada.
- La configuración puede ser editada más adelante desde **Ajustes**, excepto el usuario administrador original.
- La trazabilidad de esta configuración queda registrada automáticamente.

---

## 2. Inicio de Sesión

El sistema permite el acceso únicamente mediante **credenciales tradicionales**: correo electrónico y contraseña. Este método es sencillo, directo y compatible con los permisos definidos por rol.

### 🔐 Acceso al sistema

1. Dirígete a la ruta `/login`.
2. Ingresa tu **correo electrónico** registrado.
3. Escribe tu **contraseña** (entre 8 y 64 caracteres).
4. Haz clic en **Iniciar sesión**.

Si las credenciales son correctas:

- Serás redirigido automáticamente al **dashboard principal**.

### 🧯 Gestión de errores

En caso de error:

- Si el correo no existe, se mostrará un mensaje de **"Credenciales inválidas"**.
- Si la contraseña es incorrecta, el mismo mensaje será mostrado.
- No se especifica qué campo falló por razones de seguridad.

### ✅ Características del login

- **Sin autenticación social**: no se permite ingresar con Google, GitHub u otros proveedores externos.
- **Sin verificación por correo**: no se requiere confirmar identidad por email tras iniciar sesión.
- **Sin reCAPTCHA**: el sistema no usa verificación de bot al iniciar sesión (pero puede implementarse más adelante si se requiere seguridad extra).

### 🔐 Seguridad

- El sistema implementa validaciones de longitud mínima para contraseñas.
- Los intentos fallidos pueden ser rastreados desde la sección de **Trazabilidad** por administradores.

### 🔄 ¿Olvidaste tu contraseña?

Consulta la sección **9. Recuperación de clave** para conocer el procedimiento de restablecimiento.

---

## 3. Dashboard

El **Dashboard** es la pantalla principal del sistema una vez que el usuario ha iniciado sesión. Ofrece una visión general del comportamiento del entorno, destacando métricas clave y acceso directo a módulos importantes.

### 📊 Panel de métricas

El dashboard muestra tres gráficos principales en tiempo real, con datos obtenidos directamente desde el Gateway y las aplicaciones registradas:

#### 1. Requests en las últimas 24 horas

- **Tipo de gráfico**: Barras verticales
- **Eje X**: Horas del día (0h - 23h)
- **Eje Y**: Cantidad de solicitudes por hora
- **Finalidad**: Detectar picos de tráfico, posibles ataques, o validar despliegues recientes

#### 2. Tecnologías hospedadas

- **Tipo de gráfico**: Torta / Pie chart
- **Segmentos**: Tecnologías registradas por las aplicaciones (ej. Go, Node.js, Python)
- **Finalidad**: Visualizar la diversidad del stack tecnológico dentro del entorno

#### 3. Visitantes por día

- **Tipo de gráfico**: Línea
- **Eje X**: Días de la última semana o mes
- **Eje Y**: Número de visitantes únicos registrados por día
- **Finalidad**: Analizar evolución del uso, campañas de activación, etc.

### ⚙️ Navegación desde el Dashboard

Desde esta vista también puedes acceder rápidamente a otros módulos clave:

- **Aplicaciones**: para ver, crear o gestionar apps
- **Gateway**: para consultar endpoints y versionado
- **Ajustes**: para cambiar configuraciones generales

### 🔐 Visibilidad

- Todos los usuarios con acceso al sistema pueden ver el dashboard.
- La visualización de datos puede variar según los **permisos por rol**.

### 🛡️ Seguridad

- La información mostrada es de **solo lectura**.
- No se expone información sensible como tokens o rutas internas.

---

## 4. Aplicaciones

El módulo **Aplicaciones** permite gestionar todo el ciclo de vida de una aplicación hospedada o desplegada en el entorno. Desde esta sección puedes crear, cargar, desplegar y monitorear múltiples versiones de tus aplicaciones, ya sea desde archivos binarios o desde repositorios Git.

### 🧩 Crear una aplicación

1. Haz clic en **"Crear aplicación"**.
2. Completa el formulario con:
   - Nombre de la app
   - Descripción (opcional)
   - Opción de despliegue:
     - **Subir archivo** `.zip` / `.tar`
     - **Desde repositorio Git** (GitHub o GitLab)
3. Si seleccionas Git:
   - Ingresa la URL del repositorio (solo se aceptan URLs válidas con formato `https://github.com/user/repo`)
   - Selecciona una rama disponible

> El sistema validará automáticamente la estructura del repositorio y descargará las ramas disponibles si la URL es válida.

### 🚀 Despliegue de versiones

El despliegue de versiones puede ser por medio de dos formas, una de ellas es **subiendo un .zip**, en la cual:

- Seleccionas el archivo .zip
- El sistema lo subirá y almacenará en el disco
- Se registrará como una nueva versión

### Por repositorio

- Indica la URL y la rama
- El sistema clonará y construirá la aplicación
- Se mostrará progreso en tiempo real mediante WebSocket (`progress` messages)

**Nota**: si en el archivo docker no se especifica un puerto, el sistema solicitará al usuario que ingrese el puerto a utilizar. Además, para una nueva versión, no se especifica un puerto, el sistema supondrá que se encuentra al puerto siguiente, por ejemplo si se encuentra en el puerto 4000 y desean subir una nueva versión, el sistema asumirá que se subirá al puerto 4001.

### 🔄 WebSocket y Acciones Interactivas

El sistema puede enviar notificaciones de:

- Progreso de despliegue
- Requerimientos adicionales (ej. número de puerto)
- Estado de ejecución

> Algunas acciones requerirán completar formularios dinámicos directamente en el frontend. El usuario debe responder con los datos solicitados (por ejemplo, `port`, `env`).

### 📦 Gestión de aplicaciones

Una vez creada la app:

- Se mostrará como una **tarjeta** en vista de grilla o lista
- Puedes ver sus detalles, estado actual y versiones disponibles
- También puedes:
  - **Eliminar** la aplicación
  - **Ver estadísticas**: cantidad total, activas y con errores
  - **Re-deplegar** una nueva versión

### 🧪 Validaciones

- No se puede crear una aplicación sin nombre
- Si se selecciona Git, la URL debe tener el formato válido y la rama debe estar definida
- Se puede usar archivo o repo, pero **al menos uno debe estar presente**

---

## 5. Gateway

El módulo de Gateway en el sistema es un componente de **solo lectura** que permite visualizar cómo están expuestas las aplicaciones a través del API Gateway y configurar el **tipo de versionado** utilizado para las rutas de acceso.

### Acceso al Módulo

Desde el menú lateral, haz clic en **"Gateway"** para ingresar al módulo.

### Visualización de Configuración

La vista del módulo incluye:

- Lista de endpoints activos por aplicación.
- Estado y versión publicada de cada endpoint.
- Tipo de versionado configurado globalmente para la API.

---

### Tipos de Versionado

La configuración admite dos tipos de versionado:

1. **Por URI**:

   - Las rutas incluyen explícitamente la versión en el path.
   - Ejemplo: `/v1.0.0/myApp/endpoint`

2. **Por HTTP Headers**:
   - La versión se indica mediante un encabezado HTTP personalizado.
   - Ejemplo:
     ```
     GET /myApp/endpoint
     X-API-Version: 1.0.0
     ```

### Limitaciones

- No se permite crear, modificar ni eliminar endpoints desde esta vista.
- Los cambios en las rutas o versiones deben hacerse desde el origen de la aplicación o vía despliegue.

---

### Propósito

Este módulo permite a desarrolladores y operadores:

- Verificar cómo están siendo expuestas las versiones actuales.
- Confirmar que las rutas están accesibles según la convención de versionado esperada.
- Auditar rápidamente el estado del enrutamiento del sistema sin requerir acceso al backend o a configuraciones sensibles.

---

## 6. Ajustes

El módulo de **Ajustes** permite gestionar la configuración general del sistema, los roles de usuarios y las tecnologías disponibles (TechStacks). Está dividido en cuatro secciones independientes:

- **General**
- **Roles**
- **TechStack**
- **Trazabilidad** (actividad reciente de los usuarios)

### ⚙️ General

Aquí se configuran los parámetros básicos del sistema:

#### Campos disponibles:

- **Nombre del equipo**: Identificador visible en el dashboard y encabezados.
- **Enlace del logo**: URL de una imagen (`.png`, `.jpg`, `.svg`) utilizada como branding.
- **Idioma predeterminado**: Lenguaje que se aplicará por defecto a nuevos usuarios (por ahora soporta `es`, `en`, `fr`, `pt`, `zh`).

> 💾 Todos los campos se pueden modificar en cualquier momento. Los cambios se aplican en tiempo real para nuevos usuarios y vistas.

### 👥 Roles

Desde esta sección puedes gestionar los roles y sus asignaciones:

#### Acciones disponibles:

- **Crear nuevo rol**: Define nombre, descripción, ícono (por clase `lucide` o string) y color.
- **Editar rol existente**: Modificar cualquier campo de un rol ya creado.
- **Eliminar rol**: Solo si no está asignado a usuarios.
- **Asignar usuarios a roles**: Selecciona usuarios existentes y asócialos a uno o más roles.
- **Eliminar usuarios de roles**: Desvincula un usuario sin eliminar su cuenta.

#### Notas:

- Los roles son usados para controlar permisos dentro del sistema.
- Se pueden definir roles como `Auditor`, `Operador`, `Backend`, `Lider`, etc., según tu estructura organizativa.

### 🧱 TechStack

Administra las tecnologías que pueden seleccionarse al registrar aplicaciones:

#### Campos:

- **Nombre**: Identificador de la tecnología (`Node.js`, `Go`, `Rails`, etc.).
- **Descripción** (opcional).
- **Ícono o etiqueta visual** (si aplica).

#### Acciones permitidas:

- **Crear tecnología**
- **Editar tecnología**
- **Eliminar tecnología**: Solo si **no está en uso por ninguna aplicación**.

> 📦 Las tecnologías conectadas a una o más aplicaciones no pueden eliminarse hasta que todas las apps asociadas sean modificadas o eliminadas.

### 🔍 Trazabilidad (actividad reciente)

Esta subsección permite auditar la actividad reciente del sistema. Las acciones son registradas con:

- Fecha y hora
- Usuario que ejecutó la acción
- Módulo afectado
- Acción realizada (`"Editó rol"`, `"Actualizó logo"`, `"Cambió idioma"`, etc.)

> 🛡️ Solo los usuarios con permisos de administrador pueden visualizar esta sección.

### Observaciones

- Todos los cambios en Ajustes son auditables.
- No es necesario confirmar cambios por correo.
- Las modificaciones se aplican de inmediato en la mayoría de los casos.

---

## 7. Perfil

El módulo de **Perfil** permite que cada usuario gestione su propia cuenta dentro del sistema. Es una sección individual, accesible desde el menú superior o desde el menú lateral en la opción **"Perfil"**.

### Información visible

El perfil muestra los siguientes datos del usuario:

- **Nombre completo** (FirstName + LastName)
- **Correo electrónico**
- **Nombre de usuario (username)**
- **Rol asignado**
- **Idioma actual**
- **Fecha de nacimiento**
- **Dirección**
- **Número telefónico**
- **Proveedor de autenticación** (`GitHub`, `GitLab` o `manual`)

### Acciones disponibles

#### ✏️ Editar perfil

El usuario puede actualizar su:

- Nombre
- Dirección
- Teléfono
- Otra información valiosa que requiera actualizar

### 🔐 Cambio de contraseña

- El usuario puede cambiar su contraseña desde esta sección sin requerir confirmación por correo.
- Debe proporcionar:
  - La contraseña actual
  - La nueva contraseña (mínimo 8 caracteres, máximo 64)
  - Confirmación de la nueva contraseña

> ⚠️ La contraseña se actualiza inmediatamente después de confirmar.

---

## 8. Equipo

El módulo **Equipo** permite a los administradores gestionar a los usuarios registrados en el sistema. Desde aquí se pueden invitar nuevos miembros, asignar roles y supervisar la estructura del equipo técnico.

Para añadir un nuevo usuario al sistema:

1. Haz clic en **"Invitar usuario"**.
2. Ingresa el **correo electrónico** de la persona a invitar.
3. Selecciona uno o más **roles** que se le asignarán.
4. Envía la invitación.

> El invitado recibirá un correo con un enlace para registrarse y completar sus datos personales.

### 🎭 Roles asignados

Durante la invitación, el rol se selecciona directamente desde una lista predefinida de roles personalizados.

- Un usuario puede tener **uno o varios roles**.
- Los permisos disponibles dependerán del rol asignado.

> 📌 Los roles deben ser creados previamente desde **Ajustes → Roles**.

### 👥 Gestión del equipo

Dentro del listado de usuarios se puede:

- Ver información básica: nombre, correo, rol/es asignados.
- **Editar roles**: agregar o eliminar roles existentes.
- **Desactivar usuarios**: impedir su acceso al sistema sin eliminar su cuenta.
- **Eliminar usuarios** (si no hay registros críticos asociados).

### 🛡️ Control de acceso

- Solo usuarios con privilegios de **Administrador** pueden acceder a esta sección.
- Toda modificación en el equipo queda registrada en **Trazabilidad**.

### Consideraciones

- El correo electrónico no puede modificarse después de la invitación.
- Si el usuario no completa el registro, su invitación puede ser reenviada o eliminada.
- Un usuario desactivado no puede iniciar sesión hasta ser reactivado por un administrador.

## 9. Recuperación de Clave

El sistema permite recuperar el acceso mediante un flujo de restablecimiento de contraseña completamente automatizado. Este proceso está diseñado para ser **rápido, seguro y sin intervención manual** por parte de los administradores.

### 1. Iniciar recuperación

1. Dirígete a `/login`.
2. Haz clic en el enlace **“¿Olvidaste tu contraseña?”**.
3. Introduce tu **correo electrónico registrado**.

> Si el correo es válido, recibirás un enlace de recuperación por email.

### 2. Verificar el enlace

- El enlace que recibirás incluirá un **token temporal único**.
- Este enlace redirige a un formulario seguro para establecer una nueva contraseña.

### 🕒 Duración del token

- **Válido por 2 horas** desde su emisión.
- **No se invalida automáticamente** en el backend al usarse una vez.
- El token solo se considera inválido cuando la nueva contraseña es establecida.

> ⚠️ Esto significa que, mientras no se cambie la clave, el mismo enlace puede seguir siendo válido dentro del periodo.

### 3. Establecer nueva contraseña

1. En el formulario de restablecimiento:
   - Escribe tu nueva contraseña (mín. 8, má
