const studentClasses = ["8", "9", "10"];
const studentSections = ["A", "B"];

function getFilteredStudents() {
    const workspace = loadWorkspace();
    const query = $("#studentSearch").val().toLowerCase().trim();
    const classGrade = $("#filterClass").val();
    const section = $("#filterSection").val();
    const status = $("#filterStatus").val();

    return workspace.students.filter((student) => {
        const searchable = [
            student.firstName,
            student.lastName,
            student.rollNumber,
            student.classGrade,
            student.section,
            student.guardianName,
            student.guardianContact,
            student.status
        ].join(" ").toLowerCase();

        return (!query || searchable.includes(query)) &&
            (!classGrade || student.classGrade === classGrade) &&
            (!section || student.section === section) &&
            (!status || student.status === status);
    });
}

function getStatusBadgeClass(status) {
    if (status === "Active") return "badge-active";
    if (status === "Inactive") return "badge-inactive";
    return "badge-graduated";
}

function renderStudentStats() {
    const workspace = loadWorkspace();
    const active = workspace.students.filter((student) => student.status === "Active").length;
    const inactive = workspace.students.filter((student) => student.status === "Inactive").length;
    const graduated = workspace.students.filter((student) => student.status === "Graduated").length;

    $("#studentStats").html(`
    <div class="student-mini-stat"><span>Total Students</span><strong>${workspace.students.length}</strong></div>
    <div class="student-mini-stat"><span>Active</span><strong>${active}</strong></div>
    <div class="student-mini-stat"><span>Inactive</span><strong>${inactive}</strong></div>
    <div class="student-mini-stat"><span>Graduated</span><strong>${graduated}</strong></div>
  `);
}

function renderStudents() {
    const students = getFilteredStudents();

    renderStudentStats();

    if (!students.length) {
        $("#studentsTableMount").html(renderEmptyState("Try changing your search or filters."));
        $("#studentsCardMount").html(renderEmptyState("No student cards match the current filters."));
        return;
    }

    $("#studentsTableMount").html(`
    <div class="table-responsive">
      <table class="table table-hover">
        <thead>
          <tr>
            <th>Name</th>
            <th>Roll No.</th>
            <th>Class</th>
            <th>Guardian</th>
            <th>Contact</th>
            <th>Status</th>
            <th>Admission</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${students.map((student) => `
            <tr>
              <td>
                <div class="student-table-name">
                  <span class="avatar">${escapeHtml(student.firstName[0])}${escapeHtml(student.lastName[0])}</span>
                  <strong>${escapeHtml(student.firstName)} ${escapeHtml(student.lastName)}</strong>
                </div>
              </td>
              <td><span class="student-roll">${escapeHtml(student.rollNumber)}</span></td>
              <td>${escapeHtml(student.classGrade)}-${escapeHtml(student.section)}</td>
              <td>${escapeHtml(student.guardianName)}</td>
              <td>${escapeHtml(student.guardianContact)}</td>
              <td><span class="badge ${getStatusBadgeClass(student.status)}">${escapeHtml(student.status)}</span></td>
              <td>${escapeHtml(formatDate(student.admissionDate))}</td>
              <td>
                <div class="action-row">
                  <button class="btn btn-sm btn-outline-info" type="button" onclick="editStudent('${student.id}')">Edit</button>
                  <button class="btn btn-sm btn-outline-danger" type="button" onclick="deleteStudent('${student.id}')">Delete</button>
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `);

    $("#studentsCardMount").html(students.map((student) => `
    <article class="person-card">
      <div class="person-header">
        <span class="avatar">${escapeHtml(student.firstName[0])}${escapeHtml(student.lastName[0])}</span>
        <div>
          <p class="person-name">${escapeHtml(student.firstName)} ${escapeHtml(student.lastName)}</p>
          <p class="person-meta">${escapeHtml(student.rollNumber)} · Class ${escapeHtml(student.classGrade)}-${escapeHtml(student.section)}</p>
        </div>
      </div>

      <ul class="meta-list">
        <li>Guardian: ${escapeHtml(student.guardianName)}</li>
        <li>Contact: ${escapeHtml(student.guardianContact)}</li>
        <li>Admission: ${escapeHtml(formatDate(student.admissionDate))}</li>
        <li>Status: <span class="badge ${getStatusBadgeClass(student.status)}">${escapeHtml(student.status)}</span></li>
      </ul>

      <div class="student-card-actions">
        <button class="btn btn-sm btn-outline-info" type="button" onclick="editStudent('${student.id}')">Edit</button>
        <button class="btn btn-sm btn-outline-danger" type="button" onclick="deleteStudent('${student.id}')">Delete</button>
      </div>
    </article>
  `).join(""));
}

function createStudent() {
    const workspace = loadWorkspace();
    const studentId = $("#studentId").val();
    const now = new Date().toISOString();

    const studentData = {
        id: studentId || generateId("student"),
        firstName: $("#firstName").val().trim(),
        lastName: $("#lastName").val().trim(),
        rollNumber: $("#rollNumber").val().trim(),
        classGrade: $("#classGrade").val(),
        section: $("#section").val(),
        guardianName: $("#guardianName").val().trim(),
        guardianContact: $("#guardianContact").val().trim(),
        status: $("#status").val(),
        admissionDate: $("#admissionDate").val(),
        createdAt: now,
        updatedAt: now
    };

    if (!studentData.firstName || !studentData.lastName || !studentData.rollNumber) {
        showStatus("Please complete the required student fields.", "warning");
        return;
    }

    const duplicateRoll = workspace.students.some((student) => {
        return student.rollNumber.toLowerCase() === studentData.rollNumber.toLowerCase() &&
            student.id !== studentData.id;
    });

    if (duplicateRoll) {
        showStatus("That roll number already exists.", "danger");
        return;
    }

    if (studentId) {
        const index = workspace.students.findIndex((student) => student.id === studentId);
        if (index === -1) return;

        studentData.createdAt = workspace.students[index].createdAt;
        workspace.students[index] = studentData;
        workspace.activityLog.unshift({
            id: generateId("log"),
            module: "Students",
            action: "Updated student",
            detail: `Updated student ${studentData.firstName} ${studentData.lastName}`,
            createdAt: now
        });

        showStatus("Student updated successfully.", "success");
    } else {
        workspace.students.push(studentData);
        workspace.activityLog.unshift({
            id: generateId("log"),
            module: "Students",
            action: "Created student",
            detail: `Created student ${studentData.firstName} ${studentData.lastName}`,
            createdAt: now
        });

        showStatus("Student created successfully.", "success");
    }

    workspace.activityLog = workspace.activityLog.slice(0, 50);
    saveWorkspace(workspace);
    resetStudentForm();
    renderStudents();
}

function editStudent(id) {
    const workspace = loadWorkspace();
    const student = workspace.students.find((item) => item.id === id);

    if (!student) {
        showStatus("Student was not found.", "danger");
        return;
    }

    $("#studentFormTitle").text("Edit Student");
    $("#studentId").val(student.id);
    $("#firstName").val(student.firstName);
    $("#lastName").val(student.lastName);
    $("#rollNumber").val(student.rollNumber);
    $("#classGrade").val(student.classGrade);
    $("#section").val(student.section);
    $("#guardianName").val(student.guardianName);
    $("#guardianContact").val(student.guardianContact);
    $("#status").val(student.status);
    $("#admissionDate").val(student.admissionDate);

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteStudent(id) {
    const workspace = loadWorkspace();
    const student = workspace.students.find((item) => item.id === id);

    if (!student) {
        showStatus("Student was not found.", "danger");
        return;
    }

    if (!confirm(`Delete ${student.firstName} ${student.lastName}? Related attendance, grades, and fee records will remain for audit history.`)) {
        return;
    }

    workspace.students = workspace.students.filter((item) => item.id !== id);
    workspace.activityLog.unshift({
        id: generateId("log"),
        module: "Students",
        action: "Deleted student",
        detail: `Deleted student ${student.firstName} ${student.lastName}`,
        createdAt: new Date().toISOString()
    });

    workspace.activityLog = workspace.activityLog.slice(0, 50);
    saveWorkspace(workspace);
    renderStudents();
    showStatus("Student deleted successfully.", "success");
}

function filterStudents() {
    renderStudents();
}

function loadStudentFormOptions() {
    $("#classGrade").html(studentClasses.map((item) => `<option>${item}</option>`).join(""));
    $("#section").html(studentSections.map((item) => `<option>${item}</option>`).join(""));

    $("#filterClass").html(`
    <option value="">All classes</option>
    ${studentClasses.map((item) => `<option>${item}</option>`).join("")}
  `);

    $("#filterSection").html(`
    <option value="">All sections</option>
    ${studentSections.map((item) => `<option>${item}</option>`).join("")}
  `);
}

function resetStudentForm() {
    $("#studentFormTitle").text("Add Student");
    $("#studentForm")[0].reset();
    $("#studentId").val("");
    $("#admissionDate").val(getTodayDate());
}

$(document).ready(function () {
    $("#sidebarMount").html(renderSidebar("students"));
    applyThemeSettings();
    setActiveNav();

    loadStudentFormOptions();
    resetStudentForm();
    renderStudents();

    $("#studentForm").on("submit", function (event) {
        event.preventDefault();
        createStudent();
    });

    $("#resetStudentFormBtn").on("click", resetStudentForm);

    $("#studentSearch, #filterClass, #filterSection, #filterStatus").on("input change", filterStudents);
});