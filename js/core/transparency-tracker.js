/**
 * TransparencyTracker — Auditoría y Trazabilidad de Búsqueda
 * Registra qué fuentes se consultan, cuántas vacantes devuelve cada una,
 * cuáles se descartan y por qué motivo exacto.
 */

class TransparencyTracker {
    static detectSource(job) {
        const url = (job.applyUrl || "").toLowerCase();
        const comp = (job.company || "").toLowerCase();
        const src = (job.source || "").toLowerCase();

        if (url.includes("advice.zohorecruit.com") || comp.includes("advice") || src.includes("advice")) return "Advice Recursos Humanos";
        if (url.includes("cpaferrere.com") || comp.includes("cpa ferrere") || src.includes("cpa")) return "CPA Ferrere";
        if (url.includes("linkedin.com") || job.isLinkedIn || src.includes("linkedin")) return "LinkedIn Uruguay";
        if (url.includes("buscojobs.com.uy") || src.includes("buscojobs")) return "BuscoJobs Uruguay";
        if (url.includes("smarttalent.uy") || src.includes("smarttalent")) return "Smart Talent Uruguay";
        if (url.includes("computrabajo.com.uy") || src.includes("computrabajo")) return "CompuTrabajo Uruguay";
        if (url.includes("gallito.com.uy") || src.includes("gallito")) return "El Gallito Luis";
        return "Portales Directos / Empresas";
    }

    static getAuditReport(allJobs, candidateProfile) {
        const sourceBreakdown = {};
        const allRecords = [];
        let approvedCount = 0;
        let discardedCount = 0;

        (allJobs || []).forEach(job => {
            const sourceName = this.detectSource(job);
            if (!sourceBreakdown[sourceName]) {
                sourceBreakdown[sourceName] = { total: 0, approved: 0, discarded: 0 };
            }
            sourceBreakdown[sourceName].total++;

            const evaluation = MatchingEngine.evaluate(job, candidateProfile);
            const isApproved = !evaluation.isDealbreaker && (evaluation.score >= CONFIG.MIN_DISPLAY_SCORE);

            if (isApproved) {
                approvedCount++;
                sourceBreakdown[sourceName].approved++;
                allRecords.push({
                    id: job.id,
                    title: job.title,
                    company: job.company,
                    source: sourceName,
                    score: evaluation.score,
                    status: "Aprobada",
                    reason: evaluation.verdict || "Afinidad con perfil",
                    job
                });
            } else {
                discardedCount++;
                sourceBreakdown[sourceName].discarded++;
                allRecords.push({
                    id: job.id,
                    title: job.title,
                    company: job.company,
                    source: sourceName,
                    score: evaluation.score || 0,
                    status: "Descartada",
                    reason: evaluation.dealbreakerReason || "Baja afinidad con el campo del candidato",
                    job
                });
            }
        });

        return {
            totalJobs: allJobs.length,
            approvedCount,
            discardedCount,
            sourceBreakdown,
            allRecords
        };
    }
}
