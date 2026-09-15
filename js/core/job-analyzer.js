/**
 * JobAnalyzer — Extractor Semántico Universal de Vacantes
 * Detecta la familia funcional del puesto, si está abierto a carreras afines (ej. Ciencias Económicas),
 * su nivel de jerarquía y si impone restricciones estrictamente excluyentes.
 */

class JobAnalyzer {
    static analyze(job) {
        if (!job) return null;

        let rawTitle = job.title || "";
        let normalizedTitle = rawTitle.toLowerCase().replace(/\/(a|as|os|o)\b/g, "");

        let textToScan = `
            ${normalizedTitle}
            ${job.company || ""}
            ${job.desc || job.description || ""}
            ${job.area || ""}
            ${job.location || ""}
        `.toLowerCase().replace(/\/(a|as|os|o)\b/g, "");

        // 1. Scoring semántico para identificar el dominio del puesto
        const domainScores = {};
        for (const [key, domain] of Object.entries(DOMAINS)) {
            let score = 0;
            for (const kw of domain.keywords) {
                const regex = new RegExp(`\\b${kw}\\b`, "gi");
                const matches = textToScan.match(regex);
                if (matches) {
                    const inTitle = normalizedTitle.includes(kw);
                    score += matches.length * (inTitle ? 6 : 1.5);
                }
            }
            domainScores[key] = score;
        }

        const sorted = Object.entries(domainScores)
            .sort((a, b) => b[1] - a[1])
            .filter(([_, score]) => score > 0);

        const domainKey = sorted.length > 0 ? sorted[0][0] : "ECONOMIC_BUSINESS";
        const domain = DOMAINS[domainKey] || DOMAINS.ECONOMIC_BUSINESS;

        // 2. Apertura explícita a carreras afines
        const admitsEconomicSciences = /\b(ciencias econ[óo]micas|administraci[óo]n|negocios|econom[íi]a|comercial|marketing|carreras afines)\b/i.test(textToScan);
        const admitsStudents = /\b(estudiante|pasant[íi]a|practicante|trainee|j[óo]venes profesionales|sin experiencia|primer empleo)\b/i.test(textToScan);

        // 3. Exclusiones Regulatorias / Título Habilitante Estricto
        const requiresStrictHealthLicense = /\b(t[íi]tulo de m[ée]dico|m[ée]dico general|fonoaudi[óo]logo|licenciatura en fonoaudiolog[íi]a|odont[óo]logo|enfermero matriculado)\b/i.test(textToScan) ||
            /fonoaudi|médico general|odontólogo|cirujano/i.test(normalizedTitle);

        const requiresStrictLegalBar = /\b(abogado matriculado|t[íi]tulo de abogado|escribano p[úu]blico|firma de balances legal)\b/i.test(textToScan);

        // 4. Seniority del Puesto (Normalizado)
        let requiredSeniority = "junior";
        const isExecutive = /\b(jefe de planta|jefatura de planta|jefatura|director general|gerente general|head of|chief)\b/i.test(normalizedTitle);
        const isSenior = /\b(senior|sr\\b|5\\+ a[ñn]os|8 a[ñn]os|10 a[ñn]os)\b/i.test(textToScan);
        const isSemiSenior = /\b(semi senior|semi-senior|ssr|2 a[ñn]os|3 a[ñn]os)\b/i.test(textToScan);

        if (isExecutive) requiredSeniority = "executive";
        else if (isSenior) requiredSeniority = "senior";
        else if (isSemiSenior) requiredSeniority = "semisenior";
        else requiredSeniority = "junior";

        // 5. Requisitos técnicos detectados
        const detectedReqs = [];
        const commonReqs = [
            "sql", "power bi", "excel", "python", "sap", "erp", "salesforce",
            "meta ads", "google ads", "tableau", "inglés", "english"
        ];
        for (const req of commonReqs) {
            const regex = new RegExp(`\\b${req}\\b`, "gi");
            if (regex.test(textToScan)) {
                detectedReqs.push(req.toUpperCase());
            }
        }

        return {
            domainKey,
            domain,
            admitsEconomicSciences,
            admitsStudents,
            requiresStrictHealthLicense,
            requiresStrictLegalBar,
            requiredSeniority,
            detectedReqs,
            rawScan: textToScan
        };
    }
}