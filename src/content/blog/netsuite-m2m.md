---
title: "Conexión a NetSuite con OAuth 2.0: Client Credentials (M2M)"
pubDate: 2025-04-07
description: "Cómo autenticar integraciones máquina a máquina contra NetSuite con OAuth 2.0 y JWT firmado por certificado, con ejemplos en Node.js y Python."
author: "Jorge Espinoza Espinoza"
tags: ["NetSuite", "OAuth 2.0", "SuiteTalk", "Integraciones"]
---

Cuando una integración necesita hablar con NetSuite sin que haya un usuario sentado frente a un login —un ERP externo sincronizando clientes, un middleware publicando órdenes, un job nocturno consolidando datos— el flujo correcto es **Client Credentials (Machine to Machine)**. A diferencia del flujo [Authorization Code Grant](/blog/netsuite-oauth2/), donde una persona autoriza a la aplicación, aquí la aplicación actúa con credenciales propias.

Hay un detalle que casi todos los tutoriales genéricos de OAuth 2.0 omiten y que en NetSuite es la principal fuente de frustración: **NetSuite no soporta el grant `client_credentials` con Client Secret**. La única forma de autenticar el cliente es mediante un **JWT firmado con la llave privada de un certificado** registrado en la cuenta. Si vienes de otros ERP o APIs donde basta `client_id:client_secret` en un header Basic, este post te va a ahorrar algunas horas de depuración.

> Este post es parte de una serie sobre autenticación en NetSuite. Si aún no sabes qué método te corresponde, empieza por el [índice con la comparativa de métodos](/blog/netsuite-auth-methods/).

## Cómo funciona el flujo

1. Tu aplicación construye un JWT (la *client assertion*) y lo firma con su llave privada.
2. Envía el JWT al endpoint de token de NetSuite, pidiendo un access token con `grant_type=client_credentials`.
3. NetSuite valida la firma contra el certificado público registrado y verifica los claims del JWT.
4. Si todo es válido, emite un access token (Bearer) válido por 60 minutos.
5. Tu aplicación usa ese token en las llamadas a la API (REST Web Services o RESTlets).

Los permisos efectivos de la integración no dependen de scopes únicamente: se derivan de la combinación de **scopes del token** y del **rol** asociado al mapeo M2M. Esto es clave para entender por qué un token "válido" puede igualmente recibir errores de permisos.

## Paso 1: Configuración en NetSuite

Necesitas permisos de administrador. Son cinco sub-pasos: características, integración, rol, par de llaves y mapeo M2M.

### 1.1 Habilitar características

Ve a `Setup > Company > Enable Features`, pestaña `SuiteCloud`, y verifica:

- `OAUTH 2.0`
- `REST WEB SERVICES` (o `RESTLETS`, según lo que consuma tu integración)

Guarda los cambios.

### 1.2 Crear el registro de integración

Ve a `Setup > Integration > Manage Integrations > New`:

- **Name:** algo descriptivo, ej. `Integracion ERP - M2M`.
- **State:** `Enabled`.
- Pestaña `Authentication`:
  - Marca **Client Credentials (Machine to Machine) Grant**.
  - Marca los scopes que usará la aplicación: `REST WEB SERVICES`, `RESTLETS` o `SUITEANALYTICS WORKBOOK`, según el caso. No marques de más: siguen el principio de privilegio mínimo.
- Guarda. NetSuite mostrará el **Client ID**: cópialo. A diferencia del flujo Authorization Code, el Client Secret no se usa en M2M (de hecho, puedes generarlo y ni siquiera almacenarlo).

### 1.3 Crear un rol para la integración

El mapeo M2M requiere un rol explícito. Creo un rol por integración, con lo mínimo indispensable — es tentador reutilizar un rol de integración existente, pero a la larga hace imposible auditar qué aplicación puede tocar qué.

Ve a `Setup > Users/Roles > Manage Roles > New` y dale al rol, como mínimo:

- Pestaña `Setup`:
  - **Log in Using OAuth 2.0 Tokens** (sin esto el token se emite pero las llamadas fallan con `USER_UNAUTHORIZED`)
  - **REST Web Services** (y/o **RESTlets**)
  - **Records Catalog**
- Los permisos sobre los registros que la integración va a manipular (ej. permiso `List > Customer` con nivel Full si va a crear clientes).

### 1.4 Generar el par de llaves

NetSuite espera un certificado X.509 en formato PEM. El comando que recomienda la propia documentación genera una llave EC (curva `prime256v1`), que se firma con algoritmo `ES256`:

```bash
openssl req -new -x509 -newkey ec \
  -pkeyopt ec_paramgen_curve:prime256v1 \
  -nodes -days 365 \
  -out public.pem -keyout private.pem \
  -subj "/CN=Integracion ERP M2M"
```

Dos advertencias que solo se aprenden a las malas:

- La validez máxima que NetSuite acepta es de **2 años** (`-days 730`). Cuando el certificado expire, el endpoint de token empieza a rechazar los JWT sin cambiar nada en tu código. Programa la rotación desde el día uno.
- Guarda `private.pem` en un gestor de secretos (AWS Secrets Manager, Vault, etc.), nunca en el repositorio. `public.pem` es la que se sube a NetSuite.

### 1.5 Crear el mapeo M2M

Este es el paso que la mayoría de guías antiguas no menciona, porque antes la asociación se hacía dentro del registro de integración. Hoy vive en una página aparte:

Ve a `Setup > Integration > Manage Authentication > OAuth 2.0 Client Credentials (M2M) Setup` y crea un nuevo mapeo:

- **Entity:** la integración creada en 1.2.
- **Role:** el rol creado en 1.3.
- **Certificate:** sube `public.pem`.

Al guardar, NetSuite asigna un **Certificate ID** (identificador tipo `nicode1abc...` o similar). Anótalo: es el **`kid`** que va en el header del JWT. Si el `kid` no coincide, la firma no valida, aunque el certificado sea correcto.

## Paso 2: Construir y firmar el JWT

El JWT debe incluir estos claims:

| Claim | Valor | Notas |
| --- | --- | --- |
| `iss` | Client ID de la integración | El emisor eres tú, la aplicación |
| `scope` | ej. `rest_webservices` | Debe ser un scope configurado en la integración |
| `aud` | URL del endpoint de token | Ver abajo |
| `iat` | Timestamp actual (segundos Unix) | |
| `exp` | Expiración del JWT | Vida corta recomendada: 5 minutos. Máximo 60 min desde `iat` |
| `kid` (header) | Certificate ID del mapeo | Así NetSuite sabe qué certificado usar para verificar |

La URL del endpoint de token (y valor de `aud`) es:

```
https://<ACCOUNT_ID>.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token
```

Reemplaza `<ACCOUNT_ID>` por tu ID de cuenta (ej. `1234567`; en sandbox, `1234567_SB1`).

### Ejemplo en Node.js

Con `jsonwebtoken` (`npm install jsonwebtoken`):

```js
import jwt from "jsonwebtoken";
import fs from "node:fs";

const CLIENT_ID = process.env.NETSUITE_CLIENT_ID;
const ACCOUNT_ID = process.env.NETSUITE_ACCOUNT_ID; // ej. 1234567 o 1234567_SB1
const CERTIFICATE_ID = process.env.NETSUITE_CERT_ID; // Certificate ID del mapeo M2M
const PRIVATE_KEY = fs.readFileSync("private.pem", "utf8");

export const TOKEN_URL = `https://${ACCOUNT_ID}.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token`;

export function createClientAssertion(scope = "rest_webservices") {
  const now = Math.floor(Date.now() / 1000);

  return jwt.sign(
    {
      iss: CLIENT_ID,
      scope,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 5 * 60,
    },
    PRIVATE_KEY,
    { algorithm: "ES256", keyid: CERTIFICATE_ID, header: { typ: "JWT" } }
  );
}
```

### Ejemplo en Python

Con `PyJWT` (`pip install pyjwt cryptography requests`):

```python
import os
import time

import jwt  # PyJWT

CLIENT_ID = os.environ["NETSUITE_CLIENT_ID"]
ACCOUNT_ID = os.environ["NETSUITE_ACCOUNT_ID"]      # ej. 1234567 o 1234567_SB1
CERTIFICATE_ID = os.environ["NETSUITE_CERT_ID"]     # Certificate ID del mapeo M2M
PRIVATE_KEY = open("private.pem").read()

TOKEN_URL = f"https://{ACCOUNT_ID}.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token"


def create_client_assertion(scope="rest_webservices"):
    now = int(time.time())
    payload = {
        "iss": CLIENT_ID,
        "scope": scope,
        "aud": TOKEN_URL,
        "iat": now,
        "exp": now + 5 * 60,
    }
    headers = {"kid": CERTIFICATE_ID, "typ": "JWT"}
    return jwt.encode(payload, PRIVATE_KEY, algorithm="ES256", headers=headers)
```

## Paso 3: Solicitar el access token

La petición al endpoint de token lleva tres parámetros en el body (`application/x-www-form-urlencoded`):

```bash
curl -X POST \
  'https://1234567.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'grant_type=client_credentials' \
  --data-urlencode 'client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer' \
  --data-urlencode "client_assertion=<EL_JWT_FIRMADO>" \
  --data-urlencode 'scope=rest_webservices'
```

Respuesta exitosa:

```json
{
  "access_token": "eyJhbGciOi...",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

No hay `refresh_token` en este flujo: cuando el token expire, firmas un JWT nuevo y repites la petición. Esto no es un problema sino una ventaja — obtener un token es barato (una firma local + un POST) y evita gestionar secretos de larga vida.

## Paso 4: Consumir la API

El access token va en el header `Authorization: Bearer`. Ejemplo creando un cliente vía REST Web Services:

```bash
curl -X POST \
  'https://1234567.suitetalk.api.netsuite.com/services/rest/record/v1/customer' \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H 'Content-Type: application/json' \
  -H 'Prefer: transient' \
  -d '{
    "companyName": "Cliente M2M Inc.",
    "subsidiary": { "id": "1" }
  }'
```

El header `Prefer: transient` le indica a NetSuite que no persista el estado de la petición, y ayuda con concurrencia en llamadas repetitivas.

## Paso 5: Ciclo de vida del token (caché y retry)

Pedir un token en cada llamada desperdicia límites de concurrencia de SuiteTalk y agrega ~200-400 ms por request. Lo correcto es cachear el token y refrescarlo al expirar, con un reintento ante 401.

### TokenManager en Node.js

```js
let cached = null; // { token, expiresAt } (en producción: Redis o similar)

export async function getAccessToken(scope = "rest_webservices") {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    client_assertion: createClientAssertion(scope),
    scope,
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) throw new Error(`Error obteniendo token ${res.status}: ${await res.text()}`);
  return res.json(); // { access_token, expires_in, token_type }
}

export async function getToken(scope = "rest_webservices") {
  const now = Date.now();
  if (cached && cached.expiresAt > now + 60_000) return cached.token;

  const { access_token, expires_in } = await getAccessToken(scope);
  cached = { token: access_token, expiresAt: now + expires_in * 1000 };
  return access_token;
}

export async function netsuiteFetch(path, options = {}) {
  const call = (token) =>
    fetch(`https://${ACCOUNT_ID}.suitetalk.api.netsuite.com${path}`, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${token}`, Prefer: "transient" },
    });

  let res = await call(await getToken());
  if (res.status === 401) {
    cached = null; // token expirado o revocado: refrescar y reintentar una vez
    res = await call(await getToken());
  }
  return res;
}
```

Uso:

```js
const res = await netsuiteFetch("/services/rest/record/v1/customer/123");
const customer = await res.json();
```

### Versión compacta en Python

```python
import requests

_cached = None  # {"token": ..., "expires_at": ...}


def get_access_token(scope="rest_webservices"):
    res = requests.post(
        TOKEN_URL,
        data={
            "grant_type": "client_credentials",
            "client_assertion_type": "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
            "client_assertion": create_client_assertion(scope),
            "scope": scope,
        },
        timeout=30,
    )
    res.raise_for_status()
    return res.json()


def get_token(scope="rest_webservices"):
    global _cached
    now = time.time()
    if _cached and _cached["expires_at"] > now + 60:
        return _cached["token"]

    data = get_access_token(scope)
    _cached = {"token": data["access_token"], "expires_at": now + data["expires_in"]}
    return _cached["token"]
```

## Troubleshooting: errores comunes

Estos son los fallos que más me he encontrado depurando integraciones M2M:

| Error | Causa probable | Solución |
| --- | --- | --- |
| `400 invalid_client` | El `kid` del JWT no coincide con ningún certificado, o la firma no valida | Verifica el Certificate ID del mapeo y que estés firmando con la llave privada correcta (¿par de llaves correcto? ¿PEM completo, con sus headers?) |
| `400 invalid_grant` | El JWT expiró antes de llegar (`exp - iat` muy justo, reloj del servidor desincronizado) | Vida de JWT de 5 minutos; sincroniza NTP en el servidor |
| `400 invalid_scope` / `unsupported_scope` | El scope pedido no está marcado en el registro de integración | Revisa 1.2 y usa exactamente `rest_webservices`, `restlets`, etc. |
| `401` en llamadas API con token recién emitido | El rol del mapeo no tiene **Log in Using OAuth 2.0 Tokens** | Agrega el permiso al rol (1.3) y vuelve a pedir token |
| `USER_UNAUTHORIZED` / `PERMISSION_VIOLATION` | El rol no tiene permisos sobre el registro o la operación | Revisa los permisos del rol; recuerda que el token hereda los permisos del rol, no del scope |
| Falla tras meses de funcionar | El certificado expiró (máx. 2 años de validez) | Genera nuevo par, sube el nuevo `public.pem`, crea/actualiza el mapeo y actualiza el `kid` |
| `404` o error de DNS al llamar el endpoint | `ACCOUNT_ID` incorrecto (falta `_SB1` en sandbox, o es una cuenta con dominio custom) | Verifica el ID en `Setup > Company > Company Information` |

Un tip de depuración: pega tu JWT en [jwt.io](https://jwt.io) y compara claim por claim contra el mapeo (Client ID en `iss`, Certificate ID en `kid`, URL exacta en `aud`). El 90% de los `invalid_client` se explican ahí.

## Consideraciones de seguridad

- **Llave privada:** que nunca salga del servidor. Variables de entorno como mínimo; idealmente un gestor de secretos con rotación automática. Un commit accidental de `private.pem` compromete toda la cuenta de NetSuite.
- **Rotación de certificados:** la validez máxima es 2 años. Mi recomendación es rotar cada 12 meses: genera el nuevo par, crea un segundo mapeo (NetSuite permite varios certificados por integración), actualiza el `kid` en la aplicación y elimina el mapeo viejo. Así la rotación no es un evento de emergencia.
- **Privilegio mínimo:** un rol por integración, con permisos solo sobre los registros que necesita. Cuando audits 6 meses después, vas a agradecer poder responder "¿qué puede hacer esta app?" mirando un solo rol.
- **Auditoría:** las acciones M2M quedan registradas bajo el contexto de la integración y el rol, no de un usuario. Diseña los nombres de integraciones y roles pensando en quien va a leer ese log.
- **Concurrencia:** SuiteTalk tiene límites de concurrencia por cuenta. Cachea el token, controla el paralelismo de tus workers y maneja `429`/`SSS_REQUEST_LIMIT_EXCEEDED` con backoff exponencial.

## Cierre

El flujo M2M de NetSuite tiene una curva de entrada más alta que un `client_secret` tradicional, pero el modelo de certificado + rol da una postura de seguridad notablemente mejor: la llave privada jamás viaja por la red, los permisos son explícitos y auditables, y rotar credenciales no implica tocar código.

Si tu integración sí necesita actuar en nombre de un usuario (un portal que muestra datos de cada cliente, por ejemplo), el flujo adecuado es [Authorization Code Grant](/blog/netsuite-oauth2/). Y si vas a firmar el JWT desde un SuiteScript interno, la lógica es la misma descrita aquí, solo cambia la librería de firma.
