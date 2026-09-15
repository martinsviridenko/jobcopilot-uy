/**
 * FilterController — Controlador de Filtros Post-Matching
 * Aplica filtros de ubicación combinables (multi-select), modalidad, horario y búsqueda
 * EXCLUSIVAMENTE sobre las vacantes que superaron la evaluación de la IA.
 */

class FilterController {
    static getActiveFilters() {
        const locations = [];
        if (document.getElementById('locMontevideo')?.checked) locations.push("montevideo");
        if (document.getElementById('locCanelones')?.checked) locations.push("canelones", "costa");
        if (document.getElementById('locMaldonado')?.checked) locations.push("maldonado", "punta del este");
        if (document.getElementById('locColonia')?.checked) locations.push("colonia");
        if (document.getElementById('locRemoto')?.checked) locations.push("remoto", "remote", "teletrabajo");
        if (document.getElementById('locInterior')?.checked) locations.push("interior");

        const hours = [];
        if (document.getElementById('hours4h')?.checked) hours.push("4h");
        if (document.getElementById('hours6h')?.checked) hours.push("6h");
        if (document.getElementById('hours8h')?.checked) hours.push("8h");

        const modalities = [];
        if (document.getElementById('modPresential')?.checked) modalities.push("presential");
        if (document.getElementById('modHybrid')?.checked) modalities.push("hybrid");
        if (document.getElementById('modRemote')?.checked) modalities.push("remote");

        const shifts = [];
        if (document.getElementById('shiftMorning')?.checked) shifts.push("Matutino");
        if (document.getElementById('shiftAfternoon')?.checked) shifts.push("Vespertino");
        if (document.getElementById('shiftFlexible')?.checked) shifts.push("Flexible");

        const discipline = document.getElementById('filterDiscipline')?.value || "ALL";
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
        // 1. Viabilidad y umbral mínimo (In dubio pro candidato: 45%)
        if (evaluation.isDealbreaker || (evaluation.score !== null && evaluation.score < CONFIG.MIN_DISPLAY_SCORE)) {
            return false;
        }

        // 2. Ocultar postuladas si el toggle está activo
        const applied = StorageManager.getApplications();
        if (filters.hideApplied && applied[job.id]) {
            return false;
        }

        // 3. Blacklist persistente ("No me interesa")
        const dismissed = StorageManager.getDismissedJobs();
        if (dismissed.includes(job.id)) {
            return false;
        }

        // 4. Ubicaciones combinables (OR logic)
        if (filters.locations.length > 0) {
            const locText = (job.location || "").toLowerCase();
            const modText = (job.modality || "").toLowerCase();
            const isRemote = locText.includes("remot") || modText.includes("remot") || job.modalityKey === "remote";
            
            const matchesLoc = filters.locations.some(loc => {
                if (loc === "remoto" || loc === "remote") return isRemote;
                return locText.includes(loc);
            });
            if (!matchesLoc) return false;
        }

        // 5. Carga horaria
        if (filters.hours.length > 0) {
            if (!filters.hours.includes(job.hours)) return false;
        }

        // 6. Modalidad
        if (filters.modalities.length > 0) {
            if (!filters.modalities.includes(job.modalityKey)) return false;
        }

        // 7. Disciplina (Filtro manual de usuario)
        if (filters.discipline !== "ALL") {
            const jobAnalysis = JobAnalyzer.analyze(job);
            if (jobAnalysis.domainKey !== filters.discipline) return false;
        }

        // 8. Búsqueda por palabra clave
        if (filters.searchKeyword) {
            const q = filters.searchKeyword;
            const inTitle = (job.title || "").toLowerCase().includes(q);
            const inCompany = (job.company || "").toLowerCase().includes(q);
            const inDesc = (job.desc || job.description || "").toLowerCase().includes(q);
            if (!inTitle && !inCompany && !inDesc) return false;
        }

        return true;
    }
}\n