/**
 * JobCopilot v3 — Modals Controller
 * Manages Recruiter X-Ray, Cover Letter, CV Optimization and Sources Transparency Radar modals.
 */

class ModalsController {
    static openModal(modalId) {
        const m = document.getElementById(modalId);
        if (m) {
            m.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    static closeModal(modalId) {
        const m = document.getElementById(modalId);
        if (m) {
            m.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    static openAnalysis(jobId) {
        const job = App.getJobById(jobId);
        if (!job) return;

        const profile = App.getProfile();
        const analysis = MatchingEngine.evaluate(job, profile);
        const sourceName = TransparencyTracker.detectSource(job);

        const content = document.getElementById('analysisModalContent');
        if (!content) return;

        content.innerHTML = `
            <div style="background: var(--surface-card); padding: 18px; border-radius: 12px; border: 1px solid var(--border-highlight);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
                    <div>
                        <span class="tag-pill t-domain">${analysis.domain.icon} ${analysis.domain.name}</span>
                        <h3 style="color: #FFF; font-size: 18px; margin-top: 8px;">${job.title}</h3>
                        <p style="color: var(--primary); font-size: 13.5px; font-weight: 600; margin-top: 2px;">
                            ${job.company} • ${job.location} • ${job.hoursLabel || job.hours}
                        </p>
                        <p style="color: var(--text-subtle); font-size: 11.5px; margin-top: 2px;">Fuente validada: ${sourceName}</p>
                    </div>
                    <div style="text-align: right; flex-shrink: 0;">
                        <span style="font-size: 26px; font-weight: 900; color: ${analysis.score >= 80 ? '#34D399' : '#FCD34D'};">
                            ${analysis.score}%
                        </span>
                        <div style="font-size: 11px; color: var(--text-muted); font-weight: 600;">Match de Reclutador</div>
                    </div>
                </div>
            </div>

            <!-- Por qué te conviene -->
            <div style="background: rgba(56, 189, 248, 0.08); border-left: 3px solid var(--primary); padding: 12px 14px; border-radius: 0 8px 8px 0; font-size: 13px; color: #E2E8F0; line-height: 1.5;">
                💡 <strong>Por qué te conviene:</strong> ${analysis.whyAppeared}
            </div>

            <!-- Comparativa de Requisitos y Brechas -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; font-size: 12.5px;">
                <div style="background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.25); padding: 14px; border-radius: 10px;">
                    <strong style="color: #34D399; font-size: 13px;">✔ Requisitos a tu favor:</strong>
                    <ul style="margin-top: 8px; padding-left: 18px; line-height: 1.6;">
                        ${(analysis.met || []).map(m => `<li>${m}</li>`).join('')}
                    </ul>
                    ${analysis.boosters && analysis.boosters.length > 0 ? `
                        <div style="margin-top: 8px; font-size: 11.5px; color: #34D399; border-top: 1px solid rgba(16,185,129,0.2); padding-top: 6px;">
                            ⚡ <strong>Ventajas competitivas:</strong> ${analysis.boosters.join(' • ')}
                        </div>
                    ` : ''}
                </div>

                <div style="background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.25); padding: 14px; border-radius: 10px;">
                    <strong style="color: #FCD34D; font-size: 13px;">⚠️ Puntos a compensar / Brechas:</strong>
                    <ul style="margin-top: 8px; padding-left: 18px; line-height: 1.6;">
                        ${(analysis.unmet && analysis.unmet.length ? analysis.unmet : ["Sin brechas críticas detectadas"]).map(u => `<li>${u}</li>`).join('')}
                    </ul>
                    ${analysis.penalties && analysis.penalties.length > 0 ? `
                        <div style="margin-top: 8px; font-size: 11.5px; color: #FB923C; border-top: 1px solid rgba(245,158,11,0.2); padding-top: 6px;">
                            ⚠️ <strong>Recomendación:</strong> Destacá en tu carta tu rápida curva de aprendizaje.
                        </div>
                    ` : ''}
                </div>
            </div>

            <!-- Veredicto Final -->
            <div style="background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.35); padding: 16px; border-radius: 10px; font-size: 13px;">
                <strong style="color: #FFF; display: flex; align-items: center; gap: 8px;">
                    🎯 Veredicto del Reclutador:
                </strong>
                <p style="margin-top: 6px; color: #E2E8F0; line-height: 1.5;">
                    ${analysis.verdict}
                </p>
                <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 12px; color: var(--text-subtle); display: flex; justify-content: space-between;">
                    <span>Sueldo estimado de referencia: <strong style="color: #FFF;">${job.salaryGuide || "A convenir"}</strong></span>
                    <a href="${job.applyUrl}" target="_blank" rel="noopener noreferrer" style="color: var(--primary); text-decoration: underline; font-weight: 600;">
                        Ver publicación original &rarr;
                    </a>
                </div>
            </div>
        `;
        this.openModal('modalAnalysis');
    }

    static openCoverLetter(jobId) {
        const job = App.getJobById(jobId);
        if (!job) return;

        const profile = App.getProfile();
        const candidateName = profile ? profile.name : "Postulante";
        const career = profile ? profile.edu : "Estudiante Universitario";
        const skillsText = profile ? profile.skills.slice(0, 3).join(", ") : "análisis de datos y gestión";

        const letter = `Estimado equipo de Selección de ${job.company},

Me pongo en contacto con ustedes con gran interés en presentar mi postulación a la posición de ${job.title}.

Actualmente soy estudiante de ${career}. A lo largo de mi formación he desarrollado sólidas competencias prácticas en ${skillsText}, orientadas a la optimización de procesos y la toma de decisiones basada en datos.

El perfil que buscan para ${job.title} representa una excelente oportunidad para aportar mi capacidad analítica, proactividad y compromiso en el cumplimiento de los objetivos del área. Cuento con disponibilidad para integrarme en el régimen horario requerido (${job.hoursLabel || job.hours}).

Agradezco de antemano su tiempo y consideración, quedando a su total disposición para profundizar sobre mi perfil en una entrevista.

Atentamente,
${candidateName}
Montevideo, Uruguay`;

        const textarea = document.getElementById('coverLetterTextarea');
        if (textarea) textarea.value = letter;
        this.openModal('modalCoverLetter');
    }

    static openOptimizeCv(jobId) {
        const job = App.getJobById(jobId);
        if (!job) return;

        const profile = App.getProfile();
        const analysis = MatchingEngine.evaluate(job, profile);
        const container = document.getElementById('optimizeCvContent');
        if (!container) return;

        container.innerHTML = `
            <div style="background: var(--surface-card); padding: 14px; border-radius: 10px; border: 1px solid var(--border-highlight); margin-bottom: 12px;">
                <h4 style="color: #FFF; font-size: 15px;">Adaptación Estratégica para: ${job.title} (${job.company})</h4>
                <p style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Optimizá las palabras clave en tu CV antes de enviar la postulación.</p>
            </div>

            <div style="display: flex; flex-direction: column; gap: 10px; font-size: 12.5px;">
                <div style="background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.25); padding: 12px; border-radius: 8px;">
                    <strong style="color: var(--primary);">1. Palabras clave a incluir en tu experiencia:</strong>
                    <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;">
                        ${(analysis.domain.criticalSkills || []).slice(0, 5).map(s => `<span class="chip-skill">${s}</span>`).join('')}
                    </div>
                </div>

                <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); padding: 12px; border-radius: 8px;">
                    <strong style="color: #34D399;">2. Enfoque recomendado para el extracto del CV:</strong>
                    <p style="margin-top: 6px; color: #CBD5E1; line-height: 1.5;">
                        "Estudiante universitario con foco en ${analysis.domain.name}. Experiencia práctica en ${(profile?.skills || []).slice(0, 3).join(', ')}. Interés en aplicar metodologías ágiles y análisis cuantitativo en entornos corporativos."
                    </p>
                </div>
            </div>
        `;
        this.openModal('modalOptimizeCv');
    }

    // Modal de Transparencia de Fuentes & Rastreo
    static openTransparencyModal() {
        const report = TransparencyTracker.generateReport(App.getAllJobs(), App.getProfile());
        const container = document.getElementById('transparencyModalContent');
        if (!container) return;

        let sourcesHtml = '';
        for (const [sourceName, stats] of Object.entries(report.sourceStats)) {
            sourcesHtml += `
                <div style="display: flex; justify-content: space-between; align-items: center; background: var(--surface-card); padding: 10px 14px; border-radius: 8px; border: 1px solid var(--border);">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="color: var(--accent-green); font-size: 12px;">●</span>
                        <strong style="font-size: 13px; color: #FFF;">${sourceName}</strong>
                    </div>
                    <div style="font-size: 12px; display: flex; gap: 14px;">
                        <span style="color: var(--text-muted);">Consultadas: <strong>${stats.found}</strong></span>
                        <span style="color: var(--accent-green);">Aprobadas: <strong>${stats.approved}</strong></span>
                        <span style="color: #F87171;">Descartadas: <strong>${stats.discarded}</strong></span>
                    </div>
                </div>
            `;
        }

        let discardsHtml = '';
        report.discardAuditLog.slice(0, 15).forEach(item => {
            discardsHtml += `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 12px;">
                    <td style="padding: 8px; color: #FFF;">${item.title}</td>
                    <td style="padding: 8px; color: var(--text-muted);">${item.company}</td>
                    <td style="padding: 8px; color: var(--primary);">${item.source}</td>
                    <td style="padding: 8px; color: #FCA5A5;">${item.reason}</td>
                </tr>
            `;
        });

        container.innerHTML = `
            <!-- Resumen Global -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px;">
                <div style="background: var(--surface-card); border: 1px solid var(--border-highlight); padding: 14px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 22px; font-weight: 800; color: #FFF;">${report.totalFound}</div>
                    <div style="font-size: 11px; color: var(--text-muted);">Vacantes Rastreadas en Uruguay</div>
                </div>
                <div style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); padding: 14px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 22px; font-weight: 800; color: #34D399;">${report.totalApproved}</div>
                    <div style="font-size: 11px; color: #A7F3D0;">Compatibles con tu Perfil</div>
                </div>
                <div style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); padding: 14px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 22px; font-weight: 800; color: #F87171;">${report.totalDiscarded}</div>
                    <div style="font-size: 11px; color: #FCA5A5;">Descartadas por Compuertas</div>
                </div>
            </div>

            <!-- Fuentes Consultadas -->
            <h4 style="font-size: 13px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px; letter-spacing: 0.5px;">Portales y Fuentes Consultadas</h4>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 18px;">
                ${sourcesHtml}
            </div>

            <!-- Auditoría de Descartes -->
            <h4 style="font-size: 13px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px; letter-spacing: 0.5px;">Registro de Descartes Automáticos (Por qué no aparecen)</h4>
            <div style="max-height: 220px; overflow-y: auto; background: rgba(7, 11, 18, 0.8); border-radius: 8px; border: 1px solid var(--border);">
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead>
                        <tr style="background: rgba(255,255,255,0.03); color: var(--text-subtle); font-size: 11px; border-bottom: 1px solid var(--border);">
                            <th style="padding: 8px;">Puesto</th>
                            <th style="padding: 8px;">Empresa</th>
                            <th style="padding: 8px;">Portal</th>
                            <th style="padding: 8px;">Motivo del Descarte</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${discardsHtml}
                    </tbody>
                </table>
            </div>
        `;
        this.openModal('modalTransparency');
    }
}
