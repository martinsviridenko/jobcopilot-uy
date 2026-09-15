/**
 * JobCopilot v3 — Configuration & Professional Taxonomy
 */

const CONFIG = {
    SUPABASE_URL: "https://lbxchpaoltuwpselfiwr.supabase.co",
    SUPABASE_ANON_KEY: "sb_publishable_1ztKeV9Y3UyIRnjkR6-jVg_zj7Wyrlm",
    MIN_DISPLAY_SCORE: 50, // Vacancies below 50% are deemed non-competitive and hidden from the feed
    STORAGE_KEYS: {
        USER_PROFILE: "jc_user_profile",
        DISMISSED_JOBS: "jc_dismissed_jobs",
        APPLIED_JOBS: "jc_applied_pipeline",
        FAVORITES: "jc_favorites_list"
    }
};

const DOMAINS = {
    DATA_ANALYTICS_BI: {
        id: "DATA_ANALYTICS_BI",
        name: "Datos, BI & Analítica",
        icon: "📊",
        keywords: ["data", "datos", "bi", "business intelligence", "sql", "power bi", "tableau", "analítica", "analytics", "looker", "etl", "dax", "modelado", "ciencia de datos", "big data", "data warehouse"],
        criticalSkills: ["sql", "power bi", "tableau", "python", "dax", "looker", "r", "modelado de datos", "etl", "data warehouse", "estadística", "visualización", "dashboards"]
    },
    BUSINESS_MANAGEMENT: {
        id: "BUSINESS_MANAGEMENT",
        name: "Negocios & Gestión Corporativa",
        icon: "💼",
        keywords: ["administración", "negocios", "gestión", "procesos", "business", "administrativo", "consultoría", "control de gestión", "facturación", "erp", "reorganización", "organización y métodos"],
        criticalSkills: ["facturación", "erp", "control de gestión", "flujo de caja", "gestión administrativa", "mejora de procesos", "organización", "sap", "relevamiento", "excel avanzado"]
    },
    MARKETING_GROWTH: {
        id: "MARKETING_GROWTH",
        name: "Marketing Digital & E-commerce",
        icon: "🚀",
        keywords: ["marketing", "e-commerce", "ecommerce", "digital", "growth", "redes", "publicidad", "ads", "seo", "sem", "medios", "content", "community manager", "branding", "pauta"],
        criticalSkills: ["meta ads", "google ads", "seo", "sem", "e-commerce", "shopify", "growth marketing", "crm", "google analytics", "campañas", "content strategy"]
    },
    FINANCE_BANKING: {
        id: "FINANCE_BANKING",
        name: "Finanzas, Banca & Contabilidad",
        icon: "🏦",
        keywords: ["finanzas", "financiero", "contable", "contabilidad", "banco", "banca", "auditoría", "tax", "impuestos", "crédito", "tesorería", "liquidación", "balance"],
        criticalSkills: ["contabilidad", "conciliaciones", "niif", "impuestos", "tax", "auditoría contable", "asientos contables", "finanzas corporativas", "balance", "servicios bancarios"]
    },
    SALES_COMMERCIAL: {
        id: "SALES_COMMERCIAL",
        name: "Ventas B2B & Comercial",
        icon: "🤝",
        keywords: ["ventas", "comercial", "b2b", "ejecutivo de cuentas", "account executive", "business developer", "prospección", "negociación", "preventa", "vendedor"],
        criticalSkills: ["ventas b2b", "prospección", "crm", "negociación comercial", "cierre de ventas", "pipeline comercial", "cuenta clave", "gestión de cartera"]
    },
    CUSTOMER_OPERATIONS: {
        id: "CUSTOMER_OPERATIONS",
        name: "Customer Experience & Operaciones",
        icon: "📦",
        keywords: ["customer experience", "cx", "atención al cliente", "operaciones comerciales", "soporte usuarios", "logística", "comex", "comercio exterior", "supply chain", "despacho", "depósito", "aduana"],
        criticalSkills: ["customer experience", "atención al cliente", "comercio exterior", "logística", "resolución de reclamos", "zendesk", "crm", "aduana", "supply chain"]
    },
    HR_PEOPLE: {
        id: "HR_PEOPLE",
        name: "Gestión Humana & People Analytics",
        icon: "👥",
        keywords: ["rrhh", "recursos humanos", "people", "talento", "reclutamiento", "selección", "gestión humana", "nómina", "búsquedas it", "clima laboral", "people analytics"],
        criticalSkills: ["reclutamiento", "selección", "gestión humana", "people analytics", "nómina", "evaluación de desempeño", "clima laboral", "entrevistas"]
    },
    SOFTWARE_ENGINEERING: {
        id: "SOFTWARE_ENGINEERING",
        name: "Ingeniería de Software & Desarrollo",
        icon: "💻",
        keywords: ["developer", "software", "programador", "backend", "frontend", "fullstack", "desarrollo", "código", "dev", "programación", "react", "node", "java", "qa", "tester", "ai developer"],
        criticalSkills: ["javascript", "react", "node", "java", "c#", ".net", "python dev", "git", "apis", "backend", "frontend", "docker", "typescript", "qa automation"]
    },
    CYBERSECURITY: {
        id: "CYBERSECURITY",
        name: "Ciberseguridad & Auditoría IT",
        icon: "🔒",
        keywords: ["ciberseguridad", "seguridad de la información", "auditoría it", "iso 27001", "vulnerabilidades", "pentesting", "infosec", "soc", "siem"],
        criticalSkills: ["ciberseguridad", "firewalls", "iso 27001", "pentesting", "vulnerabilidades", "seguridad de la información", "soc", "siem", "auditoría de sistemas"]
    },
    IT_INFRA_SUPPORT: {
        id: "IT_INFRA_SUPPORT",
        name: "Soporte TI & Infraestructura",
        icon: "🛠️",
        keywords: ["soporte", "it", "ti", "infraestructura", "redes", "help desk", "mesa de ayuda", "hardware", "técnico", "servidores", "sysadmin", "linux", "cisco", "cableado"],
        criticalSkills: ["linux", "redes", "cisco", "hardware", "active directory", "soporte técnico", "help desk", "mesa de ayuda", "tcp/ip", "antivirus", "mantenimiento"]
    },
    HEALTH_MEDICAL: {
        id: "HEALTH_MEDICAL",
        name: "Salud, Medicina & Terapias Clínicas",
        icon: "🏥",
        keywords: [
            "fonoaudiología", "fonoaudiólogo", "fonoaudióloga", "fonoaudiologo", "fonoaudiologa",
            "médico", "médica", "medicina", "enfermería", "enfermero", "enfermera", "salud", "clínica", "hospital",
            "psicología clínica", "psicólogo", "psicóloga", "odontología", "fisioterapia", "kinesiología",
            "terapeuta", "nutrición", "veterinaria", "pediatría", "teletón", "sanatorio", "farmacéutico"
        ],
        criticalSkills: ["fonoaudiología", "medicina", "enfermería", "terapia clínica", "diagnóstico médico", "atención de pacientes"]
    },
    INDUSTRIAL_PLANT: {
        id: "INDUSTRIAL_PLANT",
        name: "Planta Industrial, Fábricas & Oficios",
        icon: "🏭",
        keywords: [
            "jefe de planta", "jefa de planta", "planta y proyectos", "ingeniero de planta", "mantenimiento industrial",
            "producción industrial", "fábrica", "operario", "tornero", "soldador", "electromecánico", "mecánico",
            "obra", "construcción", "electricista", "peón", "chofer", "vigilante", "limpieza", "seguridad física"
        ],
        criticalSkills: ["ingeniería de planta", "mantenimiento industrial", "seguridad industrial", "operaciones de fábrica"]
    },
    EDUCATION_TEACHING: {
        id: "EDUCATION_TEACHING",
        name: "Docencia & Educación Escolar",
        icon: "🎓",
        keywords: [
            "docente", "profesor", "profesora", "maestro", "maestra", "educador", "educadora", "colegio", "liceo", "escuela", "pedagogía", "docencia inglés"
        ],
        criticalSkills: ["docencia", "pedagogía", "planificación escolar", "didáctica"]
    },
    LEGAL_NOTARIAL: {
        id: "LEGAL_NOTARIAL",
        name: "Legal, Abogacía & Notarial",
        icon: "⚖️",
        keywords: ["abogado", "abogada", "notarial", "escribano", "escribana", "procurador", "procuradora", "derecho corporativo", "litigios", "juzgados"],
        criticalSkills: ["derecho", "legislación", "redacción contractual", "procuración", "trámites judiciales"]
    }
};

const DOMAIN_AFFINITY = {
    DATA_ANALYTICS_BI: {
        DATA_ANALYTICS_BI: 1.0,
        BUSINESS_MANAGEMENT: 0.85,
        MARKETING_GROWTH: 0.85,
        FINANCE_BANKING: 0.80,
        SALES_COMMERCIAL: 0.65,
        CUSTOMER_OPERATIONS: 0.65,
        HR_PEOPLE: 0.60,
        SOFTWARE_ENGINEERING: 0.35,
        CYBERSECURITY: 0.25,
        IT_INFRA_SUPPORT: 0.10,
        HEALTH_MEDICAL: 0.0,
        INDUSTRIAL_PLANT: 0.0,
        EDUCATION_TEACHING: 0.0,
        LEGAL_NOTARIAL: 0.0
    },
    BUSINESS_MANAGEMENT: {
        BUSINESS_MANAGEMENT: 1.0,
        DATA_ANALYTICS_BI: 0.85,
        FINANCE_BANKING: 0.85,
        MARKETING_GROWTH: 0.80,
        SALES_COMMERCIAL: 0.80,
        CUSTOMER_OPERATIONS: 0.80,
        HR_PEOPLE: 0.70,
        SOFTWARE_ENGINEERING: 0.20,
        CYBERSECURITY: 0.20,
        IT_INFRA_SUPPORT: 0.10,
        HEALTH_MEDICAL: 0.0,
        INDUSTRIAL_PLANT: 0.0,
        EDUCATION_TEACHING: 0.0,
        LEGAL_NOTARIAL: 0.05
    },
    MARKETING_GROWTH: {
        MARKETING_GROWTH: 1.0,
        DATA_ANALYTICS_BI: 0.85,
        BUSINESS_MANAGEMENT: 0.80,
        SALES_COMMERCIAL: 0.75,
        CUSTOMER_OPERATIONS: 0.60,
        HR_PEOPLE: 0.45,
        FINANCE_BANKING: 0.40,
        SOFTWARE_ENGINEERING: 0.25,
        CYBERSECURITY: 0.10,
        IT_INFRA_SUPPORT: 0.10,
        HEALTH_MEDICAL: 0.0,
        INDUSTRIAL_PLANT: 0.0,
        EDUCATION_TEACHING: 0.0,
        LEGAL_NOTARIAL: 0.0
    },
    FINANCE_BANKING: {
        FINANCE_BANKING: 1.0,
        BUSINESS_MANAGEMENT: 0.85,
        DATA_ANALYTICS_BI: 0.80,
        CUSTOMER_OPERATIONS: 0.65,
        SALES_COMMERCIAL: 0.60,
        HR_PEOPLE: 0.50,
        MARKETING_GROWTH: 0.40,
        LEGAL_NOTARIAL: 0.30,
        CYBERSECURITY: 0.25,
        SOFTWARE_ENGINEERING: 0.15,
        IT_INFRA_SUPPORT: 0.10,
        HEALTH_MEDICAL: 0.0,
        INDUSTRIAL_PLANT: 0.0,
        EDUCATION_TEACHING: 0.0
    }
};

const TRANSVERSAL_SKILLS = [
    "excel", "inglés", "ingles", "office", "word", "powerpoint",
    "comunicación", "comunicacion", "trabajo en equipo", "proactividad",
    "capacidad analítica", "resolución de problemas"
];
