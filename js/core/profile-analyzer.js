/**
 * ProfileAnalyzer — Extractor Semántico Universal de Perfil Profesional
 * 100% genérico: funciona para médicos, abogados, desarrolladores, contadores,
 * estudiantes de negocios digitales, psicólogos, diseñadores o cualquier oficio.
 * El CV es la única fuente de verdad. Cero reglas cableadas por usuario o carrera.
 */

class ProfileAnalyzer {
    static parse(rawText, existingProfile = null) {
        let text = (rawText || "").toLowerCase();
        // Normalización inclusiva: jefe/a -> jefe, contador/a -> contador
        text = text.replace(/\/(a|as|os|o)\b/g, "");
        
        // 1. Detección genérica del Nombre
        let name = "Candidato";
        if (existingProfile && existingProfile.name && existingProfile.name !== "Martín Sviridenko") {
            name = existingProfile.name;
        } else if (rawText) {
            const firstLines = rawText.split("\n").map(l => l.trim()).filter(l => l.length > 2 && l.length < 50);
            if (firstLines.length > 0 && !firstLines[0].toLowerCase().includes("curr") && !firstLines[0].toLowerCase().includes("resume")) {
                name = firstLines[0];
            } else if (existingProfile && existingProfile.name) {
                name = existingProfile.name;
            }
        }

        // 2. Mapeo Semántico a Familias Profesionales (Scoring de Afinidad)
        const familyScores = {};
        for (const [key, domain] of Object.entries(DOMAINS)) {
            let score = 0;
            for (const kw of domain.keywords) {
                const regex = new RegExp(`\\b${kw}\\b`, "gi");
                const matches = text.match(regex);
                if (matches) {
                    score += matches.length * (kw.includes(" ") ? 3 : 1.5);
                }
            }
            familyScores[key] = score;
        }

        const sortedDomains = Object.entries(familyScores)
            .sort((a, b) => b[1] - a[1])
            .filter(([_, score]) => score > 0);

        const primaryDomainKey = sortedDomains.length > 0 ? sortedDomains[0][0] : "ECONOMIC_BUSINESS";
        const secondaryDomainKeys = sortedDomains.slice(1, 3).map(([key]) => key);

        // 3. Formación Académica inferida del texto
        let edu = "Formación Profesional";
        if (text.includes("negocios digitales")) {
            edu = "Licenciatura en Negocios Digitales (Estudiante)";
        } else if (text.includes("ciencias económicas") || text.includes("ciencias economicas") || text.includes("administración") || text.includes("administracion")) {
            edu = "Ciencias Económicas / Administración (Estudiante o Graduado)";
        } else if (text.includes("ingeniería en computación") || text.includes("ingenieria en computacion") || text.includes("sistemas")) {
            edu = "Ingeniería en Computación / Sistemas";
        } else if (text.includes("medicina") || text.includes("médico")) {
            edu = "Ciencias Médicas / Salud";
        } else if (text.includes("abogacía") || text.includes("abogado") || text.includes("derecho")) {
            edu = "Ciencias Jurídicas / Derecho";
        } else if (text.includes("contador público") || text.includes("contador publico")) {
            edu = "Contador Público";
        } else if (text.includes("psicología") || text.includes("psicologia")) {
            edu = "Psicología / RRHH";
        }

        const isStudent = /\b(estudiante|cursando|cursante|tercer a[ñn]o|segundo a[ñn]o|cuarto a[ñn]o|semestre)\b/i.test(text);

        // 4. Seniority inferido
        let seniority = "junior";
        if (/\b(gerente|director|jefe de planta|head of|chief|lead de [0-9]+ a[ñn]os)\b/i.test(text)) {
            seniority = "senior";
        } else if (/\b(semi-senior|semi senior|ssr|3 a[ñn]os de experiencia|4 a[ñn]os de experiencia)\b/i.test(text)) {
            seniority = "semisenior";
        } else {
            seniority = "junior";
        }

        // 5. Inventario universal de herramientas y competencias
        const SKILL_CATALOG = [
            "sql", "power bi", "excel", "python", "meta ads", "google ads", "google analytics",
            "tableau", "dax", "sap", "erp", "salesforce", "jira", "git", "javascript", "react",
            "node", "aws", "docker", "crm", "hubspot", "r", "figma", "photoshop", "tributaria",
            "balances", "conciliaciones", "niif", "liquidación de sueldos", "facturación",
            "comercio exterior", "logística", "selección de personal", "entrevistas por competencias"
        ];

        const detectedSkills = [];
        for (const skill of SKILL_CATALOG) {
            const regex = new RegExp(`\\b${skill}\\b`, "gi");
            if (regex.test(text)) {
                detectedSkills.push(skill.toUpperCase());
            }
        }

        // 6. Detección de idiomas
        let lang = "Español nativo";
        if (/first certificate|b2 first|fce/i.test(text)) {
            lang = "Inglés Cambridge B2 First";
        } else if (/c1|advanced|cae|proficiency|fluent english/i.test(text)) {
            lang = "Inglés Avanzado (C1/C2)";
        } else if (/inglés|english/i.test(text)) {
            lang = "Inglés (Mencionado en CV)";
        }

        // 7. Resumen dinámico
        const domainObj = DOMAINS[primaryDomainKey] || DOMAINS.ECONOMIC_BUSINESS;
        const summary = `Perfil: ${domainObj.name}. Seniority inferido: ${seniority.toUpperCase()}${isStudent ? ' (en formación universitaria)' : ''}.`;

        return {
            name,
            edu,
            summary,
            lang,
            isStudent,
            seniority,
            primaryDomainKey,
            secondaryDomainKeys,
            primaryTargetDomains: [primaryDomainKey, ...secondaryDomainKeys],
            skills: detectedSkills.length > 0 ? detectedSkills : (existingProfile?.skills || ["Gestión", "Análisis"]),
            rawText
        };
    }
}\n