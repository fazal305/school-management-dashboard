function getFeeStatusBadgeClass(status) {
    if (status === "Paid") return "badge-paid";
    if (status === "Partial") return "badge-partial";
    if (status === "Unpaid") return "badge-unpaid";
    return "badge-overdue";
}

function getStudentClassForFee(workspace, studentId) {
    const student = workspace.students.find((item) => item.id === studentId);
    return student ? `${student.classGrade}-${student.section}` : "Unknown";
}

function getFilteredFeeRecords() {
    const workspace = loadWorkspace();
    const query = $("#feeSearch").val().toLowerCase().trim();
    const classGrade = $("#filterClass").val();
    const status = $("#filterStatus").val();
    const month = $("#filterMonth").val().toLowerCase().trim();

    return workspace.feeRecords.filter((record) => {
        const student = workspace.students.find((item) => item.id === record.studentId);
        const studentName = getStudentName(workspace, record.studentId);
        const searchable = [
            studentName,
            record.month,
            record.status,
            record.dueDate,
            record.paidDate
        ].join(" ").toLowerCase();

        return (!query || searchable.includes(query)) &&
            (!classGrade || (student && student.classGrade === classGrade)) &&
            (!status || record.status === status) &&
            (!month || record.month.toLowerCase().includes(month));
    });
}

function renderFeeRecords() {
    const workspace = loadWorkspace();
    const records = getFilteredFeeRecords();

    renderFeeSummary();
    loadFeeReceiptOptions();

    if (!records.length) {
        $("#feeRecordsTableMount").html(renderEmptyState("Try changing your fee ledger filters."));
        return;
    }

    $("#feeRecordsTableMount").html(`
    <div class="table-responsive">
      <table class="table table-hover">
        <thead>
          <tr>
            <th>Student</th>
            <th>Class</th>
            <th>Month</th>
            <th>Total</th>
            <th>Paid</th>
            <th>Pending</th>
            <th>Status</th>
            <th>Due</th>
            <th>Paid Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${records.map((record) => {
        const total = calculateFeeTotal(record);
        const pending = Math.max(total - Number(record.amountPaid || 0), 0);

        return `
              <tr>
                <td><strong>${escapeHtml(getStudentName(workspace, record.studentId))}</strong></td>
                <td>${escapeHtml(getStudentClassForFee(workspace, record.studentId))}</td>
                <td><span class="fee-ledger-code">${escapeHtml(record.month)}</span></td>
                <td>${escapeHtml(formatCurrency(total))}</td>
                <td>${escapeHtml(formatCurrency(record.amountPaid))}</td>
                <td>${escapeHtml(formatCurrency(pending))}</td>
                <td><span class="badge ${getFeeStatusBadgeClass(record.status)}">${escapeHtml(record.status)}</span></td>
                <td>${escapeHtml(formatDate(record.dueDate))}</td>
                <td>${escapeHtml(record.paidDate ? formatDate(record.paidDate) : "Not paid")}</td>
                <td>
                  <div class="action-row">
                    <button class="btn btn-sm btn-outline-success" type="button" onclick="renderReceiptPreview('${record.id}')">Receipt</button>
                    <button class="btn btn-sm btn-outline-info" type="button" onclick="editFeeRecord('${record.id}')">Edit</button>
                    <button class="btn btn-sm btn-outline-danger" type="button" onclick="deleteFeeRecord('${record.id}')">Delete</button>
                  </div>
                </td>
              </tr>
            `;
    }).join("")}
        </tbody>
      </table>
    </div>
  `);
}

function createFeeRecord() {
    const workspace = loadWorkspace();
    const feeId = $("#feeId").val();
    const now = new Date().toISOString();

    const feeData = {
        id: feeId || generateId("fee"),
        studentId: $("#studentId").val(),
        month: $("#month").val().trim(),
        tuitionFee: Number($("#tuitionFee").val()),
        transportFee: Number($("#transportFee").val()),
        examFee: Number($("#examFee").val()),
        amountPaid: Number($("#amountPaid").val()),
        status: $("#status").val(),
        dueDate: $("#dueDate").val(),
        paidDate: $("#paidDate").val(),
        createdAt: now,
        updatedAt: now
    };

    if (!feeData.studentId || !feeData.month || !feeData.dueDate) {
        showStatus("Please complete the required fee fields.", "warning");
        return;
    }

    const total = calculateFeeTotal(feeData);

    if (feeData.amountPaid > total) {
        showStatus("Amount paid cannot exceed the total fee.", "danger");
        return;
    }

    if (feeData.status === "Paid" && feeData.amountPaid < total) {
        showStatus("Paid records must have the full amount paid.", "warning");
        return;
    }

    if (feeData.status !== "Paid" && feeData.amountPaid === total) {
        showStatus("Use Paid status when the full amount has been received.", "warning");
        return;
    }

    if (feeId) {
        const index = workspace.feeRecords.findIndex((record) => record.id === feeId);
        if (index === -1) return;

        feeData.createdAt = workspace.feeRecords[index].createdAt;
        workspace.feeRecords[index] = feeData;

        workspace.activityLog.unshift({
            id: generateId("log"),
            module: "Fees",
            action: "Updated fee record",
            detail: `Updated ${feeData.month} fee for ${getStudentName(workspace, feeData.studentId)}`,
            createdAt: now
        });

        showStatus("Fee record updated successfully.", "success");
    } else {
        workspace.feeRecords.push(feeData);

        workspace.activityLog.unshift({
            id: generateId("log"),
            module: "Fees",
            action: "Recorded fee payment",
            detail: `Recorded ${feeData.month} fee for ${getStudentName(workspace, feeData.studentId)}`,
            createdAt: now
        });

        showStatus("Fee record created successfully.", "success");
    }

    workspace.activityLog = workspace.activityLog.slice(0, 50);
    saveWorkspace(workspace);
    resetFeeForm();
    renderFeeRecords();
    renderReceiptPreview($("#receiptFeeId").val());
}

function editFeeRecord(id) {
    const workspace = loadWorkspace();
    const record = workspace.feeRecords.find((item) => item.id === id);

    if (!record) {
        showStatus("Fee record was not found.", "danger");
        return;
    }

    $("#feeFormTitle").text("Edit Fee Record");
    $("#feeId").val(record.id);
    $("#studentId").val(record.studentId);
    $("#month").val(record.month);
    $("#tuitionFee").val(record.tuitionFee);
    $("#transportFee").val(record.transportFee);
    $("#examFee").val(record.examFee);
    $("#amountPaid").val(record.amountPaid);
    $("#status").val(record.status);
    $("#dueDate").val(record.dueDate);
    $("#paidDate").val(record.paidDate);

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteFeeRecord(id) {
    const workspace = loadWorkspace();
    const record = workspace.feeRecords.find((item) => item.id === id);

    if (!record) {
        showStatus("Fee record was not found.", "danger");
        return;
    }

    if (!confirm(`Delete ${record.month} fee record for ${getStudentName(workspace, record.studentId)}?`)) {
        return;
    }

    workspace.feeRecords = workspace.feeRecords.filter((item) => item.id !== id);
    workspace.activityLog.unshift({
        id: generateId("log"),
        module: "Fees",
        action: "Deleted fee record",
        detail: `Deleted ${record.month} fee for ${getStudentName(workspace, record.studentId)}`,
        createdAt: new Date().toISOString()
    });

    workspace.activityLog = workspace.activityLog.slice(0, 50);
    saveWorkspace(workspace);
    renderFeeRecords();
    renderReceiptPreview($("#receiptFeeId").val());
    showStatus("Fee record deleted successfully.", "success");
}

function filterFeeRecords() {
    renderFeeRecords();
}

function renderFeeSummary() {
    const workspace = loadWorkspace();
    const summary = calculateFeeSummary(workspace);

    $("#feeSummary").html(`
    <div class="fee-summary-card"><span>Total Billed</span><strong>${escapeHtml(formatCurrency(summary.totalBilled))}</strong></div>
    <div class="fee-summary-card"><span>Total Collected</span><strong>${escapeHtml(formatCurrency(summary.totalCollected))}</strong></div>
    <div class="fee-summary-card"><span>Total Pending</span><strong>${escapeHtml(formatCurrency(summary.totalPending))}</strong></div>
    <div class="fee-summary-card"><span>Needs Attention</span><strong>${summary.partial + summary.unpaid + summary.overdue}</strong></div>
  `);
}

function renderReceiptPreview(feeId) {
    const workspace = loadWorkspace();
    const record = workspace.feeRecords.find((item) => item.id === feeId) || workspace.feeRecords[0];

    if (!record) {
        $("#receiptPreviewMount").html(renderEmptyState("No fee records available for receipt preview."));
        return;
    }

    $("#receiptFeeId").val(record.id);

    const total = calculateFeeTotal(record);
    const pending = Math.max(total - Number(record.amountPaid || 0), 0);

    $("#receiptPreviewMount").html(`
    <article class="receipt-preview">
      <div class="receipt-header">
        <h3>${escapeHtml(workspace.settings.schoolName)}</h3>
        <p>Receipt for ${escapeHtml(getStudentName(workspace, record.studentId))}</p>
      </div>

      <div class="receipt-body">
        <div class="receipt-line"><span>Receipt ID</span><strong>${escapeHtml(record.id)}</strong></div>
        <div class="receipt-line"><span>Student</span><strong>${escapeHtml(getStudentName(workspace, record.studentId))}</strong></div>
        <div class="receipt-line"><span>Class</span><strong>${escapeHtml(getStudentClassForFee(workspace, record.studentId))}</strong></div>
        <div class="receipt-line"><span>Month</span><strong>${escapeHtml(record.month)}</strong></div>
        <div class="receipt-line"><span>Tuition Fee</span><strong>${escapeHtml(formatCurrency(record.tuitionFee))}</strong></div>
        <div class="receipt-line"><span>Transport Fee</span><strong>${escapeHtml(formatCurrency(record.transportFee))}</strong></div>
        <div class="receipt-line"><span>Exam Fee</span><strong>${escapeHtml(formatCurrency(record.examFee))}</strong></div>
        <div class="receipt-line receipt-total"><span>Total</span><strong>${escapeHtml(formatCurrency(total))}</strong></div>
        <div class="receipt-line"><span>Amount Paid</span><strong>${escapeHtml(formatCurrency(record.amountPaid))}</strong></div>
        <div class="receipt-line"><span>Pending</span><strong>${escapeHtml(formatCurrency(pending))}</strong></div>
        <div class="receipt-line"><span>Status</span><strong><span class="badge ${getFeeStatusBadgeClass(record.status)}">${escapeHtml(record.status)}</span></strong></div>
        <div class="receipt-line"><span>Due Date</span><strong>${escapeHtml(formatDate(record.dueDate))}</strong></div>
        <div class="receipt-line"><span>Paid Date</span><strong>${escapeHtml(record.paidDate ? formatDate(record.paidDate) : "Not paid")}</strong></div>
      </div>
    </article>
  `);
}

function exportFeeLedger() {
    const workspace = loadWorkspace();
    const exportData = {
        exportedAt: new Date().toISOString(),
        schoolName: workspace.settings.schoolName,
        currency: workspace.settings.currency,
        summary: calculateFeeSummary(workspace),
        feeRecords: workspace.feeRecords
    };

    downloadJson("school-fee-ledger.json", exportData);
    showStatus("Fee ledger JSON exported.", "success");
}

function loadFeeOptions() {
    const workspace = loadWorkspace();
    const studentOptions = workspace.students.map((student) => `
    <option value="${student.id}">${escapeHtml(student.firstName)} ${escapeHtml(student.lastName)} · ${escapeHtml(student.classGrade)}-${escapeHtml(student.section)}</option>
  `).join("");

    $("#studentId").html(studentOptions);

    const classes = [...new Set(workspace.students.map((student) => student.classGrade))].sort();

    $("#filterClass").html(`
    <option value="">All classes</option>
    ${classes.map((item) => `<option>${escapeHtml(item)}</option>`).join("")}
  `);
}

function loadFeeReceiptOptions() {
    const workspace = loadWorkspace();

    $("#receiptFeeId").html(workspace.feeRecords.map((record) => `
    <option value="${record.id}">${escapeHtml(getStudentName(workspace, record.studentId))} · ${escapeHtml(record.month)} · ${escapeHtml(record.status)}</option>
  `).join(""));
}

function resetFeeForm() {
    $("#feeFormTitle").text("Record Fee");
    $("#feeForm")[0].reset();
    $("#feeId").val("");
    $("#month").val("July 2026");
    $("#tuitionFee").val(8000);
    $("#transportFee").val(1500);
    $("#examFee").val(500);
    $("#amountPaid").val(0);
    $("#status").val("Unpaid");
    $("#dueDate").val("2026-07-10");
    $("#paidDate").val("");
}

$(document).ready(function () {
    $("#sidebarMount").html(renderSidebar("fee-tracking"));
    applyThemeSettings();
    setActiveNav();

    loadFeeOptions();
    resetFeeForm();
    renderFeeRecords();
    renderReceiptPreview($("#receiptFeeId").val());

    $("#feeForm").on("submit", function (event) {
        event.preventDefault();
        createFeeRecord();
    });

    $("#resetFeeFormBtn").on("click", resetFeeForm);
    $("#exportFeeLedgerBtn").on("click", exportFeeLedger);
    $("#feeSearch, #filterClass, #filterStatus, #filterMonth").on("input change", filterFeeRecords);

    $("#receiptFeeId").on("change", function () {
        renderReceiptPreview($(this).val());
    });
});