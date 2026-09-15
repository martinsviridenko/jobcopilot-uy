/**
 * JobCopilot v3.2 — Application Master Coordinator
 * Incluye carga robusta de CV (.pdf y .txt), Drag & Drop confiable,
 * modo de demostración genérico ficticio y sincronización de estado.
 */

const App = {
    allJobs: [],
    profile: null,
    currentView: "feed", // 'feed' | 'kanban' | 'favorites'

    async init() {
        console.log('[JobCopilot] App.init() starting...');

        // 1. Cargar perfil guardado (sin forzar perfiles predeterminados)
        this.profile = StorageManager.getProfile();
        this.renderProfileCard();

        // 2. Inicializar manejadores de archivo y drag & drop (CRÍTICO)
        try {
            this.setupFileInput();
        } catch (e) {
            console.error('[JobCopilot] Error en setupFileInput:', e);
        }

        // 3. Inicializar controlador de filtros desplegables
        try {
            FilterController.init();
        } catch (e) {
            console.error('[JobCopilot] Error en FilterController.init:', e);
        }

        // 4. Cargar vacantes desde Supabase / BD de respaldo
        await this.loadJobs();

        // 5. Renderizado inicial
        this.applyFilters();

        console.log('[JobCopilot] App.init() completed successfully');
    },

    getProfile() {
        return this.profile;
    },

    getAllJobs() {
        return this.allJobs;
    },

    getJobById(jobId) {
        if (!jobId) return null;
        return this.allJobs.find(j => String(j.id) === String(jobId));
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
                        id: j.hash_dedup || String(j.id),
                        company: j.company || "Empresa",
                        title: j.title || "Posición",
                        hours: j.hours || "6h",
                        hoursLabel: j.hours_label || j.hours || "Flexible",
                        modality: j.modality || "Presencial",
                        modalityKey: j.modality_key || "presential",
                        sector: j.sector || "General",
                        sectorLabel: j.sector_label || "General",
                        seniority: j.seniority || "Junior",
                        location: j.location || "Montevideo",
                        desc: j.description || "",
                        applyUrl: j.apply_url || "",
                        isLinkedIn: !!j.is_linkedin,
                        source: j.source || (j.is_linkedin ? "LinkedIn" : "Portal")
                    }));
                }
            }
        } catch (e) {
            console.warn("[JobCopilot] Error conectando a Supabase, usando respaldo:", e);
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
        const feedHeader = document.getElementById('feedHeaderBar');
        const filtersBar = document.getElementById('filtersBar');

        if (feedView && kanbanView) {
            feedView.style.display = view === 'kanban' ? 'none' : 'flex';
            kanbanView.style.display = view === 'kanban' ? 'block' : 'none';
        }

        if (feedHeader) feedHeader.style.display = view === 'kanban' ? 'none' : 'flex';
        if (filtersBar) filtersBar.style.display = view === 'kanban' ? 'none' : 'flex';

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

    toggleFavorite(jobId) {
        StorageManager.toggleFavorite(jobId);
        this.applyFilters();
    },

    dismissJob(jobId) {
        StorageManager.dismissJob(jobId);
        this.applyFilters();
    },

    markAsApplied(jobId) {
        const job = this.getJobById(jobId);
        StorageManager.recordApplication(jobId, 'sent', job);
        this.updateCounters();
        this.applyFilters();
    },

    removeApplication(jobId) {
        StorageManager.removeApplication(jobId);
        this.applyFilters();
    },

    updateApplicationStatus(jobId, newStatus) {
        StorageManager.updateApplicationStage(jobId, newStatus);
        this.renderKanban();
    },

    renderProfileCard() {
        const p = this.profile;
        const box = document.getElementById('profileSummaryBox');
        const emptyHint = document.getElementById('profileEmptyHint');
        const badge = document.getElementById('cvBadgeStatus');

        if (!p) {
            if (box) box.style.display = 'none';
            if (emptyHint) emptyHint.style.display = 'block';
            if (badge) {
                badge.innerText = "Sin cargar";
                badge.className = "cv-badge-status";
            }
            return;
        }

        if (emptyHint) emptyHint.style.display = 'none';
        if (box) box.style.display = 'block';

        const pName = document.getElementById('pName');
        if (pName) pName.innerText = p.name || "Candidato";

        const pSeniority = document.getElementById('pSeniority');
        if (pSeniority) pSeniority.innerText = (p.seniority || "Junior").toUpperCase();

        const pEdu = document.getElementById('pEdu');
        if (pEdu) pEdu.innerText = p.edu || "Formación Profesional";

        const pSummary = document.getElementById('pSummaryText');
        if (pSummary) pSummary.innerText = p.summary || "Perfil analizado";

        const pLang = document.getElementById('pLang');
        if (pLang) pLang.innerText = p.lang || "Español";

        const chipsContainer = document.getElementById('pSkillsChips');
        if (chipsContainer) {
            chipsContainer.innerHTML = (p.skills || []).map(s => `<span class="chip-skill">${s}</span>`).join('');
        }

        if (badge) {
            badge.innerText = "● CV Activo";
            badge.className = "cv-badge-status active";
        }
    },

    // =========================================================================
    // Manejador Robusto de Archivos de CV (PDF y Texto) con Drag & Drop
    // =========================================================================
    setupFileInput() {
        const fileInput = document.getElementById('cvFileInput');
        const dropzone = document.getElementById('dropzoneBox');

        console.log('[JobCopilot] setupFileInput — fileInput:', !!fileInput, ', dropzone:', !!dropzone);

        if (dropzone) {
            dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.add('is-dragover');
            });

            dropzone.addEventListener('dragleave', (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.remove('is-dragover');
            });

            dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.remove('is-dragover');
                if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    console.log('[JobCopilot] Archivo recibido via drag & drop:', e.dataTransfer.files[0].name);
                    this.processFile(e.dataTransfer.files[0]);
                }
            });
        }

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                console.log('[JobCopilot] change event disparado en fileInput, archivos:', e.target.files ? e.target.files.length : 0);
                if (e.target.files && e.target.files.length > 0) {
                    this.processFile(e.target.files[0]);
                }
            });
            console.log('[JobCopilot] Listener "change" registrado exitosamente en #cvFileInput');
        } else {
            console.error('[JobCopilot] CRÍTICO: No se encontró #cvFileInput en el DOM');
        }
    },

    async processFile(file) {
        if (!file) return;

        console.log("[JobCopilot] Iniciando lectura de archivo:", file.name, "tipo:", file.type, "tamano:", file.size);

        const loader = document.getElementById('cvUploadLoader');
        const loaderText = document.getElementById('cvLoaderText');
        const dropTitle = document.getElementById('dropzoneTitle');
        const dropSub = document.getElementById('dropzoneSub');

        if (loader) loader.style.display = 'flex';
        if (loaderText) loaderText.innerText = "Leyendo archivo: " + file.name + "...";

        try {
            let extractedText = "";

            if (file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf") {
                if (loaderText) loaderText.innerText = "Extrayendo texto del PDF...";
                
                // Intento 1: Extracción con PDF.js (Uint8Array)
                let pdfParsed = false;
                if (typeof pdfjsLib !== 'undefined') {
                    try {
                        const arrayBuffer = await file.arrayBuffer();
                        const typedArray = new Uint8Array(arrayBuffer);
                        const loadingTask = pdfjsLib.getDocument({ data: typedArray });
                        const pdf = await loadingTask.promise;
                        
                        let pagesText = [];
                        for (let i = 1; i <= pdf.numPages; i++) {
                            const page = await pdf.getPage(i);
                            const content = await page.getTextContent();
                            const pageStrings = content.items.map(item => item.str).join(" ");
                            pagesText.push(pageStrings);
                        }
                        extractedText = pagesText.join("\n").trim();
                        if (extractedText.length > 30) {
                            pdfParsed = true;
                            console.log("[JobCopilot] Extracción exitosa con PDF.js:", extractedText.length, "caracteres");
                        }
                    } catch (pdfErr) {
                        console.warn("[JobCopilot] PDF.js arrojó error:", pdfErr);
                    }
                } else {
                    console.warn("[JobCopilot] pdfjsLib no está disponible en window.");
                }

                // Intento 2: Si PDF.js no extrajo suficiente texto (ej. streams o error), buscar texto ASCII en el binario
                if (!pdfParsed) {
                    try {
                        const rawContent = await file.text();
                        // Filtrar secuencias de texto legibles
                        const asciiMatches = rawContent.match(/[A-Za-zÀ-ÿ0-9,.:;()\/\- ]{4,}/g);
                        if (asciiMatches && asciiMatches.length > 10) {
                            extractedText = asciiMatches.join(" ");
                            console.log("[JobCopilot] Extracción exitosa con fallback ASCII:", extractedText.length, "caracteres");
                        }
                    } catch (rawErr) {
                        console.warn("[JobCopilot] Fallback ASCII falló:", rawErr);
                    }
                }
            } else {
                // Archivo de texto plano (.txt u otro)
                extractedText = await file.text();
            }

            // Validar que se haya obtenido texto
            if (!extractedText || extractedText.trim().length < 20) {
                alert("No se pudo extraer texto legible de '" + file.name + "'. Es posible que el PDF sea una imagen escaneada o esté protegido.\n\nPodés usar la opción 'Pegar texto' para ingresar tu CV directamente.");
                ModalsController.openPasteModal();
                if (loader) loader.style.display = 'none';
                return;
            }

            if (loaderText) loaderText.innerText = "Analizando perfil e infiriendo competencias...";

            // Inferencia y guardado
            this.profile = ProfileAnalyzer.parse(extractedText);
            StorageManager.saveProfile(this.profile);
            StorageManager.saveCvText(extractedText);

            if (dropTitle) dropTitle.innerText = file.name;
            if (dropSub) dropSub.innerText = "CV procesado correctamente (" + (this.profile.skills ? this.profile.skills.length : 0) + " herramientas detectadas)";

            this.renderProfileCard();
            this.applyFilters();

            console.log("[JobCopilot] Perfil procesado con éxito:", this.profile);

            // Resetear input para permitir seleccionar de nuevo si se desea
            const fileInput = document.getElementById('cvFileInput');
            if (fileInput) fileInput.value = '';

        } catch (err) {
            console.error("[JobCopilot] Error general al procesar el archivo:", err);
            alert("Ocurrió un error al procesar el archivo: " + err.message + "\n\nPodés ingresar tu información con el botón 'Pegar texto'.");
            ModalsController.openPasteModal();
        } finally {
            if (loader) loader.style.display = 'none';
        }
    },
    handleDirectCvText() {
        const textarea = document.getElementById('pasteCvTextarea');
        if (!textarea) return;

        const text = textarea.value.trim();
        if (text.length < 20) {
            alert("Por favor ingresá un texto con información relevante de tu CV.");
            return;
        }

        this.profile = ProfileAnalyzer.parse(text);
        StorageManager.saveProfile(this.profile);
        StorageManager.saveCvText(text);

        this.renderProfileCard();
        this.applyFilters();
        ModalsController.closeModal('pasteCvModal');
    },

    /**
     * Carga un candidato genérico ficticio para propósitos de demostración.
     * Claramente identificado como ejemplo sin datos personales de ningún desarrollador.
     */
    loadDemoCandidate() {
        const demoText = `
Alex Morales (Perfil de Demostración)
Estudiante de Licenciatura en Administración y Analítica de Negocios
Habilidades: SQL, Power BI, Excel avanzado, Análisis de datos, Python, Meta Ads, Modelado de indicadores.
Idiomas: Inglés Cambridge B2 First.
Experiencia previa en proyectos de gestión y reporting comercial.
        `;

        this.profile = ProfileAnalyzer.parse(demoText);
        StorageManager.saveProfile(this.profile);
        StorageManager.saveCvText(demoText);
        this.renderProfileCard();
        this.applyFilters();
    },

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
            let job = this.getJobById(jobId);
            if (!job) {
                job = {
                    id: jobId,
                    title: data.title || "Postulación Guardada",
                    company: data.company || "Empresa",
                    hoursLabel: "Flexible"
                };
            }

            const status = (data.status || 'sent').toLowerCase();
            if (counts[status] !== undefined) counts[status]++;

            const targetCol = cols[status] || cols.sent;
            const card = document.createElement('div');
            card.className = 'kanban-card';
            card.innerHTML = `
                <div class="kanban-card-title">${job.title}</div>
                <div class="kanban-card-company">${job.company} • ${job.hoursLabel || '6h'}</div>
                <div class="kanban-card-date">Fecha: ${data.date || 'Reciente'}</div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; gap: 6px;">
                    <select class="kanban-status-select" style="flex: 1;" onchange="App.updateApplicationStatus('${job.id}', this.value)">
                        <option value="sent" ${status === 'sent' ? 'selected' : ''}>CV Enviado</option>
                        <option value="review" ${status === 'review' ? 'selected' : ''}>En Revisión</option>
                        <option value="interview" ${status === 'interview' ? 'selected' : ''}>En Entrevista</option>
                        <option value="offer" ${status === 'offer' ? 'selected' : ''}>Oferta / Cerrado</option>
                    </select>
                    <button onclick="App.removeApplication('${job.id}')" style="background: rgba(244,63,94,0.15); border: 1px solid rgba(244,63,94,0.3); color: #FDA4AF; font-size: 11px; padding: 4px 8px; border-radius: 4px; cursor: pointer;" title="Quitar postulación">
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
