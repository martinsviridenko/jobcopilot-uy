/**
 * MatchingEngine — Evaluador Universal en Dos Etapas con Principio "In Dubio Pro Candidato"
 * 
 * Etapa 1: Viability Gate (Descarte silencioso SOLO ante incompatibilidad radical indiscutible)
 * - Puestos de Salud Médica/Clínica vs perfiles ajenos a la salud.
 * - Títulos habilitantes legales excluyentes (Abogado matriculado).
 * - Jefaturas de Planta / Direcciones de 10+ años vs perfiles junior/estudiantes.
 * 
 * Regla de Oro: Si la IA duda o hay matices, NO SE DESCARTA. Pasa al feed ranqueada con menor score (45%-60%)
 * para que el usuario siempre tenga la libertad de postularse.
 * 
 * Etapa 2: Probabilidad Real de ser Competitivo (Puntaje Ponderado Transparente)
 */

class MatchingEngine {
    static evaluate(job, candidateProfile) {
        if (!candidateProfile) {
            return {
                score: 70,
                isDealbreaker: false,
                whyAppeared: "Cargá tu CV para ver el análisis de reclutador personalizado.",
                probability: "Estándar",
                verdict: "Oportunidad disponible para postulación.",
                domain: DOMAINS.ECONOMIC_BUSINESS,
                met: ["Vacante activa en el mercado uruguayo"],
                unmet: [],
                boosters: [],
                penalties: []
            };
        }

        const jobAnalysis = JobAnalyzer.analyze(job);
        const jobDomain = jobAnalysis.domain;
        const jobDomainKey = jobAnalysis.domainKey;
        const candDomainKey = candidateProfile.primaryDomainKey || "ECONOMIC_BUSINESS";

        // =========================================================================
        // ETAPA 1: VIABILITY GATE (Descarte duro SOLO ante incompatibilidad radical)
        // =========================================================================

        // 1. Descarte Clínico/Salud Estricto
        if ((jobDomainKey === "HEALTH_MEDICAL" || jobAnalysis.requiresStrictHealthLicense) && candDomainKey !== "HEALTH_MEDICAL") {
            return {
                score: 0,
                isDealbreaker: true,
                dealbreakerReason: "Incompatibilidad médica asistencial",
                whyAppeared: "Descarte radical: Puesto clínico/asistencial que exige título de la salud.",
                probability: "Descarte",
                verdict: "Descarte: Requiere formación profesional en ciencias médicas o de la salud.",
                domain: jobDomain,
                met: [],
                unmet: ["Título y formación asistencial/médica requerida"],
                boosters: [],
                penalties: ["Sector salud excluyente"]
            };
        }

        // 2. Descarte Jurídico Matriculado Estricto
        if (jobAnalysis.requiresStrictLegalBar && candDomainKey !== "LEGAL_NOTARIAL") {
            return {
                score: 0,
                isDealbreaker: true,
                dealbreakerReason: "Incompatibilidad regulatoria legal",
                whyAppeared: "Descarte radical: Exige matrícula habilitante de Abogado o Escribano.",
                probability: "Descarte",
                verdict: "Descarte: Requiere título habilitante legal para litigar o actuar como notario.",
                domain: jobDomain,
                met: [],
                unmet: ["Matrícula profesional de abogado habilitado"],
                boosters: [],
                penalties: ["Requisito legal excluyente"]
            };
        }

        // 3. Descarte de Brecha Jerárquica Extrema / Planta Industrial Pesada
        if (jobAnalysis.requiredSeniority === "executive" && candidateProfile.seniority === "junior") {
            return {
                score: 0,
                isDealbreaker: true,
                dealbreakerReason: "Brecha jerárquica insalvable",
                whyAppeared: "Descarte radical: Jefatura de planta o dirección ejecutiva con alta experiencia requerida.",
                probability: "Descarte",
                verdict: "Descarte: Puesto directivo/industrial que requiere años de liderazgo operativo.",
                domain: jobDomain,
                met: [],
                unmet: ["Experiencia comprobada de 8+ años en gestión directiva o de planta industrial"],
                boosters: [],
                penalties: ["Jerarquía ejecutiva incompatible con perfil junior"]
            };
        }

        // =========================================================================
        // PRINCIPIO: IN DUBIO PRO CANDIDATO (Ante la duda, es VIABLE)
        // =========================================================================
        
        // Si el puesto pide "Ciencias Económicas" o afines y el candidato proviene o se vincula con esa macro-área:
        const isEconomicAffinity = jobAnalysis.admitsEconomicSciences && 
            (candDomainKey === "ECONOMIC_BUSINESS" || (candidateProfile.secondaryDomainKeys || []).includes("ECONOMIC_BUSINESS"));

        // Calcular afinidad del campo (0.0 a 1.0)
        let affinity = DOMAIN_AFFINITY[candDomainKey]?.[jobDomainKey] ?? 0.40;
        if (isEconomicAffinity) {
            affinity = Math.max(affinity, 0.90);
        }

        // Si la afinidad es prácticamente nula (< 0.15) y no admite estudiantes:
        if (affinity < 0.15 && !jobAnalysis.admitsStudents) {
            return {
                score: 20,
                isDealbreaker: true,
                dealbreakerReason: `Disciplina lejana (${jobDomain.name})`,
                whyAppeared: `Descarte: Rol en ${jobDomain.name} sin relación con tu campo.`,
                probability: "Descarte",
                verdict: "Descarte por falta de afinidad funcional.",
                domain: jobDomain,
                met: [],
                unmet: ["Formación en área especializada del puesto"],
                boosters: [],
                penalties: ["Baja transferibilidad"]
            };
        }

        // =========================================================================
        // ETAPA 2: SCORING COMPETITIVO Y TRANSPARENCIA
        // =========================================================================

        const met = [];
        const unmet = [];
        const boosters = [];
        const penalties = [];

        // 1. Puntos por Afinidad de Campo (0 a 45 pts)
        let fieldScore = Math.round(45 * affinity);
        if (candDomainKey === jobDomainKey || isEconomicAffinity) {
            met.push(`Formación alineada al área de ${jobDomain.name}`);
            boosters.push("Afinidad directa con la disciplina del puesto");
        } else {
            met.push(`Habilidades transferibles hacia ${jobDomain.name}`);
            penalties.push("Área profesional adyacente");
        }

        // 2. Cobertura de Requisitos y Herramientas (0 a 30 pts)
        let skillsScore = 15;
        const candidateSkills = (candidateProfile.skills || []).map(s => s.toLowerCase());

        if (jobAnalysis.detectedReqs.length > 0) {
            let matchedCount = 0;
            for (const req of jobAnalysis.detectedReqs) {
                const reqLower = req.toLowerCase();
                const hasSkill = candidateSkills.some(cs => cs.includes(reqLower) || reqLower.includes(cs));
                if (hasSkill) {
                    matchedCount++;
                    met.push(`Dominio de herramienta requerida: ${req}`);
                } else {
                    unmet.push(`Requisito a compensar o adquirir: ${req}`);
                }
            }
            const ratio = matchedCount / jobAnalysis.detectedReqs.length;
            skillsScore = Math.round(30 * ratio);
            if (ratio >= 0.6) boosters.push(`Cumplís con el ${Math.round(ratio * 100)}% de herramientas clave`);
        } else {
            skillsScore = 22;
            met.push("Competencias analíticas y de gestión valoradas para el rol");
        }

        // 3. Seniority y Nivel Formativo (0 a 20 pts)
        let seniorityScore = 15;
        if (jobAnalysis.admitsStudents && candidateProfile.isStudent) {
            seniorityScore = 20;
            met.push("Perfil universitario/estudiante admitido por la vacante");
            boosters.push("Puesto diseñado para formación y jóvenes profesionales");
        } else if (jobAnalysis.requiredSeniority === "semisenior" && candidateProfile.seniority === "junior") {
            seniorityScore = 10;
            penalties.push("Puesto semi-senior: conviene destacar proyectos autónomos");
        } else {
            seniorityScore = 18;
        }

        // 4. Idiomas (0 a 5 pts)
        let langScore = 4;
        if (/inglés|english/i.test(jobAnalysis.rawScan)) {
            if (candidateProfile.lang && /b2|c1|c2|advanced|first/i.test(candidateProfile.lang)) {
                langScore = 5;
                met.push("Cumplís con el nivel de inglés requerido");
            }
        }

        let totalScore = fieldScore + skillsScore + seniorityScore + langScore;
        totalScore = Math.min(Math.max(totalScore, 40), 96);

        // Determinación del Veredicto y Por qué te conviene
        let verdict = "";
        let probability = "Moderada";
        let whyAppeared = "";

        if (totalScore >= 75) {
            probability = "Alta";
            verdict = "Match Ideal: Tu formación y herramientas te posicionan como candidato muy competitivo.";
            whyAppeared = `Afinidad directa con ${jobDomain.name} y dominio de competencias requeridas por ${job.company}.`;
        } else if (totalScore >= 60) {
            probability = "Buena";
            verdict = "Buena Oportunidad: Cumplís con la base principal del puesto y podés postularte con sólidas chances.";
            whyAppeared = `El perfil de ${job.company} valora disciplinas afines a tu carrera y competencias transferibles.`;
        } else {
            probability = "Afinidad Parcial / Desafío";
            verdict = "Oportunidad Adyacente: El puesto presenta matices o requisitos a reforzar, pero tenés perfil para intentarlo.";
            whyAppeared = `Oportunidad en área adyacente. Se recomienda adaptar el CV para destacar proyectos relacionados.`;
        }

        return {
            score: totalScore,
            isDealbreaker: false,
            dealbreakerReason: null,
            whyAppeared,
            probability,
            verdict,
            domain: jobDomain,
            met,
            unmet: unmet.length > 0 ? unmet : ["Sin brechas críticas detectadas"],
            boosters,
            penalties
        };
    }
}\n