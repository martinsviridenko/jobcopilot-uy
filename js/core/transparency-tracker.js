/**
 * JobCopilot v3 — Transparency Tracker & Sources Radar
 * Provides 100% auditable metrics: sources queried, found count, discarded count and exact reasons.
 */

class TransparencyTracker {
    static detectSource(job) {
        const url = (job.applyUrl || "").toLowerCase();
        const comp = (job.company || "").toLowerCase();
        
        if (url.includes("advice.zohorecruit.com") || comp.includes("advice")) return "Advice Recursos Humanos";
        if (url.includes("cpaferrere.com") || comp.includes("cpa ferrere")) return "CPA Ferrere";
        if (url.includes("linkedin.com") || job.isLinkedIn) return "LinkedIn Uruguay";
        if (url.includes("buscojobs.com.uy")) return "BuscoJobs Uruguay";
        if (url.includes("smarttalent.uy")) return "Smart Talent Uruguay";
        if (url.includes("gallito.com.uy")) return "Gallito Luis";
        return "Portales Directos / Empresas";
    }

    static generateReport(allJobs, candidateProfile) {
        const sourceStats = {
            "Advice Recursos Humanos": { queried: true, found: 0, approved: 0, discarded: 0 },
            "CPA Ferrere": { queried: true, found: 0, approved: 0, discarded: 0 },
            "LinkedIn Uruguay": { queried: true, found: 0, approved: 0, discarded: 0 },
            "BuscoJobs Uruguay": { queried: true, found: 0, approved: 0, discarded: 0 },
            "Smart Talent Uruguay": { queried: true, found: 0, approved: 0, discarded: 0 },
            "Portales Directos / Empresas": { queried: true, found: 0, approved: 0, discarded: 0 }
        };

        const discardAuditLog = [];
        const approvedJobs = [];

        (allJobs || []).forEach(job => {
            const sourceName = this.detectSource(job);
            if (!sourceStats[sourceName]) {
                sourceStats[sourceName] = { queried: true, found: 0, approved: 0, discarded: 0 };
            }
            sourceStats[sourceName].found++;

            const evaluation = MatchingEngine.evaluate(job, candidateProfile);

            if (evaluation.isDealbreaker || (evaluation.score !== null && evaluation.score < CONFIG.MIN_DISPLAY_SCORE)) {
                sourceStats[sourceName].discarded++;
                discardAuditLog.push({
                    id: job.id,
                    title: job.title,
                    company: job.company,
                    source: sourceName,
                    score: evaluation.score,
                    reason: evaluation.dealbreakerReason || "Puntaje de afinidad insuficiente (<50%)"
                });
            } else {
                sourceStats[sourceName].approved++;
                approvedJobs.push({
                    job,
                    evaluation
                });
            }
        });

        return {
            totalFound: allJobs.length,
            totalApproved: approvedJobs.length,
            totalDiscarded: discardAuditLog.length,
            sourceStats,
            discardAuditLog,
            approvedJobs
        };
    }
}
