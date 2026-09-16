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
        const diagLog = document.getElementById('diagnosticLog');
        const diagPanel = document.getElementById('diagnosticPanel');
        let logs = [];
        const addLog = (msg) => {
            console.log(msg);
            logs.push(msg);
            if (diagLog) diagLog.innerText = logs.join('\n');
            if (diagPanel) diagPanel.style.display = 'block';
        };

        addLog("=== INICIO CARGA DE VACANTES ===");
        let jobsLoaded = false;

        try {
            const endpoint = `${CONFIG.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/jobs?is_active=eq.true&order=created_at.desc&limit=300`;
            addLog(`[JobCopilot] Consultando Supabase: ${endpoint}`);
            
            const res = await fetch(endpoint, {
                headers: {
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                }
            });
            
            addLog(`[JobCopilot] Supabase respondió HTTP ${res.status}`);
            
            if (res.ok) {
                const data = await res.json();
                addLog(`[JobCopilot] Supabase devolvió ${data ? data.length : 0} registros.`);
                
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
                    jobsLoaded = true;
                    addLog("[JobCopilot] Vacantes cargadas desde SUPABASE EXITOSAMENTE.");
                } else {
                    addLog("[JobCopilot] WARN: Supabase respondió OK pero la tabla está vacía (0 registros).");
                }
            } else {
                addLog(`[JobCopilot] ERROR en Supabase HTTP ${res.status}. No se pudo obtener datos.`);
            }
        } catch (e) {
            addLog(`[JobCopilot] ERROR de red / excepción al conectar con Supabase: ${e.message}`);
        }

        if (!jobsLoaded) {
            addLog("[JobCopilot] Iniciando rescate: Cargando FALLBACK_JOBS_DB local...");
            if (typeof FALLBACK_JOBS_DB !== 'undefined' && FALLBACK_JOBS_DB.length > 0) {
                this.allJobs = [...FALLBACK_JOBS_DB];
                addLog(`[JobCopilot] Rescate exitoso: Se cargaron ${this.allJobs.length} vacantes locales.`);
            } else {
                addLog("[JobCopilot] FATAL: FALLBACK_JOBS_DB no está definido o está vacío. Total vacantes: 0.");
                this.allJobs = [];
            }
        }
        addLog(`=== FIN CARGA DE VACANTES: Total ${this.allJobs.length} ===`);

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

        console.log("[JobCopilot] Iniciando lectura de archivo:", file.name);

        const loader = document.getElementById('cvUploadLoader');
        const loaderText = document.getElementById('cvLoaderText');
        const dropTitle = document.getElementById('dropzoneTitle');
        const dropSub = document.getElementById('dropzoneSub');

        if (loader) loader.style.display = 'flex';
        
        try {
            let extractedText = "";
            const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";

            if (loaderText) loaderText.innerText = "1/4: Extrayendo texto del CV...";

            if (isPdf) {
                let pdfParsed = false;
                if (typeof pdfjsLib !== 'undefined') {
                    try {
                        const arrayBuffer = await new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result);
                            reader.onerror = () => reject(reader.error);
                            reader.readAsArrayBuffer(file);
                        });
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
                        if (extractedText.length > 30) pdfParsed = true;
                    } catch (e) {}
                }
                if (!pdfParsed) {
                    try {
                        const rawContent = await new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result);
                            reader.onerror = () => reject(reader.error);
                            reader.readAsText(file);
                        });
                        const asciiMatches = rawContent.match(/[A-Za-zÀ-ÿ0-9,.:;()\/\- ]{4,}/g);
                        if (asciiMatches && asciiMatches.length > 10) {
                            extractedText = asciiMatches.join(" ");
                        }
                    } catch (e) {}
                }
            } else {
                extractedText = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = () => reject(reader.error);
                    reader.readAsText(file);
                });
            }

            if (!extractedText || extractedText.trim().length < 20) {
                alert("No se pudo extraer texto. Usa la opción 'Pegar texto'.");
                ModalsController.openPasteModal();
                if (loader) loader.style.display = 'none';
                return;
            }

            // Iniciar Agentic Flow
            await this.runAgenticSearch(extractedText, file.name);

        } catch (err) {
            console.error(err);
            alert("Error: " + err.message);
        } finally {
            if (loader) loader.style.display = 'none';
        }
    },

    async runAgenticSearch(cvText, fileName) {
        const loaderText = document.getElementById('cvLoaderText');
        const dropTitle = document.getElementById('dropzoneTitle');
        const dropSub = document.getElementById('dropzoneSub');

        try {
            // STEP 1: Generate Queries
            if (loaderText) loaderText.innerText = "2/4: IA analizando perfil y diseñando estrategia de búsqueda...";
            let qRes;
            for (let attempt = 1; attempt <= 2; attempt++) {
                try {
                    qRes = await fetch('/api/generate_queries', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ cv_text: cvText })
                    });
                    if (qRes.ok) break;
                } catch (e) {
                    if (attempt === 2) throw e;
                }
            }

            if (!qRes || !qRes.ok) {
                let errorMsg = "Error desconocido del servidor.";
                try {
                    if (qRes) {
                        const errJson = await qRes.json();
                        errorMsg = errJson.error || errorMsg;
                    }
                } catch(e) {}
                throw new Error("Fallo al generar consultas. Detalles: " + errorMsg);
            }
            const qData = await qRes.json();
            
            // Build temporary profile for UI
            this.profile = {
                name: "Candidato",
                edu: qData.profile_summary || "Perfil Analizado",
                summary: "Buscando en vivo usando: " + qData.queries.join(", "),
                lang: "IA Agent Mode",
                skills: [],
                seniority: "Analizando..."
            };
            this.renderProfileCard();

            // STEP 2: Web Search
            if (loaderText) loaderText.innerText = "3/4: Buscando vacantes activas en portales web...";
            const sRes = await fetch('/api/search_web', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ queries: qData.queries })
            });
            if (!sRes.ok) {
                let errorMsg = "Error desconocido del servidor.";
                try {
                    const errJson = await sRes.json();
                    errorMsg = errJson.error || errorMsg;
                } catch(e) {}
                throw new Error("Fallo en la búsqueda web. Detalles: " + errorMsg);
            }
            const sData = await sRes.json();
            const rawJobs = sData.results || [];

            if (rawJobs.length === 0) {
                throw new Error("El agente completó la búsqueda pero no se encontraron ofertas recientes con esos filtros en la web.");
            }

            // STEP 3: Evaluate Match
            if (loaderText) loaderText.innerText = `4/4: IA evaluando ${rawJobs.length} resultados en tiempo real...`;
            const finalJobs = [];
            
            // Evaluate in parallel for speed, but catch errors
            let failedEvals = 0;
            const evPromises = rawJobs.map(job => 
                fetch('/api/evaluate_match', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cv_text: cvText, job: job })
                })
                .then(r => r.json())
                .catch(err => {
                    console.error("Evaluate error:", err);
                    failedEvals++;
                    return null;
                })
            );
            
            const evResults = await Promise.all(evPromises);
            
            evResults.forEach(res => {
                if (res && res.is_match) {
                    finalJobs.push({
                        id: res.id || String(Math.random()),
                        company: res.company || "Empresa Confidencial",
                        title: res.title || "Vacante",
                        hours: res.hours || "Consultar",
                        hoursLabel: res.hours || "Consultar",
                        modality: res.modality || "Híbrido",
                        modalityKey: (res.modality || "").toLowerCase().includes("remot") ? "remote" : "hybrid",
                        location: "Uruguay",
                        applyUrl: res.url || "",
                        desc: res.reason || "Buen match según IA.",
                        reason: res.reason || "Evaluado por IA",
                        pros: res.pros || [],
                        cons: res.cons || [],
                        source: "Web Search Agent",
                        score: res.score || 80,
                        isLinkedIn: (res.url || "").includes("linkedin")
                    });
                }
            });

            if (finalJobs.length === 0) {
                if (failedEvals === rawJobs.length) {
                    throw new Error("Todas las evaluaciones de la IA fallaron por tiempo de espera o límite de la API de Google. Por favor, reintente.");
                } else {
                    throw new Error(`La IA descargó ${rawJobs.length} vacantes de GetOnBoard, pero determinó que NINGUNA encajaba bien con tu CV. Trata de usar menos palabras clave en tu CV.`);
                }
            }

            this.allJobs = finalJobs;
            if (dropTitle) dropTitle.innerText = fileName || "Perfil Activo";
            if (dropSub) dropSub.innerText = `Búsqueda en vivo finalizada: ${finalJobs.length} matches exactos`;
            
            this.applyFilters();

        } catch (err) {
            console.error(err);
            alert("Error en el Agente: " + err.message);
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
