/**
 * JobCopilot Universal Engine v3.1 — Configuración y Taxonomía Profesional
 * Funciona de forma genérica para cualquier perfil (Médicos, Abogados, Ingenieros,
 * Contadores, Psicólogos, Negocios Digitales, Diseñadores, etc.).
 */

const CONFIG = {
    SUPABASE_URL: "https://dohskepbckuvmptptqti.supabase.co",
    SUPABASE_ANON_KEY: "sb_publishable_1ztKeV9Y3UyIRnjkR6-jVg_zj7Wyrlm",
    MIN_DISPLAY_SCORE: 45, // Principio In Dubio Pro Candidato: umbral accesible (45%) para no privar al usuario de oportunidades
    STORAGE_KEYS: {
        USER_PROFILE: "jc_user_profile",
        CV_TEXT: "jc_cv_text",
        DISMISSED_JOBS: "jc_dismissed_jobs",
        APPLIED_JOBS: "jc_applied_pipeline",
        APPLIED_DATA: "jc_applied_data",
        FAVORITES: "jc_favorites_list"
    }
};

/**
 * Familias macro-profesionales universales.
 * Reconocen carreras afines e interdisciplinarias.
 */
const DOMAINS = {
    ECONOMIC_BUSINESS: {
        id: "ECONOMIC_BUSINESS",
        name: "Ciencias Económicas, Negocios & Gestión",
        icon: "💼",
        keywords: [
            "ciencias economicas", "ciencias económicas", "negocios digitales", "administracion", "administración",
            "economia", "economía", "finanzas", "financiero", "contabilidad", "contable", "auditoria", "auditoría",
            "comercial", "ventas", "marketing", "business", "business intelligence", "inteligencia comercial",
            "people analytics", "analista de datos", "comercio exterior", "comex", "control de gestion",
            "control de gestión", "facturacion", "facturación", "cobranzas", "tax", "impuestos", "e-commerce",
            "supply chain", "logistica", "logística"
        ],
        criticalSkills: ["excel", "power bi", "sql", "analisis", "gestion", "facturacion", "contabilidad", "finanzas"]
    },
    TECH_SOFTWARE: {
        id: "TECH_SOFTWARE",
        name: "Tecnología, Software & Datos",
        icon: "💻",
        keywords: [
            "software", "desarrollo", "developer", "programador", "frontend", "backend", "fullstack",
            "ingenieria de software", "sistemas", "computacion", "computación", "python", "javascript",
            "react", "node", "sql", "cloud", "aws", "docker", "devops", "qa", "testing", "soporte ti",
            "infraestructura", "redes", "data engineer", "machine learning", "ia", "inteligencia artificial"
        ],
        criticalSkills: ["javascript", "python", "react", "node", "sql", "git", "cloud", "docker"]
    },
    HEALTH_MEDICAL: {
        id: "HEALTH_MEDICAL",
        name: "Salud & Ciencias Médicas",
        icon: "🩺",
        isRegulatedStrict: true,
        keywords: [
            "medicina", "medico", "médico", "enfermeria", "enfermería", "fonoaudiologia", "fonoaudiología",
            "fonoaudiologo", "fonoaudiólogo", "odontologia", "odontología", "clinica", "clínica", "hospital",
            "paciente", "psiquiatria", "farmacia", "bioquimica", "kinesiologia", "terapia ocupacional", "salud"
        ],
        criticalSkills: ["atencion clinica", "pacientes", "farmacologia", "enfermeria"]
    },
    LEGAL_NOTARIAL: {
        id: "LEGAL_NOTARIAL",
        name: "Ciencias Jurídicas & Derecho",
        icon: "⚖️",
        isRegulatedStrict: true,
        keywords: [
            "abogado", "abogada", "abogacia", "abogacía", "derecho", "notariado", "escribano", "escribana",
            "procurador", "juridico", "jurídico", "litigios", "legal", "contratos", "societario"
        ],
        criticalSkills: ["derecho", "redaccion legal", "contratos", "litigios"]
    },
    HR_PSYCHOLOGY: {
        id: "HR_PSYCHOLOGY",
        name: "Gestión Humana & Psicología",
        icon: "👥",
        keywords: [
            "recursos humanos", "rrhh", "gestion humana", "gestión humana", "capital humano",
            "psicologia", "psicología", "seleccion", "selección", "reclutamiento", "recruiting",
            "talent acquisition", "clima laboral", "capacitacion", "people"
        ],
        criticalSkills: ["entrevistas", "seleccion", "reclutamiento", "gestion humana"]
    },
    DESIGN_CREATIVE: {
        id: "DESIGN_CREATIVE",
        name: "Diseño & Comunicación Visual",
        icon: "🎨",
        keywords: [
            "diseno", "diseño", "ux", "ui", "product design", "diseno grafico", "audiovisual",
            "multimedia", "branding", "figma", "photoshop", "illustrator", "comunicacion visual"
        ],
        criticalSkills: ["figma", "photoshop", "illustrator", "diseno ux/ui"]
    },
    INDUSTRIAL_PLANT: {
        id: "INDUSTRIAL_PLANT",
        name: "Operaciones Industriales & Fábrica",
        icon: "🏭",
        keywords: [
            "jefe de planta", "jefatura de planta", "planta industrial", "mantenimiento industrial",
            "produccion industrial", "producción industrial", "planta de produccion", "planta de producción",
            "produccion pesada", "producción pesada", "ingenieria quimica", "ingenieria mecanica", "calidad industrial"
        ],
        criticalSkills: ["procesos industriales", "mantenimiento industrial", "seguridad laboral"]
    }
};

/**
 * Matriz de Afinidad y Transferibilidad Funcional entre Familias.
 * Permite que un estudiante de Negocios Digitales sea compatible con Ciencias Económicas,
 * Administración, Analítica de Datos, Inteligencia Comercial, Finanzas y People Analytics.
 */
const DOMAIN_AFFINITY = {
    ECONOMIC_BUSINESS: {
        ECONOMIC_BUSINESS: 1.0,
        TECH_SOFTWARE: 0.65,      // BI, analítica, SQL, datos de negocio
        HR_PSYCHOLOGY: 0.60,      // People analytics, compensaciones, gestión
        DESIGN_CREATIVE: 0.45,    // Marketing, e-commerce, pauta
        INDUSTRIAL_PLANT: 0.25,   // Operaciones comerciales / compras, pero NO jefatura pesada
        LEGAL_NOTARIAL: 0.20,
        HEALTH_MEDICAL: 0.0       // Incompatibilidad radical estricta
    },
    TECH_SOFTWARE: {
        TECH_SOFTWARE: 1.0,
        ECONOMIC_BUSINESS: 0.65,
        DESIGN_CREATIVE: 0.60,
        HR_PSYCHOLOGY: 0.30,
        INDUSTRIAL_PLANT: 0.25,
        LEGAL_NOTARIAL: 0.15,
        HEALTH_MEDICAL: 0.0
    },
    HEALTH_MEDICAL: {
        HEALTH_MEDICAL: 1.0,
        HR_PSYCHOLOGY: 0.25,
        ECONOMIC_BUSINESS: 0.0,
        TECH_SOFTWARE: 0.0,
        LEGAL_NOTARIAL: 0.0,
        DESIGN_CREATIVE: 0.0,
        INDUSTRIAL_PLANT: 0.0
    },
    HR_PSYCHOLOGY: {
        HR_PSYCHOLOGY: 1.0,
        ECONOMIC_BUSINESS: 0.65,
        TECH_SOFTWARE: 0.30,
        HEALTH_MEDICAL: 0.20,
        DESIGN_CREATIVE: 0.25,
        LEGAL_NOTARIAL: 0.20,
        INDUSTRIAL_PLANT: 0.15
    },
    LEGAL_NOTARIAL: {
        LEGAL_NOTARIAL: 1.0,
        ECONOMIC_BUSINESS: 0.50,
        HR_PSYCHOLOGY: 0.35,
        TECH_SOFTWARE: 0.20,
        HEALTH_MEDICAL: 0.0,
        DESIGN_CREATIVE: 0.0,
        INDUSTRIAL_PLANT: 0.10
    },
    DESIGN_CREATIVE: {
        DESIGN_CREATIVE: 1.0,
        TECH_SOFTWARE: 0.65,
        ECONOMIC_BUSINESS: 0.50,
        HR_PSYCHOLOGY: 0.20,
        HEALTH_MEDICAL: 0.0,
        LEGAL_NOTARIAL: 0.0,
        INDUSTRIAL_PLANT: 0.10
    },
    INDUSTRIAL_PLANT: {
        INDUSTRIAL_PLANT: 1.0,
        ECONOMIC_BUSINESS: 0.50,
        TECH_SOFTWARE: 0.40,
        HEALTH_MEDICAL: 0.0,
        LEGAL_NOTARIAL: 0.10,
        HR_PSYCHOLOGY: 0.15,
        DESIGN_CREATIVE: 0.10
    }
};