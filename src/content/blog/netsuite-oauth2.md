---
title: "Conexión a NetSuite con OAuth 2.0: Authorization Code Grant"
pubDate: 2025-04-07
description: "Cómo autorizar una aplicación para actuar en nombre de un usuario en NetSuite con OAuth 2.0 (Authorization Code + PKCE), con ejemplos en Node.js y Python."
author: "Jorge Espinoza Espinoza"
tags: ["NetSuite", "OAuth 2.0", "SuiteTalk", "Integraciones"]
---

---

OAuth 2.0 es el mecanismo correcto cuando tu aplicación necesita actuar **en nombre de un usuario**: un portal que muestra a cada cliente sus propias facturas, un add-in que consulta datos del vendedor que lo usa, un proceso que publica aprobaciones en nombre de un aprobador. Si tu caso es una integración servidor a servidor sin usuario en el medio, lo que buscas es el flujo [Client Credentials (M2M)](/blog/netsuite-m2m/).

Un matiz que en NetSuite confunde a muchos: los **scopes no otorgan permisos sobre los datos**. El scope solo habilita la superficie de API (REST Web Services, RESTlets, SuiteAnalytics); los permisos reales de datos los hereda el token del **rol del usuario que autorizó**. Esto explica la escena clásica de "el token es válido pero me da `PERMISSION_VIOLATION`".

> Este post es parte de una serie sobre autenticación en NetSuite. Si aún no sabes qué método te corresponde, empieza por el [índice con la comparativa de métodos](/blog/netsuite-auth-methods/).

## Cómo funciona el flujo

1. Tu aplicación redirige al usuario a la página de login de NetSuite, identificándose con su Client ID.
2. El usuario inicia sesión y autoriza (o rechaza) los scopes solicitados.
3. NetSuite redirige a tu `redirect_uri` con un `code` de autorización (corta vida, de un solo uso).
4. Tu aplicación canjea el `code` por un `access_token` y un `refresh_token`, autenticándose con su Client Secret.
5. Tu aplicación usa el `access_token` (Bearer) para llamar a la API, y el `refresh_token` para renovarlo sin molestar otra vez al usuario.

## Paso 1: Configuración en NetSuite

Necesitas permisos de administrador.

### 1.1 Habilitar características

Ve a `Setup > Company > Enable Features`, pestaña `SuiteCloud`:

- `OAUTH 2.0`
- `REST WEB SERVICES` (o `RESTLETS`, según lo que consuma tu aplicación)

### 1.2 Crear el registro de integración

Ve a `Setup > Integration > Manage Integrations > New`:

- **Name:** algo descriptivo, ej. `Portal Clientes - OAuth2`.
- **State:** `Enabled`.
- Pestaña `Authentication`:
  - Marca **Authorization Code Grant**.
  - **Redirect URI:** la URL exacta de tu callback, ej. `https://miapp.com/oauth2/callback`. NetSuite la compara de forma exacta (esquema, host y path incluidos), así que define desde ya si será con o sin `www`, con o sin trailing slash.
  - **OAuth 2.0 Scopes:** marca solo lo necesario: `REST WEB SERVICES`, `RESTLETS`, `SUITEANALYTICS WORKBOOK`... Nada de marcar todo "por si acaso".
- Guarda. NetSuite muestra el **Client ID** y el **Client Secret**. El secreto se muestra una sola vez: guárdalo directo en tu gestor de secretos, no en un bloc de notas.

### 1.3 Permiso del rol de los usuarios que autorizan

Detalle que se olvida con frecuencia: para autenticarse vía OAuth 2.0, el rol del usuario que autoriza la aplicación necesita el permiso **Log in Using OAuth 2.0 Tokens** (pestaña `Setup`). Sin él, el login de NetSuite rechaza el acceso con un error genérico de credenciales.

Y como el token hereda los permisos del rol de ese usuario, para aplicaciones internas mi recomendación es un **usuario de servicio** dedicado por aplicación, con un rol de privilegios mínimos. Evita autorizar con tu usuario admin: un token robado valdría tanto como tus credenciales.

## Paso 2: Flujo de autorización en tu aplicación

### 2.1 Construir la URL de autorización

Redirige al usuario (un HTTP 302 desde tu backend) a:

```
https://<ACCOUNT_ID>.app.netsuite.com/app/login/oauth2/authorize.nl
```

con estos parámetros en el query string:

| Parámetro | Valor | Notas |
| --- | --- | --- |
| `response_type` | `code` | Fijo |
| `client_id` | Tu Client ID | De la integración (1.2) |
| `redirect_uri` | Tu callback | Idéntico al configurado en NetSuite |
| `scope` | ej. `rest_webservices` | Espacio separa múltiples scopes |
| `state` | Valor aleatorio por sesión | Verificación anti-CSRF: obligatorio, no opcional |
| `code_challenge` | Hash SHA-256 del verifier | PKCE (ver abajo) |
| `code_challenge_method` | `S256` | PKCE |

Sobre **PKCE**: NetSuite lo soporta con `S256` y viene endureciendo los requisitos de las integraciones nuevas en cada release. Genera un `code_verifier` aleatorio, envía su SHA-256 como `code_challenge`, y conserva el verifier en la sesión para el canje. Cuesta tres líneas y cierra la puerta al robo de código de autorización.

Ejemplo de URL armada:

```text
https://1234567.app.netsuite.com/app/login/oauth2/authorize.nl
  ?response_type=code
  &client_id=abcdef12345
  &redirect_uri=https%3A%2F%2Fmiapp.com%2Foauth2%2Fcallback
  &scope=rest_webservices
  &state=xyz789
  &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
  &code_challenge_method=S256
```

### 2.2 El usuario autoriza

El usuario inicia sesión en NetSuite y ve la pantalla de consentimiento con los scopes solicitados. Si acepta, NetSuite redirige a tu callback:

```text
https://miapp.com/oauth2/callback?code=def456&state=xyz789
```

Valida que el `state` devuelto coincida con el de la sesión antes de tocar el `code`.

### 2.3 Canjear el code por tokens

`POST` al endpoint de token con Basic auth (`client_id:client_secret` en Base64):

```bash
curl -X POST \
  'https://1234567.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -H 'Authorization: Basic <BASE64_CLIENT_ID:CLIENT_SECRET>' \
  --data-urlencode 'grant_type=authorization_code' \
  --data-urlencode 'code=def456' \
  --data-urlencode 'redirect_uri=https://miapp.com/oauth2/callback' \
  --data-urlencode 'code_verifier=<EL_VERIFIER_DE_LA_SESION>'
```

Respuesta exitosa:

```json
{
  "access_token": "an_access_token_string",
  "refresh_token": "a_refresh_token_string",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

El `access_token` vive 1 hora. El `refresh_token` te permite renovarlo sin nueva autorización — trátalo como una credencial de larga vida, porque lo es.

## Paso 3: Implementación de referencia

### Node.js (Express)

```js
import crypto from "node:crypto";
import express from "express";
import session from "express-session";

const CLIENT_ID = process.env.NETSUITE_CLIENT_ID;
const CLIENT_SECRET = process.env.NETSUITE_CLIENT_SECRET;
const ACCOUNT_ID = process.env.NETSUITE_ACCOUNT_ID; // ej. 1234567 o 1234567_SB1
const REDIRECT_URI = "https://miapp.com/oauth2/callback";
const SCOPES = "rest_webservices";

const AUTHORIZE_URL = `https://${ACCOUNT_ID}.app.netsuite.com/app/login/oauth2/authorize.nl`;
const TOKEN_URL = `https://${ACCOUNT_ID}.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token`;

const app = express();
app.use(session({ secret: process.env.SESSION_SECRET, cookie: { httpOnly: true, secure: true } }));

const basicAuth = () =>
  `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`;

// 1. Iniciar el flujo
app.get("/login", (req, res) => {
  const state = crypto.randomBytes(16).toString("hex");
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");

  req.session.oauth = { state, verifier };

  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });

  res.redirect(`${AUTHORIZE_URL}?${params}`);
});

// 2. Callback: validar state y canjear el code
app.get("/oauth2/callback", async (req, res) => {
  const { code, state } = req.query;
  const oauth = req.session.oauth;

  if (!oauth || state !== oauth.state) {
    return res.status(400).send("state inválido (posible CSRF)");
  }

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: basicAuth(),
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: oauth.verifier,
    }),
  });

  if (!response.ok) return res.status(502).send(await response.text());

  const tokens = await response.json(); // { access_token, refresh_token, expires_in, ... }
  // Persistir tokens asociados al usuario: BD con cifrado o gestor de secretos.
  // Nunca exponer el refresh_token al navegador.
  res.send("Autorización completada");
});
```

### Python (Flask)

```python
import base64
import hashlib
import os
import secrets
from urllib.parse import urlencode

import requests
from flask import Flask, redirect, request, session

app = Flask(__name__)
app.secret_key = os.environ["FLASK_SECRET"]

CLIENT_ID = os.environ["NETSUITE_CLIENT_ID"]
CLIENT_SECRET = os.environ["NETSUITE_CLIENT_SECRET"]
ACCOUNT_ID = os.environ["NETSUITE_ACCOUNT_ID"]      # ej. 1234567 o 1234567_SB1
REDIRECT_URI = "https://miapp.com/oauth2/callback"
SCOPES = "rest_webservices"

AUTHORIZE_URL = f"https://{ACCOUNT_ID}.app.netsuite.com/app/login/oauth2/authorize.nl"
TOKEN_URL = f"https://{ACCOUNT_ID}.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token"


@app.route("/login")
def login():
    state = secrets.token_urlsafe(16)
    verifier = secrets.token_urlsafe(48)
    challenge = (
        base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest())
        .rstrip(b"=")
        .decode()
    )
    session.update(state=state, verifier=verifier)

    params = {
        "response_type": "code",
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "scope": SCOPES,
        "state": state,
        "code_challenge": challenge,
        "code_challenge_method": "S256",
    }
    return redirect(f"{AUTHORIZE_URL}?{urlencode(params)}")


@app.route("/oauth2/callback")
def callback():
    if request.args.get("state") != session.get("state"):
        return "state inválido (posible CSRF)", 400

    basic = base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()
    res = requests.post(
        TOKEN_URL,
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": f"Basic {basic}",
        },
        data={
            "grant_type": "authorization_code",
            "code": request.args["code"],
            "redirect_uri": REDIRECT_URI,
            "code_verifier": session["verifier"],
        },
        timeout=30,
    )
    res.raise_for_status()
    tokens = res.json()  # { access_token, refresh_token, expires_in, ... }
    # Persistir tokens asociados al usuario: BD con cifrado o gestor de secretos.
    return "Autorización completada"
```

## Paso 4: Consumir la API

El access token viaja como Bearer. Ejemplo leyendo un cliente:

```bash
curl -X GET \
  'https://1234567.suitetalk.api.netsuite.com/services/rest/record/v1/customer/123' \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H 'Prefer: transient'
```

Recuerda: la respuesta dependerá de los permisos del rol del usuario que autorizó, no de los scopes del token.

## Paso 5: Renovar el token

Cuando el access token expire (o mejor, antes: con margen de 1-2 minutos), usa el refresh token:

```bash
curl -X POST \
  'https://1234567.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -H 'Authorization: Basic <BASE64_CLIENT_ID:CLIENT_SECRET>' \
  --data-urlencode 'grant_type=refresh_token' \
  --data-urlencode 'refresh_token=<TU_REFRESH_TOKEN>'
```

Dos detalles de la respuesta:

- NetSuite suele devolver un `refresh_token` nuevo en cada renovación (**rotación**). Cuando ocurra, persiste el nuevo y descarta el anterior — si sigues usando el viejo, tarde o temprano fallará.
- Los refresh tokens no son eternos: expiran por tiempo o por inactividad. Cuando eso pase, el endpoint responde `invalid_grant` y la única salida es repetir el flujo completo de autorización. Diseña esa re-autorización como un flujo normal, no como una excepción.

Helper en Node.js:

```js
export async function refreshAccessToken(refreshToken) {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: basicAuth(),
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    // invalid_grant => refresh token expirado/revocado: requerir re-autorización
    throw new Error(`Error renovando token: ${await response.text()}`);
  }
  return response.json(); // puede incluir refresh_token nuevo: persistirlo
}
```

Y en Python:

```python
def refresh_access_token(refresh_token):
    basic = base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()
    res = requests.post(
        TOKEN_URL,
        headers={"Authorization": f"Basic {basic}"},
        data={"grant_type": "refresh_token", "refresh_token": refresh_token},
        timeout=30,
    )
    if res.status_code != 200:
        # invalid_grant => refresh token expirado/revocado: requerir re-autorización
        raise RuntimeError(f"Error renovando token: {res.text}")
    return res.json()  # puede incluir refresh_token nuevo: persistirlo
```

## Troubleshooting: errores comunes

| Error | Causa probable | Solución |
| --- | --- | --- |
| Login rechazado con error de credenciales | El rol del usuario no tiene **Log in Using OAuth 2.0 Tokens** | Agrega el permiso al rol (1.3) |
| `redirect_uri` mismatch / `INVALID_REDIRECT_URI` | El callback no coincide carácter por carácter con el configurado | Compara esquema, host, puerto, path y trailing slash |
| `400 invalid_grant` al canjear el code | El `code` ya fue usado, expiró, o el `redirect_uri` del canje difiere del de la autorización | El code es de un solo uso y vive minutos; canjéalo inmediatamente con la misma URI |
| `400 INVALID_CLIENT` | Basic auth malformado | Es Base64 de `client_id:client_secret` (con los dos puntos), sin espacios extra |
| `state` inválido en el callback | Sesión perdida entre `/login` y el callback (cookies, múltiples tabs) | Revisa la configuración de sesión; nunca deshabilites la validación de state |
| `PERMISSION_VIOLATION` en llamadas API | El rol del usuario no tiene permiso sobre ese registro/transacción | Ajusta el rol del usuario que autorizó; los scopes no otorgan permisos de datos |
| `401` tras ~1 hora de funcionamiento | Access token expirado | Renueva con el refresh token (Paso 5), idealmente de forma proactiva |
| Renovación falla con `invalid_grant` | Refresh token expirado o revocado | Repetir el flujo de autorización completo |

## Consideraciones de seguridad

- **Client Secret solo en el backend.** Jamás en código de frontend ni en apps móviles distribuidas. Si tu cliente es público (SPA sin backend), el canje debe vivir en un BFF.
- **PKCE siempre**, incluso siendo cliente confidencial. Es gratis y es la dirección en la que va NetSuite.
- **`state` en cada inicio de flujo**, validado en el callback. Un `state` fijo o reutilizable anula la protección CSRF.
- **Tokens en reposo:** cifrados en base de datos o en un gestor de secretos; el refresh token con el mismo cuidado que una contraseña. Al navegador nunca le entregues nada más que indicadores de sesión propios.
- **Usuario de servicio con rol mínimo** para apps internas, en lugar de credenciales de personas. Revisa periódicamente qué integraciones están autorizadas y revoca las muertas (`Manage Integrations` muestra el uso; los tokens también pueden revocarse desde ahí).
- **Manejo de revocación:** si un integrador deja el proyecto, revoca sus tokens. Un refresh token sin dueño vigente es deuda de seguridad.

## Cierre

El Authorization Code Grant es más largo que un simple login con usuario y contraseña, y esa longitud es exactamente el punto: ninguna credencial viaja entre tu app y NetSuite, el usuario puede revocar el acceso sin cambiar su contraseña, y tú puedes auditar y rotar todo de forma independiente.

Si tu integración no necesita identidad de usuario —sincronizaciones, jobs, middleware— el flujo [Client Credentials (M2M)](/blog/netsuite-m2m/) es más simple de operar. Entre ambos cubres prácticamente cualquier integración contra NetSuite.
