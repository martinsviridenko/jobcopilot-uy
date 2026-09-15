/**
 * StorageManager — Gestión Persistente Segura
 * Asegura la retención de las postulaciones del pipeline (incluidas Bestseller y las 4 históricas),
 * sincronizando de forma segura jc_applied_pipeline y jc_applied_data.
 */

class StorageManager {
    static getProfile() {
        const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_PROFILE);
        if (stored) {
            try { return JSON.parse(stored); } catch (e) {}
        }
        return null;
    }

    static saveProfile(profile) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    }

    static getCvText() {
        return localStorage.getItem(CONFIG.STORAGE_KEYS.CV_TEXT) || "";
    }

    static saveCvText(text) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.CV_TEXT, text || "");
    }

    static getFavorites() {
        const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.FAVORITES);
        if (stored) {
            try { return JSON.parse(stored); } catch (e) {}
        }
        return [];
    }

    static toggleFavorite(jobId) {
        const favs = this.getFavorites();
        const idx = favs.indexOf(jobId);
        if (idx >= 0) favs.splice(idx, 1);
        else favs.push(jobId);
        localStorage.setItem(CONFIG.STORAGE_KEYS.FAVORITES, JSON.stringify(favs));
        return favs;
    }

    static getDismissedJobs() {
        const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.DISMISSED_JOBS);
        if (stored) {
            try { return JSON.parse(stored); } catch (e) {}
        }
        return [];
    }

    static dismissJob(jobId) {
        const dismissed = this.getDismissedJobs();
        if (!dismissed.includes(jobId)) {
            dismissed.push(jobId);
            localStorage.setItem(CONFIG.STORAGE_KEYS.DISMISSED_JOBS, JSON.stringify(dismissed));
        }
        return dismissed;
    }

    static getApplications() {
        let pipeline = {};
        const storedPipeline = localStorage.getItem(CONFIG.STORAGE_KEYS.APPLIED_JOBS);
        if (storedPipeline) {
            try { pipeline = JSON.parse(storedPipeline); } catch (e) {}
        }

        // Sincronizar con jc_applied_data histórico
        const legacyData = localStorage.getItem(CONFIG.STORAGE_KEYS.APPLIED_DATA);
        if (legacyData) {
            try {
                const parsedLegacy = JSON.parse(legacyData);
                for (const [id, item] of Object.entries(parsedLegacy)) {
                    if (!pipeline[id]) {
                        pipeline[id] = {
                            jobId: id,
                            status: item.stage || item.status || "applied",
                            date: item.applied_at || item.date || new Date().toLocaleDateString("es-UY"),
                            title: item.title,
                            company: item.company,
                            location: item.location,
                            matchScore: item.matchScore || item.score || 85
                        };
                    }
                }
            } catch (e) {}
        }

        return pipeline;
    }

    static recordApplication(jobId, status = "applied", jobDetails = null) {
        const applications = this.getApplications();
        applications[jobId] = {
            jobId,
            status,
            date: new Date().toLocaleDateString("es-UY"),
            title: jobDetails?.title || applications[jobId]?.title || "Postulación Guardada",
            company: jobDetails?.company || applications[jobId]?.company || "Empresa",
            location: jobDetails?.location || applications[jobId]?.location || "Uruguay",
            matchScore: jobDetails?.matchScore || applications[jobId]?.matchScore || 85
        };
        localStorage.setItem(CONFIG.STORAGE_KEYS.APPLIED_JOBS, JSON.stringify(applications));
        localStorage.setItem(CONFIG.STORAGE_KEYS.APPLIED_DATA, JSON.stringify(applications));
        return applications;
    }

    static updateApplicationStage(jobId, newStage) {
        const applications = this.getApplications();
        if (applications[jobId]) {
            applications[jobId].status = newStage;
            localStorage.setItem(CONFIG.STORAGE_KEYS.APPLIED_JOBS, JSON.stringify(applications));
            localStorage.setItem(CONFIG.STORAGE_KEYS.APPLIED_DATA, JSON.stringify(applications));
        }
        return applications;
    }

    static removeApplication(jobId) {
        const applications = this.getApplications();
        delete applications[jobId];
        localStorage.setItem(CONFIG.STORAGE_KEYS.APPLIED_JOBS, JSON.stringify(applications));
        localStorage.setItem(CONFIG.STORAGE_KEYS.APPLIED_DATA, JSON.stringify(applications));
        return applications;
    }
}\n