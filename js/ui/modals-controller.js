/**
 * ModalsController — Gestor de Modales y Auditoría Interactiva
 */

class ModalsController {
    static openModal(modalId) {
        const m = document.getElementById(modalId);
        if (m) m.style.display = 'flex';
    }

    static closeModal(modalId) {
        const m = document.getElementById(modalId);
        if (m) m.style.display = 'none';
    }

    static openPasteModal() {
        this.openModal('pasteCvModal');
    }

    static openAuditModal() {
        const allJobs = App.getAllJobs();
        const profile = App.getProfile();
        const report = TransparencyTracker.getAuditReport(allJobs, profile);

        const content = document.getElementById('auditModalContent');
        if (!content) return;

        // Fuentes pills
        const sourcePillsHtml = Object.entries(report.sourceBreakdown).map(([name, data]) => `
            <div class="audit-source-pill">
                <span>${escapeHtml(name)}:</span>
                <strong>${data.total}</strong>
                <span style="color: #34D399; font-size: 11px;">(${data.approved} en feed)</span>
            </div>
        `).join('');

        content.innerHTML = `
            <!-- KPI Grid -->
            <div class="audit-kpi-grid">
                <div class="audit-kpi-card">
                    <div class="audit-kpi-num">${report.totalJobs}</div>
                    <div class="audit-kpi-label">Vacantes en Base</div>
                </div>
                <div class="audit-kpi-card">
                    <div class="audit-kpi-num kpi-green">${report.approvedCount}</div>
                    <div class="audit-kpi-label">Aptas para tu Perfil</div>
                </div>
                <div class="audit-kpi-card">
                    <div class="audit-kpi-num kpi-rose">${report.discardedCount}</div>
                    <div class="audit-kpi-label">Descartadas por Incompatibilidad</div>
                </div>
                <div class="audit-kpi-card">
                    <div class="audit-kpi-num kpi-blue">${Object.keys(report.sourceBreakdown).length}</div>
                    <div class="audit-kpi-label">Fuentes Activas</div>
                </div>
            </div>

            <div style="font-size: 12px; font-weight: 700; color: #FFF; margin-bottom: 6px;">
                Desglose por Fuente Laboral:
            </div>
            <div class="audit-sources-cloud">
                ${sourcePillsHtml}
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; margin-bottom: 8px;">
                <div style="font-size: 12.5px; font-weight: 700; color: #FFF;">
                    Registro de Decisiones del Motor:
                </div>
                <div style="display: flex; gap: 8px;">
                    <select id="auditFilterStatus" class="sort-select" style="font-size: 11.5px;" onchange="ModalsController.filterAuditTable()">
                        <option value="all">Todas las decisiones (${report.totalJobs})</option>
                        <option value="descartadas" selected>Solo Descartadas (${report.discardedCount})</option>
                        <option value="aprobadas">Solo Aprobadas (${report.approvedCount})</option>
                    </select>
                </div>
            </div>

            <div class="audit-table-wrapper">
                <table class="audit-table">
                    <thead>
                        <tr>
                            <th>Vacante / Empresa</th>
                            <th>Fuente</th>
                            <th>Estado</th>
                            <th>Score</th>
                            <th>Motivo del Reclutador</th>
                        </tr>
                    </thead>
                    <tbody id="auditTableBody">
                        <!-- Injected via filterAuditTable -->
                    </tbody>
                </table>
            </div>
        `;

        // Cache audit records on window for filtering
        window.__currentAuditRecords = report.allRecords;
        this.filterAuditTable();
        this.openModal('auditModal');
    }

    static filterAuditTable() {
        const records = window.__currentAuditRecords || [];
        const filterStatus = document.getElementById('auditFilterStatus')?.value || "descartadas";
        const tbody = document.getElementById('auditTableBody');
        if (!tbody) return;

        const filtered = records.filter(r => {
            if (filterStatus === "descartadas") return r.status === "Descartada";
            if (filterStatus === "aprobadas") return r.status === "Aprobada";
            return true;
        });

        tbody.innerHTML = filtered.map(r => `
            <tr>
                <td>
                    <strong style="color: #FFF;">${escapeHtml(r.title)}</strong><br>
                    <span style="color: var(--text-muted); font-size: 11px;">${escapeHtml(r.company)}</span>
                </td>
                <td style="color: var(--primary); font-size: 11.5px;">${escapeHtml(r.source)}</td>
                <td>
                    <span class="${r.status === 'Aprobada' ? 'badge-status-approved' : 'badge-status-discarded'}">
                        ${r.status}
                    </span>
                </td>
                <td style="font-weight: 700;">${r.score}%</td>
                <td style="color: ${r.status === 'Aprobada' ? '#A7F3D0' : '#FED7AA'}; font-size: 11.5px; line-height: 1.4;">
                    ${escapeHtml(r.reason)}
                </td>
            </tr>
        `).join('');
    }

    static closeAuditModal() {
        this.closeModal('auditModal');
    }

    static openAnalysis(jobId) {
        const job = App.getJobById(jobId);
        if (!job) return;

        const profile = App.getProfile();
        const analysis = MatchingEngine.evaluate(job, profile);
        const content = document.getElementById('analysisModalContent');
        if (!content) return;

        content.innerHTML = `
            <div style="background: var(--surface-card); padding: 14px; border-radius: 8px; border: 1px solid var(--border);">
                <h4 style="color: #FFF; font-size: 16px;">${escapeHtml(job.title)}</h4>
                <p style="color: var(--primary); font-size: 13px; font-weight: 600;">${escapeHtml(job.company)} • ${escapeHtml(job.location)}</p>
            </div>

            <div style="background: rgba(56, 189, 248, 0.08); border-left: 3px solid var(--primary); padding: 12px; border-radius: 0 8px 8px 0; font-size: 13px; color: #E2E8F0;">
                <strong>Diagnóstico:</strong> ${analysis.verdict}
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); padding: 12px; border-radius: 8px;">
                    <strong style="color: #34D399; font-size: 12.5px;">Requisitos a tu favor:</strong>
                    <ul style="margin-top: 6px; font-size: 12px; padding-left: 16px; color: #CBD5E1;">
                        ${(analysis.met || []).map(m => `<li>${escapeHtml(m)}</li>`).join('')}
                    </ul>
                </div>
                <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); padding: 12px; border-radius: 8px;">
                    <strong style="color: #FCD34D; font-size: 12.5px;">Puntos a compensar:</strong>
                    <ul style="margin-top: 6px; font-size: 12px; padding-left: 16px; color: #CBD5E1;">
                        ${(analysis.unmet || ["Sin brechas críticas"]).map(u => `<li>${escapeHtml(u)}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;

        this.openModal('analysisModal');
    }

    static openCoverLetter(jobId) {
        const job = App.getJobById(jobId);
        if (!job) return;

        const profile = App.getProfile();
        const candidateName = profile?.name || "Candidato";
        const content = document.getElementById('coverLetterContent');
        if (!content) return;

        content.innerHTML = `
            <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px;">
                Esta carta fue redactada resaltando tus competencias frente a los requisitos de <strong>${escapeHtml(job.company)}</strong>:
            </p>
            <div style="background: var(--surface-card); border: 1px solid var(--border); border-radius: 8px; padding: 16px; font-size: 13px; line-height: 1.6; color: #E2E8F0; white-space: pre-line;" id="letterTextContent">
Estimado equipo de selección de ${job.company},

Me pongo en contacto con ustedes con motivo de la búsqueda para la posición de ${job.title}.

A partir de mi formación y trayectoria, he desarrollado sólidas competencias en ${(profile?.skills || ['gestión', 'análisis']).slice(0, 4).join(', ')}, lo que me permite adaptarme con rapidez a las responsabilidades operativas y analíticas que este rol requiere.

Me resulta de especial interés sumarme a ${job.company} para aportar compromiso, proactividad y rigor profesional.

Quedo a su entera disposición para ampliar cualquier detalle sobre mi perfil.

Atentamente,
${candidateName}
            </div>
            <div style="margin-top: 14px; text-align: right;">
                <button class="btn btn-primary btn-sm" onclick="navigator.clipboard.writeText(document.getElementById('letterTextContent').innerText); alert('Carta copiada al portapapeles.');">
                    Copiar al Portapapeles
                </button>
            </div>
        `;

        this.openModal('coverLetterModal');
    }

    static openOptimizeCv(jobId) {
        const job = App.getJobById(jobId);
        if (!job) return;

        const content = document.getElementById('optimizeCvContent');
        if (!content) return;

        content.innerHTML = `
            <div style="font-size: 13px; color: #E2E8F0; line-height: 1.6;">
                <h4 style="color: #FFF; font-size: 15px; margin-bottom: 10px;">Recomendaciones para postular a ${escapeHtml(job.title)}:</h4>
                <ul style="padding-left: 18px; display: flex; flex-direction: column; gap: 8px;">
                    <li><strong>Encabezado claro:</strong> Asegurate de que el título bajo tu nombre mencione áreas afines al puesto.</li>
                    <li><strong>Herramientas prioritarias:</strong> Ubicá en primer plano conocimientos como Excel, SQL o herramientas de gestión que la empresa valora.</li>
                    <li><strong>Resultados concretos:</strong> Si participaste en proyectos o pasantías, describí qué lograste en lugar de solo listar tareas.</li>
                </ul>
            </div>
        `;

        this.openModal('optimizeCvModal');
    }
}
