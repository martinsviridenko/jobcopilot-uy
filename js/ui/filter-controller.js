/**
 * JobCopilot v3 — Combinable Multi-Select Filters Controller
 * Supports multi-location (e.g. Montevideo + Remoto), shifts, hours, modalities and disciplines.
 */

class FilterController {
    static getActiveFilters() {
        // Location (Multi-select)
        const locations = [];
        if (document.getElementById('locMontevideo')?.checked) locations.push("montevideo");
        if (document.getElementById('locCanelones')?.checked) locations.push("canelones", "costa");
        if (document.getElementById('locMaldonado')?.checked) locations.push("maldonado", "punta del este");
        if (document.getElementById('locColonia')?.checked) locations.push("colonia");
        if (document.getElementById('locRemoto')?.checked) locations.push("remoto", "remote", "teletrabajo");
        if (document.getElementById('locInterior')?.checked) locations.push("interior");

        // Hours (Multi-select)
        const hours = [];
        if (document.getElementById('hours4h')?.checked) hours.push("4h");
        if (document.getElementById('hours6h')?.checked) hours.push("6h");
        if (document.getElementById('hours8h')?.checked) hours.push("8h");

        // Modality (Multi-select)
        const modalities = [];
        if (document.getElementById('modPresential')?.checked) modalities.push("presential");
        if (document.getElementById('modHybrid')?.checked) modalities.push("hybrid");
        if (document.getElementById('modRemote')?.checked) modalities.push("remote");

        // Shifts (Multi-select)
        const shifts = [];
        if (document.getElementById('shiftMorning')?.checked) shifts.push("Matutino");
        if (document.getElementById('shiftAfternoon')?.checked) shifts.push("Vespertino");
        if (document.getElementById('shiftFlexible')?.checked) shifts.push("Flexible");

        // Discipline
        const discipline = document.getElementById('filterDiscipline')?.value || "ALL";

        // Search text
        const searchKeyword = (document.getElementById('filterKeyword')?.value || "").toLowerCase().trim();

        return {
            locations,
            hours,
            modalities,
            shifts,
            discipline,
            searchKeyword,
            hideApplied: !!document.getElementById('hideAppliedToggle')?.checked
        };
    }

    static matches(job, evaluation, filters) {
        // 1. Never show dealbreakers or sub-50% in the active feed
        if (evaluation.isDealbreaker || (evaluation.score !== null && evaluation.score < CONFIG.MIN_DISPLAY_SCORE)) {
            return false;
        }

        // 2. Hide applied toggle
        const applied = StorageManager.getApplications();
        if (filters.hideApplied && applied[job.id]) {
            return false;
        }

        // 3. Dismissed blacklist check ("No me interesa")
        const dismissed = StorageManager.getDismissedJobs();
        if (dismissed.includes(job.id)) {
            return false;
        }

        // 4. Combinable Location Filter (OR logic between checked locations)
        if (filters.locations.length > 0) {
            const locText = (job.location || "").toLowerCase();
            const modText = (job.modality || "").toLowerCase();
            const isRemote = locText.includes("remot") || modText.includes("remot") || job.modalityKey === "remote";
            
            const matchesAnyLoc = filters.locations.some(loc => {
                if (loc === "remoto" || loc === "remote") return isRemote;
                return locText.includes(loc);
            });
            if (!matchesAnyLoc) return false;
        }

        // 5. Combinable Hours Filter
        if (filters.hours.length > 0) {
            if (!filters.hours.includes(job.hours)) return false;
        }

        // 6. Combinable Modality Filter
        if (filters.modalities.length > 0) {
            if (!filters.modalities.includes(job.modalityKey)) return false;
        }

        // 7. Discipline Filter
        if (filters.discipline !== "ALL") {
            const jobAnalysis = JobAnalyzer.analyze(job);
            if (jobAnalysis.domainKey !== filters.discipline) return false;
        }

        // 8. Keyword search filter
        if (filters.searchKeyword) {
            const haystack = `${job.title} ${job.company} ${job.desc} ${job.location}`.toLowerCase();
            if (!haystack.includes(filters.searchKeyword)) return false;
        }

        return true;
    }
}
