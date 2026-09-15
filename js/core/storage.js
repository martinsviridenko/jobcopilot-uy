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
            const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.FAVORITES) || localStorage.getItem('jc_favorites');
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
        localStorage.setItem('jc_favorites', JSON.stringify(list));
        return list.includes(jobId);
    }

    // Applied Applications Pipeline (Reads both jc_applied_data and jc_applied_pipeline)
    static getApplications() {
        try {
            const rawNew = localStorage.getItem(CONFIG.STORAGE_KEYS.APPLIED_JOBS);
            const rawOld = localStorage.getItem('jc_applied_data');
            const parsedNew = rawNew ? JSON.parse(rawNew) : {};
            const parsedOld = rawOld ? JSON.parse(rawOld) : {};
            return { ...parsedOld, ...parsedNew };
        } catch (e) {
            return {};
        }
    }

    static saveApplication(job, status = "sent") {
        const apps = this.getApplications();
        const jobId = typeof job === 'string' ? job : job.id;
        const jobMeta = typeof job === 'object' ? {
            title: job.title,
            company: job.company,
            location: job.location,
            hours: job.hoursLabel || job.hours,
            applyUrl: job.applyUrl
        } : {};

        apps[jobId] = {
            status: status,
            date: new Date().toLocaleDateString('es-UY', { day: '2-digit', month: 'short' }),
            ...jobMeta,
            ...(apps[jobId] || {})
        };
        apps[jobId].status = status;

        localStorage.setItem(CONFIG.STORAGE_KEYS.APPLIED_JOBS, JSON.stringify(apps));
        localStorage.setItem('jc_applied_data', JSON.stringify(apps));
    }

    static updateApplicationStatus(jobId, newStatus) {
        const apps = this.getApplications();
        if (apps[jobId]) {
            apps[jobId].status = newStatus;
            localStorage.setItem(CONFIG.STORAGE_KEYS.APPLIED_JOBS, JSON.stringify(apps));
            localStorage.setItem('jc_applied_data', JSON.stringify(apps));
        }
    }

    static removeApplication(jobId) {
        const apps = this.getApplications();
        delete apps[jobId];
        localStorage.setItem(CONFIG.STORAGE_KEYS.APPLIED_JOBS, JSON.stringify(apps));
        localStorage.setItem('jc_applied_data', JSON.stringify(apps));
    }

    static clearAllApplications() {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.APPLIED_JOBS);
        localStorage.removeItem('jc_applied_data');
    }
}
