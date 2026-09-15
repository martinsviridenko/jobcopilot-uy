// =========================================================================
// JobCopilot Semantic Matching Engine v2 (Recruiter-Grade Hierarchical Model)
// =========================================================================

const DOMAINS = {
    DATA_BI: {
        id: "DATA_BI",
        name: "Datos, BI & Analítica",
        icon: "📊",
        keywords: ["data", "datos", "bi", "business intelligence", "sql", "power bi", "tableau", "analítica", "analytics", "looker", "etl", "dax", "modelado", "ciencia de datos"],
        criticalSkills: ["sql", "power bi", "tableau", "python", "dax", "looker", "r", "modelado de datos", "etl", "data warehouse", "estadística", "visualización", "dashboards"]
    },
    BUSINESS_ADMIN: {
        id: "BUSINESS_ADMIN",
        name: "Negocios & Administración",
        icon: "💼",
        keywords: ["administración", "negocios", "gestión", "procesos", "business", "administrativo", "consultoría", "control de gestión", "facturación", "erp"],
        criticalSkills: ["facturación", "erp", "control de gestión", "flujo de caja", "gestión administrativa", "mejora de procesos", "organización", "sap", "relevamiento"]
    },
    FINANCE_BANKING: {
        id: "FINANCE_BANKING",
        name: "Finanzas, Banca & Contabilidad",
        icon: "🏦",
        keywords: ["finanzas", "financiero", "contable", "contabilidad", "banco", "banca", "auditoría", "tax", "impuestos", "crédito", "tesorería"],
        criticalSkills: ["contabilidad", "conciliaciones", "niif", "impuestos", "tax", "auditoría contable", "asientos contables", "finanzas corporativas", "balance", "servicios bancarios"]
    },
    MARKETING_ECOMM: {
        id: "MARKETING_ECOMM",
        name: "Marketing Digital & E-commerce",
        icon: "🚀",
        keywords: ["marketing", "e-commerce", "digital", "growth", "redes", "publicidad", "ads", "seo", "sem", "medios", "content", "ventas b2b"],
        criticalSkills: ["meta ads", "google ads", "seo", "sem", "e-commerce", "shopify", "growth marketing", "crm", "google analytics", "campañas", "ventas b2b"]
    },
    HR_PEOPLE: {
        id: "HR_PEOPLE",
        name: "Gestión Humana & People",
        icon: "👥",
        keywords: ["rrhh", "recursos humanos", "people", "talento", "reclutamiento", "selección", "gestión humana", "nómina"],
        criticalSkills: ["reclutamiento", "selección", "gestión humana", "people analytics", "nómina", "evaluación de desempeño", "clima laboral"]
    },
    IT_SUPPORT_INFRA: {
        id: "IT_SUPPORT_INFRA",
        name: "Soporte TI & Infraestructura",
        icon: "🛠️",
        keywords: ["soporte", "it", "ti", "infraestructura", "redes", "help desk", "mesa de ayuda", "hardware", "técnico", "servidores", "sysadmin", "linux"],
        criticalSkills: ["linux", "redes", "cisco", "hardware", "active directory", "soporte técnico", "help desk", "mesa de ayuda", "tcp/ip", "antivirus", "mantenimiento"]
    },
    SOFTWARE_DEV: {
        id: "SOFTWARE_DEV",
        name: "Desarrollo de Software",
        icon: "💻",
        keywords: ["developer", "software", "programador", "backend", "frontend", "fullstack", "desarrollo", "código", "dev", "programación"],
        criticalSkills: ["javascript", "react", "node", "java", "c#", ".net", "python dev", "git", "apis", "backend", "frontend", "docker", "typescript"]
    },
    CYBERSECURITY: {
        id: "CYBERSECURITY",
        name: "Ciberseguridad & Auditoría IT",
        icon: "🔒",
        keywords: ["ciberseguridad", "seguridad de la información", "auditoría it", "iso 27001", "vulnerabilidades", "pentesting", "infosec", "soc"],
        criticalSkills: ["ciberseguridad", "firewalls", "iso 27001", "pentesting", "vulnerabilidades", "seguridad de la información", "soc", "siem", "auditoría de sistemas"]
    },
    OPERATIONS_LOG: {
        id: "OPERATIONS_LOG",
        name: "Operaciones & Logística",
        icon: "📦",
        keywords: ["operaciones", "logística", "comercio exterior", "supply chain", "cadena de suministro", "depósito", "despacho", "stock", "comex", "customer experience"],
        criticalSkills: ["comercio exterior", "logística", "cadena de suministro", "aduana", "stock", "inventario", "despacho", "importaciones", "customer experience"]
    }
};

const DOMAIN_AFFINITY = {
    DATA_BI: {
        DATA_BI: 1.0,
        BUSINESS_ADMIN: 0.90,
        FINANCE_BANKING: 0.80,
        MARKETING_ECOMM: 0.85,
        HR_PEOPLE: 0.70,
        OPERATIONS_LOG: 0.65,
        SOFTWARE_DEV: 0.50,
        CYBERSECURITY: 0.35,
        IT_SUPPORT_INFRA: 0.15 // Incompatible
    },
    BUSINESS_ADMIN: {
        BUSINESS_ADMIN: 1.0,
        DATA_BI: 0.85,
        FINANCE_BANKING: 0.90,
        MARKETING_ECOMM: 0.80,
        HR_PEOPLE: 0.75,
        OPERATIONS_LOG: 0.75,
        SOFTWARE_DEV: 0.25,
        CYBERSECURITY: 0.30,
        IT_SUPPORT_INFRA: 0.20 // Incompatible
    },
    MARKETING_ECOMM: {
        MARKETING_ECOMM: 1.0,
        DATA_BI: 0.85,
        BUSINESS_ADMIN: 0.80,
        OPERATIONS_LOG: 0.55,
        HR_PEOPLE: 0.50,
        FINANCE_BANKING: 0.40,
        SOFTWARE_DEV: 0.35,
        CYBERSECURITY: 0.15,
        IT_SUPPORT_INFRA: 0.15 // Incompatible
    },
    FINANCE_BANKING: {
        FINANCE_BANKING: 1.0,
        BUSINESS_ADMIN: 0.90,
        DATA_BI: 0.80,
        OPERATIONS_LOG: 0.60,
        HR_PEOPLE: 0.55,
        MARKETING_ECOMM: 0.40,
        CYBERSECURITY: 0.35,
        SOFTWARE_DEV: 0.20,
        IT_SUPPORT_INFRA: 0.15
    },
    IT_SUPPORT_INFRA: {
        IT_SUPPORT_INFRA: 1.0,
        CYBERSECURITY: 0.75,
        SOFTWARE_DEV: 0.55,
        DATA_BI: 0.20,
        BUSINESS_ADMIN: 0.20,
        FINANCE_BANKING: 0.15,
        MARKETING_ECOMM: 0.15,
        HR_PEOPLE: 0.15,
        OPERATIONS_LOG: 0.20
    },
    SOFTWARE_DEV: {
        SOFTWARE_DEV: 1.0,
        DATA_BI: 0.60,
        CYBERSECURITY: 0.60,
        IT_SUPPORT_INFRA: 0.50,
        BUSINESS_ADMIN: 0.30,
        FINANCE_BANKING: 0.25,
        MARKETING_ECOMM: 0.35,
        HR_PEOPLE: 0.20,
        OPERATIONS_LOG: 0.25
    },
    CYBERSECURITY: {
        CYBERSECURITY: 1.0,
        IT_SUPPORT_INFRA: 0.75,
        SOFTWARE_DEV: 0.60,
        DATA_BI: 0.40,
        BUSINESS_ADMIN: 0.35,
        FINANCE_BANKING: 0.35,
        HR_PEOPLE: 0.15,
        OPERATIONS_LOG: 0.20,
        MARKETING_ECOMM: 0.15
    },
    HR_PEOPLE: {
        HR_PEOPLE: 1.0,
        BUSINESS_ADMIN: 0.80,
        DATA_BI: 0.70,
        OPERATIONS_LOG: 0.50,
        FINANCE_BANKING: 0.45,
        MARKETING_ECOMM: 0.40,
        SOFTWARE_DEV: 0.15,
        IT_SUPPORT_INFRA: 0.15,
        CYBERSECURITY: 0.15
    },
    OPERATIONS_LOG: {
        OPERATIONS_LOG: 1.0,
        BUSINESS_ADMIN: 0.85,
        FINANCE_BANKING: 0.65,
        DATA_BI: 0.65,
        MARKETING_ECOMM: 0.50,
        HR_PEOPLE: 0.45,
        IT_SUPPORT_INFRA: 0.25,
        SOFTWARE_DEV: 0.20,
        CYBERSECURITY: 0.20
    }
};

const TRANSVERSAL_SKILLS = ["excel", "inglés", "ingles", "office", "word", "powerpoint", "comunicación", "comunicacion", "trabajo en equipo", "proactividad"];

function hasWord(text, kw) {
    if (!text || !kw) return false;
    const t = " " + text.toLowerCase().replace(/[^a-záéíóúüñ0-9_+#-]/gi, " ") + " ";
    const k = " " + kw.toLowerCase().trim() + " ";
    return t.indexOf(k) !== -1;
}

function classifyProfileDomains(profile) {
    if (!profile) return ["BUSINESS_ADMIN"];
    const text = ((profile.edu || "") + " " + (profile.summary || "") + " " + (profile.skills || []).join(" "));
    const scores = {};
    for (const [domKey, domObj] of Object.entries(DOMAINS)) {
        let count = 0;
        domObj.keywords.forEach(kw => {
            if (hasWord(text, kw)) count += 2;
        });
        domObj.criticalSkills.forEach(cs => {
            if (hasWord(text, cs)) count += 4;
        });
        scores[domKey] = count;
    }
    const sorted = Object.entries(scores).filter(([k, v]) => v > 0).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return ["BUSINESS_ADMIN"];
    return sorted.slice(0, 3).map(([k, v]) => k);
}

function inferJobDomain(job) {
    if (job.domain && DOMAINS[job.domain]) return job.domain;
    const text = ((job.title || "") + " " + (job.desc || "") + " " + (job.careerFit || []).join(" ") + " " + (job.sectorLabel || "")).toLowerCase();
    let bestDom = "BUSINESS_ADMIN";
    let bestScore = -1;

    for (const [domKey, domObj] of Object.entries(DOMAINS)) {
        let score = 0;
        domObj.keywords.forEach(kw => {
            if (hasWord(text, kw)) score += (job.title.toLowerCase().includes(kw) ? 6 : 2);
        });
        domObj.criticalSkills.forEach(cs => {
            if (hasWord(text, cs)) score += 3;
        });
        if (score > bestScore) {
            bestScore = score;
            bestDom = domKey;
        }
    }
    return bestDom;
}

function inferCriticalSkills(job, domainKey) {
    if (job.criticalSkills && job.criticalSkills.length > 0) return job.criticalSkills;
    const domObj = DOMAINS[domainKey];
    if (!domObj) return [];
    const text = ((job.title || "") + " " + (job.desc || "") + " " + JSON.stringify(job.requirements || {})).toLowerCase();
    const detected = [];
    domObj.criticalSkills.forEach(cs => {
        if (hasWord(text, cs)) detected.push(cs);
    });
    return detected;
}

// =========================================================================
// MOTOR DE EVALUACIÓN SEMÁNTICA JERÁRQUICA
// =========================================================================
function calculateWeightedScore(job) {
    if (!userProfile) return { score: null, breakdown: null };

    // 1. Clasificación de Dominios
    const userDomains = classifyProfileDomains(userProfile);
    const jobDomainKey = inferJobDomain(job);
    const jobDomain = DOMAINS[jobDomainKey] || DOMAINS.BUSINESS_ADMIN;

    // 2. Matriz de Afinidad
    let maxAffinity = 0.15;
    userDomains.forEach(ud => {
        const matrixRow = DOMAIN_AFFINITY[ud] || {};
        const aff = matrixRow[jobDomainKey] !== undefined ? matrixRow[jobDomainKey] : 0.20;
        if (aff > maxAffinity) maxAffinity = aff;
    });

    const reasonsMet = [];
    const reasonsUnmet = [];

    // 3. Extracción de Requisitos
    const userSkillsLower = (userProfile.skills || []).map(s => s.toLowerCase());
    const userEduLower = (userProfile.edu || "").toLowerCase();

    const jobCriticalRequired = inferCriticalSkills(job, jobDomainKey).map(s => s.toLowerCase());
    const jobMandatory = (job.requirements && job.requirements.mandatory) || [];
    const jobDesirable = (job.requirements && job.requirements.desirable) || [];

    // Detectar coincidencias críticas
    const criticalMet = [];
    const criticalMissing = [];
    jobCriticalRequired.forEach(cs => {
        const met = userSkillsLower.some(us => us.includes(cs) || cs.includes(us));
        if (met) criticalMet.push(cs);
        else criticalMissing.push(cs);
    });

    // Detectar habilidades transversales
    const transversalMet = [];
    TRANSVERSAL_SKILLS.forEach(ts => {
        const reqByJob = [...jobMandatory, ...jobDesirable].some(r => r.toLowerCase().includes(ts));
        const hasUser = userSkillsLower.some(us => us.includes(ts)) || (ts.includes("inglés") && (userProfile.lang || "").length > 0);
        if (reqByJob && hasUser) {
            transversalMet.push(ts);
        }
    });

    // Filtros de horario activos en el navegador
    const wants4h = typeof document !== 'undefined' && document.getElementById('filter4h') ? document.getElementById('filter4h').checked : true;
    const wants6h = typeof document !== 'undefined' && document.getElementById('filter6h') ? document.getElementById('filter6h').checked : true;
    const wants8h = typeof document !== 'undefined' && document.getElementById('filter8h') ? document.getElementById('filter8h').checked : false;

    // 4. PUERTA DE DESCARTE (DEALBREAKER GATE)
    const isDomainIncompatible = maxAffinity < 0.35;
    const isTechnicalRole = ["IT_SUPPORT_INFRA", "SOFTWARE_DEV", "CYBERSECURITY"].includes(jobDomainKey);
    const missingAllCritical = jobCriticalRequired.length > 0 && criticalMet.length === 0;

    if (isDomainIncompatible || (isTechnicalRole && missingAllCritical && maxAffinity < 0.50)) {
        reasonsUnmet.push(`Incompatibilidad de Dominio: El puesto requiere perfil técnico de ${jobDomain.name} (${jobCriticalRequired.slice(0, 3).join(", ") || "especialidad técnica"}).`);
        if (criticalMissing.length > 0) {
            reasonsUnmet.push(`Competencias troncales faltantes: ${criticalMissing.slice(0, 3).join(", ")}.`);
        }
        reasonsMet.push(`Formación universitaria compatible en general.`);
        if (transversalMet.length > 0) {
            reasonsMet.push(`Competencias transversales: ${transversalMet.slice(0, 2).join(", ")}.`);
        }

        const cappedScore = Math.min(30, Math.max(18, Math.round(maxAffinity * 100)));
        return {
            score: cappedScore,
            domain: jobDomain,
            affinity: maxAffinity,
            met: reasonsMet,
            unmet: reasonsUnmet,
            isDealbreaker: true,
            criticalMet: criticalMet,
            criticalMissing: criticalMissing,
            probability: "Baja",
            verdict: `Descarte muy probable. La vacante exige un perfil técnico de ${jobDomain.name} que no concuerda con tu formación.`
        };
    }

    // 5. CÁLCULO PONDERADO PROFUNDO (DOMINIOS COMPATIBLES)
    let score = 0;

    // Componente A: Afinidad de Dominio (35 pts)
    score += (maxAffinity * 35);
    reasonsMet.push(`Alineación de carrera: ${jobDomain.name} (${Math.round(maxAffinity * 100)}% afinidad)`);

    // Componente B: Habilidades Críticas del Puesto (35 pts)
    if (jobCriticalRequired.length > 0) {
        const critRatio = criticalMet.length / jobCriticalRequired.length;
        score += (critRatio * 35);
        criticalMet.forEach(c => reasonsMet.push(`Herramienta clave del puesto: ${c.toUpperCase()}`));
        criticalMissing.forEach(c => reasonsUnmet.push(`Requisito técnico no explicitado en CV: ${c}`));
    } else {
        score += 28;
    }

    // Componente C: Habilidades Transversales & Idiomas (12 pts)
    let transScore = 0;
    if (transversalMet.length > 0) {
        transScore += Math.min(8, transversalMet.length * 4);
        reasonsMet.push(`Competencias complementarias: ${transversalMet.join(", ")}`);
    }
    const lang = (userProfile.lang || "").toLowerCase();
    if (lang.includes("b2") || lang.includes("c1") || lang.includes("avanzado") || lang.includes("first")) {
        transScore += 4;
        reasonsMet.push(`Inglés profesional acreditado`);
    }
    score += Math.min(12, transScore);

    // Componente D: Carrera / Formación Académica (10 pts)
    const matchesCareerFit = (job.careerFit || []).some(cf => userEduLower.includes(cf.toLowerCase()));
    if (matchesCareerFit) {
        score += 10;
        reasonsMet.push(`Carrera solicitada explícitamente (${job.careerFit[0]})`);
    } else {
        score += 5;
    }

    // Componente E: Compatibilidad Horaria (8 pts)
    const matchesCurrentHours = (job.hours === '4h' && wants4h) || (job.hours === '6h' && wants6h) || (job.hours === '8h' && wants8h);
    if (matchesCurrentHours) {
        score += 8;
        reasonsMet.push(`Régimen de ${job.hoursLabel}`);
    } else {
        score += 2;
        reasonsUnmet.push(`Jornada de ${job.hoursLabel} (preferís ${wants4h ? '4h' : ''} ${wants6h ? '6h' : ''})`);
    }

    const finalScore = Math.min(96, Math.max(32, Math.round(score)));
    let prob = "Baja";
    let verdict = "";
    if (finalScore >= 80) {
        prob = "Alta";
        verdict = "¡Excelente oportunidad! Tu formación y herramientas se ajustan al perfil buscado por la empresa.";
    } else if (finalScore >= 60) {
        prob = "Media";
        verdict = "Postulación viable. Tenés buen encaje general, pero convendría destacar proyectos prácticos en tu carta.";
    } else {
        prob = "Baja";
        verdict = "Puesto con brechas técnicas o incompatibilidad de jornada frente a tu perfil actual.";
    }

    return {
        score: finalScore,
        domain: jobDomain,
        affinity: maxAffinity,
        met: reasonsMet,
        unmet: reasonsUnmet,
        isDealbreaker: false,
        criticalMet: criticalMet,
        criticalMissing: criticalMissing,
        probability: prob,
        verdict: verdict
    };
}
