const attendanceClasses = ["8", "9", "10"];
const attendanceSections = ["A", "B"];
const attendanceStatuses = ["Present", "Absent", "Late", "Leave"];

function getAttendanceBadgeClass(status) {
    if (status === "Present") return "badge-present";
    if (status === "Absent") return "badge-absent";
    if (status === "Late") return "badge-late";
    return "badge-leave";
}

function renderAttendanceMarkList() {
    const workspace = loadWorkspace();
    const classGrade = $("#markClass").val();
    const section = $("#markSection").val();

    const students = workspace.students.filter((student) => {
        return student.status === "Active" &&
            student.classGrade === classGrade &&
            student.section === section;
    });

    if (!students.length) {
        $("#attendanceMarkMount").html(renderEmptyState("No active students found for this class and section."));
        return;
    }

    $("#attendanceMarkMount").html(students.map((student) => `
    <div class="attendance-student-row" data-student-id="${student.id}">
      <div>
        <strong>${escapeHtml(student.firstName)} ${escapeHtml(student.lastName)}</strong>
        <div class="attendance-student-meta">${escapeHtml(student.rollNumber)} · Class ${escapeHtml(student.classGrade)}-${escapeHtml(student.section)}</div>
      </div>

      ${attendanceStatuses.map((status) => `
        <label class="attendance-radio">
          <input type="radio" name="attendance-${student.id}" value="${status}" ${status === "Present" ? "checked" : ""}>
          <span>${status}</span>
        </label>
      `).join("")}
    </div>
  `).join(""));
}

function getFilteredAttendance() {
    const workspace = loadWorkspace();
    const query = $("#attendanceSearch").val().toLowerCase().trim();
    const date = $("#filterDate").val();
    const classGrade = $("#filterClass").val();
    const status = $("#filterStatus").val();

    return workspace.attendance.filter((record) => {
        const studentName = getStudentName(workspace, record.studentId);
        const searchable = [
            studentName,
            record.date,
            record.classGrade,
            record.section,
            record.status,
            record.notes
        ].join(" ").toLowerCase();

        return (!query || searchable.includes(query)) &&
            (!date || record.date === date) &&
            (!classGrade || record.classGrade === classGrade) &&
            (!status || record.status === status);
    }).sort((a, b) => b.date.localeCompare(a.date));
}

function renderAttendance() {
    const workspace = loadWorkspace();
    const records = getFilteredAttendance();

    renderAttendanceStats();

    if (!records.length) {
        $("#attendanceTableMount").html(renderEmptyState("Try changing your attendance filters."));
        return;
    }

    $("#attendanceTableMount").html(`
    <div class="table-responsive">
      <table class="table table-hover">
        <thead>
          <tr>
            <th>Date</th>
            <th>Student</th>
            <th>Class</th>
            <th>Status</th>
            <th>Notes</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${records.map((record) => `
            <tr>
              <td>${escapeHtml(formatDate(record.date))}</td>
              <td><strong>${escapeHtml(getStudentName(workspace, record.studentId))}</strong></td>
              <td>${escapeHtml(record.classGrade)}-${escapeHtml(record.section)}</td>
              <td><span class="badge ${getAttendanceBadgeClass(record.status)}">${escapeHtml(record.status)}</span></td>
              <td>${escapeHtml(record.notes || "—")}</td>
              <td>${escapeHtml(new Date(record.createdAt).toLocaleString())}</td>
              <td>
                <div class="action-row">
                  <button class="btn btn-sm btn-outline-info" type="button" onclick="editAttendance('${record.id}')">Cycle</button>
                  <button class="btn btn-sm btn-outline-danger" type="button" onclick="deleteAttendance('${record.id}')">Delete</button>
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `);
}

function markAttendance() {
    const workspace = loadWorkspace();
    const date = $("#markDate").val();
    const notes = $("#markNotes").val().trim();
    const rows = $(".attendance-student-row");

    if (!date) {
        showStatus("Please select an attendance date.", "warning");
        return;
    }

    if (!rows.length) {
        showStatus("No students are available to mark.", "warning");
        return;
    }

    let created = 0;
    let skipped = 0;

    rows.each(function () {
        const studentId = $(this).data("student-id");
        const student = workspace.students.find((item) => item.id === studentId);
        const status = $(`input[name="attendance-${studentId}"]:checked`).val();

        if (!student) return;

        if (preventDuplicateAttendance(studentId, date)) {
            skipped += 1;
            return;
        }

        workspace.attendance.push({
            id: generateId("attendance"),
            studentId,
            date,
            status,
            classGrade: student.classGrade,
            section: student.section,
            notes,
            createdAt: new Date().toISOString()
        });

        created += 1;
    });

    workspace.activityLog.unshift({
        id: generateId("log"),
        module: "Attendance",
        action: "Marked attendance",
        detail: `Created ${created} attendance records for ${date}; skipped ${skipped} duplicate records.`,
        createdAt: new Date().toISOString()
    });

    workspace.activityLog = workspace.activityLog.slice(0, 50);
    saveWorkspace(workspace);
    renderAttendance();

    if (created) {
        showStatus(`Attendance saved. ${created} created, ${skipped} skipped.`, "success");
    } else {
        showStatus("No new attendance was created because records already exist.", "warning");
    }
}

function editAttendance(id) {
    const workspace = loadWorkspace();
    const record = workspace.attendance.find((item) => item.id === id);

    if (!record) {
        showStatus("Attendance record was not found.", "danger");
        return;
    }

    const currentIndex = attendanceStatuses.indexOf(record.status);
    record.status = attendanceStatuses[(currentIndex + 1) % attendanceStatuses.length];

    workspace.activityLog.unshift({
        id: generateId("log"),
        module: "Attendance",
        action: "Updated attendance",
        detail: `Changed ${getStudentName(workspace, record.studentId)} to ${record.status} for ${record.date}`,
        createdAt: new Date().toISOString()
    });

    workspace.activityLog = workspace.activityLog.slice(0, 50);
    saveWorkspace(workspace);
    renderAttendance();
    showStatus("Attendance status cycled.", "success");
}

function deleteAttendance(id) {
    const workspace = loadWorkspace();
    const record = workspace.attendance.find((item) => item.id === id);

    if (!record) {
        showStatus("Attendance record was not found.", "danger");
        return;
    }

    if (!confirm(`Delete attendance for ${getStudentName(workspace, record.studentId)} on ${record.date}?`)) {
        return;
    }

    workspace.attendance = workspace.attendance.filter((item) => item.id !== id);
    workspace.activityLog.unshift({
        id: generateId("log"),
        module: "Attendance",
        action: "Deleted attendance",
        detail: `Deleted attendance for ${getStudentName(workspace, record.studentId)} on ${record.date}`,
        createdAt: new Date().toISOString()
    });

    workspace.activityLog = workspace.activityLog.slice(0, 50);
    saveWorkspace(workspace);
    renderAttendance();
    showStatus("Attendance deleted successfully.", "success");
}

function filterAttendance() {
    renderAttendance();
}

function renderAttendanceStats() {
    const workspace = loadWorkspace();
    const today = getTodayDate();
    const stats = calculateAttendanceStats(workspace, today);

    $("#attendanceStats").html(`
    <div class="attendance-summary-card"><span>Today Records</span><strong>${stats.total}</strong></div>
    <div class="attendance-summary-card"><span>Present</span><strong>${stats.present}</strong></div>
    <div class="attendance-summary-card"><span>Absent</span><strong>${stats.absent}</strong></div>
    <div class="attendance-summary-card"><span>Late / Leave</span><strong>${stats.late + stats.leave}</strong></div>
  `);
}

function preventDuplicateAttendance(studentId, date) {
    const workspace = loadWorkspace();

    return workspace.attendance.some((record) => {
        return record.studentId === studentId && record.date === date;
    });
}

function loadAttendanceOptions() {
    const classOptions = attendanceClasses.map((item) => `<option>${item}</option>`).join("");
    const sectionOptions = attendanceSections.map((item) => `<option>${item}</option>`).join("");

    $("#markClass").html(classOptions);
    $("#markSection").html(sectionOptions);

    $("#filterClass").html(`
    <option value="">All classes</option>
    ${classOptions}
  `);
}

$(document).ready(function () {
    $("#sidebarMount").html(renderSidebar("attendance"));
    applyThemeSettings();
    setActiveNav();

    loadAttendanceOptions();

    $("#markDate").val(getTodayDate());
    $("#filterDate").val("");
    renderAttendanceMarkList();
    renderAttendance();

    $("#markClass, #markSection").on("change", renderAttendanceMarkList);
    $("#saveAttendanceBtn").on("click", markAttendance);
    $("#attendanceSearch, #filterDate, #filterClass, #filterStatus").on("input change", filterAttendance);
});