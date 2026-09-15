/**
 * FeedRenderer — Renderizado de Tarjetas de Oportunidades
 * Presenta el diagnóstico transparente del reclutador, badges calibrados
 * y acciones limpias sin emojis infantiles.
 */

class FeedRenderer {
    static render(jobs, candidateProfile, containerId = "feedView") {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = "";

        const filters = FilterController.getActiveFilters();
        const favorites = StorageManager.getFavorites();
        const applications = StorageManager.getApplications();

        // 1. Evaluación mediante el Motor Universal
        const evaluatedList = [];
        jobs.forEach(job => {
            const evalResult = MatchingEngine.evaluate(job, candidateProfile);
            if (FilterController.matches(job, evalResult, filters)) {
                evaluatedList.push({ job, eval: evalResult });
            }
        });

        // 2. Ordenamiento por probabilidad competitiva
        const sortMode = document.getElementById('sortSelect')?.value || "worth_it";
        evaluatedList.sort((a, b) => {
            const sa = a.eval.score || 0;
            const sb = b.eval.score || 0;
            if (sortMode === "worth_it" || sortMode === "score_desc") return sb - sa;
            if (sortMode === "hours_asc") return (a.job.hours || "").localeCompare(b.job.hours || "");
            return 0;
        });

        // 3. Actualizar contadores
        const countBadge = document.getElementById('countFeed');
        if (countBadge) countBadge.innerText = evaluatedList.length;

        const countNav = document.getElementById('countFeedNav');
        if (countNav) countNav.innerText = evaluatedList.length;

        // 4. Estado vacío
        if (evaluatedList.length === 0) {
            // Diferenciar entre "no cargaron trabajos de la BD" y "los filtros los ocultaron todos"
            if (jobs.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 50px 24px; background: var(--surface); border: 1px dashed #ef4444; border-radius: 14px; color: var(--text-muted); width: 100%;">
                        <h3 style="color: #ef4444; font-size: 16px; margin-bottom: 6px;">No se pudieron cargar las vacantes.</h3>
                        <p style="font-size: 13px; max-width: 520px; margin: 0 auto; line-height: 1.5; color: #fca5a5;">
                            Verifique la conexión con Supabase o la base de datos local.
                        </p>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div style="text-align: center; padding: 50px 24px; background: var(--surface); border: 1px dashed var(--border); border-radius: 14px; color: var(--text-muted); width: 100%;">
                        <h3 style="color: #FFF; font-size: 16px; margin-bottom: 6px;">No hay vacantes que coincidan con estos filtros</h3>
                        <p style="font-size: 13px; max-width: 520px; margin: 0 auto; line-height: 1.5;">
                            El motor descarta únicamente búsquedas radicalmente incompatibles. Probá ampliando los filtros de carga horaria o ubicación en la barra superior.
                        </p>
                        <button class="btn btn-secondary btn-sm" onclick="FilterController.resetAllFilters()" style="margin-top: 14px;">
                            Restablecer todos los filtros
                        </button>
                    </div>
                `;
            }
            return;
        }

        // 5. Renderizado de tarjetas limpias
        evaluatedList.forEach(({ job, eval: analysis }) => {
            const isFav = favorites.includes(job.id);
            const isApplied = !!applications[job.id];
            const sourceName = TransparencyTracker.detectSource(job);

            let tierClass = "tier-good";
            let tierLabel = "Buena Opción";
            if (analysis.score >= 75) {
                tierClass = "tier-ideal";
                tierLabel = "Match Ideal";
            } else if (analysis.score < 60) {
                tierClass = "tier-challenge";
                tierLabel = "Afinidad Parcial / Desafío";
            }

            const card = document.createElement("article");
            card.id = `job-card-${job.id}`;
            card.className = `job-card ${isApplied ? 'is-applied' : ''} ${isFav ? 'is-favorite' : ''}`;
            card.innerHTML = `
                <div class="job-card-header">
                    <div class="job-card-title-area">
                        <div class="job-card-title-row">
                            <button class="btn-star-fav ${isFav ? 'active' : ''}" onclick="App.toggleFavorite('${job.id}')" title="Marcar como favorita">★</button>
                            <h3 class="job-title">${escapeHtml(job.title)}</h3>
                        </div>
                        <div class="job-company-line">
                            <span>${escapeHtml(job.company)}</span>
                            <span class="source-tag">• Fuente: ${escapeHtml(sourceName)}</span>
                        </div>
                    </div>

                    <div class="match-score-pill">
                        <span class="score-badge ${tierClass}">${analysis.score}% ${tierLabel}</span>
                        <span class="score-sublabel">Afinidad: <strong>${analysis.probability}</strong></span>
                    </div>
                </div>

                <div class="job-tags-row">
                    <span class="tag-badge t-area">${analysis.domain ? analysis.domain.name : "Área General"}</span>
                    <span class="tag-badge t-hours">${job.hoursLabel || job.hours || "Flexible"}</span>
                    <span class="tag-badge">${escapeHtml(job.location || "Uruguay")}</span>
                    <span class="tag-badge">${escapeHtml(job.modality || "Presencial")}</span>
                </div>

                <p class="job-description-snippet">${escapeHtml(job.desc || job.description || "")}</p>

                <!-- Diagnóstico del Reclutador -->
                <div class="diagnostic-box">
                    <div class="diagnostic-verdict">${analysis.verdict}</div>
                    <div class="diagnostic-why"><strong>Por qué encaja:</strong> ${analysis.whyAppeared}</div>

                    <div class="diagnostic-grid">
                        <div class="diag-col pros">
                            <strong>Requisitos a tu favor:</strong>
                            <ul>
                                ${(analysis.met || []).slice(0, 3).map(m => `<li>${escapeHtml(m)}</li>`).join('')}
                            </ul>
                        </div>
                        <div class="diag-col cons">
                            <strong>Puntos de atención:</strong>
                            <ul>
                                ${(analysis.unmet || ["Sin brechas críticas"]).slice(0, 3).map(u => `<li>${escapeHtml(u)}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- Footer / Action Bar -->
                <div class="job-card-footer">
                    <div class="action-buttons-group">
                        <button class="btn-tool" onclick="ModalsController.openAnalysis('${job.id}')" title="Ver análisis de requisitos">
                            Ver Análisis
                        </button>
                        <button class="btn-tool" onclick="ModalsController.openCoverLetter('${job.id}')" title="Generar carta de presentación">
                            Generar Carta
                        </button>
                        <button class="btn-tool" onclick="ModalsController.openOptimizeCv('${job.id}')" title="Consejos para adaptar tu CV">
                            Adaptar CV
                        </button>
                        <button class="btn-tool btn-discard" onclick="App.dismissJob('${job.id}')" title="Ocultar de mis recomendaciones">
                            No me interesa
                        </button>
                    </div>

                    <div class="primary-actions-group">
                        ${job.applyUrl ? `
                            <a href="${job.applyUrl}" target="_blank" rel="noopener noreferrer" class="btn-apply-cta" onclick="App.markAsApplied('${job.id}')">
                                Postular en Portal Oficial ↗
                            </a>
                        ` : ''}

                        <button class="btn-status-toggle ${isApplied ? 'applied' : ''}" onclick="${isApplied ? `App.removeApplication('${job.id}')` : `App.markAsApplied('${job.id}')`}">
                            ${isApplied ? `✓ Postulado (${applications[job.id].status})` : '+ Registrar Postulación'}
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
