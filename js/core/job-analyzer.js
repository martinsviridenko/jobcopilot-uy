/**
 * JobCopilot v3 — Job Deep Analyzer
 * Full text reading of vacancy descriptions, degree requirements, shifts and constraints.
 */

class JobAnalyzer {
    static hasWord(text, kw) {
        if (!text || !kw) return false;
        const t = " " + text.toLowerCase().replace(/[^a-záéíóúüñ0-9_+#-]/gi, " ") + " ";
        const k = " " + kw.toLowerCase().trim() + " ";
        return t.indexOf(k) !== -1;
    }

    static analyze(job) {
        const title = job.title || "";
        const desc = job.desc || job.description || "";
        const fullText = (title + " " + desc + " " + (job.sectorLabel || "") + " " + (job.company || "")).toLowerCase();
        const titleLower = title.toLowerCase();

        // 1. Discipline / Domain Inference
        let domainKey = "BUSINESS_MANAGEMENT";
        
        // Immediate domain hard-interceptors
        if (["fonoaudiól", "fonoaudiol", "médic", "medic", "enfermer", "psicól", "psicol", "odontól", "terapeut", "fisioterap", "nutricion", "veterinari", "teletón"].some(k => titleLower.includes(k) || desc.toLowerCase().includes(k))) {
            domainKey = "HEALTH_MEDICAL";
        } else if (["jefe de planta", "jefa de planta", "planta y proyectos", "ingeniero de planta", "mantenimiento industrial", "producción industrial", "tornero", "soldador", "electromecánic", "mecánico", "chofer", "peón", "vigilante"].some(k => titleLower.includes(k) || desc.toLowerCase().includes(k))) {
            domainKey = "INDUSTRIAL_PLANT";
        } else if (["docente", "profesor", "profesora", "maestro", "maestra", "educador", "educadora", "colegio", "liceo"].some(k => titleLower.includes(k) || desc.toLowerCase().includes(k))) {
            domainKey = "EDUCATION_TEACHING";
        } else if (["abogado", "abogada", "escribano", "escribana", "notarial", "procurador"].some(k => titleLower.includes(k) || desc.toLowerCase().includes(k))) {
            domainKey = "LEGAL_NOTARIAL";
        } else if (job.domain && DOMAINS[job.domain] && !["BUSINESS_ADMIN", "BUSINESS_MANAGEMENT"].includes(job.domain)) {
            domainKey = job.domain;
        } else {
            let bestScore = 0;
            for (const [dKey, dObj] of Object.entries(DOMAINS)) {
                let score = 0;
                dObj.keywords.forEach(kw => {
                    if (this.hasWord(fullText, kw)) score += (titleLower.includes(kw) ? 8 : 2);
                });
                dObj.criticalSkills.forEach(cs => {
                    if (this.hasWord(fullText, cs)) score += 3;
                });
                if (score > bestScore) {
                    bestScore = score;
                    domainKey = dKey;
                }
            }
            if (bestScore === 0) domainKey = "INDUSTRIAL_PLANT";
        }

        // 2. Career & Degree Requirements Extraction
        const demandedDegrees = [];
        if (this.hasWord(fullText, "ingeniería en computación") || this.hasWord(fullText, "ingenieria en computacion") || this.hasWord(fullText, "ingeniería en sistemas") || this.hasWord(fullText, "computer science") || this.hasWord(fullText, "licenciatura en computación")) {
            demandedDegrees.push("INGENIERIA_COMPUTACION_CORE");
        }
        if (this.hasWord(fullText, "psicología") || this.hasWord(fullText, "psicologia") || this.hasWord(fullText, "relaciones laborales") || this.hasWord(fullText, "reclutamiento")) {
            demandedDegrees.push("PSICOLOGIA_RRHH_CORE");
        }
        if (this.hasWord(fullText, "negocios digitales") || this.hasWord(fullText, "administración") || this.hasWord(fullText, "ciencias económicas") || this.hasWord(fullText, "economía") || this.hasWord(fullText, "analítica de datos")) {
            demandedDegrees.push("NEGOCIOS_DIGITALES_DATOS");
        }
        if (this.hasWord(fullText, "contador") || this.hasWord(fullText, "contabilidad") || this.hasWord(fullText, "cpa") || this.hasWord(fullText, "finanzas")) {
            demandedDegrees.push("CONTABILIDAD_FINANZAS");
        }

        // 3. Seniority Analysis
        const isLeadership = ["jefe", "jefa", "gerente", "gerenta", "director", "directora", "head of", "lead", "senior"].some(w => this.hasWord(titleLower, w));
        const isStudentLevel = ["pasantía", "pasantia", "estudiante", "trainee", "becario", "student worker", "junior", "sin experiencia"].some(w => this.hasWord(fullText, w));
        
        let calculatedSeniority = "Junior";
        if (isLeadership) calculatedSeniority = "Jefatura / Gerencia";
        else if (job.seniority) calculatedSeniority = job.seniority;
        else if (isStudentLevel) calculatedSeniority = "Pasantía / Trainee";

        // 4. Shift Detection (Matutino / Vespertino / Flexible)
        let shift = "Flexible";
        if (fullText.includes("mañana") || fullText.includes("matutino") || fullText.includes("8 a 12") || fullText.includes("9 a 13") || fullText.includes("9 a 15")) {
            shift = "Matutino";
        } else if (fullText.includes("tarde") || fullText.includes("vespertino") || fullText.includes("13 a 17") || fullText.includes("14 a 18") || fullText.includes("14 a 20")) {
            shift = "Vespertino";
        } else if (fullText.includes("noche") || fullText.includes("nocturno")) {
            shift = "Nocturno";
        }

        // 5. English Requirement
        const requiresEnglish = fullText.includes("inglés avanzado") || fullText.includes("ingles avanzado") || fullText.includes("fluent english") || fullText.includes("b2") || fullText.includes("c1");

        return {
            domainKey,
            domain: DOMAINS[domainKey] || DOMAINS.BUSINESS_MANAGEMENT,
            demandedDegrees,
            calculatedSeniority,
            isLeadership,
            isStudentLevel,
            shift,
            requiresEnglish,
            fullText
        };
    }
}
