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

        // 3. Load Jobs (Start with fallback database so no saved application is ever lost)
        this.allJobs = typeof FALLBACK_JOBS_DB !== 'undefined' ? [...FALLBACK_JOBS_DB] : [];
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
        if (!jobId) return null;
        let found = this.allJobs.find(j => j.id === jobId);
        if (!found && typeof FALLBACK_JOBS_DB !== 'undefined') {
            found = FALLBACK_JOBS_DB.find(j => j.id === jobId);
        }
        return found;
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
                    const supabaseJobs = data.map(j => ({
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

                    // Merge avoiding duplicates
                    const existingIds = new Set(this.allJobs.map(j => j.id));
                    supabaseJobs.forEach(sj => {
                        if (!existingIds.has(sj.id)) {
                            this.allJobs.push(sj);
                            existingIds.add(sj.id);
                        }
                    });
                }
            }
        } catch (e) {
            console.warn("[JobCopilot] Usando base local por error de conexión:", e);
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
        const job = this.getJobById(jobId) || { id: jobId, title: "Postulación registrada", company: "Empresa" };
        StorageManager.saveApplication(job, "sent");
        this.applyFilters();
    },

    removeApplication(jobId) {
        StorageManager.removeApplication(jobId);
        this.applyFilters();
    },

    resetAllApplications() {
        if (confirm("¿Estás seguro de que querés desmarcar todas las postulaciones guardadas?")) {
            StorageManager.clearAllApplications();
            this.applyFilters();
        }
    },

    updateApplicationStatus(jobId, newStatus) {
        StorageManager.updateApplicationStatus(jobId, newStatus);
        this.renderKanban();
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

    // Renders the 4 Kanban columns without dropping ANY stored application!
    renderKanban() {
        const cols = {
            sent: document.getElementById('colSent'),
            review: document.getElementById('colReview'),
            interview: document.getElementById('colInterview'),
            offer: document.getElementById('colOffer')
        };
        if (!cols.sent) return;

        Object.values(cols).forEach(c => { if (c) c.innerHTML = ''; });
        const counts = { sent: 0, review: 0, interview: 0, offer: 0 };

        const applications = StorageManager.getApplications();
        const entries = Object.entries(applications);

        entries.forEach(([jobId, data]) => {
            // Find job details in allJobs or fallback, or reconstruct from saved data/id
            let job = this.getJobById(jobId);
            if (!job) {
                // Humanize ID into title if missing
                const humanized = jobId.replace(/^linkedin-/, '').replace(/-/g, ' ');
                job = {
                    id: jobId,
                    title: data.title || humanized.replace(/\b\w/g, l => l.toUpperCase()),
                    company: data.company || "Empresa en Uruguay",
                    hours: data.hours || "Part-time / 6h",
                    location: data.location || "Montevideo",
                    applyUrl: data.applyUrl || "#"
                };
            }

            const rawStatus = (data.status || 'sent').toLowerCase();
            let status = 'sent';
            if (rawStatus.includes('review') || rawStatus.includes('revisi')) status = 'review';
            else if (rawStatus.includes('interview') || rawStatus.includes('entrevista')) status = 'interview';
            else if (rawStatus.includes('offer') || rawStatus.includes('oferta') || rawStatus.includes('cerrado')) status = 'offer';

            if (counts[status] !== undefined) counts[status]++;

            const targetCol = cols[status] || cols.sent;
            const card = document.createElement('div');
            card.className = 'kanban-card';
            card.innerHTML = `
                <div class="kanban-card-title">${job.title}</div>
                <div class="kanban-card-company">${job.company} • ${job.hoursLabel || job.hours || '6h'}</div>
                <div class="kanban-card-date">Fecha: ${data.date || 'Reciente'}</div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; gap: 6px;">
                    <select class="kanban-status-select" style="flex: 1;" onchange="App.updateApplicationStatus('${job.id}', this.value)">
                        <option value="sent" ${status === 'sent' ? 'selected' : ''}>CV Enviado</option>
                        <option value="review" ${status === 'review' ? 'selected' : ''}>En Revisión</option>
                        <option value="interview" ${status === 'interview' ? 'selected' : ''}>En Entrevista</option>
                        <option value="offer" ${status === 'offer' ? 'selected' : ''}>Oferta / Cerrado</option>
                    </select>
                    <button onclick="App.removeApplication('${job.id}')" style="background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #FCA5A5; font-size: 11px; padding: 4px 8px; border-radius: 6px; cursor: pointer;" title="Quitar postulación">
                        ✕
                    </button>
                </div>
            `;
            targetCol.appendChild(card);
        });

        const kCountSent = document.getElementById('kCountSent');
        if (kCountSent) kCountSent.innerText = counts.sent;
        const kCountReview = document.getElementById('kCountReview');
        if (kCountReview) kCountReview.innerText = counts.review;
        const kCountInterview = document.getElementById('kCountInterview');
        if (kCountInterview) kCountInterview.innerText = counts.interview;
        const kCountOffer = document.getElementById('kCountOffer');
        if (kCountOffer) kCountOffer.innerText = counts.offer;

        const countPipeline = document.getElementById('countPipeline');
        if (countPipeline) countPipeline.innerText = entries.length;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
