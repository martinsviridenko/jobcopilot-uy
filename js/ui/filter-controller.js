/**
 * FilterController — Controlador de Menús Desplegables Multi-Select
 * Aplica filtros combinables sobre las vacantes viables:
 * - Ubicación (Regla: elegir Montevideo NO excluye vacantes remotas)
 * - Carga horaria
 * - Turno
 * - Modalidad
 * - Área
 * - Idioma
 * - Experiencia
 */

class FilterController {
    static init() {
        // Inicializar toggles de apertura/cierre de popovers
        const triggers = document.querySelectorAll('.dropdown-trigger');
        triggers.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const targetId = btn.getAttribute('data-target');
                const popover = document.getElementById(targetId);
                
                // Cerrar todos los demás popovers abiertos
                document.querySelectorAll('.dropdown-popover').forEach(p => {
                    if (p.id !== targetId) p.classList.remove('show');
                });
                document.querySelectorAll('.dropdown-trigger').forEach(t => {
                    if (t !== btn) t.classList.remove('open');
                });

                // Alternar el actual
                if (popover) {
                    popover.classList.toggle('show');
                    btn.classList.toggle('open');
                }
            });
        });

        // Prevenir cierre al hacer click dentro del popover
        document.querySelectorAll('.dropdown-popover').forEach(p => {
            p.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });

        // Cerrar al hacer click fuera
        document.addEventListener('click', () => {
            document.querySelectorAll('.dropdown-popover').forEach(p => p.classList.remove('show'));
            document.querySelectorAll('.dropdown-trigger').forEach(t => t.classList.remove('open'));
        });

        this.updateBadgeCounts();
    }

    static onCheckboxChange() {
        this.updateBadgeCounts();
        App.applyFilters();
    }

    static updateBadgeCounts() {
        // Ubicaciones
        const locChecked = Array.from(document.querySelectorAll('.cb-loc:checked')).length;
        const badgeLoc = document.getElementById('badgeLoc');
        if (badgeLoc) {
            badgeLoc.style.display = locChecked > 0 ? 'inline-block' : 'none';
            badgeLoc.innerText = locChecked;
        }

        // Carga horaria
        const hoursChecked = Array.from(document.querySelectorAll('.cb-hours:checked')).length;
        const badgeHours = document.getElementById('badgeHours');
        if (badgeHours) {
            badgeHours.style.display = hoursChecked > 0 ? 'inline-block' : 'none';
            badgeHours.innerText = hoursChecked;
        }

        // Turno
        const shiftChecked = Array.from(document.querySelectorAll('.cb-shift:checked')).length;
        const badgeShift = document.getElementById('badgeShift');
        if (badgeShift) {
            badgeShift.style.display = shiftChecked > 0 ? 'inline-block' : 'none';
            badgeShift.innerText = shiftChecked;
        }

        // Modalidad
        const modChecked = Array.from(document.querySelectorAll('.cb-mod:checked')).length;
        const badgeModality = document.getElementById('badgeModality');
        if (badgeModality) {
            badgeModality.style.display = modChecked > 0 ? 'inline-block' : 'none';
            badgeModality.innerText = modChecked;
        }

        // Experiencia
        const expChecked = Array.from(document.querySelectorAll('.cb-exp:checked')).length;
        const badgeExp = document.getElementById('badgeExp');
        if (badgeExp) {
            badgeExp.style.display = expChecked > 0 ? 'inline-block' : 'none';
            badgeExp.innerText = expChecked;
        }
    }

    static resetAllFilters() {
        document.querySelectorAll('.cb-loc').forEach(cb => {
            cb.checked = (cb.value === 'montevideo' || cb.value === 'remoto');
        });
        document.querySelectorAll('.cb-hours').forEach(cb => {
            cb.checked = (cb.value === '4h' || cb.value === '6h');
        });
        document.querySelectorAll('.cb-shift').forEach(cb => { cb.checked = false; });
        document.querySelectorAll('.cb-mod').forEach(cb => { cb.checked = false; });
        document.querySelectorAll('.cb-exp').forEach(cb => { cb.checked = (cb.value === 'junior'); });
        
        const rbDiscipline = document.querySelector('input[name="rbDiscipline"][value="ALL"]');
        if (rbDiscipline) rbDiscipline.checked = true;

        const rbLang = document.querySelector('input[name="rbLang"][value="all"]');
        if (rbLang) rbLang.checked = true;

        const kwInput = document.getElementById('filterKeyword');
        if (kwInput) kwInput.value = '';

        this.updateBadgeCounts();
        App.applyFilters();
    }

    static getActiveFilters() {
        const locations = Array.from(document.querySelectorAll('.cb-loc:checked')).map(c => c.value);
        const hours = Array.from(document.querySelectorAll('.cb-hours:checked')).map(c => c.value);
        const shifts = Array.from(document.querySelectorAll('.cb-shift:checked')).map(c => c.value);
        const modalities = Array.from(document.querySelectorAll('.cb-mod:checked')).map(c => c.value);
        const seniority = Array.from(document.querySelectorAll('.cb-exp:checked')).map(c => c.value);

        const disciplineEl = document.querySelector('input[name="rbDiscipline"]:checked');
        const discipline = disciplineEl ? disciplineEl.value : "ALL";

        const langEl = document.querySelector('input[name="rbLang"]:checked');
        const lang = langEl ? langEl.value : "all";

        const searchKeyword = (document.getElementById('filterKeyword')?.value || "").toLowerCase().trim();
        const hideApplied = !!document.getElementById('hideAppliedToggle')?.checked;

        return {
            locations,
            hours,
            shifts,
            modalities,
            seniority,
            discipline,
            lang,
            searchKeyword,
            hideApplied
        };
    }

    static matches(job, evaluation, filters) {
        // 1. Umbral accesible con In Dubio Pro Candidato (45%)
        if (evaluation.isDealbreaker || (evaluation.score !== null && evaluation.score < CONFIG.MIN_DISPLAY_SCORE)) {
            return false;
        }

        // 2. Ocultar aplicadas
        const applied = StorageManager.getApplications();
        if (filters.hideApplied && applied[job.id]) {
            return false;
        }

        // 3. Blacklist persistente ("No me interesa")
        const dismissed = StorageManager.getDismissedJobs();
        if (dismissed.includes(job.id)) {
            return false;
        }

        // 4. Filtro de Ubicación Inteligente
        // Regla solicitada: Elegir Montevideo NO debe eliminar trabajos remotos realizables desde Montevideo.
        if (filters.locations.length > 0) {
            const locText = (job.location || "").toLowerCase();
            const modText = (job.modality || "").toLowerCase();
            const isRemoteJob = locText.includes("remot") || modText.includes("remot") || job.modalityKey === "remote";

            const matchesLoc = filters.locations.some(loc => {
                if (loc === "remoto") return isRemoteJob;
                if (loc === "montevideo") {
                    // Montevideo admite empleos ubicados en Montevideo Y también empleos remotos
                    return locText.includes("montevideo") || isRemoteJob;
                }
                return locText.includes(loc);
            });

            if (!matchesLoc) return false;
        }

        // 5. Carga horaria
        if (filters.hours.length > 0) {
            if (!filters.hours.includes(job.hours)) return false;
        }

        // 6. Turno
        if (filters.shifts.length > 0) {
            const jobHoursLabel = (job.hoursLabel || "").toLowerCase();
            const jobDesc = (job.desc || "").toLowerCase();
            const matchesShift = filters.shifts.some(s => jobHoursLabel.includes(s.toLowerCase()) || jobDesc.includes(s.toLowerCase()));
            if (!matchesShift) return false;
        }

        // 7. Modalidad
        if (filters.modalities.length > 0) {
            if (!filters.modalities.includes(job.modalityKey)) return false;
        }

        // 8. Disciplina
        if (filters.discipline !== "ALL") {
            const jobAnalysis = JobAnalyzer.analyze(job);
            if (jobAnalysis.domainKey !== filters.discipline) return false;
        }

        // 9. Idioma
        if (filters.lang !== "all") {
            const hasEnglishReq = /inglés|english/i.test(job.desc || "") || /inglés|english/i.test(job.title || "");
            if (filters.lang === "english" && !hasEnglishReq) return false;
            if (filters.lang === "spanish" && hasEnglishReq) return false;
        }

        // 10. Búsqueda por texto
        if (filters.searchKeyword) {
            const q = filters.searchKeyword;
            const inTitle = (job.title || "").toLowerCase().includes(q);
            const inCompany = (job.company || "").toLowerCase().includes(q);
            const inDesc = (job.desc || "").toLowerCase().includes(q);
            if (!inTitle && !inCompany && !inDesc) return false;
        }

        return true;
    }
}
