---
title: "Autenticación en NetSuite: métodos, cuál usar y cuándo"
pubDate: 2026-09-30
description: "Comparativa de los métodos de autenticación de NetSuite: User Credentials, TBA, OAuth 2.0 Authorization Code y M2M. Ventajas, estado actual y guía de decisión."
author: "Jorge Espinoza Espinoza"
tags: ["NetSuite", "Integraciones", "Seguridad"]
---

---

Cada cierto tiempo me toca responder la misma pregunta en un kickoff de integración: "¿con qué nos autenticamos contra NetSuite?". La respuesta corta es casi siempre OAuth 2.0 — pero entre medias hay matices que deciden si la integración envejece bien o se convierte en deuda. NetSuite reconoce cuatro métodos de autenticación para integraciones; dos están muertos o en cuidados paliativos.

Esta página es el índice de una serie de tres posts donde desarrollo cada método operativo. Aquí va la vista de pájaro y la guía de decisión.

## Los cuatro métodos, de un vistazo

| Método | Credenciales | ¿Quién autoriza? | Expiración | Estado | Úsalo para |
| --- | --- | --- | --- | --- | --- |
| **User Credentials** | Email + contraseña del usuario | El usuario (implícito) | Sesión | **Muerto** para RESTlets desde 2021.1 | Nada nuevo. Solo entender integraciones fosilizadas |
| **TBA** (Token-Based Auth) | Consumer key/secret + token id/secret, firma HMAC por request | El admin, al emitir el token a nombre de un usuario+rol | **No expira** (revocación manual) | Soportado, sin roadmap de mejoras | Integraciones existentes, SOAP legacy, vendors que solo hablan TBA |
| **OAuth 2.0 Authorization Code** | Client ID/secret + consentimiento del usuario + PKCE | El usuario, en pantalla de login | Access 1 h, refresh con rotación | **Recomendado** | Apps que actúan en nombre de un usuario (portales, add-ins) |
| **OAuth 2.0 Client Credentials (M2M)** | Client ID + certificado (JWT firmado) | Nadie: la aplicación | Access 1 h, sin refresh | **Recomendado** | Integraciones servidor a servidor (ERP, middleware, jobs) |

## Guía de decisión

Tres preguntas y sales con el método:

1. **¿Tu aplicación actúa como una persona específica** (cada cliente ve sus facturas, cada vendedor sus leads)? → **Authorization Code Grant**.
2. **¿Es máquina a máquina** — sincronizaciones, integradores, jobs nocturnos? → **OAuth 2.0 M2M**.
3. **¿Es una integración existente con TBA que funciona?** → Déjala operando con una política formal de rotación/revocación, y planifica migración a M2M. No la repliques en proyectos nuevos.

Y una no-pregunta: si alguien propone poner email y contraseña en el código o en Postman para "salir del paso", no hay camino soportado desde 2021.1. Esa puerta está cerrada por diseño.

## Los posts de la serie

### OAuth 2.0 Authorization Code — para apps con usuario

El flujo completo con PKCE: redirección a login, consentimiento, canje del `code`, refresh con rotación, y el detalle que muchos ignoran — los scopes no otorgan permisos de datos, estos los hereda el token del rol del usuario que autorizó.

→ [Conexión a NetSuite con OAuth 2.0: Authorization Code Grant](/blog/netsuite-oauth2/)

### OAuth 2.0 Client Credentials (M2M) — para integraciones sin usuario

La particularidad de NetSuite: el grant `client_credentials` exige un JWT firmado con certificado, no un Client Secret. Setup del mapeo integración+rol+certificado, construcción del JWT en Node.js y Python, caché del token y troubleshooting de `invalid_client`.

→ [Conexión a NetSuite con OAuth 2.0: Client Credentials (M2M)](/blog/netsuite-m2m/)

### TBA — el veterano que sigue en producción

OAuth 1.0a firmado por request: los cuatro secretos estáticos, la firma HMAC explicada paso a paso (base string, percent-encoding, realm en mayúsculas), implementación con librería, y cuándo conviene migrar.

→ [Conexión a NetSuite con Token-Based Authentication (TBA)](/blog/netsuite-tba/)

## Contexto: por qué quedó este panorama

Vale la pena conocer la línea de tiempo, porque explica el estado de muchas integraciones que vas a heredar:

- **2021.1**: los RESTlets nuevos dejan de aceptar credenciales de usuario. User Credentials pasa a ser método muerto para integraciones (y ya antes era una mala idea).
- **SuiteSignOn (SSO de integraciones)**: retirado; su reemplazo natural es OAuth 2.0.
- **TBA**: sigue funcionando y no está anunciado su fin, pero Oracle concentra toda la evolución en OAuth 2.0. Los tokens que no expiran se vuelven un tema de auditoría en cuanto la integración madura.
- **OAuth 2.0**: además de los dos grants de esta serie, NetSuite soporta OpenID Connect (`id_token`) encima del Authorization Code para apps que además necesitan identidad federada.

## Migrar de TBA a OAuth 2.0 en cuatro movimientos

Para la mayoría de integraciones TBA propias, el destino es [M2M](/blog/netsuite-m2m/):

1. Crea la integración OAuth 2.0 con certificado y mapeo M2M.
2. Corre ambos métodos en paralelo en pruebas.
3. Cambia credenciales en la app: de "OAuth 1.0a firmado por request" a "JWT → Bearer cacheado".
4. Revoca los tokens TBA cuando lo nuevo lleve semanas estable.

## Cierre

Si tuvieras que quedarte con una sola idea: **todo lo nuevo se hace con OAuth 2.0** — Authorization Code si hay usuario, M2M si no lo hay — y TBA es un método de transición que merece un plan de salida, no proyectos nuevos. Los posts de la serie tienen el detalle paso a paso de cada uno.
