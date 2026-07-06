function getStudentClassLabel(workspace, studentId) {
    const student = workspace.students.find((item) => item.id === studentId);
    return student ? `${student.classGrade}-${student.section}` : "Unknown";
}

function getFilteredGrades() {
    const workspace = loadWorkspace();
    const query = $("#gradeSearch").val().toLowerCase().trim();
    const classGrade = $("#filterClass").val();
    const subject = $("#filterSubject").val().toLowerCase().trim();
    const examType = $("#filterExamType").val();

    return workspace.grades.filter((record) => {
        const student = workspace.students.find((item) => item.id === record.studentId);
        const studentName = getStudentName(workspace, record.studentId);
        const searchable = [
            studentName,
            record.subject,
            record.examType,
            record.grade,
            record.term
        ].join(" ").toLowerCase();

        return (!query || searchable.includes(query)) &&
            (!classGrade || (student && student.classGrade === classGrade)) &&
            (!subject || record.subject.toLowerCase().includes(subject)) &&
            (!examType || record.examType === examType);
    });
}

function renderGrades() {
    const workspace = loadWorkspace();
    const records = getFilteredGrades();

    renderGradeStats();

    if (!records.length) {
        $("#gradesTableMount").html(renderEmptyState("Try changing your grade filters."));
        return;
    }

    $("#gradesTableMount").html(`
    <div class="table-responsive">
      <table class="table table-hover">
        <thead>
          <tr>
            <th>Student</th>
            <th>Class</th>
            <th>Subject</th>
            <th>Exam</th>
            <th>Marks</th>
            <th>Percentage</th>
            <th>Grade</th>
            <th>Term</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${records.map((record) => {
        const percentage = Math.round((Number(record.marksObtained) / Number(record.totalMarks)) * 100);

        return `
              <tr>
                <td><strong>${escapeHtml(getStudentName(workspace, record.studentId))}</strong></td>
                <td>${escapeHtml(getStudentClassLabel(workspace, record.studentId))}</td>
                <td>${escapeHtml(record.subject)}</td>
                <td>${escapeHtml(record.examType)}</td>
                <td>${escapeHtml(record.marksObtained)} / ${escapeHtml(record.totalMarks)}</td>
                <td>${percentage}%</td>
                <td><span class="grade-pill">${escapeHtml(record.grade)}</span></td>
                <td>${escapeHtml(record.term)}</td>
                <td>
                  <div class="action-row">
                    <button class="btn btn-sm btn-outline-info" type="button" onclick="editGradeEntry('${record.id}')">Edit</button>
                    <button class="btn btn-sm btn-outline-danger" type="button" onclick="deleteGradeEntry('${record.id}')">Delete</button>
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

function createGradeEntry() {
    const workspace = loadWorkspace();
    const gradeId = $("#gradeId").val();
    const marksObtained = Number($("#marksObtained").val());
    const totalMarks = Number($("#totalMarks").val());
    const now = new Date().toISOString();

    if (marksObtained > totalMarks) {
        showStatus("Marks obtained cannot exceed total marks.", "danger");
        return;
    }

    const gradeData = {
        id: gradeId || generateId("grade"),
        studentId: $("#studentId").val(),
        subject: $("#subject").val().trim(),
        examType: $("#examType").val(),
        marksObtained,
        totalMarks,
        grade: calculateGradeLetter(marksObtained, totalMarks),
        term: $("#term").val().trim(),
        createdAt: now,
        updatedAt: now
    };

    if (!gradeData.studentId || !gradeData.subject || !gradeData.term) {
        showStatus("Please complete the required grade fields.", "warning");
        return;
    }

    if (gradeId) {
        const index = workspace.grades.findIndex((item) => item.id === gradeId);
        if (index === -1) return;

        gradeData.createdAt = workspace.grades[index].createdAt;
        workspace.grades[index] = gradeData;

        workspace.activityLog.unshift({
            id: generateId("log"),
            module: "Grades",
            action: "Updated grade",
            detail: `Updated ${gradeData.subject} grade for ${getStudentName(workspace, gradeData.studentId)}`,
            createdAt: now
        });

        showStatus("Grade updated successfully.", "success");
    } else {
        workspace.grades.push(gradeData);

        workspace.activityLog.unshift({
            id: generateId("log"),
            module: "Grades",
            action: "Recorded grade",
            detail: `Recorded ${gradeData.subject} ${gradeData.examType} for ${getStudentName(workspace, gradeData.studentId)}`,
            createdAt: now
        });

        showStatus("Grade recorded successfully.", "success");
    }

    workspace.activityLog = workspace.activityLog.slice(0, 50);
    saveWorkspace(workspace);
    resetGradeForm();
    renderGrades();
    renderReportCardPreview($("#reportStudentId").val());
}

function editGradeEntry(id) {
    const workspace = loadWorkspace();
    const record = workspace.grades.find((item) => item.id === id);

    if (!record) {
        showStatus("Grade record was not found.", "danger");
        return;
    }

    $("#gradeFormTitle").text("Edit Grade");
    $("#gradeId").val(record.id);
    $("#studentId").val(record.studentId);
    $("#subject").val(record.subject);
    $("#examType").val(record.examType);
    $("#marksObtained").val(record.marksObtained);
    $("#totalMarks").val(record.totalMarks);
    $("#term").val(record.term);

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteGradeEntry(id) {
    const workspace = loadWorkspace();
    const record = workspace.grades.find((item) => item.id === id);

    if (!record) {
        showStatus("Grade record was not found.", "danger");
        return;
    }

    if (!confirm(`Delete ${record.subject} grade for ${getStudentName(workspace, record.studentId)}?`)) {
        return;
    }

    workspace.grades = workspace.grades.filter((item) => item.id !== id);
    workspace.activityLog.unshift({
        id: generateId("log"),
        module: "Grades",
        action: "Deleted grade",
        detail: `Deleted ${record.subject} grade for ${getStudentName(workspace, record.studentId)}`,
        createdAt: new Date().toISOString()
    });

    workspace.activityLog = workspace.activityLog.slice(0, 50);
    saveWorkspace(workspace);
    renderGrades();
    renderReportCardPreview($("#reportStudentId").val());
    showStatus("Grade deleted successfully.", "success");
}

function filterGrades() {
    renderGrades();
}

function renderReportCardPreview(studentId) {
    const workspace = loadWorkspace();
    const student = workspace.students.find((item) => item.id === studentId);

    if (!student) {
        $("#reportCardMount").html(renderEmptyState("Select a student to preview a report card."));
        return;
    }

    const records = workspace.grades.filter((record) => record.studentId === studentId);

    if (!records.length) {
        $("#reportCardMount").html(renderEmptyState("This student has no grade records yet."));
        return;
    }

    const totalObtained = records.reduce((sum, record) => sum + Number(record.marksObtained), 0);
    const totalPossible = records.reduce((sum, record) => sum + Number(record.totalMarks), 0);
    const percentage = Math.round((totalObtained / totalPossible) * 100);
    const finalGrade = calculateGradeLetter(totalObtained, totalPossible);

    $("#reportCardMount").html(`
    <article class="report-card">
      <div class="report-card-header">
        <h3>${escapeHtml(student.firstName)} ${escapeHtml(student.lastName)}</h3>
        <p>${escapeHtml(student.rollNumber)} · Class ${escapeHtml(student.classGrade)}-${escapeHtml(student.section)}</p>
      </div>

      <div class="report-card-body">
        <div class="report-summary-grid">
          <div class="report-summary-item"><span>Total Marks</span><strong>${totalObtained} / ${totalPossible}</strong></div>
          <div class="report-summary-item"><span>Percentage</span><strong>${percentage}%</strong></div>
          <div class="report-summary-item"><span>Final Grade</span><strong>${finalGrade}</strong></div>
        </div>

        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Exam</th>
                <th>Marks</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              ${records.map((record) => `
                <tr>
                  <td>${escapeHtml(record.subject)}</td>
                  <td>${escapeHtml(record.examType)}</td>
                  <td>${escapeHtml(record.marksObtained)} / ${escapeHtml(record.totalMarks)}</td>
                  <td><span class="grade-pill">${escapeHtml(record.grade)}</span></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </article>
  `);
}

function renderGradeStats() {
    const workspace = loadWorkspace();
    const records = workspace.grades;
    const average = records.length
        ? Math.round(records.reduce((sum, record) => sum + ((Number(record.marksObtained) / Number(record.totalMarks)) * 100), 0) / records.length)
        : 0;

    const topRecord = [...records].sort((a, b) => {
        return (Number(b.marksObtained) / Number(b.totalMarks)) - (Number(a.marksObtained) / Number(a.totalMarks));
    })[0];

    $("#gradeStats").html(`
    <div class="grade-stat-card"><span>Total Grade Records</span><strong>${records.length}</strong></div>
    <div class="grade-stat-card"><span>Overall Average</span><strong>${average}%</strong></div>
    <div class="grade-stat-card"><span>Top Scorer</span><strong>${topRecord ? escapeHtml(getStudentName(workspace, topRecord.studentId)) : "N/A"}</strong></div>
  `);
}

function loadGradeOptions() {
    const workspace = loadWorkspace();
    const studentOptions = workspace.students.map((student) => `
    <option value="${student.id}">${escapeHtml(student.firstName)} ${escapeHtml(student.lastName)} · ${escapeHtml(student.classGrade)}-${escapeHtml(student.section)}</option>
  `).join("");

    $("#studentId").html(studentOptions);
    $("#reportStudentId").html(studentOptions);

    const classes = [...new Set(workspace.students.map((student) => student.classGrade))].sort();
    $("#filterClass").html(`
    <option value="">All classes</option>
    ${classes.map((item) => `<option>${escapeHtml(item)}</option>`).join("")}
  `);
}

function resetGradeForm() {
    const workspace = loadWorkspace();

    $("#gradeFormTitle").text("Record Grade");
    $("#gradeForm")[0].reset();
    $("#gradeId").val("");
    $("#term").val(workspace.settings.academicSession);
    $("#totalMarks").val(100);
}

$(document).ready(function () {
    $("#sidebarMount").html(renderSidebar("grades"));
    applyThemeSettings();
    setActiveNav();

    loadGradeOptions();
    resetGradeForm();
    renderGrades();
    renderReportCardPreview($("#reportStudentId").val());

    $("#gradeForm").on("submit", function (event) {
        event.preventDefault();
        createGradeEntry();
    });

    $("#resetGradeFormBtn").on("click", resetGradeForm);
    $("#gradeSearch, #filterClass, #filterSubject, #filterExamType").on("input change", filterGrades);

    $("#reportStudentId").on("change", function () {
        renderReportCardPreview($(this).val());
    });
});