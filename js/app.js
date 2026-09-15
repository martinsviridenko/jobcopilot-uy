// Lógica del Copiloto de Postulaciones (JobCopilot AI)
// =========================================================================
        // BASE DE DATOS DE OFERTAS LABORALES REALES CON REQUISITOS CLASIFICADOS
        // =========================================================================
        // JOBS_DB cargada desde js/jobs.js


        // Estado global de la aplicación
        let userProfile = null;
        let currentView = 'feed';
        let appliedData = JSON.parse(localStorage.getItem('jc_applied_data') || '{}');
        let favoriteIds = JSON.parse(localStorage.getItem('jc_favorites') || '[]');
        let userApiKey = localStorage.getItem('jc_api_key') || '';
        let compareSelection = [];

        // Inicialización
        document.addEventListener('DOMContentLoaded', () => {
            initProfileFromStorage();
            setupDragAndDrop();
            renderAll();
        });

        // =========================================================================
        // GESTIÓN DEL CV CON LECTURA NATIVA DE PDF (PDF.JS)
        // =========================================================================
        function initProfileFromStorage() {
            const saved = localStorage.getItem('jc_user_profile');
            if (saved) {
                try {
                    userProfile = JSON.parse(saved);
                    renderProfileBox(userProfile);
                    return;
                } catch(e) {}
            }
            userProfile = null;
            document.getElementById('profileSummaryBox').style.display = 'none';
            document.getElementById('cvBadgeStatus').innerText = "● Sin cargar";
            document.getElementById('cvBadgeStatus').style.color = "var(--text-muted)";
        }

        function setupDragAndDrop() {
            const dz = document.getElementById('dropzoneLabel');
            dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.style.borderColor = 'var(--primary)'; dz.style.background = 'rgba(56, 189, 248, 0.08)'; });
            dz.addEventListener('dragleave', () => { dz.style.borderColor = 'var(--border-highlight)'; dz.style.background = 'rgba(14, 22, 38, 0.7)'; });
            dz.addEventListener('drop', (e) => {
                e.preventDefault();
                dz.style.borderColor = 'var(--border-highlight)';
                dz.style.background = 'rgba(14, 22, 38, 0.7)';
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    processUploadedDocument(e.dataTransfer.files[0]);
                }
            });
        }

        function handleFileSelected(event) {
            if (event.target.files && event.target.files.length > 0) {
                processUploadedDocument(event.target.files[0]);
            }
        }

        async function processUploadedDocument(file) {
            let extractedText = "";

            if (file.name.toLowerCase().endsWith('.pdf')) {
                try {
                    const arrayBuffer = await file.arrayBuffer();
                    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map(item => item.str).join(' ');
                        extractedText += pageText + "\n";
                    }
                } catch(err) {
                    console.error("PDF.js error:", err);
                    extractedText = await file.text();
                }
            } else {
                extractedText = await file.text();
            }

            // Análisis semántico del texto extraído
            const profile = parseResumeTextSemantics(extractedText, file.name);
            userProfile = profile;
            localStorage.setItem('jc_user_profile', JSON.stringify(profile));
            renderProfileBox(profile);
            renderAll();
        }

        function parseResumeTextSemantics(rawText, filename) {
            const text = rawText.toLowerCase();
            const cleanName = filename.replace(/\.[^/.]+$/, "");

            // Detección de habilidades
            const dictionary = [
                "excel", "sql", "power bi", "python", "meta ads", "google ads",
                "looker studio", "e-commerce", "analítica", "analytics", "sap",
                "tableau", "negocios", "marketing digital", "crm", "ciberseguridad"
            ];
            const detectedSkills = [];
            dictionary.forEach(term => {
                if (text.includes(term)) {
                    let formatted = term.charAt(0).toUpperCase() + term.slice(1);
                    if (term === "power bi") formatted = "Power BI";
                    if (term === "sql") formatted = "SQL";
                    if (term === "meta ads") formatted = "Meta Ads";
                    if (term === "e-commerce") formatted = "E-commerce";
                    if (!detectedSkills.includes(formatted)) detectedSkills.push(formatted);
                }
            });
            if (detectedSkills.length === 0) detectedSkills.push("Excel", "Negocios", "Analítica");

            // Detección de carrera
            let detectedCareer = "Licenciatura en Negocios Digitales / Administración";
            if (text.includes("negocios digitales")) detectedCareer = "Lic. en Negocios Digitales (ORT Uruguay)";
            else if (text.includes("contador")) detectedCareer = "Carrera de Contador Público";
            else if (text.includes("sistemas") || text.includes("ingeniería")) detectedCareer = "Ingeniería en Sistemas / Computación";
            else if (text.includes("economía")) detectedCareer = "Licenciatura en Economía";

            // Detección de idioma
            let detectedLang = "Inglés Intermedio";
            if (text.includes("b2") || text.includes("first") || text.includes("fce")) detectedLang = "Cambridge B2 First (FCE)";
            else if (text.includes("c1") || text.includes("advanced") || text.includes("cae")) detectedLang = "Inglés Avanzado / C1";

            // Generación de Resumen Profesional Automático
            const summary = `Estudiante de ${detectedCareer} con dominio de ${detectedSkills.slice(0, 3).join(", ")} y nivel ${detectedLang}. Perfil analítico orientado a proyectos de negocio, tecnología y optimización de procesos.`;

            return {
                name: cleanName.length > 2 ? cleanName : "Postulante",
                initials: cleanName.slice(0, 2).toUpperCase(),
                edu: detectedCareer,
                lang: detectedLang,
                summary: summary,
                skills: detectedSkills
            };
        }

        function loadDemoCandidate() {
            userProfile = {
                name: "Martín Sviridenko",
                initials: "MS",
                edu: "Licenciatura en Negocios Digitales (ORT Uruguay) • Promedio 91/100",
                lang: "Cambridge B2 First (FCE Oficial)",
                summary: "Estudiante avanzado de Negocios Digitales en ORT Uruguay (Promedio 91/100). Especializado en analítica de datos comerciales con SQL, Power BI y Python, campañas digitales y e-commerce. Buscando régimen de 4h o 6h.",
                skills: ["Excel", "SQL", "Power BI", "Python", "Looker Studio", "Meta Ads", "E-commerce", "Negocios", "Analítica", "Inglés"]
            };
            localStorage.setItem('jc_user_profile', JSON.stringify(userProfile));
            renderProfileBox(userProfile);
            renderAll();
        }

        function renderProfileBox(p) {
            document.getElementById('pName').innerText = p.name;
            document.getElementById('pEdu').innerText = p.edu;
            document.getElementById('pLang').innerText = p.lang;
            document.getElementById('pAvatar').innerText = p.initials || 'CV';
            document.getElementById('pSummaryText').innerText = p.summary || 'Resumen del candidato cargado.';

            const container = document.getElementById('pSkillsChips');
            container.innerHTML = '';
            (p.skills || []).forEach(s => {
                const sp = document.createElement('span');
                sp.className = 'chip-skill';
                sp.innerText = s;
                container.appendChild(sp);
            });

            document.getElementById('profileSummaryBox').style.display = 'block';
            document.getElementById('cvBadgeStatus').innerText = "● CV Activo";
            document.getElementById('cvBadgeStatus').style.color = "var(--accent-green)";
        }

        function resetProfile() {
            localStorage.removeItem('jc_user_profile');
            userProfile = null;
            document.getElementById('profileSummaryBox').style.display = 'none';
            document.getElementById('cvBadgeStatus').innerText = "● Sin cargar";
            document.getElementById('cvBadgeStatus').style.color = "var(--text-muted)";
            renderAll();
        }

        // =========================================================================
        // SCORE INTELIGENTE PONDERADO (Carrera 35%, Exp 25%, Tools 15%, etc.)
        // =========================================================================
        function calculateWeightedScore(job) {
            if (!userProfile) return { score: null, breakdown: null };

            let total = 0;
            const reasonsMet = [];
            const reasonsUnmet = [];

            // 1. Carrera / Formación Académica (Ponderación 35%)
            const userEdu = (userProfile.edu || "").toLowerCase();
            const matchesCareer = (job.careerFit || []).some(c => userEdu.includes(c.toLowerCase()));
            if (matchesCareer) {
                total += 35;
                reasonsMet.push(`Formación alineada (${job.careerFit[0]})`);
            } else {
                total += 15; // Parcial por afinidad universitaria general
                reasonsUnmet.push(`Puesto prioriza egresados de: ${job.careerFit.slice(0, 2).join(", ")}`);
            }

            // 2. Experiencia / Requisitos Excluyentes (Ponderación 25%)
            let mandatoryMet = 0;
            const mandatories = job.requirements.mandatory || [];
            mandatories.forEach(m => {
                // Si pide estudiante o 4h, chequeamos si cumplimos
                if (m.toLowerCase().includes("estudiante") || m.toLowerCase().includes("disponibilidad")) {
                    mandatoryMet++;
                    reasonsMet.push(m);
                } else if (m.toLowerCase().includes("excel") && userProfile.skills.includes("Excel")) {
                    mandatoryMet++;
                    reasonsMet.push("Cumplís requisito excluyente: " + m);
                } else {
                    reasonsUnmet.push("Excluyente a considerar: " + m);
                }
            });
            const mandScore = mandatories.length > 0 ? (mandatoryMet / mandatories.length) * 25 : 20;
            total += mandScore;

            // 3. Herramientas Técnicas (Ponderación 15%)
            let techMatches = 0;
            const desirables = [...(job.requirements.desirable || []), ...(job.requirements.bonus || [])];
            desirables.forEach(d => {
                const hasSkill = (userProfile.skills || []).some(s => d.toLowerCase().includes(s.toLowerCase()));
                if (hasSkill) {
                    techMatches++;
                    reasonsMet.push(`Manejo de ${d}`);
                }
            });
            total += Math.min(15, techMatches * 5 + 4);

            // 4. Idiomas (Ponderación 10%)
            const userLang = (userProfile.lang || "").toLowerCase();
            if (userLang.includes("b2") || userLang.includes("c1") || userLang.includes("avanzado")) {
                total += 10;
                reasonsMet.push("Nivel de inglés profesional certificado");
            } else {
                total += 5;
            }

            // 5. Ubicación / Modalidad (Ponderación 10%)
            total += (job.modalityKey === 'hybrid' || job.modalityKey === 'remote') ? 10 : 8;

            // 6. Carga Horaria y Disponibilidad (Ponderación 5%)
            const wants4h = document.getElementById('filter4h').checked;
            const wants6h = document.getElementById('filter6h').checked;
            if ((job.hours === '4h' && wants4h) || (job.hours === '6h' && wants6h)) {
                total += 5;
                reasonsMet.push(`Horario compatible de ${job.hours}`);
            } else if (job.hours === '8h') {
                reasonsUnmet.push("Régimen de 8 horas (jornada completa)");
            }

            const finalScore = Math.min(96, Math.max(38, Math.round(total)));
            return {
                score: finalScore,
                met: reasonsMet,
                unmet: reasonsUnmet,
                probability: finalScore >= 80 ? "Alta" : finalScore >= 65 ? "Media" : "Baja"
            };
        }

        // =========================================================================
        // RENDER DE VISTAS (Feed & Kanban)
        // =========================================================================
        function renderAll() {
            renderFeed();
            renderKanban();
            updateGlobalCounters();
        }

        function switchView(view) {
            currentView = view;
            document.getElementById('tabFeed').classList.toggle('active', view === 'feed');
            document.getElementById('tabKanban').classList.toggle('active', view === 'kanban');
            document.getElementById('tabFavorites').classList.toggle('active', view === 'favorites');

            document.getElementById('feedView').style.display = view === 'kanban' ? 'none' : 'flex';
            document.getElementById('kanbanView').style.display = view === 'kanban' ? 'block' : 'none';

            if (view !== 'kanban') renderFeed();
        }

        function applyFilters() {
            renderAll();
        }

        function renderFeed() {
            const container = document.getElementById('feedView');
            container.innerHTML = '';

            const wants4h = document.getElementById('filter4h').checked;
            const wants6h = document.getElementById('filter6h').checked;
            const wants8h = document.getElementById('filter8h').checked;

            const secBank = document.getElementById('secBank').checked;
            const secConsulting = document.getElementById('secConsulting').checked;
            const secTech = document.getElementById('secTech').checked;
            const secRetail = document.getElementById('secRetail').checked;
            const secUniv = document.getElementById('secUniv').checked;

            const modHybrid = document.getElementById('modHybrid').checked;
            const modRemote = document.getElementById('modRemote').checked;
            const modPresential = document.getElementById('modPresential').checked;
            const hideApplied = document.getElementById('hideAppliedToggle').checked;

            let filtered = JOBS_DB.filter(job => {
                if (currentView === 'favorites' && !favoriteIds.includes(job.id)) return false;
                if (hideApplied && appliedData[job.id]) return false;

                if (job.hours === '4h' && !wants4h) return false;
                if (job.hours === '6h' && !wants6h) return false;
                if (job.hours === '8h' && !wants8h) return false;

                if (job.sector === 'bank' && !secBank) return false;
                if (job.sector === 'consulting' && !secConsulting) return false;
                if (job.sector === 'tech' && !secTech) return false;
                if (job.sector === 'retail' && !secRetail) return false;
                if (job.sector === 'univ' && !secUniv) return false;

                if (job.modalityKey === 'hybrid' && !modHybrid) return false;
                if (job.modalityKey === 'remote' && !modRemote) return false;
                if (job.modalityKey === 'presential' && !modPresential) return false;

                return true;
            });

            // Ordenamiento inteligente
            const sortMode = document.getElementById('sortSelect').value;
            filtered.sort((a, b) => {
                const sa = calculateWeightedScore(a).score || 0;
                const sb = calculateWeightedScore(b).score || 0;
                if (sortMode === 'worth_it' || sortMode === 'score_desc') return sb - sa;
                if (sortMode === 'hours_asc') return a.hours.localeCompare(b.hours);
                return 0;
            });

            document.getElementById('countFeed').innerText = filtered.length;

            if (filtered.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px; background: var(--surface); border: 1px dashed var(--border); border-radius: 12px; color: var(--text-muted);">
                        <h3>No hay ofertas que coincidan con estos filtros</h3>
                        <p style="font-size: 13px; margin-top: 6px;">Probá habilitar más sectores o activar la opción de 8 horas.</p>
                    </div>
                `;
                return;
            }

            filtered.forEach(job => {
                const analysis = calculateWeightedScore(job);
                const isApplied = !!appliedData[job.id];
                const isFav = favoriteIds.includes(job.id);

                let scoreBadgeHtml = '';
                if (analysis.score !== null) {
                    const clr = analysis.score >= 80 ? 'score-high' : analysis.score >= 65 ? 'score-mid' : 'score-low';
                    scoreBadgeHtml = `
                        <div class="match-score-pill">
                            <span class="match-score-main ${clr}">⚡ ${analysis.score}% Coincidencia</span>
                            <span class="match-probability-text">Probabilidad de llamada: <strong>${analysis.probability}</strong></span>
                        </div>
                    `;
                } else {
                    scoreBadgeHtml = `
                        <div class="match-score-pill">
                            <span class="match-score-main score-none" onclick="document.getElementById('cvFileInput').click()" style="cursor: pointer;">
                                📄 Subí CV para Score Ponderado
                            </span>
                        </div>
                    `;
                }

                const card = document.createElement('div');
                card.className = `job-card ${isApplied ? 'is-applied' : ''} ${isFav ? 'is-favorite' : ''}`;
                card.innerHTML = `
                    <div class="job-top-header">
                        <div class="job-title-block">
                            <h3>
                                <button class="btn-fav ${isFav ? 'active' : ''}" onclick="toggleFavorite('${job.id}')" title="Marcar empresa favorita">★</button>
                                ${job.title}
                            </h3>
                            <div class="job-company-row">
                                <span>${job.company}</span>
                                <span class="location">• ${job.location}</span>
                                <span style="color: var(--text-subtle); font-size: 11px;">(Sueldo ref: ${job.salaryGuide})</span>
                            </div>
                        </div>
                        <div>${scoreBadgeHtml}</div>
                    </div>

                    <div class="tags-cluster">
                        <span class="tag-pill t-hours">⏰ ${job.hoursLabel}</span>
                        <span class="tag-pill t-modality">📍 ${job.modality}</span>
                        <span class="tag-pill t-sector">🏢 ${job.sectorLabel}</span>
                        ${job.isTalentPool ? '<span class="tag-pill t-pool">📥 Base de Talentos</span>' : ''}
                    </div>

                    <p class="job-quote-desc">${job.desc}</p>

                    <!-- Diagnóstico del Copiloto -->
                    <div class="copilot-evaluation-box">
                        <div class="copilot-verdict-header">
                            <span>🤖 Diagnóstico de tu Copiloto:</span>
                            <span style="font-weight: 600; color: ${analysis.score >= 80 ? '#34D399' : '#FCD34D'};">
                                ${analysis.score >= 80 ? '¡Muy recomendada para postularte!' : analysis.score >= 65 ? 'Vale la pena si te interesa el área' : 'Postularte con expectativas moderadas'}
                            </span>
                        </div>
                        <div class="breakdown-row">
                            <div class="pros-col">
                                <strong>Lo que cumplís:</strong>
                                <ul>
                                    ${(analysis.met || job.requirements.mandatory).slice(0, 2).map(m => `<li>${m}</li>`).join('')}
                                </ul>
                            </div>
                            <div class="cons-col">
                                <strong>Puntos de atención:</strong>
                                <ul>
                                    ${(analysis.unmet && analysis.unmet.length ? analysis.unmet : ["Puesto competitivo con alta demanda"]).slice(0, 2).map(u => `<li>${u}</li>`).join('')}
                                </ul>
                            </div>
                        </div>
                    </div>

                    <!-- Action Bar -->
                    <div class="job-card-actions">
                        <div class="copilot-tool-buttons">
                            <button class="btn-copilot-action" onclick="openAnalysisModal('${job.id}')">
                                🔍 ¿Me conviene?
                            </button>
                            <button class="btn-copilot-action" onclick="generateCoverLetterModal('${job.id}')">
                                ✉️ Generar Carta
                            </button>
                            <button class="btn-copilot-action" onclick="openOptimizeCvModal('${job.id}')">
                                ⚡ Adaptar CV
                            </button>
                            <button class="btn-copilot-action" onclick="openSkillGapsModal('${job.id}')">
                                📚 Cursos
                            </button>
                            <button class="btn-copilot-action" onclick="addToCompare('${job.id}')">
                                ⚖️ Comparar
                            </button>
                        </div>

                        <div style="display: flex; gap: 8px; align-items: center;">
                            <a href="${job.applyUrl}" target="_blank" rel="noopener noreferrer" class="btn-apply-direct ${job.isLinkedIn ? 'linkedin' : ''}">
                                Postularme en ${job.isLinkedIn ? 'LinkedIn' : 'Portal'} &rarr;
                            </a>
                            <button class="btn-status-toggle ${isApplied ? 'applied' : ''}" onclick="toggleApplicationPipeline('${job.id}')">
                                ${isApplied ? '✓ Postulado (' + appliedData[job.id].status + ')' : '+ Registrar Postulación'}
                            </button>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
        }

        // =========================================================================
        // KANBAN PIPELINE DE POSTULACIONES
        // =========================================================================
        function renderKanban() {
            const cols = {
                sent: document.getElementById('colSent'),
                review: document.getElementById('colReview'),
                interview: document.getElementById('colInterview'),
                offer: document.getElementById('colOffer')
            };
            Object.values(cols).forEach(c => c.innerHTML = '');

            let counts = { sent: 0, review: 0, interview: 0, offer: 0 };

            Object.entries(appliedData).forEach(([jobId, data]) => {
                const job = JOBS_DB.find(j => j.id === jobId);
                if (!job) return;

                const status = data.status || 'sent';
                if (counts[status] !== undefined) counts[status]++;

                const targetCol = cols[status] || cols.sent;
                const card = document.createElement('div');
                card.className = 'kanban-card';
                card.innerHTML = `
                    <div class="kanban-card-title">${job.title}</div>
                    <div class="kanban-card-company">${job.company} • ${job.hours}</div>
                    <div class="kanban-card-date">Fecha: ${data.date || 'Reciente'}</div>
                    <select class="kanban-status-select" onchange="updateApplicationStatus('${job.id}', this.value)">
                        <option value="sent" ${status === 'sent' ? 'selected' : ''}>CV Enviado</option>
                        <option value="review" ${status === 'review' ? 'selected' : ''}>En Revisión</option>
                        <option value="interview" ${status === 'interview' ? 'selected' : ''}>En Entrevista</option>
                        <option value="offer" ${status === 'offer' ? 'selected' : ''}>Oferta / Cerrado</option>
                    </select>
                `;
                targetCol.appendChild(card);
            });

            document.getElementById('kCountSent').innerText = counts.sent;
            document.getElementById('kCountReview').innerText = counts.review;
            document.getElementById('kCountInterview').innerText = counts.interview;
            document.getElementById('kCountOffer').innerText = counts.offer;
            document.getElementById('countPipeline').innerText = Object.keys(appliedData).length;
        }

        function toggleApplicationPipeline(jobId) {
            if (appliedData[jobId]) {
                delete appliedData[jobId];
            } else {
                appliedData[jobId] = {
                    status: 'sent',
                    date: new Date().toLocaleDateString('es-UY', { day: '2-digit', month: 'short' })
                };
            }
            localStorage.setItem('jc_applied_data', JSON.stringify(appliedData));
            renderAll();
        }

        function updateApplicationStatus(jobId, newStatus) {
            if (appliedData[jobId]) {
                appliedData[jobId].status = newStatus;
                localStorage.setItem('jc_applied_data', JSON.stringify(appliedData));
                renderAll();
            }
        }

        function toggleFavorite(jobId) {
            if (favoriteIds.includes(jobId)) {
                favoriteIds = favoriteIds.filter(id => id !== jobId);
            } else {
                favoriteIds.push(jobId);
            }
            localStorage.setItem('jc_favorites', JSON.stringify(favoriteIds));
            renderAll();
        }

        function updateGlobalCounters() {
            document.getElementById('statAnalyzed').innerText = JOBS_DB.length;
            document.getElementById('statApplied').innerText = Object.keys(appliedData).length;
            document.getElementById('countFavs').innerText = favoriteIds.length;

            const wants4h = document.getElementById('filter4h').checked;
            const wants6h = document.getElementById('filter6h').checked;
            const wants8h = document.getElementById('filter8h').checked;
            const arr = [];
            if (wants4h) arr.push('4h');
            if (wants6h) arr.push('6h');
            if (wants8h) arr.push('8h');
            document.getElementById('statFilterHours').innerText = arr.length > 0 ? arr.join(' & ') : 'Ninguno';
        }

        // =========================================================================
        // HERRAMIENTAS COPILOT (Modales & Generación)
        // =========================================================================
        function openAnalysisModal(jobId) {
            const job = JOBS_DB.find(j => j.id === jobId);
            if (!job) return;
            const analysis = calculateWeightedScore(job);

            document.getElementById('analysisModalContent').innerHTML = `
                <div style="background: var(--surface-card); padding: 14px; border-radius: 10px; border: 1px solid var(--border-highlight);">
                    <h4 style="color: #FFF; font-size: 15px;">${job.title}</h4>
                    <p style="color: var(--primary); font-size: 13px; font-weight: 600;">${job.company} • ${job.hoursLabel}</p>
                </div>

                <div style="font-size: 13px; color: #CBD5E1; line-height: 1.5;">
                    <strong style="color:#FFF;">Lo que realmente busca la empresa:</strong>
                    <p style="margin-top: 4px;">${job.desc}</p>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 12.5px;">
                    <div style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); padding: 12px; border-radius: 8px;">
                        <strong style="color: #34D399;">Lo que cumplís a tu favor:</strong>
                        <ul style="margin-top: 6px; padding-left: 18px;">
                            ${(analysis.met || job.requirements.mandatory).map(m => `<li>${m}</li>`).join('')}
                        </ul>
                    </div>

                    <div style="background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); padding: 12px; border-radius: 8px;">
                        <strong style="color: #FCD34D;">Posibles desventajas o filtros:</strong>
                        <ul style="margin-top: 6px; padding-left: 18px;">
                            ${(analysis.unmet && analysis.unmet.length ? analysis.unmet : ["Competencia con graduados"]).map(u => `<li>${u}</li>`).join('')}
                        </ul>
                    </div>
                </div>

                <div style="background: rgba(56,189,248,0.1); border: 1px solid rgba(56,189,248,0.3); padding: 14px; border-radius: 8px; font-size: 13px;">
                    <strong style="color: var(--primary);">Veredicto honesto del Copiloto:</strong>
                    <p style="margin-top: 4px; color: #E2E8F0;">
                        ${analysis.score >= 80 ? 'La vacante tiene un encaje extraordinario con tus horas y perfil. Dedicale tiempo a enviar tu CV y una carta personalizada.' : 'Es una opción válida si te interesa ingresar a esta firma, aunque debés destacar en la postulación tu rápido aprendizaje en herramientas donde no tengás tanta experiencia.'}
                    </p>
                    <div style="margin-top: 6px; font-weight: 700; color: #FFF;">
                        Expectativa salarial sugerida: ${job.salaryGuide}
                    </div>
                </div>
            `;
            openModal('modalAnalysis');
        }

        function generateCoverLetterModal(jobId) {
            const job = JOBS_DB.find(j => j.id === jobId);
            if (!job) return;

            const name = userProfile ? userProfile.name : "Postulante";
            const career = userProfile ? userProfile.edu : "Estudiante Universitario";
            const skills = userProfile ? userProfile.skills.slice(0, 4).join(", ") : "análisis de datos y gestión";

            const letter = `Estimado equipo de Selección de ${job.company},

Me dirijo a ustedes con gran entusiasmo para presentar mi postulación a la vacante de ${job.title} en Montevideo.

Actualmente me encuentro cursando ${career}. A lo largo de mi formación he desarrollado sólidas competencias prácticas en ${skills}, combinadas con una fuerte orientación al cumplimiento de objetivos y trabajo en equipo.

Me resulta sumamente atractivo el desafío planteado por ${job.company}, particularmente en lo referente a ${job.desc.slice(0, 100)}... Considero que mi perfil se alinea con las necesidades del puesto, aportando rigor analítico, rápida curva de aprendizaje y una alta motivación por agregar valor desde el primer día. Asimismo, el régimen de ${job.hoursLabel} resulta perfectamente compatible con mis responsabilidades universitarias.

Agradezco de antemano su tiempo y consideración en evaluar mi postulación. Quedo a entera disposición para profundizar en una entrevista.

Atentamente,
${name}
Montevideo, Uruguay`;

            document.getElementById('coverLetterText').innerText = letter;
            openModal('modalCoverLetter');
        }

        function openOptimizeCvModal(jobId) {
            const job = JOBS_DB.find(j => j.id === jobId);
            if (!job) return;

            const keywords = [...job.requirements.mandatory, ...job.requirements.desirable];

            document.getElementById('optimizeCvContent').innerHTML = `
                <div style="font-size: 13px; color: #CBD5E1;">
                    Para que tu currículum supere los filtros automáticos (ATS) de <strong>${job.company}</strong>, asegurate de incluir estas palabras clave en tu resumen y experiencia:
                </div>

                <div class="chips-cloud" style="margin-top: 8px;">
                    ${keywords.map(k => `<span class="chip-skill" style="background: rgba(16,185,129,0.15); color:#34D399; border-color: rgba(16,185,129,0.3); font-size:12px; padding: 4px 10px;">${k}</span>`).join('')}
                </div>

                <div style="background: #070B12; border: 1px solid var(--border-highlight); padding: 14px; border-radius: 8px; font-size: 12.5px; color: #E2E8F0; margin-top: 10px;">
                    <strong style="color: var(--primary);">Resumen recomendado para la cabecera de tu CV:</strong>
                    <p style="margin-top: 6px; font-style: italic;">
                        "Estudiante universitario de ${userProfile ? userProfile.edu : 'carreras afines'} con perfil analítico y competencias en ${keywords.slice(0, 3).join(", ")}. Orientado a optimizar procesos y colaborar en proyectos de alto impacto en ${job.company} bajo modalidad ${job.hoursLabel}."
                    </p>
                </div>
            `;
            openModal('modalOptimizeCv');
        }

        function openSkillGapsModal(jobId) {
            const job = JOBS_DB.find(j => j.id === jobId);
            if (!job) return;

            const desirable = job.requirements.desirable || ["Excel Avanzado", "Power BI"];

            document.getElementById('skillGapsContent').innerHTML = `
                <div style="font-size: 13px; color: #CBD5E1;">
                    Requisitos deseables para esta posición en <strong>${job.company}</strong> y recursos recomendados para dominarlos gratis:
                </div>

                <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 8px;">
                    ${desirable.map(d => `
                        <div style="background: var(--surface-card); border: 1px solid var(--border); padding: 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                            <div>
                                <strong style="color: #FFF; font-size: 13px;">${d}</strong>
                                <p style="font-size: 11.5px; color: var(--text-muted);">Habilidad requerida / valorada</p>
                            </div>
                            <div style="display: flex; gap: 6px;">
                                <a href="https://www.youtube.com/results?search_query=curso+${encodeURIComponent(d)}" target="_blank" class="btn-action-outline" style="width:auto; margin-bottom:0; font-size:11px; padding:4px 8px;">
                                    ▶ YouTube Gratis
                                </a>
                                <a href="https://learn.microsoft.com/es-es/training/" target="_blank" class="btn-action-outline" style="width:auto; margin-bottom:0; font-size:11px; padding:4px 8px;">
                                    🎓 Microsoft Learn
                                </a>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            openModal('modalSkillGaps');
        }

        // Comparador de ofertas
        function addToCompare(jobId) {
            if (compareSelection.includes(jobId)) {
                alert("Ya agregaste esta oferta al comparador.");
                return;
            }
            if (compareSelection.length >= 2) compareSelection.shift();
            compareSelection.push(jobId);

            if (compareSelection.length === 2) {
                renderCompareModal();
            } else {
                alert("Agregaste 1 oferta al comparador. Seleccioná una segunda oferta para verlas frente a frente.");
            }
        }

        function renderCompareModal() {
            const j1 = JOBS_DB.find(j => j.id === compareSelection[0]);
            const j2 = JOBS_DB.find(j => j.id === compareSelection[1]);
            if (!j1 || !j2) return;

            const a1 = calculateWeightedScore(j1);
            const a2 = calculateWeightedScore(j2);

            document.getElementById('compareGridContent').innerHTML = `
                <div class="compare-col">
                    <h4 style="color: #FFF; font-size: 16px;">${j1.title}</h4>
                    <p style="color: var(--primary); font-size: 13px; font-weight:700;">${j1.company}</p>
                    <div style="margin: 10px 0; font-size: 20px; font-weight: 800; color: #34D399;">⚡ ${a1.score || '--'}% Match</div>
                    <ul style="font-size: 12px; color: #CBD5E1; padding-left: 16px; line-height: 1.6;">
                        <li><strong>Carga:</strong> ${j1.hoursLabel}</li>
                        <li><strong>Modalidad:</strong> ${j1.modality}</li>
                        <li><strong>Sector:</strong> ${j1.sectorLabel}</li>
                        <li><strong>Sueldo ref:</strong> ${j1.salaryGuide}</li>
                    </ul>
                </div>

                <div class="compare-col">
                    <h4 style="color: #FFF; font-size: 16px;">${j2.title}</h4>
                    <p style="color: var(--primary); font-size: 13px; font-weight:700;">${j2.company}</p>
                    <div style="margin: 10px 0; font-size: 20px; font-weight: 800; color: #34D399;">⚡ ${a2.score || '--'}% Match</div>
                    <ul style="font-size: 12px; color: #CBD5E1; padding-left: 16px; line-height: 1.6;">
                        <li><strong>Carga:</strong> ${j2.hoursLabel}</li>
                        <li><strong>Modalidad:</strong> ${j2.modality}</li>
                        <li><strong>Sector:</strong> ${j2.sectorLabel}</li>
                        <li><strong>Sueldo ref:</strong> ${j2.salaryGuide}</li>
                    </ul>
                </div>
            `;
            openModal('modalCompare');
        }

        // Búsqueda conversacional
        function executeConversationalSearch() {
            const query = (document.getElementById('conversationalPrompt').value || '').toLowerCase();
            if (!query) return;

            // Detección de intención por lenguaje natural
            if (query.includes("4h") || query.includes("4 horas") || query.includes("part-time")) {
                document.getElementById('filter4h').checked = true;
                document.getElementById('filter6h').checked = false;
                document.getElementById('filter8h').checked = false;
            } else if (query.includes("6h") || query.includes("6 horas") || query.includes("banca")) {
                document.getElementById('filter4h').checked = false;
                document.getElementById('filter6h').checked = true;
                document.getElementById('filter8h').checked = false;
            } else if (query.includes("completo") || query.includes("8 horas") || query.includes("full-time")) {
                document.getElementById('filter8h').checked = true;
            }

            if (query.includes("tecnolog") || query.includes("tech") || query.includes("software")) {
                document.getElementById('secTech').checked = true;
                document.getElementById('secRetail').checked = false;
            }

            applyFilters();
            alert(`JobCopilot analizó tu consulta: "${query}". Ajustó automáticamente los filtros y ordenó las oportunidades.`);
        }

        // Modales genéricos
        function openModal(id) { document.getElementById(id).style.display = 'flex'; }
        function closeModal(id) { document.getElementById(id).style.display = 'none'; }
        function copyModalContent(elementId) {
            const text = document.getElementById(elementId).innerText;
            navigator.clipboard.writeText(text);
            alert("✓ Copiado al portapapeles con éxito.");
        }

        function openManualProfileModal() {
            if (userProfile) {
                document.getElementById('mName').value = userProfile.name || '';
                document.getElementById('mEdu').value = userProfile.edu || '';
                document.getElementById('mLang').value = userProfile.lang || '';
                document.getElementById('mSkills').value = (userProfile.skills || []).join(', ');
            }
            openModal('modalManualProfile');
        }

        function saveManualProfile() {
            const name = document.getElementById('mName').value.trim() || 'Candidato';
            const edu = document.getElementById('mEdu').value.trim() || 'Estudiante Universitario';
            const lang = document.getElementById('mLang').value.trim() || 'Inglés Intermedio';
            const skills = document.getElementById('mSkills').value.split(',').map(s => s.trim()).filter(s => s.length > 0);

            userProfile = {
                name: name,
                initials: name.slice(0, 2).toUpperCase(),
                edu: edu,
                lang: lang,
                summary: `Estudiante de ${edu} con competencias en ${skills.slice(0, 3).join(", ")}.`,
                skills: skills.length > 0 ? skills : ["Excel", "Negocios"]
            };
            localStorage.setItem('jc_user_profile', JSON.stringify(userProfile));
            renderProfileBox(userProfile);
            closeModal('modalManualProfile');
            renderAll();
        }

        function openApiKeyModal() {
            document.getElementById('inputApiKey').value = userApiKey;
            openModal('modalApiKey');
        }

        function saveApiKey() {
            userApiKey = document.getElementById('inputApiKey').value.trim();
            localStorage.setItem('jc_api_key', userApiKey);
            closeModal('modalApiKey');
            alert(userApiKey ? "✓ API Key configurada. El Copilot utilizará llamadas a modelos LLM para la generación avanzada." : "Modo offline asistido configurado.");
        }
