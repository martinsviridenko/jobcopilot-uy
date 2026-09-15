/**
 * JobCopilot v3 — High Relevance Feed Renderer
 * Renders verified vacancies with 'No me interesa' blacklist and validated action buttons.
 */

class FeedRenderer {
    static render(jobs, candidateProfile, containerId = "feedView") {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = "";

        const filters = FilterController.getActiveFilters();
        const favorites = StorageManager.getFavorites();
        const applications = StorageManager.getApplications();

        // 1. Evaluate & filter for high quality recommendations only
        const evaluatedList = [];
        jobs.forEach(job => {
            const evalResult = MatchingEngine.evaluate(job, candidateProfile);
            if (FilterController.matches(job, evalResult, filters)) {
                evaluatedList.push({
                    job,
                    eval: evalResult
                });
            }
        });

        // 2. Sort by highest interview probability score
        const sortMode = document.getElementById('sortSelect')?.value || "worth_it";
        evaluatedList.sort((a, b) => {
            const sa = a.eval.score || 0;
            const sb = b.eval.score || 0;
            if (sortMode === "worth_it" || sortMode === "score_desc") return sb - sa;
            if (sortMode === "hours_asc") return (a.job.hours || "").localeCompare(b.job.hours || "");
            return 0;
        });

        // 3. Update counter badge in UI
        const countBadge = document.getElementById('countFeed');
        if (countBadge) countBadge.innerText = evaluatedList.length;

        // 4. Handle empty state
        if (evaluatedList.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 48px 24px; background: var(--surface); border: 1px dashed var(--border); border-radius: 14px; color: var(--text-muted);">
                    <div style="font-size: 32px; margin-bottom: 8px;">🎯</div>
                    <h3 style="color: #FFF; font-size: 16px; margin-bottom: 6px;">No hay ofertas compatibles con estos filtros</h3>
                    <p style="font-size: 13px; max-width: 500px; margin: 0 auto; line-height: 1.5;">
                        Para mantener la máxima calidad, JobCopilot filtra automáticamente ofertas de otras disciplinas o jerarquías incompatibles. Probá activar más ubicaciones (como Remoto) o ampliar la carga horaria.
                    </p>
                </div>
            `;
            return;
        }

        // 5. Render cards
        evaluatedList.forEach(({ job, eval: analysis }) => {
            const isFav = favorites.includes(job.id);
            const isApplied = !!applications[job.id];
            const sourceName = TransparencyTracker.detectSource(job);

            let scoreClr = "score-mid";
            let scoreLabel = `${analysis.score}% Probabilidad de Entrevista`;
            if (analysis.score >= 80) {
                scoreClr = "score-high";
                scoreLabel = `${analysis.score}% Alta Probabilidad de Entrevista`;
            } else if (analysis.score < 60) {
                scoreClr = "score-low";
                scoreLabel = `${analysis.score}% Probabilidad Media / Condicionada`;
            }

            const card = document.createElement("div");
            card.id = `job-card-${job.id}`;
            card.className = `job-card ${isApplied ? 'is-applied' : ''} ${isFav ? 'is-favorite' : ''}`;
            card.innerHTML = `
                <div class="job-top-header">
                    <div class="job-title-block">
                        <h3>
                            <button class="btn-fav ${isFav ? 'active' : ''}" onclick="App.toggleFavorite('${job.id}')" title="Marcar como favorita">★</button>
                            ${job.title}
                        </h3>
                        <div class="job-company-row">
                            <span>${job.company}</span>
                            <span class="location">• ${job.location}</span>
                            <span style="color: var(--text-subtle); font-size: 11px;">(Fuente: ${sourceName})</span>
                        </div>
                    </div>
                    <div class="match-score-pill">
                        <span class="match-score-main ${scoreClr}">⚡ ${scoreLabel}</span>
                        <span class="match-probability-text">Encaje con tu perfil: <strong>${analysis.probability}</strong></span>
                    </div>
                </div>

                <div class="tags-cluster">
                    <span class="tag-pill t-domain">${analysis.domain ? analysis.domain.icon + " " + analysis.domain.name : (job.domainLabel || "🏢 General")}</span>
                    <span class="tag-pill t-hours">⏰ ${job.hoursLabel || job.hours}</span>
                    <span class="tag-pill t-modality">📍 ${job.modality || "Presencial"}</span>
                    ${job.seniority ? `<span class="tag-pill t-modality" style="background: rgba(148, 163, 184, 0.12); color: #CBD5E1; border: 1px solid rgba(148, 163, 184, 0.25);">🎖️ ${job.seniority}</span>` : ''}
                </div>

                <p class="job-quote-desc">${job.desc || job.description || ""}</p>

                <!-- Diagnóstico del Reclutador JobCopilot (X-Ray) -->
                <div class="copilot-evaluation-box">
                    <div class="copilot-verdict-header">
                        <span>🤖 Evaluación del Reclutador:</span>
                        <span style="font-weight: 700; color: ${analysis.score >= 80 ? '#34D399' : '#FCD34D'};">
                            ${analysis.verdict}
                        </span>
                    </div>

                    <div style="background: rgba(56, 189, 248, 0.08); border-left: 3px solid var(--primary); padding: 8px 12px; border-radius: 0 6px 6px 0; font-size: 12px; color: #CBD5E1;">
                        💡 <strong>Por qué te conviene:</strong> ${analysis.whyAppeared}
                    </div>

                    <div class="breakdown-row">
                        <div class="pros-col">
                            <strong>Requisitos que cumplís:</strong>
                            <ul>
                                ${(analysis.met || []).slice(0, 3).map(m => `<li>${m}</li>`).join('')}
                            </ul>
                            ${analysis.boosters && analysis.boosters.length > 0 ? `
                                <div style="margin-top: 6px; font-size: 11px; color: #34D399;">
                                    ⚡ Factores a favor: ${analysis.boosters.slice(0, 2).join(' • ')}
                                </div>
                            ` : ''}
                        </div>
                        <div class="cons-col">
                            <strong>Puntos de atención / Brechas:</strong>
                            <ul>
                                ${(analysis.unmet && analysis.unmet.length ? analysis.unmet : ["Sin brechas críticas detectadas"]).slice(0, 3).map(u => `<li>${u}</li>`).join('')}
                            </ul>
                            ${analysis.penalties && analysis.penalties.length > 0 ? `
                                <div style="margin-top: 6px; font-size: 11px; color: #FB923C;">
                                    ⚠️ Puntos a compensar: ${analysis.penalties.slice(0, 2).join(' • ')}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <!-- Action Bar -->
                <div class="job-card-actions">
                    <div class="copilot-tool-buttons">
                        <button class="btn-copilot-action" onclick="ModalsController.openAnalysis('${job.id}')" title="Ver análisis detallado">
                            🔍 ¿Por qué me conviene?
                        </button>
                        <button class="btn-copilot-action" onclick="ModalsController.openCoverLetter('${job.id}')" title="Redactar carta de presentación">
                            ✉️ Generar Carta
                        </button>
                        <button class="btn-copilot-action" onclick="ModalsController.openOptimizeCv('${job.id}')" title="Consejos para adaptar tu CV">
                            ⚡ Adaptar CV
                        </button>
                        <button class="btn-copilot-action btn-dismiss" onclick="App.dismissJob('${job.id}')" title="Ocultar permanentemente esta vacante">
                            🚫 No me interesa
                        </button>
                    </div>

                    <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                        <a href="${job.applyUrl}" target="_blank" rel="noopener noreferrer" class="btn-apply-direct ${job.isLinkedIn ? 'linkedin' : ''}">
                            Postularme en ${job.isLinkedIn ? 'LinkedIn' : 'Portal Oficial'} &rarr;
                        </a>
                        ${isApplied ? `
                            <button class="btn-status-toggle applied" onclick="App.removeApplication('${job.id}')" title="Desmarcar postulación">
                                ✓ Postulado (${applications[job.id].status})
                            </button>
                        ` : `
                            <button class="btn-status-toggle" onclick="App.registerApplication('${job.id}')">
                                + Registrar Postulación
                            </button>
                        `}
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }
}
