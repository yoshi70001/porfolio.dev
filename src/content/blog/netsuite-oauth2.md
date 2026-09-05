---
title: "Conexión a NetSuite con OAuth 2.0"
pubDate: 2025-04-07
description: "Guía rápida para autorizar aplicaciones de terceros sobre NetSuite con OAuth 2.0 (Authorization Code)."
author: "Jorge Espinoza Espinoza"
tags: ["NetSuite", "OAuth 2.0"]
---

# 🌐 Conexión a NetSuite con OAuth 2.0: Guía Rápida 🚀

OAuth 2.0 es el estándar de la industria para la autorización. Permite que aplicaciones de terceros accedan a recursos de NetSuite en nombre de un usuario, sin exponer las credenciales del usuario.

## 📜 Flujo General de OAuth 2.0 (Authorization Code Grant)

1.  **Tu Aplicación** ➡️ Redirige al Usuario a **NetSuite** para autorización.
2.  **Usuario** 👤 Inicia sesión en NetSuite y autoriza tu aplicación.
3.  **NetSuite** ➡️ Redirige de vuelta a **Tu Aplicación** con un `código de autorización`.
4.  **Tu Aplicación** 🔄 Intercambia el `código de autorización` con **NetSuite** por un `token de acceso` (y un `token de refresco`).
5.  **Tu Aplicación** 🔑 Usa el `token de acceso` para realizar llamadas API a **NetSuite**.

---

## 🛠️ Paso 1: Configuración en NetSuite (Lado del Servidor)

Necesitarás permisos de administrador en NetSuite.

1.  **Habilitar Características:**

    - Ve a `Setup > Company > Enable Features`.
    - En la pestaña `SuiteCloud`, asegúrate de que las siguientes características estén habilitadas:
      - `SERVER SUITESCRIPT` (si planeas usar SuiteScript)
      - `CLIENT SUITESCRIPT` (si planeas usar SuiteScript)
      - `SUITETALK (WEB SERVICES)`
      - `OAUTH 2.0`
    - Guarda los cambios.

2.  **Crear un Registro de Integración:**

    - Ve a `Setup > Integration > Manage Integrations > New`.
    - **Nombre:** Dale un nombre descriptivo a tu integración (ej: "Mi App OAuth2").
    - **Estado:** `Enabled`.
    - **Nota (Opcional):** Descripción de la integración.
    - En la pestaña `Authentication`:
      - Marca la casilla `OAUTH 2.0`.
      - **Grant Type:** Selecciona `AUTHORIZATION CODE GRANT`.
      - **REDIRECT URI(s):** Ingresa la(s) URL(s) a la(s) que NetSuite redirigirá al usuario después de la autorización. Esta debe ser una URL en tu aplicación que pueda manejar el código de autorización. (Ej: `https://miapp.com/oauth2/callback`)
      - **OAUTH 2.0 SCOPES:** Selecciona los permisos necesarios para tu aplicación (ej: `REST WEB SERVICES`, `USER_PROFILE`, `TRANSACTIONS`, etc.).
    - Guarda el registro de integración.

3.  **Obtener Credenciales:**
    - Una vez guardado, NetSuite mostrará el `CLIENT ID` y `CLIENT SECRET`.
    - **¡IMPORTANTE!** Copia y guarda de forma segura el `Client ID` y `Client Secret`. El `Client Secret` no se mostrará de nuevo.

---

## ⚙️ Paso 2: Flujo de Autorización (Lado de tu Aplicación Cliente)

Ahora, en tu aplicación, implementarás el flujo OAuth 2.0.

### 2.1. Solicitud de Autorización del Usuario

Redirige al usuario al endpoint de autorización de NetSuite.
Construye la URL de la siguiente manera:

- **URL Base:** `https://<ACCOUNT_ID>.app.netsuite.com/app/login/oauth2/authorize.nl`

  - Reemplaza `<ACCOUNT_ID>` con tu ID de cuenta de NetSuite (ej: `1234567` o `1234567_SB1` para sandbox). Puedes encontrarlo en `Setup > Company > Company Information > ACCOUNT ID`.

- **Parámetros (Query String):**
  - `response_type=code`
  - `client_id=<TU_CLIENT_ID>` (El Client ID obtenido en el Paso 1.3)
  - `redirect_uri=<TU_REDIRECT_URI>` (La misma URI que configuraste en NetSuite)
  - `scope=<LISTA_DE_SCOPES_SEPARADOS_POR_ESPACIO>` (Ej: `rest_webservices user_profile`)
  - `state=<VALOR_ALEATORIO_SEGURO>` (Opcional pero recomendado para prevenir CSRF)

**Ejemplo de URL de Autorización:**
[https://1234567.app.netsuite.com/app/login/oauth2/authorize.nl?response_type=code&client_id=abcdef12345&redirect_uri=https%3A%2F%2Fmiapp.com%2Foauth2%2Fcallback&scope=rest_webservices%20transactions&state=xyz789](https://www.google.com/url?sa=E&q=https://1234567.app.netsuite.com/app/login/oauth2/authorize.nl?response_type=code&client_id=abcdef12345&redirect_uri=https%3A%2F%2Fmiapp.com%2Foauth2%2Fcallback&scope=rest_webservices%20transactions&state=xyz789)

### 2.2. Usuario Autoriza la Aplicación

El usuario será llevado a la página de login de NetSuite. Después de iniciar sesión, se le presentará una pantalla para autorizar o denegar el acceso a tu aplicación con los scopes solicitados.

### 2.3. NetSuite Redirige con el Código de Autorización

Si el usuario autoriza, NetSuite lo redirigirá a tu `redirect_uri` con:

- `code=<CODIGO_DE_AUTORIZACION>`
- `state=<VALOR_STATE_ORIGINAL>` (si lo enviaste)

**Ejemplo de Redirección:**
`https://miapp.com/oauth2/callback?code=def456&state=xyz789`

Tu aplicación debe capturar este `code`.

### 2.4. Intercambiar el Código por Tokens de Acceso y Refresco

Con el `code` obtenido, tu aplicación debe hacer una petición `POST` al endpoint de token de NetSuite para obtener el `access_token` y `refresh_token`.

- **URL del Token:** `https://<ACCOUNT_ID>.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token`

  - Reemplaza `<ACCOUNT_ID>` con tu ID de cuenta.

- **Método:** `POST`
- **Headers:**

  - `Content-Type: application/x-www-form-urlencoded`
  - `Authorization: Basic <BASE64_ENCODED_CLIENT_ID:CLIENT_SECRET>`
    - Donde `<BASE64_ENCODED_CLIENT_ID:CLIENT_SECRET>` es la cadena `CLIENT_ID:CLIENT_SECRET` codificada en Base64. (Ej: `YWJjZGVmMTIzNDU6c2VjcmV0eHl6Nzg5`)

- **Cuerpo de la Petición (form-urlencoded):**
  - `grant_type=authorization_code`
  - `code=<CODIGO_DE_AUTORIZACION_RECIBIDO>`
  - `redirect_uri=<TU_REDIRECT_URI>`

**Ejemplo de Petición (usando cURL):**

````bash
curl -X POST \
  'https://1234567.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -H 'Authorization: Basic YWJjZGVmMTIzNDU6c2VjcmV0eHl6Nzg5' \
  -d 'grant_type=authorization_code&code=def456&redirect_uri=https%3A%2F%2Fmiapp.com%2Foauth2%2Fcallback'```
````

**_Respuesta Exitosa (JSON):_**

```bash
{
  "access_token": "an_access_token_string",
  "refresh_token": "a_refresh_token_string",
  "expires_in": 3600, // Segundos hasta que el access_token expire (generalmente 1 hora)
  "token_type": "Bearer"
}
```

> **¡IMPORTANTE!** Almacena de forma segura el access_token y el refresh_token. El refresh_token se usa para obtener nuevos access_token cuando el actual expire, sin necesidad de que el usuario vuelva a autorizar.

---

## 🚀 Paso 3: Realizar Peticiones API a NetSuite

Usa el access_token obtenido para autorizar tus llamadas a la API REST de NetSuite.

- **Header de Autorización:** Authorization: Bearer <ACCESS_TOKEN>
- **Header Adicional (para REST):** Prefer: transient (opcional, pero puede ayudar con la concurrencia y el versionado)

**Ejemplo de Petición API (usando cURL para obtener un registro de cliente):**

```bash
curl -X GET \
  'https://<ACCOUNT_ID>.suitetalk.api.netsuite.com/services/rest/record/v1/customer/123' \
  -H 'Authorization: Bearer an_access_token_string' \
  -H 'Prefer: transient'
```

Reemplaza <ACCOUNT_ID> y el ID del cliente (123).

## 🔄 Paso 4: Refrescar el Token de Acceso (Opcional pero Recomendado)

Cuando el access_token expire, usa el refresh_token para obtener uno nuevo.

- **URL del Token:** https://<ACCOUNT_ID>.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token
- **Método:** POST
- **Headers:**

  - Content-Type: application/x-www-form-urlencoded
  - Authorization: Basic <BASE64_ENCODED_CLIENT_ID:CLIENT_SECRET>

- **Cuerpo de la Petición (form-urlencoded):**

  - grant_type=refresh_token
  - refresh_token=<TU_REFRESH_TOKEN_GUARDADO>

**Respuesta Exitosa (JSON):**

```
{
  "access_token": "a_new_access_token_string",
  "expires_in": 3600,
  "token_type": "Bearer"
  // NetSuite puede o no devolver un nuevo refresh_token. Si lo hace, actualiza el que tienes guardado.
}
```

## 💡 Consideraciones Importantes

- **Seguridad del Client Secret:** Trata el Client Secret como una contraseña. No lo expongas en el código del lado del cliente (frontend).
- **Almacenamiento de Tokens:** Almacena los access_token y refresh_token de forma segura (ej: base de datos encriptada, gestor de secretos).
- **Manejo de Errores:** Implementa un manejo robusto de errores para todos los pasos del flujo OAuth y las llamadas API.
- **Parámetro state:** Úsalo para mitigar ataques CSRF. Genera un valor aleatorio antes de redirigir al usuario, guárdalo en la sesión del usuario, y verifica que el valor devuelto por NetSuite coincida.
- **Vigencia de Tokens:** Los access_token suelen tener una vida corta (1 hora). Los refresh_token suelen tener una vida más larga (ej: 7 días, o hasta ser revocados), pero esto puede variar. Consulta la documentación de NetSuite.
- **Scopes:** Solicita solo los scopes (permisos) que tu aplicación realmente necesita.
