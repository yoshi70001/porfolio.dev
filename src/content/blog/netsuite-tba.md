---
title: "Conexión a NetSuite con Token-Based Authentication (TBA)"
pubDate: 2026-09-30
description: "Cómo integrar con NetSuite usando TBA (OAuth 1.0a): setup de integración, tokens de acceso, firma HMAC explicada y ejemplos en Node.js y Python."
author: "Jorge Espinoza Espinoza"
tags: ["NetSuite", "TBA", "OAuth 1.0a", "Integraciones"]
---

---

TBA es el método veterano de las integraciones con NetSuite: firma cada request con OAuth 1.0a usando cuatro credenciales estáticas (consumer key/secret y token id/secret). No hay pantallas de login, no hay expiración, no hay refresh — cada llamada lleva su propia firma criptográfica.

Si llegas a este post probablemente por una de dos razones: heredaste una integración que ya usa TBA (sigue siendo el método más extendido en producción, sobre todo en conectores y SOAP legado), o algún iPaas/herramienta que solo soporta TBA. Para **integraciones nuevas**, sé honesto contigo mismo: NetSuite ya no invierte en TBA y lo que hoy es OAuth 2.0 [M2M](/blog/netsuite-m2m/) hace el mismo trabajo con mejor modelo de seguridad. Este post te enseña a operar TBA bien — y a saber cuándo migrar.

Para el panorama completo de métodos, revisa el [índice de autenticación en NetSuite](/blog/netsuite-auth-methods/).

## Cómo funciona

A diferencia de OAuth 2.0, aquí no hay intercambio de tokens ni endpoints de autorización: la aplicación firma **cada request** HTTP con HMAC usando sus cuatro credenciales:

1. Tu aplicación construye el header `Authorization: OAuth ...` con consumer key, token id, timestamp, nonce y método de firma.
2. Genera la firma HMAC sobre un "base string" derivado del request (ver abajo).
3. NetSuite, del lado servidor, reconstruye el mismo base string y verifica la firma contra los secretos registrados.
4. Si valida, el request se ejecuta con los permisos del **rol** asociado al token.

Un matiz importante: un token TBA está atado a la tríada **usuario + rol + integración**. Los permisos efectivos son los de ese rol con ese usuario; si el usuario se desactiva o pierde el rol, el token deja de funcionar aunque nunca haya "expirado".

## Paso 1: Configuración en NetSuite

Necesitas permisos de administrador. Cuatro pasos.

### 1.1 Habilitar la característica

Ve a `Setup > Company > Enable Features`, pestaña `SuiteCloud`, y habilita **Token-Based Authentication**. Guarda.

### 1.2 Crear el registro de integración

Ve a `Setup > Integration > Manage Integrations > New`:

- **Name:** descriptivo, ej. `Integracion WMS - TBA`.
- **State:** `Enabled`.
- Pestaña `Authentication`: marca **Token-Based Authentication**.
- Guarda y copia el **Consumer Key** y **Consumer Secret** — se muestran una sola vez, directo al gestor de secretos.

### 1.3 Preparar el rol

El rol que usará el token necesita, como mínimo:

- Pestaña `Setup`: permiso **Log in using Access Tokens** (sin esto, cualquier llamada devuelve `INVALID_LOGIN` aunque la firma sea perfecta).
- Los permisos sobre los registros que la integración va a manipular.

Es el mismo principio de los otros flujos: un rol dedicado por integración, con privilegios mínimos. En TBA esto pesa todavía más, porque los tokens no expiran — el rol es la única frontera real.

### 1.4 Emitir el token de acceso

Ve a `Setup > Users/Roles > Access Tokens > New`:

- **User:** el usuario de servicio para la integración (no tu usuario personal).
- **Role:** el rol del paso 1.3.
- **Integration:** la integración del paso 1.2.
- Guarda. NetSuite muestra el **Token ID** y el **Token Secret** — una sola vez. Ya tienes las cuatro credenciales: consumer key/secret y token id/secret.

Si necesitas revocar acceso, es en esta misma pantalla: borrar el token corta la integración al instante.

## Paso 2: La firma OAuth 1.0a, sin magia

Cuando una firma TBA falla y no usas librería, hay que depurar a mano. Entender la receta ahorra horas.

### 2.1 El header

Cada request lleva:

```text
Authorization: OAuth realm="1234567",oauth_consumer_key="abcdef12345",oauth_token="a1b2c3d4e5",oauth_signature_method="HMAC-SHA256",oauth_timestamp="1696036800",oauth_nonce="K7LAi6HsLgk",oauth_version="1.0",oauth_signature="W4xT..."
```

| Componente | Qué es | Notas |
| --- | --- | --- |
| `realm` | El ID de cuenta | **En mayúsculas.** `1234567_SB1` ya está bien; si tu cuenta tiene letras (`mycompany`), va `MYCOMPANY` |
| `oauth_consumer_key` | De la integración (1.2) | |
| `oauth_token` | El Token ID (1.4) | |
| `oauth_signature_method` | `HMAC-SHA256` | Usa SHA256; `HMAC-SHA1` solo si el otro extremo lo exige (legacy) |
| `oauth_timestamp` | Unix epoch en segundos | NetSuite tolera un desfase pequeño; relojes desincronizados = firmas inválidas intermitentes |
| `oauth_nonce` | String aleatorio único | Uno distinto por request |
| `oauth_version` | `1.0` | |
| `oauth_signature` | El HMAC del base string | Base64 |

### 2.2 El base string

La firma se calcula sobre una representación canónica del request:

```text
HTTP_METHOD & percentEncode(URL) & percentEncode(parametros_normalizados)
```

Paso a paso, para un `GET` a `https://1234567.suitetalk.api.netsuite.com/services/rest/record/v1/customer/123`:

1. **Recolecta los parámetros**: los del query string (si hay) más los `oauth_*` del header, **excepto** `realm` y `oauth_signature`.
2. **Ordena** los pares `clave=valor` alfabéticamente (por clave y, en empate, por valor). Con los oauth params queda: `oauth_consumer_key=abcdef12345&oauth_nonce=K7LAi6HsLgk&oauth_signature_method=HMAC-SHA256&oauth_timestamp=1696036800&oauth_token=a1b2c3d4e5&oauth_version=1.0`.
3. **Une** con `&` y luego **percent-encode todo el string** (RFC 3986: solo `A-Z a-z 0-9 - _ . ~` quedan sin codificar).
4. **Arma** el base string: método + `&` + URL codificada + `&` + el string de parámetros codificado:

```text
GET&https%3A%2F%2F1234567.suitetalk.api.netsuite.com%2Fservices%2Frest%2Frecord%2Fv1%2Fcustomer%2F123&oauth_consumer_key%3Dabcdef12345%26oauth_nonce%3DK7LAi6HsLgk%26oauth_signature_method%3DHMAC-SHA256%26oauth_timestamp%3D1696036800%26oauth_token%3Da1b2c3d4e5%26oauth_version%3D1.0
```

### 2.3 La firma

- **Clave:** `consumerSecret&tokenSecret`, ambos percent-encoded (importa si tienen caracteres especiales).
- **Firma:** `Base64(HMAC-SHA256(baseString, clave))` — esa cadena va en `oauth_signature`.

Dos reglas que rompen integraciones cuando se olvidan:

- **Solo se firman los body params si el `Content-Type` es `application/x-www-form-urlencoded`.** Un body JSON **no** participa en la firma. Es típico intentar incluirlo a mano y romper todo.
- Los parámetros `script` y `deploy` de un RESTlet **sí** entran al base string (son query params). Las librerías lo resuelven solas; a mano es el olvido más común.

## Paso 3: Implementación de referencia

A mano, la firma esconde suficientes detalles de encoding como para que implementarla sin librería sea un pasatiempo, no una decisión. Usa una.

### Node.js

Con `oauth-1.0a` (`npm install oauth-1.0a`):

```js
import crypto from "node:crypto";
import OAuth from "oauth-1.0a";

const CONSUMER_KEY = process.env.NETSUITE_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.NETSUITE_CONSUMER_SECRET;
const TOKEN_ID = process.env.NETSUITE_TOKEN_ID;
const TOKEN_SECRET = process.env.NETSUITE_TOKEN_SECRET;
const ACCOUNT_ID = process.env.NETSUITE_ACCOUNT_ID; // ej. 1234567 o 1234567_SB1

const oauth = new OAuth({
  consumer: { key: CONSUMER_KEY, secret: CONSUMER_SECRET },
  signature_method: "HMAC-SHA256",
  hash_function: (baseString, signingKey) =>
    crypto.createHmac("sha256", signingKey).update(baseString).digest("base64"),
});

const token = { key: TOKEN_ID, secret: TOKEN_SECRET };

// Devuelve el header Authorization firmado. El realm SIEMPRE en mayúsculas.
export function tbaHeader(url, method = "GET") {
  const { Authorization } = oauth.toHeader(
    oauth.authorize({ url, method }, token, { realm: ACCOUNT_ID.toUpperCase() })
  );
  return Authorization;
}

// REST Web Services: leer un cliente
const restUrl = `https://${ACCOUNT_ID}.suitetalk.api.netsuite.com/services/rest/record/v1/customer/123`;
const restRes = await fetch(restUrl, {
  headers: { Authorization: tbaHeader(restUrl), Prefer: "transient" },
});
const customer = await restRes.json();

// RESTlet: los query params (script, deploy) se firman automáticamente
const restletUrl = `https://${ACCOUNT_ID}.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=customscript_mi_restlet&deploy=customdeploy1`;
const restletRes = await fetch(restletUrl, {
  method: "POST",
  headers: { Authorization: tbaHeader(restletUrl, "POST"), "Content-Type": "application/json" },
  body: JSON.stringify({ orderId: "SO-1234" }),
});
```

### Python

Con `requests_oauthlib` (`pip install requests requests-oauthlib`):

```python
import os

import requests
from requests_oauthlib import OAuth1

CONSUMER_KEY = os.environ["NETSUITE_CONSUMER_KEY"]
CONSUMER_SECRET = os.environ["NETSUITE_CONSUMER_SECRET"]
TOKEN_ID = os.environ["NETSUITE_TOKEN_ID"]
TOKEN_SECRET = os.environ["NETSUITE_TOKEN_SECRET"]
ACCOUNT_ID = os.environ["NETSUITE_ACCOUNT_ID"]      # ej. 1234567 o 1234567_SB1

# El realm SIEMPRE en mayúsculas
auth = OAuth1(
    client_key=CONSUMER_KEY,
    client_secret=CONSUMER_SECRET,
    resource_owner_key=TOKEN_ID,
    resource_owner_secret=TOKEN_SECRET,
    signature_method="HMAC-SHA256",
    realm=ACCOUNT_ID.upper(),
)

# REST Web Services: leer un cliente
rest_res = requests.get(
    f"https://{ACCOUNT_ID}.suitetalk.api.netsuite.com/services/rest/record/v1/customer/123",
    auth=auth,
    headers={"Prefer": "transient"},
    timeout=30,
)
rest_res.raise_for_status()
customer = rest_res.json()

# RESTlet: los query params se firman automáticamente
restlet_res = requests.post(
    f"https://{ACCOUNT_ID}.restlets.api.netsuite.com/app/site/hosting/restlet.nl",
    params={"script": "customscript_mi_restlet", "deploy": "customdeploy1"},
    json={"orderId": "SO-1234"},
    auth=auth,
    timeout=30,
)
```

Nota: a diferencia de OAuth 2.0, aquí no hay token que cachear — la firma es por request y no cuesta una llamada extra. El "costo" es generar HMAC en cada llamada, despreciable.

## Troubleshooting: errores comunes

| Error | Causa probable | Solución |
| --- | --- | --- |
| `INVALID_LOGIN` | Token revocado, usuario desactivado, o rol sin **Log in using Access Tokens** | Revisa el token en `Access Tokens` y el permiso del rol |
| `INVALID_TOKEN` | El Token ID no corresponde a esta cuenta o integración | Verifica que emitiste el token contra la integración correcta |
| Firma inválida (401 sin mensaje claro) | Encoding incorrecto, params sin ordenar, o cuerpo incluido en la firma cuando no corresponde | Delega en una librería; si firmas a mano, revisa RFC 3986 y la regla del body form-urlencoded |
| Funciona a ratos, falla a ratos | Reloj del servidor desincronizado (`oauth_timestamp` con drift) | Sincroniza NTP; el error intermitente es su firma característica |
| 401 solo en sandbox | `realm` sin `_SB1` o con letras en minúscula | El realm siempre en mayúsculas: `1234567_SB1`, `MYCOMPANY_SB1` |
| `INVALID_CONSUMER` / `UNABLE_TO_PERFORM_...` | Consumer key incorrecto o integración deshabilitada | Revisa el registro de integración y su estado |
| `INSUFFICIENT_PERMISSION` en el RESTlet | El rol del token no tiene acceso al script o a los registros | Permisos del rol (1.3); recuerda que el rol es la única frontera |
| Dejó de funcionar de un día para otro | Alguien cambió el rol del usuario, desactivó al usuario, o revocó el token | Los tokens no expiran, pero sí mueren si su tríada usuario+rol+integración se rompe |

## Consideraciones de seguridad

- **Cuatro secretos estáticos y eternos.** Consumer secret + token secret juntos equivalen a una contraseña con rol fijo. Gestor de secretos, sin excepciones, y fuera del código.
- **Sin expiración = sin red de seguridad.** Define una rotación operativa: emitir token nuevo, desplegarlo, revocar el viejo. Y revocación inmediata en offboarding del usuario de servicio. Auditoría anual de `Setup > Users/Roles > Access Tokens` con la pregunta "¿este token todavía tiene dueño?".
- **Usuario de servicio, nunca personas.** Un token atado a tu usuario personal es una bomba que estalla cuando cambias de rol o te vas de la empresa.
- **No llegues a límites de tokens huérfanos:** cada token emitido y olvidado es superficie de ataque. Documenta qué aplicación usa cada token ID (o al menos, deja una nota en el nombre de la integración).

## TBA → OAuth 2.0: cuándo y cómo migrar

Señales de que ya toca: la integración es de desarrollo propio o de un vendor con soporte OAuth; estás agregando cuentas (multi-subsidiaria/multi-entidad); un audit te preguntó "¿cuándo rotan estos tokens?".

La migración natural es hacia [Client Credentials (M2M)](/blog/netsuite-m2m/), que cubre el mismo caso de uso servidor-a-servidor:

1. Crea la integración OAuth 2.0 y el certificado (llaves + mapeo M2M, según el post hermano).
2. Corre ambos métodos en paralelo contra un ambiente de pruebas.
3. Cambia las credenciales en la aplicación — es un cambio de "header firmado OAuth 1.0a" por "JWT → Bearer token cacheado".
4. Revoca los tokens TBA cuando la nueva vía lleve semanas estable.

Excepciones razonables para quedarse en TBA: SOAP legacy cuya versión no soporte OAuth 2.0, o vendors cerrados que solo hablan TBA. En esos casos, al menos formaliza la rotación y la revocación que OAuth 2.0 te daría gratis.

## Cierre

TBA envejeció mejor de lo que cabría esperar: es predecible, no depende de pantallas de consentimiento ni de expiraciones, y con un rol bien acotado es perfectamente operable. Pero cada request firmado con secretos eternos es una deuda técnica que Oracle ya no va a pagar. Si empiezas algo nuevo, [M2M con OAuth 2.0](/blog/netsuite-m2m/); si tu app actúa como un usuario, [Authorization Code](/blog/netsuite-oauth2/); y si quieres comparar todo de un vistazo, el [índice de métodos](/blog/netsuite-auth-methods/).
