---
title: "Conexión a NetSuite con Machine to Machine"
pubDate: 2025-04-07
description: "Cómo conectar aplicaciones a NetSuite con OAuth 2.0 Machine-to-Machine (Client Credentials), paso a paso."
author: "Jorge Espinoza Espinoza"
tags: ["NetSuite", "OAuth 2.0", "Integraciones"]
---
# ⚙️ Conexión a NetSuite con OAuth 2.0: Flujo M2M (Client Credentials) 🤖

El flujo de "Client Credentials" (Credenciales de Cliente) es un tipo de concesión de OAuth 2.0 que permite a una aplicación (el "cliente") obtener un token de acceso directamente, utilizando sus propias credenciales, sin la intervención de un usuario. Es comúnmente usado para comunicaciones máquina a máquina (M2M).

## 📜 Flujo General de Client Credentials (M2M)

1.  **Tu Aplicación Servidor** ➡️ Envía sus `Client ID` y `Client Secret` a **NetSuite**.
2.  **NetSuite** ✅ Valida las credenciales de la aplicación.
3.  **NetSuite** ➡️ Emite un `token de acceso` directamente a **Tu Aplicación Servidor**.
4.  **Tu Aplicación Servidor** 🔑 Usa el `token de acceso` para realizar llamadas API a **NetSuite**.

---

## 🛠️ Paso 1: Configuración en NetSuite (Lado del Servidor)

Necesitarás permisos de administrador en NetSuite.

1.  **Habilitar Características:**
    *   Ve a `Setup > Company > Enable Features`.
    *   En la pestaña `SuiteCloud`, asegúrate de que las siguientes características estén habilitadas:
        *   `SERVER SUITESCRIPT` (si planeas usar SuiteScript)
        *   `CLIENT SUITESCRIPT` (si planeas usar SuiteScript)
        *   `SUITETALK (WEB SERVICES)`
        *   `OAUTH 2.0`
    *   Guarda los cambios.

2.  **Crear un Registro de Integración:**
    *   Ve a `Setup > Integration > Manage Integrations > New`.
    *   **Nombre:** Dale un nombre descriptivo a tu integración (ej: "Mi Servidor M2M OAuth2").
    *   **Estado:** `Enabled`.
    *   **Nota (Opcional):** Descripción de la integración.
    *   En la pestaña `Authentication`:
        *   Marca la casilla `OAUTH 2.0`.
        *   **Grant Type:** Selecciona `CLIENT CREDENTIALS (MACHINE TO MACHINE)`.
        *   **REDIRECT URI(s):** **NO ES NECESARIO** para el flujo Client Credentials. Puedes dejarlo en blanco o NetSuite podría no mostrar este campo para este grant type.
        *   **OAUTH 2.0 SCOPES:** Selecciona los permisos necesarios para tu aplicación (ej: `REST WEB SERVICES`, `TRANSACTIONS`, etc.). Estos scopes definirán qué puede hacer la aplicación.
    *   Guarda el registro de integración.

3.  **Obtener Credenciales:**
    *   Una vez guardado, NetSuite mostrará el `CLIENT ID` y `CLIENT SECRET`.
    *   **¡IMPORTANTE!** Copia y guarda de forma segura el `Client ID` y `Client Secret`. El `Client Secret` no se mostrará de nuevo.

4.  **Asociar la Integración con un Rol (¡Crucial para M2M!):**
    *   Dado que no hay un usuario que inicie sesión, los permisos de la integración M2M se derivan de un **Rol** específico en NetSuite.
    *   Edita el registro de integración que acabas de crear.
    *   En la subpestaña `OAuth 2.0` (o donde NetSuite lo ubique para M2M), deberías encontrar una sección para **especificar el Rol** cuyas credenciales serán utilizadas por esta integración.
        *   *Nota: La interfaz exacta puede variar ligeramente. La clave es que el sistema necesita saber qué conjunto de permisos usar.*
        *   Usualmente, se crea un rol específico para la integración con los permisos mínimos necesarios.
    *   Asegúrate de que el Rol seleccionado tenga los permisos adecuados para las operaciones API que la aplicación realizará (ej: crear, leer, actualizar, eliminar registros específicos, ejecutar búsquedas guardadas, etc.).

---

## ⚙️ Paso 2: Obtener el Token de Acceso (Desde tu Aplicación Servidor)

Tu aplicación servidor ahora solicitará directamente un token de acceso a NetSuite.

*   **URL del Token:** `https://<ACCOUNT_ID>.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token`
    *   Reemplaza `<ACCOUNT_ID>` con tu ID de cuenta de NetSuite (ej: `1234567` o `1234567_SB1` para sandbox).

*   **Método:** `POST`
*   **Headers:**
    *   `Content-Type: application/x-www-form-urlencoded`
    *   `Authorization: Basic <BASE64_ENCODED_CLIENT_ID:CLIENT_SECRET>`
        *   Donde `<BASE64_ENCODED_CLIENT_ID:CLIENT_SECRET>` es la cadena `CLIENT_ID:CLIENT_SECRET` codificada en Base64. (Ej: `YWJjZGVmMTIzNDU6c2VjcmV0eHl6Nzg5`)

*   **Cuerpo de la Petición (form-urlencoded):**
    *   `grant_type=client_credentials`
    *   `scope=<LISTA_DE_SCOPES_SEPARADOS_POR_ESPACIO>`
        *   Estos deben ser un subconjunto (o todos) los scopes que configuraste en el registro de integración. NetSuite los validará. (Ej: `rest_webservices transactions`)

**Ejemplo de Petición (usando cURL):**
```bash
curl -X POST \
  'https://1234567.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -H 'Authorization: Basic YWJjZGVmMTIzNDU6c2VjcmV0eHl6Nzg5' \
  -d 'grant_type=client_credentials&scope=rest_webservices%20transactions'
```
**Respuesta Exitosa (JSON):**

```bash
{
  "access_token": "an_m2m_access_token_string",
  "expires_in": 3600, // Segundos hasta que el access_token expire (generalmente 1 hora)
  "token_type": "Bearer"
  // Nota: Generalmente NO se devuelve un refresh_token en el flujo Client Credentials.
}
```
**¡IMPORTANTE!** Almacena de forma segura el access_token. Cuando expire, tu aplicación necesitará solicitar uno nuevo repitiendo este Paso 2.
## 🚀 Paso 3: Realizar Peticiones API a NetSuite

Usa el access_token obtenido para autorizar tus llamadas a la API REST de NetSuite.

-   **Header de Autorización:**  Authorization: Bearer <ACCESS_TOKEN>
    
-   **Header Adicional (para REST):**  Prefer: transient (opcional, pero puede ayudar con la concurrencia y el versionado)
    

**Ejemplo de Petición API (usando cURL para crear un registro de cliente):**
```bash
curl -X POST \
  'https://<ACCOUNT_ID>.suitetalk.api.netsuite.com/services/rest/record/v1/customer' \
  -H 'Authorization: Bearer an_m2m_access_token_string' \
  -H 'Content-Type: application/json' \
  -H 'Prefer: transient' \
  -d '{
        "companyName": "Cliente M2M Inc.",
        "subsidiary": {"id": "1"}
      }'
 ```
 Reemplaza <ACCOUNT_ID> y ajusta el cuerpo JSON según tus necesidades.

----------
## 🔄 Paso 4: Manejo de Expiración del Token de Acceso

Los access_token obtenidos mediante el flujo Client Credentials también expiran (generalmente después de 1 hora).

-   **No hay refresh_token:** A diferencia del flujo "Authorization Code", el flujo "Client Credentials" típicamente no emite un refresh_token.
    
-   **Para obtener un nuevo token:** Cuando el access_token actual expire (o esté cerca de expirar), tu aplicación debe **repetir el Paso 2** (solicitar un nuevo token usando grant_type=client_credentials y sus Client ID/Client Secret).
    
-   Tu aplicación debe ser capaz de detectar un error de token expirado (usualmente un HTTP 401 Unauthorized) y solicitar uno nuevo automáticamente.
    

----------

## 💡 Consideraciones Importantes para M2M

-   **Seguridad del Client Secret:** Es **extremadamente crítico** mantener el Client Secret seguro en tu aplicación servidor. Si se compromete, alguien podría obtener tokens de acceso y actuar en nombre de tu aplicación. Utiliza gestores de secretos o variables de entorno seguras.
    
-   **Rol y Permisos:** La integración M2M opera con los permisos del Rol asociado en NetSuite. Asegúrate de que este rol siga el principio de **privilegio mínimo**, concediendo solo los permisos estrictamente necesarios para las tareas de la integración.
    
-   **Scopes:** Los scopes solicitados en la petición de token deben coincidir (o ser un subconjunto) de los scopes configurados en el registro de integración en NetSuite.
    
-   **Auditoría:** Las acciones realizadas a través de una integración M2M se auditarán en NetSuite bajo el contexto del Rol asociado a la integración, no de un usuario específico.
    
-   **Límites de Concurrencia:** Sé consciente de los límites de concurrencia de SuiteTalk. Las aplicaciones M2M pueden generar muchas solicitudes.
---

## 🔑 Conexión M2M con NetSuite usando OAuth 2.0 y JWT Assertion (Clave Pública/Privada)

Este método reemplaza el uso del Client Secret en la solicitud de token por una aserción JWT firmada por la clave privada de tu aplicación. NetSuite verifica esta aserción usando la clave pública que has registrado.

### 📜 Flujo General (Client Credentials con JWT Assertion)

1.  **Tu Aplicación Servidor (Cliente)**:
    
    -   Genera un par de claves RSA (o similar) pública y privada.
        
    -   Construye un JWT (la "aserción").
        
    -   Firma el JWT con su **clave privada**.
        
2.  **Tu Aplicación Servidor** ➡️ Envía una solicitud al endpoint de token de NetSuite, incluyendo:
    
    -   grant_type=client_credentials
        
    -   client_id=<TU_CLIENT_ID>
        
    -   client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
        
    -   client_assertion=<EL_JWT_FIRMADO>
        
3.  **NetSuite**:
    
    -   Recibe la solicitud.
        
    -   Busca la **clave pública** asociada con el Client ID (que registraste previamente).
        
    -   Verifica la firma del client_assertion JWT usando esa clave pública.
        
    -   Valida las "claims" dentro del JWT (emisor, audiencia, expiración, etc.).
        
4.  **NetSuite** ✅ Si todo es válido, emite un token de acceso a **Tu Aplicación Servidor**.
    
5.  **Tu Aplicación Servidor** 🔑 Usa el token de acceso para realizar llamadas API a **NetSuite**.
    

----------

### 🛠️ Paso 1: Preparación y Configuración

1.  **Generar un Par de Claves (Pública y Privada):**
    
    -   Tú, como desarrollador de la aplicación cliente, necesitas generar un par de claves asimétricas (ej. RSA).
        
    -   Guarda la **clave privada** de forma MUY SEGURA en tu servidor. **Nunca la compartas.**
        
    -   Necesitarás la **clave pública** en un formato que NetSuite pueda aceptar (generalmente PEM).
        
    
    ```
    # Ejemplo de generación con OpenSSL (RSA 2048 bits)
    openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048
    openssl rsa -pubout -in private_key.pem -out public_key.pem
    ```
 2. **Configuración en NetSuite (Registro de Integración):**
    
    -   Ve a Setup > Integration > Manage Integrations > New (o edita una existente).
        
    -   **Nombre:** Dale un nombre descriptivo.
        
    -   **Estado:**  Enabled.
        
    -   En la pestaña Authentication:
        
        -   Marca la casilla OAUTH 2.0.
            
        -   **Grant Type:** Selecciona CLIENT CREDENTIALS (MACHINE TO MACHINE).
            
        -   **TOKEN ENDPOINT AUTH METHOD:** Aquí es donde la configuración difiere. Deberías encontrar una opción como:
            
            -   PRIVATE KEY JWT o JWT Bearer Token.
                
        -   **CERTIFICATE (PUBLIC KEY):** Habrá un campo o una forma de **cargar o pegar tu clave pública** (el contenido del archivo public_key.pem generado en el paso anterior).
            
            -   NetSuite también puede requerir que especifiques un Certificate ID o Key ID (kid) que luego incluirás en el encabezado del JWT que generes. Esto ayuda a NetSuite a encontrar la clave correcta si tienes varias registradas para un mismo Client ID.
                
        -   **OAUTH 2.0 SCOPES:** Selecciona los permisos necesarios.
            
    -   Guarda el registro de integración.
        
    -   NetSuite te proporcionará un CLIENT ID. **NO habrá un Client Secret emitido por NetSuite para este método de autenticación de cliente.**
        
3.  **Asociar la Integración con un Rol:**
    
    -   Al igual que con el flujo Client Credentials estándar, los permisos se derivan de un Rol específico en NetSuite asociado a esta integración.
        

----------
### ⚙️ Paso 2: Construir y Firmar el JWT (en tu Aplicación Cliente)

Cuando tu aplicación necesite un token de acceso, debe construir un JWT con las siguientes "claims" (campos) mínimos:

-   iss (Issuer): Tu CLIENT ID (el emisor del JWT es tu aplicación).
    
-   sub (Subject): Tu CLIENT ID (el sujeto del JWT es tu aplicación).
    
-   aud (Audience): La URL del endpoint de token de NetSuite.
    
    -   Ej: https://<ACCOUNT_ID>.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token
        
-   exp (Expiration Time): Fecha de expiración del JWT (corta duración, ej. 5 minutos desde ahora). Formato Unix timestamp.
    
-   jti (JWT ID): Un identificador único para este JWT, para prevenir ataques de repetición.
    

Este JWT luego se **firma usando tu clave privada**. La librería que uses para JWT (ej. jsonwebtoken en Node.js, PyJWT en Python, etc.) se encargará de esto.

----------

### ⚙️ Paso 3: Solicitar el Token de Acceso

Tu aplicación servidor ahora solicita el token de acceso a NetSuite:

-   **URL del Token:**  https://<ACCOUNT_ID>.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token
    
-   **Método:**  POST
    
-   **Headers:**
    
    -   Content-Type: application/x-www-form-urlencoded
        
-   **Cuerpo de la Petición (form-urlencoded):**
    
    -   grant_type=client_credentials
        
    -   client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
        
    -   client_assertion=<EL_JWT_FIRMADO_EN_EL_PASO_ANTERIOR>
        
    -   scope=<LISTA_DE_SCOPES_SEPARADOS_POR_ESPACIO> (opcional si los scopes ya están definidos completamente en la integración, pero buena práctica incluirlo).
        

**Ejemplo de Petición (conceptual):**
```http
POST /services/rest/auth/oauth2/v1/token HTTP/1.1
Host: <ACCOUNT_ID>.suitetalk.api.netsuite.com
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_assertion_type=urn%3Aietf%3Aparams%3Aoauth%3Aclient-assertion-type%3Ajwt-bearer
&client_assertion=eyJhbGciOiJSUzI1NiIsImtpZCI6InNvbWUtcHVibGljLWtleS1pZCJ9.eyJpc3MiOiJYOUR_CLIENT_ID_HERE_AS_ISSUER_AND_SUBJECT...
&scope=rest_webservices%20transactions
```
**Respuesta Exitosa (JSON):**  
Idéntica a la del flujo Client Credentials estándar:

```bash
{
  "access_token": "an_m2m_access_token_string",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```
### 🚀 Pasos Siguientes

-   **Paso 4: Realizar Peticiones API:** Igual que antes, usa el access_token en el header Authorization: Bearer <ACCESS_TOKEN>.
    
-   **Paso 5: Manejo de Expiración del Token:** Cuando el access_token expire, repite los Pasos 2 y 3 (construir nuevo JWT, firmarlo y solicitar nuevo token).
    

----------

### ✅ Ventajas de Usar Clave Pública/Privada (JWT Assertion)

-   **Mayor Seguridad:** La clave privada nunca sale de tu servidor. No se transmite un Client Secret por la red que podría ser interceptado.
    
-   **Estándar de la Industria:** Es una práctica recomendada para la autenticación de clientes M2M.
    

### 🕒 ¿Cuándo se registra la clave pública?

Se registra **durante la configuración del Registro de Integración en NetSuite (Paso 1.2 anterior)**, cuando seleccionas PRIVATE KEY JWT (o similar) como método de autenticación del endpoint de token. Es en ese momento que subes o pegas el contenido de tu archivo public_key.pem.

Este método es más complejo de implementar que el simple Client Secret, pero ofrece una postura de seguridad más robusta.
