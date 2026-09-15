/**
 * JobCopilot v3 — Matching Engine & Recruiter Decision Gate
 * Calibrated interview probability score with career exclusion gates.
 */

class MatchingEngine {
    static evaluate(job, candidateProfile) {
        if (!candidateProfile) {
            return { score: null, isDealbreaker: false, whyAppeared: "Cargá tu CV para ver el análisis de reclutador." };
        }

        const jobAnalysis = JobAnalyzer.analyze(job);
        const domainKey = jobAnalysis.domainKey;
        const jobDomain = jobAnalysis.domain;

        // 1. Check Domain Affinity from Candidate's primary domains
        let maxAffinity = 0.0;
        candidateProfile.primaryTargetDomains.forEach(pDom => {
            const row = DOMAIN_AFFINITY[pDom] || {};
            const aff = row[domainKey] !== undefined ? row[domainKey] : 0.0;
            if (aff > maxAffinity) maxAffinity = aff;
        });

        // 2. Candidate Skills & Tools Check
        const candidateSkillsLower = (candidateProfile.skills || []).map(s => s.toLowerCase());
        const jobCriticalRequired = (job.criticalSkills && job.criticalSkills.length > 0)
            ? job.criticalSkills.map(s => s.toLowerCase())
            : (jobDomain.criticalSkills || []).map(s => s.toLowerCase());

        const criticalMet = [];
        const criticalMissing = [];
        jobCriticalRequired.forEach(cs => {
            const hasSkill = candidateSkillsLower.some(us => us.includes(cs) || cs.includes(us));
            if (hasSkill) criticalMet.push(cs);
            else criticalMissing.push(cs);
        });

        // =========================================================================
        // COMPUERTAS DE ADMISIÓN (RECRUITER HARD GATES)
        // =========================================================================

        // GATE A: Non-Business / Non-Analytics Disciplines (Salud, Fábricas, Docencia, Leyes)
        const nonCompatibleDomains = ["HEALTH_MEDICAL", "INDUSTRIAL_PLANT", "EDUCATION_TEACHING", "LEGAL_NOTARIAL"];
        if (nonCompatibleDomains.includes(domainKey) || maxAffinity === 0) {
            return {
                score: 4,
                isDealbreaker: true,
                dealbreakerReason: `Disciplina incompatible: ${jobDomain.name}`,
                whyAppeared: `Descarte automático: Vacante de ${jobDomain.name}, fuera del ámbito de Negocios y Datos.`,
                probability: "Descarte",
                verdict: `Descarte definitivo: Rol ajeno a tu formación universitaria.`,
                domain: jobDomain,
                met: [],
                unmet: [`Carrera requerida no afín a Negocios Digitales (${jobDomain.name})`],
                boosters: [],
                penalties: ["Especialidad incompatible (-95%)"]
            };
        }

        // GATE B: Pure Software Engineering / AI Development Degree Exclusion
        // If a vacancy demands a Computer Science / Engineering degree for production code or AI dev
        if (jobAnalysis.demandedDegrees.includes("INGENIERIA_COMPUTACION_CORE")) {
            const isFullstackOrAI = ["ai developer", "software developer", "fullstack", "backend", "developer trainee"].some(w => job.title.toLowerCase().includes(w));
            if (isFullstackOrAI) {
                return {
                    score: 8,
                    isDealbreaker: true,
                    dealbreakerReason: "Exige titulación excluyente en Ingeniería en Computación / Sistemas",
                    whyAppeared: "Descarte técnico: Puesto de desarrollo de código o IA que exige formación en Ingeniería de Sistemas.",
                    probability: "Descarte",
                    verdict: "El reclutador exige perfil graduado o avanzado de Ingeniería en Computación pura.",
                    domain: jobDomain,
                    met: criticalMet.map(c => `Conocimiento complementario: ${c.toUpperCase()}`),
                    unmet: ["Título universitario en Ingeniería en Computación / Sistemas requerido por el aviso"],
                    boosters: [],
                    penalties: ["Carrera de grado requerida distinta a Negocios Digitales (-90%)"]
                };
            }
        }

        // GATE C: Pure HR Recruiting / Psychology Degree Exclusion
        if (jobAnalysis.demandedDegrees.includes("PSICOLOGIA_RRHH_CORE")) {
            const isPureRecruiting = ["reclutamiento", "selección", "recruiting", "talent acquisition"].some(w => job.title.toLowerCase().includes(w));
            if (isPureRecruiting) {
                return {
                    score: 12,
                    isDealbreaker: true,
                    dealbreakerReason: "Exige formación específica en Psicología o Relaciones Laborales para Selección",
                    whyAppeared: "Descarte de perfil: Rol de reclutamiento masivo o evaluación psicotécnica, no analítica de personas.",
                    probability: "Descarte",
                    verdict: "Vacante orientada a Licenciados en Psicología o Relaciones Laborales con foco en entrevistas.",
                    domain: jobDomain,
                    met: ["Habilidades generales de gestión"],
                    unmet: ["Formación troncal en Psicología / Selección de Personal"],
                    boosters: [],
                    penalties: ["Perfil de selección pura fuera del ámbito de Negocios Digitales (-85%)"]
                };
            }
        }

        // GATE D: Seniority / Leadership Gate
        if (jobAnalysis.isLeadership) {
            return {
                score: 8,
                isDealbreaker: true,
                dealbreakerReason: `Jerarquía Incompatible: ${jobAnalysis.calculatedSeniority}`,
                whyAppeared: "Descarte por experiencia: Puesto directivo o jefatura que requiere más de 5 años de trayectoria.",
                probability: "Descarte",
                verdict: "Exige liderazgo de equipos o gestión de planta senior, incompatible con tu etapa universitaria.",
                domain: jobDomain,
                met: criticalMet.map(c => `Conocimiento técnico: ${c.toUpperCase()}`),
                unmet: ["Exige trayectoria comprobable de jefatura / gerencia previa"],
                boosters: [],
                penalties: ["Nivel jerárquico directivo (-85%)"]
            };
        }

        // GATE E: IT Hardware & Networking Infrastructure Gate
        if (domainKey === "IT_INFRA_SUPPORT" && criticalMet.length === 0) {
            return {
                score: 10,
                isDealbreaker: true,
                dealbreakerReason: "Especialidad en Redes Físicas y Hardware TI ajena a Negocios",
                whyAppeared: "Descarte técnico: Requiere cableado, servidores Linux o routers Cisco.",
                probability: "Descarte",
                verdict: "Se busca técnico de soporte físico de hardware, no analista funcional ni de datos.",
                domain: jobDomain,
                met: ["Manejo informático básico"],
                unmet: ["Conocimientos en redes físicas, servidores y soporte de hardware"],
                boosters: [],
                penalties: ["Especialidad técnica ajena (-80%)"]
            };
        }

        // =========================================================================
        // CALCULO PONDERADO DE PROBABILIDAD DE ENTREVISTA (ROLES COMPATIBLES)
        // =========================================================================
        let score = 0;
        const reasonsMet = [];
        const reasonsUnmet = [];
        const boosters = [];
        const penalties = [];

        // 1. Afinidad de Carrera y Dominio (35 pts)
        score += (maxAffinity * 35);
        reasonsMet.push(`Afinidad directa con ${jobDomain.name} (${Math.round(maxAffinity * 100)}%)`);
        if (maxAffinity >= 0.85) boosters.push("Afinidad central con Negocios y Analítica");

        // 2. Herramientas Críticas Requeridas (30 pts)
        if (jobCriticalRequired.length > 0) {
            const ratio = criticalMet.length / jobCriticalRequired.length;
            score += (ratio * 30);
            criticalMet.forEach(c => {
                reasonsMet.push(`Herramienta clave dominada: ${c.toUpperCase()}`);
                boosters.push(`Dominio de ${c.toUpperCase()}`);
            });
            criticalMissing.slice(0, 2).forEach(c => {
                reasonsUnmet.push(`Herramienta no destacada en CV: ${c}`);
                penalties.push(`Falta certificar ${c}`);
            });
        } else {
            score += 25;
            reasonsMet.push("Requisitos técnicos accesibles para tu nivel");
        }

        // 3. Nivel de Seniority & Foco en Estudiantes (15 pts)
        if (jobAnalysis.isStudentLevel || job.hours === '4h') {
            score += 15;
            reasonsMet.push("Vacante ideal para estudiantes: Pasantía o Jr con desarrollo");
            boosters.push("Pasantía orientada a estudiantes universitarios");
        } else {
            score += 8;
        }

        // 4. Régimen Horario Compatible con Cursada (10 pts)
        if (job.hours === '4h' || job.hours === '6h' || jobAnalysis.shift === "Matutino" || jobAnalysis.shift === "Vespertino") {
            score += 10;
            reasonsMet.push(`Jornada compatible con facultad: ${job.hoursLabel || 'Medio turno'}`);
            boosters.push("Carga horaria adaptable a cursada universitaria");
        } else {
            score += 5;
            reasonsUnmet.push(`Jornada laboral completa: ${job.hoursLabel || '8 horas'}`);
        }

        // 5. Inglés Profesional (10 pts)
        if (jobAnalysis.requiresEnglish) {
            if ((candidateProfile.lang || "").includes("B2") || (candidateProfile.lang || "").includes("First") || (candidateProfile.lang || "").includes("C1")) {
                score += 10;
                reasonsMet.push("Inglés profesional certificado (Cambridge B2 First)");
                boosters.push("Nivel de inglés validado");
            } else {
                penalties.push("Aviso solicita inglés fluido");
            }
        } else {
            score += 7;
        }

        const finalScore = Math.min(98, Math.max(20, Math.round(score)));
        let prob = "Baja";
        let verdict = "";

        if (finalScore >= 80) {
            prob = "Alta";
            verdict = "¡Excelente oportunidad! Tu perfil universitario y herramientas coinciden plenamente con lo solicitado.";
        } else if (finalScore >= 60) {
            prob = "Media";
            verdict = "Postulación viable. Tenés buen encaje general; destacá proyectos universitarios relevantes en tu carta.";
        } else {
            prob = "Baja";
            verdict = "Puesto con brechas técnicas o incompatibilidad de jornada frente a tu perfil actual.";
        }

        const matchedTools = criticalMet.slice(0, 2).map(s => s.toUpperCase()).join(" y ");
        const whyAppeared = matchedTools
            ? `Recomendada por tu dominio de ${matchedTools} y la compatibilidad con tu formación en Negocios Digitales.`
            : `Recomendada por su alineación con el área de ${jobDomain.name} y disponibilidad universitaria.`;

        return {
            score: finalScore,
            isDealbreaker: false,
            dealbreakerReason: null,
            whyAppeared,
            probability: prob,
            verdict,
            domain: jobDomain,
            met: reasonsMet,
            unmet: reasonsUnmet,
            boosters,
            penalties
        };
    }
}
