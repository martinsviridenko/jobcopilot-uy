/**
 * JobCopilot v3 — Application Master Coordinator
 */

const App = {
    allJobs: [],
    profile: null,
    currentView: "feed", // 'feed' | 'kanban' | 'favorites'

    async init() {
        // 1. Initialize Profile
        this.profile = StorageManager.getProfile() || ProfileAnalyzer.parse("");
        this.renderProfileCard();

        // 2. Setup Drag and Drop / PDF input
        this.setupFileInput();

        // 3. Load Vacancies (Supabase live data first)
        await this.loadJobs();

        // 4. Initial Render
        this.applyFilters();
    },

    getProfile() {
        return this.profile;
    },

    getAllJobs() {
        return this.allJobs;
    },

    getJobById(jobId) {
        return this.allJobs.find(j => j.id === jobId);
    },

    async loadJobs() {
        try {
            const endpoint = `${CONFIG.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/jobs?is_active=eq.true&order=created_at.desc&limit=300`;
            const res = await fetch(endpoint, {
                headers: {
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                if (data && data.length > 0) {
                    this.allJobs = data.map(j => ({
                        id: j.hash_dedup || j.id,
                        company: j.company,
                        title: j.title,
                        hours: j.hours,
                        hoursLabel: j.hours_label || j.hours,
                        modality: j.modality,
                        modalityKey: j.modality_key,
                        sector: j.sector,
                        sectorLabel: j.sector_label,
                        domain: j.domain,
                        domainLabel: j.domain_label,
                        seniority: j.seniority,
                        location: j.location,
                        desc: j.description,
                        criticalSkills: j.critical_skills || [],
                        requirements: j.requirements || { mandatory: [], desirable: [] },
                        salaryGuide: j.salary_guide || "A convenir",
                        applyUrl: j.apply_url,
                        isLinkedIn: !!j.is_linkedin
                    }));
                }
            }
        } catch (e) {
            console.warn("[JobCopilot] No se pudo conectar a Supabase en vivo, usando datos locales:", e);
        }

        const statElem = document.getElementById('statAnalyzed');
        if (statElem) statElem.innerText = `${this.allJobs.length} ofertas`;
    },

    applyFilters() {
        if (this.currentView === 'kanban') {
            this.renderKanban();
        } else {
            FeedRenderer.render(this.allJobs, this.profile, "feedView");
        }
        this.updateCounters();
    },

    updateCounters() {
        const dismissed = StorageManager.getDismissedJobs();
        const favs = StorageManager.getFavorites();
        const apps = StorageManager.getApplications();

        const dismissedStat = document.getElementById('statDismissed');
        if (dismissedStat) dismissedStat.innerText = dismissed.length;

        const countFavs = document.getElementById('countFavs');
        if (countFavs) countFavs.innerText = favs.length;

        const countPipeline = document.getElementById('countPipeline');
        if (countPipeline) countPipeline.innerText = Object.keys(apps).length;
    },

    switchView(view) {
        this.currentView = view;
        document.getElementById('tabFeed')?.classList.toggle('active', view === 'feed');
        document.getElementById('tabKanban')?.classList.toggle('active', view === 'kanban');
        document.getElementById('tabFavorites')?.classList.toggle('active', view === 'favorites');

        const feedView = document.getElementById('feedView');
        const kanbanView = document.getElementById('kanbanView');

        if (feedView && kanbanView) {
            feedView.style.display = view === 'kanban' ? 'none' : 'flex';
            kanbanView.style.display = view === 'kanban' ? 'block' : 'none';
        }

        if (view === 'favorites') {
            const favs = StorageManager.getFavorites();
            const favJobs = this.allJobs.filter(j => favs.includes(j.id));
            FeedRenderer.render(favJobs, this.profile, "feedView");
        } else if (view === 'feed') {
            this.applyFilters();
        } else if (view === 'kanban') {
            this.renderKanban();
        }
    },

    dismissJob(jobId) {
        const card = document.getElementById(`job-card-${jobId}`);
        if (card) {
            card.style.transition = "all 0.3s ease";
            card.style.opacity = "0";
            card.style.transform = "translateX(40px)";
            setTimeout(() => {
                StorageManager.dismissJob(jobId);
                this.applyFilters();
            }, 300);
        } else {
            StorageManager.dismissJob(jobId);
            this.applyFilters();
        }
    },

    toggleFavorite(jobId) {
        StorageManager.toggleFavorite(jobId);
        this.applyFilters();
    },

    registerApplication(jobId) {
        StorageManager.saveApplication(jobId, "Postulado");
        this.applyFilters();
    },

    removeApplication(jobId) {
        StorageManager.removeApplication(jobId);
        this.applyFilters();
    },

    renderProfileCard() {
        const p = this.profile;
        if (!p) return;

        const pName = document.getElementById('pName');
        if (pName) pName.innerText = p.name;

        const pEdu = document.getElementById('pEdu');
        if (pEdu) pEdu.innerText = p.edu;

        const pSummary = document.getElementById('pSummaryText');
        if (pSummary) pSummary.innerText = p.summary;

        const pLang = document.getElementById('pLang');
        if (pLang) pLang.innerText = p.lang;

        const chipsContainer = document.getElementById('pSkillsChips');
        if (chipsContainer) {
            chipsContainer.innerHTML = (p.skills || []).map(s => `<span class="chip-skill">${s}</span>`).join('');
        }

        const box = document.getElementById('profileSummaryBox');
        if (box) box.style.display = 'block';

        const badge = document.getElementById('cvBadgeStatus');
        if (badge) {
            badge.innerText = "● CV Activo";
            badge.style.color = "var(--accent-green)";
        }
    },

    setupFileInput() {
        const input = document.getElementById('cvFileInput');
        if (!input) return;

        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
                try {
                    const arrayBuffer = await file.arrayBuffer();
                    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                    let fullText = "";
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        fullText += textContent.items.map(item => item.str).join(" ") + " ";
                    }
                    this.profile = ProfileAnalyzer.parse(fullText);
                    StorageManager.saveProfile(this.profile);
                    this.renderProfileCard();
                    this.applyFilters();
                } catch (err) {
                    alert("Error al leer el PDF en el navegador: " + err.message);
                }
            } else {
                const text = await file.text();
                this.profile = ProfileAnalyzer.parse(text);
                StorageManager.saveProfile(this.profile);
                this.renderProfileCard();
                this.applyFilters();
            }
        });
    },

    loadDemoCandidate() {
        this.profile = ProfileAnalyzer.parse("");
        StorageManager.saveProfile(this.profile);
        this.renderProfileCard();
        this.applyFilters();
    },

    renderKanban() {
        const kanbanBoard = document.getElementById('kanbanView');
        if (!kanbanBoard) return;

        const applications = StorageManager.getApplications();
        const appliedJobs = this.allJobs.filter(j => !!applications[j.id]);

        let itemsHtml = appliedJobs.map(job => `
            <div style="background: var(--surface-card); border: 1px solid var(--border); padding: 12px; border-radius: 8px; margin-bottom: 8px;">
                <strong style="color: #FFF; font-size: 13px;">${job.title}</strong>
                <p style="color: var(--primary); font-size: 11.5px; margin-top: 2px;">${job.company} • ${job.location}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                    <span style="font-size: 11px; color: var(--accent-green);">● Postulación activa</span>
                    <button onclick="App.removeApplication('${job.id}')" style="background: none; border: none; color: #F87171; font-size: 11px; cursor: pointer;">
                        ✕ Quitar
                    </button>
                </div>
            </div>
        `).join('');

        if (appliedJobs.length === 0) {
            itemsHtml = '<p style="font-size: 12px; color: var(--text-muted); text-align: center; padding: 20px 0;">No has registrado postulaciones todavía.</p>';
        }

        kanbanBoard.innerHTML = `
            <div style="max-width: 600px; margin: 0 auto; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px;">
                <h3 style="font-size: 16px; color: #FFF; margin-bottom: 12px;">Pipeline de Postulaciones Realizadas</h3>
                ${itemsHtml}
            </div>
        `;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
