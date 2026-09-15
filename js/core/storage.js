/**
 * JobCopilot v3 — Local Storage Manager
 * Persistent state for user profile, dismissed blacklist, favorites and pipeline.
 */

class StorageManager {
    static getProfile() {
        try {
            const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_PROFILE);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    static saveProfile(profile) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    }

    static clearProfile() {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_PROFILE);
    }

    // Dismissed Jobs Blacklist ("No me interesa")
    static getDismissedJobs() {
        try {
            const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.DISMISSED_JOBS);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    static dismissJob(jobId) {
        const list = this.getDismissedJobs();
        if (!list.includes(jobId)) {
            list.push(jobId);
            localStorage.setItem(CONFIG.STORAGE_KEYS.DISMISSED_JOBS, JSON.stringify(list));
        }
    }

    static restoreJob(jobId) {
        let list = this.getDismissedJobs();
        list = list.filter(id => id !== jobId);
        localStorage.setItem(CONFIG.STORAGE_KEYS.DISMISSED_JOBS, JSON.stringify(list));
    }

    static clearAllDismissed() {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.DISMISSED_JOBS);
    }

    // Favorites
    static getFavorites() {
        try {
            const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.FAVORITES);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    static toggleFavorite(jobId) {
        let list = this.getFavorites();
        if (list.includes(jobId)) {
            list = list.filter(id => id !== jobId);
        } else {
            list.push(jobId);
        }
        localStorage.setItem(CONFIG.STORAGE_KEYS.FAVORITES, JSON.stringify(list));
        return list.includes(jobId);
    }

    // Applied Applications Pipeline
    static getApplications() {
        try {
            const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.APPLIED_JOBS);
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            return {};
        }
    }

    static saveApplication(jobId, status = "Postulado") {
        const apps = this.getApplications();
        apps[jobId] = { status, timestamp: new Date().toISOString() };
        localStorage.setItem(CONFIG.STORAGE_KEYS.APPLIED_JOBS, JSON.stringify(apps));
    }

    static removeApplication(jobId) {
        const apps = this.getApplications();
        delete apps[jobId];
        localStorage.setItem(CONFIG.STORAGE_KEYS.APPLIED_JOBS, JSON.stringify(apps));
    }
}
