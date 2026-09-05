/**
 * Fuente única de verdad del portafolio.
 * Todos los componentes consumen estos datos; nada de contenido hardcodeado.
 */

export const identity = {
  name: "Jorge Espinoza",
  fullName: "Jorge Luis Emmanuel Espinoza Espinoza",
  role: "Consultor Oracle NetSuite · Full Stack · DevOps",
  title: "Ingeniero de Sistemas",
  email: "jespinozaespinoza@outlook.com",
  location: "Perú · Remoto",
  photo: "/Jorge.webp",
  photoAlt: "Retrato de Jorge Espinoza",
  available: true,
} as const;

export const socials = {
  linkedin: "https://linkedin.com/in/jorge-luis-emmanuel-espinoza-espinoza-b271591b9/",
  github: "https://github.com/yoshi70001",
  email: `mailto:${identity.email}`,
} as const;

export const publication = {
  title:
    "Review of Artificial Intelligence Models for Constructing a Sales Forecasting Module to Enhance Decision-Making",
  venue: "Springer Nature",
  event: "43rd IBIMA Conference 2024",
  place: "Madrid, España",
  collection: "Artificial Intelligence and Machine Learning",
  doi: "10.1007/978-3-031-77493-5_13",
  url: "https://link.springer.com/chapter/10.1007/978-3-031-77493-5_13",
} as const;

export interface Highlight {
  value: string;
  label: string;
  href?: string;
  external?: boolean;
}

export const highlights: Highlight[] = [
  {
    value: "Springer ’24",
    label: "Investigación en IA/ML publicada por Springer Nature (IBIMA, Madrid)",
    href: publication.url,
    external: true,
  },
  {
    value: "15+",
    label: "Certificaciones oficiales Oracle, AWS y Google Cloud",
    href: "/#certificaciones",
  },
  {
    value: "40%",
    label: "Reducción de costos operativos migrando de AWS a Oracle Cloud",
  },
  {
    value: "+4 años",
    label: "Experiencia en el ecosistema Oracle NetSuite",
    href: "/#experiencia",
  },
];

export interface ExperienceSection {
  heading: string;
  items: string[];
}

export interface ExperienceEntry {
  company: string;
  role: string;
  period: string;
  url?: string;
  summary: string;
  areas?: ExperienceSection[];
  stack?: string[];
}

export const experience: ExperienceEntry[] = [
  {
    company: "Joyit",
    role: "Desarrollador Oracle NetSuite (SuiteScript)",
    period: "Feb 2026 — Actualidad",
    url: "https://joyit.com/",
    summary:
      "Desarrollo especializado en el ecosistema Oracle NetSuite (SuiteScript 2.1, SuiteCloud SDF) con foco en manufactura farmacéutica, costeo de producción y localización tributaria peruana. Para Biomont, laboratorio farmacéutico en Perú con operaciones en Ecuador y vínculo con Kuntur Pharma (vía 2win, partner NetSuite), diseñé e implementé más de 15 módulos de negocio sobre NetSuite OneWorld (~250.000 líneas de SuiteScript en 11 proyectos).",
    areas: [
      {
        heading: "Manufactura y producción",
        items: [
          "Planificador Biomont PPS (Programa de Producción Semanal): custom record con documentación funcional, diagramas de flujo y programación semanal de órdenes de trabajo.",
          "Sistema de costeo de productos: flujo de aprobación de 5 estados (abierto → cotizado y contabilizado), cálculo de mano de obra y CIF, cotizaciones y reportes PDF/Excel.",
          "Gestión de Tiempos de Producción: aplicación web externa (login y registro de operaciones de planta) servida vía Suitelet, más 14 scripts NetSuite (Map/Reduce, reportes de tiempos aprobados, validaciones en OT).",
          "Personalización de órdenes de trabajo: entrada/salida de OT, liquidación de materiales e impresión de etiquetas.",
        ],
      },
      {
        heading: "Finanzas y costos",
        items: [
          "Módulo de pago masivo de facturas con cálculo fiscal peruano (retenciones y detracciones) e integración con E-Payments/PFA.",
          "Facturación intercompany Biomont ↔ Kuntur Pharma con registro automático, arquitectura modular y custom record de auditoría/logs.",
          "Amortizaciones automáticas en facturas de proveedor con procesamiento masivo Map/Reduce.",
          "Suite de reportes financieros Suitelet: rotación de inventario, costo estándar vs. real, estados financieros, cuenta corriente de proveedores y comparativo de resultados (plantillas FreeMarker).",
          "Conciliación bancaria, letras de deudores y solicitudes de dinero con flujo de aprobación.",
          "SuiteApp de asignación de costos con automatización de 5 segmentos contables custom (mercado, país, tipo de producto, categoría y línea) y migración de datos legado.",
        ],
      },
      {
        heading: "Localización tributaria peruana (SUNAT)",
        items: [
          "Libro electrónico de compras con estructura de reporte SUNAT.",
          "Guías de remisión y facturación masiva Ecommerce (facturas + guías) para pedidos B2C.",
          "Reporte de notas de crédito por ítem con SuiteQL y selección dinámica de artículos.",
        ],
      },
      {
        heading: "Compras y supply",
        items: [
          "Nivel de urgencia para órdenes de compra con priorización de abastecimiento.",
          "Importador de cotizaciones de proveedores y generador de CSV para carga masiva de Purchase Orders desde Excel, con guía de usuario.",
        ],
      },
      {
        heading: "Otros",
        items: [
          "Chatbot de WhatsApp conectado a API de tracking de pedidos.",
          "Certificados de análisis digitales para control de calidad farmacéutico.",
          "Convenciones de arquitectura en capas (interfaces → domain → dao) documentadas en archivos AGENTS.md para desarrollo asistido por IA.",
        ],
      },
    ],
    stack: [
      "SuiteScript 2.1",
      "Suitelet",
      "UserEvent",
      "Map/Reduce",
      "SuiteQL",
      "SuiteCloud SDF/CLI",
      "NetSuite OneWorld",
      "FreeMarker",
      "Node.js",
      "Python",
      "Git",
      "Desarrollo asistido por IA",
    ],
  },
  {
    company: "2WIN Consulting",
    role: "Desarrollador e Integrador — NetSuite",
    period: "Mar 2025 — Actualidad",
    url: "https://2win.cl/",
    summary:
      "Desarrollo de suite de integraciones NetSuite ↔ sistema hospitalario (protocolo HL7) para Andes Salud, localización tributaria chilena, integraciones ERP con retail y utilities, y herramientas internas potenciadas con IA generativa.",
    areas: [
      {
        heading: "Salud — Andes Salud (red de clínicas)",
        items: [
          "Suite de integraciones NetSuite ↔ sistema hospitalario (protocolo HL7): sincronización de pacientes, admisiones, órdenes de venta, farmacia hospitalaria y POS de farmacia, prefacturación y contabilidad. 20 RESTlets en producción, arquitectura en capas (interfaces/domain/dao), 53 flujos documentados y API publicada con OpenAPI.",
          "Módulo de recaudaciones: generación masiva y asíncrona de documentos contables (facturas, notas de crédito, journals, pagos) desde cierres de caja de los centros de salud, con callbacks bidireccionales hacia la API del sistema clínico.",
          "Corrección monetaria (IPC chileno) y revaluación Mid-Life de activos fijos sobre Fixed Asset Management, con SuiteQL avanzado (CTEs paginados multi-fuente) y protección anti-recursión.",
          "Simulador web de APIs (Node.js, Express, Sequelize, SQLite, JWT, OAuth2 M2M) para probar RESTlets con multi-ambiente, gestión de usuarios por roles y hardening de seguridad.",
        ],
      },
      {
        heading: "Localización tributaria chilena",
        items: [
          "Migración de módulos de localización a SuiteTax: redistribución de IVA, corrección monetaria, factoring automatizado y balance de 8 columnas.",
          "Nóminas de pago bancarias para Banco Santander y Scotiabank, integración de RRHH con BUK, y módulo de rendiciones de gastos con trazabilidad de auditoría.",
          "Soporte al módulo de facturación electrónica DTE (SII): boletas, facturas, NC/ND, guías de despacho y facturas de exportación, con gestión de folios/CAF.",
        ],
      },
      {
        heading: "Integraciones ERP",
        items: [
          "Multivende (plataforma OMS e-commerce, cliente Bebesit): sincronización de clientes, artículos, precios, stock y órdenes de venta con colas de procesamiento, reintentos y auditoría.",
          "GEO POS (Gama Italy): integración bidireccional de ventas, inventarios y catálogos, incluyendo un proxy en Cloudflare Workers para sortear restricciones de red.",
          "Chilquinta (electricidad): importación masiva de cartolas bancarias/contables desde SAP (FBL3N/FBL1N), prorrateo automático de montos entre subsidiarias y dashboards con SuiteQL.",
        ],
      },
      {
        heading: "IA y herramientas de productividad",
        items: [
          "OCR de facturas con Google Gemini: PDF → JSON estructurado → factura generada en NetSuite, con control de jobs, estados y reproceso.",
          "Suite interna de 17 herramientas para NetSuite: editor SQL/SuiteQL con generación asistida por IA y búsqueda semántica del esquema (embeddings), ejecutor de código SuiteScript, conversor HL7↔JSON, generador de diagramas Mermaid, servidor de reportes Markdown→PDF y cliente OAuth2 M2M (certificado).",
        ],
      },
      {
        heading: "Otros",
        items: [
          "Sitio web corporativo (2win.cl) en Astro, 100% estático, con SEO (Open Graph, JSON-LD) y accesibilidad WCAG AA.",
          "Mantención de parser HL7 en TypeScript con tests (Jest).",
        ],
      },
    ],
    stack: [
      "SuiteScript 2.0/2.1",
      "RESTlet",
      "SuiteQL",
      "SuiteTax",
      "HL7",
      "DTE/SII",
      "Node.js",
      "TypeScript",
      "Astro",
      "Cloudflare Workers",
      "IA generativa (Gemini)",
    ],
  },
  {
    company: "LatamReady",
    role: "Desarrollador Oracle NetSuite — DevOps",
    period: "Ene 2023 — Feb 2025",
    url: "https://latamready.com/",
    summary:
      "Desarrollador full-stack especializado en Oracle NetSuite (SuiteScript 2.x, SuiteCloud SDF) con foco en microservicios backend, herramientas con IA, QA automatizado e infraestructura cloud. Pasé del desarrollo de localizaciones a construir servicios del producto en producción sobre Oracle Cloud (OCI): localizaciones SuiteTax para múltiples países, módulos de pagos electrónicos y automatización interna, con buenas prácticas DevOps y CI/CD.",
    areas: [
      {
        heading: "Localización tributaria multi-país (SuiteTax)",
        items: [
          "Perú (ste-peru-localization): custom records, traducciones multiidioma y transaction fields sobre la SuiteApp de localización.",
          "Argentina (ste-argentina-localization): flujo de percepciones con soporte AGIP, validación CUIT, columna tipo de entidad y generación individual de certificados. Implementación de conexiones WS estándar para AGIP, ARBA y AFIP.",
          "Chile y LatAm: librería transversal de campos custom en facturas con ocultamiento dinámico de columnas; configuración de régimen minero (latamSeals) e impresión GL Argentina.",
          "Construí el Wizard de Setup fiscal (creación de tax types por pasos) y la interfaz de plantillas con listas draggables (Universal Settings).",
        ],
      },
      {
        heading: "Pagos y módulos financieros",
        items: [
          "Templates de pagos electrónicos SuiteTax para Itaú Chile, Santander, BBVA Francés, BCP e Interbank (Perú).",
          "Llevé el módulo de débito automático (Automatic Debit) de alpha a producción: estados de transacciones, queries y bot de despliegue de bundles.",
          "Implementé la integración bancaria Interbanking (LatamReady Link) y conexiones SFTP, SSH y SOAP con bancos internacionales (Bancolombia, JPMorgan).",
          "Mantuve el servicio de tipo de cambio multi-país: UF Chile (CLF), Honduras, Guatemala y CRC↔CAD (Costa Rica).",
        ],
      },
      {
        heading: "Microservicios e infraestructura (OCI)",
        items: [
          "Desarrollé microservicios del producto: OCR de facturas, RFC México, criptografía (crypto62), verificación de tipo de instancia por URL y consumo de API de padrones, con workers asíncronos, API cache y base de datos.",
          "Realicé despliegues en Oracle Cloud Infrastructure (OCI) de apps internas (SmartReady, Wormax), con gestión de bundles y llaves SSH; administración de VPS, OracleDB y Functions.",
          "Optimicé la app interna SmartReady: caché, compresión, prefetch, render optimizado y soporte de sitio estático.",
          "Promoví buenas prácticas DevOps y CI/CD: reducción de 40% en costos operativos migrando de AWS a OCI, 30% de mejora en tiempos de reportes y 20% de eficiencia en despliegues.",
        ],
      },
      {
        heading: "QA automatizado",
        items: [
          "Desarrollé la app de QA automatizada sobre NetSuite: downloader de estructuras de configuración, ejecución de flowSteps, selección de módulos de test cases y manejo de roles con 2FA.",
        ],
      },
      {
        heading: "IA y herramientas de productividad",
        items: [
          "Implementé OCR de facturas con Google Gemini (PDF → JSON estructurado), validado con repositorio de pruebas propio.",
          "Desarrollé indicadores para consultoría: portlets de KPIs de marketing/ventas, upsells no facturados (AMO) y portlets KAM sobre oportunidades.",
          "Automatización interna con bots en Python (uploaders/downloader de ambientes), CLI propia (Node.js/C++) y servicios auxiliares en Go.",
          "Mantuve colecciones de pruebas de API con Bruno (SuiteTalk, facturación, RFC, short URLs).",
        ],
      },
    ],
    stack: [
      "SuiteScript 2.x",
      "RESTlet",
      "Suitelet",
      "Map/Reduce",
      "SuiteQL",
      "SuiteCloud SDF/CLI",
      "SuiteTax",
      "JavaScript/TypeScript",
      "Python",
      "Go",
      "Node.js",
      "C++",
      "SQL",
      "Oracle Cloud (OCI)",
      "Git/GitLab/GitHub",
      "IA generativa (Gemini)",
      "OCR",
      "APIs REST (Bruno)",
    ],
  },
  {
    company: "LatamReady",
    role: "Desarrollador Oracle NetSuite",
    period: "Jul 2021 — Ene 2023",
    url: "https://latamready.com/",
    summary:
      "Desarrollo del core del producto LatamReady (2Win), partner NetSuite para Latinoamérica, y de soluciones contables para múltiples países de la región. Mantuve el repositorio principal de scripts del producto (~280 actualizaciones de producción entre 2021 y 2023), participé en el desarrollo de la SuiteApp central y evolucioné hasta tomar el refactor arquitectónico de la localización peruana.",
    areas: [
      {
        heading: "Core del producto LatamReady",
        items: [
          "Mantuve y evolucioné el repositorio central de scripts del producto (script_latamready) durante más de 2 años, con actualizaciones continuas en producción sobre transacciones, records y procesos del ERP.",
          "Participé en el desarrollo de la SuiteApp principal del producto (ste-suiteapp-development), dentro de la rama de desarrollo 2023.2.",
          "Implementación de módulos NetSuite personalizados, SuiteScripts y RESTlets para soluciones contables en Latinoamérica.",
          "Desarrollé herramientas de depuración (debugger de plantillas Freemarker) para acelerar el soporte de documentos generados.",
        ],
      },
      {
        heading: "Localización tributaria de Perú",
        items: [
          "Lideré el refactor arquitectónico de la localización peruana (ste-peru-localization): reestructuración de interfaces, Map/Reduce, clientes, handlers, helpers y constantes del código.",
          "Implementé transaction fields personalizados con soporte de traducciones multiidioma (custom records de traducción).",
        ],
      },
    ],
    stack: [
      "SuiteScript 2.x",
      "Map/Reduce",
      "UserEvent",
      "Workflow",
      "FreeMarker",
      "RESTlet",
      "SuiteCloud SDF",
      "JavaScript",
      "Git/GitLab",
      "Localización fiscal Perú",
    ],
  },
];

export interface Project {
  name: string;
  description: string;
  image: string;
  imageAlt: string;
  tech: string[];
  url?: string;
  repo?: string;
}

export const projects: Project[] = [
  {
    name: "HardSub Extractor",
    description:
      "Aplicación de escritorio para extracción de subtítulos incrustados (hardsub) usando redes neuronales para detección y OCR en tiempo real. Arquitectura modular con procesamiento paralelo de video.",
    image: "/projects/harsubextractor.webp",
    imageAlt: "Interfaz de HardSub Extractor",
    tech: ["Node.js", "OCR", "Redes neuronales"],
    repo: "https://github.com/yoshi70001/HardSubExtractor",
  },
  {
    name: "Animeflv Wrapper",
    description:
      "API wrapper web para streaming de anime en español. Implementada con Express y EJS, utiliza web scraping para obtención de contenido y caché para optimización de respuestas.",
    image: "/projects/animeflvWrapper.webp",
    imageAlt: "Interfaz de Animeflv Wrapper",
    tech: ["Express", "EJS", "Cheerio"],
    url: "https://jespinoza.mooo.com/anime/",
    repo: "https://github.com/yoshi70001/animeflvWrapper",
  },
  {
    name: "ScreenShot Site",
    description:
      "Servicio de capturas de pantalla de sitios web bajo demanda. Arquitectura serverless con colas de procesamiento y almacenamiento optimizado para alta disponibilidad.",
    image: "/projects/screenShot.webp",
    imageAlt: "Interfaz de ScreenShot Site",
    tech: ["Express", "Puppeteer"],
    url: "https://jespinoza.mooo.com/screenshot/",
    repo: "https://github.com/yoshi70001/screenshot-site",
  },
];

export interface StackGroup {
  name: string;
  items: string[];
}

export const stack: StackGroup[] = [
  {
    name: "Oracle NetSuite",
    items: [
      "SuiteScript 2.x",
      "RESTlets",
      "SuiteTalk (SOAP)",
      "SuiteQL",
      "SuiteFlow",
      "SuiteCloud SDF/CLI",
      "SuiteTax",
      "Saved Searches",
      "CSV/JSON Imports",
    ],
  },
  {
    name: "APIs & Integración",
    items: [
      "REST API",
      "SOAP API",
      "OAuth 2.0",
      "M2M (Client Credentials)",
      "HL7",
      "Webhooks",
      "OpenAPI",
      "Postman / Insomnia",
    ],
  },
  {
    name: "DevOps & Cloud",
    items: [
      "Oracle Cloud (OCI)",
      "AWS",
      "Google Cloud",
      "Docker",
      "CI/CD",
      "Jenkins",
      "Git / GitHub / GitLab",
      "VPS",
      "FinOps",
    ],
  },
  {
    name: "Backend & Lenguajes",
    items: [
      "JavaScript",
      "TypeScript",
      "Node.js",
      "Express",
      "Python",
      "SQL",
      "PostgreSQL",
      "FreeMarker",
    ],
  },
  {
    name: "IA & Machine Learning",
    items: [
      "TensorFlow",
      "Sales Forecasting",
      "OCR (Gemini)",
      "Embeddings",
      "RAG",
      "Data Analysis",
      "Python AI/ML",
    ],
  },
];

export interface CertificationGroup {
  category: string;
  items: string[];
}

export const certifications: CertificationGroup[] = [
  {
    category: "Oracle NetSuite",
    items: ["BI and Reporting Associate", "Financial Associate", "AI Foundations Associate"],
  },
  {
    category: "Oracle Fusion Cloud",
    items: [
      "CX Process Essentials",
      "ERP Process Essentials",
      "HCM Process Essentials",
      "SCM Process Essentials",
    ],
  },
  {
    category: "Oracle Cloud Infrastructure",
    items: ["OCI AI Foundations Associate", "OCI Foundations Associate"],
  },
  {
    category: "Cloud & FinOps",
    items: ["AWS Cloud Practitioner", "Google Cloud Computing Foundations", "FinOps Foundation"],
  },
  {
    category: "Desarrollo",
    items: [
      "SQL PostgreSQL (DevTalles)",
      "Clean Code & SOLID (Udemy)",
      "Node.js Authentication (DevTalles)",
      "TypeScript (Platzi)",
      "Python Profesional",
    ],
  },
  {
    category: "Arquitectura & Soft Skills",
    items: [
      "Fundamentos de Ingeniería de Software",
      "Autenticación & Microservicios",
      "EF SET English B1 (Proficient)",
    ],
  },
];

export const totalCertifications = certifications.reduce(
  (acc, group) => acc + group.items.length,
  0,
);
