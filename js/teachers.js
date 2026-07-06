function parseCsvList(value) {
    return String(value || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}

function getTeacherStatusBadgeClass(status) {
    if (status === "Active") return "badge-active";
    if (status === "On Leave") return "badge-warning";
    return "badge-resigned";
}

function getFilteredTeachers() {
    const workspace = loadWorkspace();
    const query = $("#teacherSearch").val().toLowerCase().trim();
    const subject = $("#filterSubject").val();
    const className = $("#filterClass").val();
    const status = $("#filterStatus").val();

    return workspace.teachers.filter((teacher) => {
        const searchable = [
            teacher.firstName,
            teacher.lastName,
            teacher.email,
            teacher.phone,
            teacher.subjects.join(" "),
            teacher.classes.join(" "),
            teacher.status
        ].join(" ").toLowerCase();

        return (!query || searchable.includes(query)) &&
            (!subject || teacher.subjects.includes(subject)) &&
            (!className || teacher.classes.includes(className)) &&
            (!status || teacher.status === status);
    });
}

function renderTeacherStats() {
    const workspace = loadWorkspace();
    const active = workspace.teachers.filter((teacher) => teacher.status === "Active").length;
    const onLeave = workspace.teachers.filter((teacher) => teacher.status === "On Leave").length;
    const uniqueSubjects = new Set(workspace.teachers.flatMap((teacher) => teacher.subjects)).size;

    $("#teacherStats").html(`
    <div class="teacher-load-card"><span>Total Teachers</span><strong>${workspace.teachers.length}</strong></div>
    <div class="teacher-load-card"><span>Active Faculty</span><strong>${active}</strong></div>
    <div class="teacher-load-card"><span>On Leave</span><strong>${onLeave}</strong></div>
    <div class="teacher-load-card"><span>Subjects Covered</span><strong>${uniqueSubjects}</strong></div>
  `);
}

function renderTeachers() {
    const teachers = getFilteredTeachers();

    renderTeacherStats();
    loadTeacherFormOptions();

    if (!teachers.length) {
        $("#teachersTableMount").html(renderEmptyState("Try changing your search or filters."));
        $("#teachersCardMount").html(renderEmptyState("No teacher cards match the current filters."));
        return;
    }

    $("#teachersTableMount").html(`
    <div class="table-responsive">
      <table class="table table-hover">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Subjects</th>
            <th>Classes</th>
            <th>Status</th>
            <th>Joining</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${teachers.map((teacher) => `
            <tr>
              <td>
                <div class="student-table-name">
                  <span class="avatar">${escapeHtml(teacher.firstName[0])}${escapeHtml(teacher.lastName[0])}</span>
                  <strong>${escapeHtml(teacher.firstName)} ${escapeHtml(teacher.lastName)}</strong>
                </div>
              </td>
              <td><a href="mailto:${escapeHtml(teacher.email)}">${escapeHtml(teacher.email)}</a></td>
              <td>${escapeHtml(teacher.phone)}</td>
              <td>
                <div class="teacher-table-subjects">
                  ${teacher.subjects.map((subject) => `<span class="badge badge-soft">${escapeHtml(subject)}</span>`).join("")}
                </div>
              </td>
              <td>${teacher.classes.map((className) => `<span class="badge badge-soft">${escapeHtml(className)}</span>`).join(" ")}</td>
              <td><span class="badge ${getTeacherStatusBadgeClass(teacher.status)}">${escapeHtml(teacher.status)}</span></td>
              <td>${escapeHtml(formatDate(teacher.joiningDate))}</td>
              <td>
                <div class="action-row">
                  <button class="btn btn-sm btn-outline-info" type="button" onclick="editTeacher('${teacher.id}')">Edit</button>
                  <button class="btn btn-sm btn-outline-danger" type="button" onclick="deleteTeacher('${teacher.id}')">Delete</button>
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `);

    $("#teachersCardMount").html(teachers.map((teacher) => `
    <article class="person-card teacher-card">
      <div class="person-header">
        <span class="avatar">${escapeHtml(teacher.firstName[0])}${escapeHtml(teacher.lastName[0])}</span>
        <div>
          <p class="person-name">${escapeHtml(teacher.firstName)} ${escapeHtml(teacher.lastName)}</p>
          <p class="person-meta">${escapeHtml(teacher.status)} · Joined ${escapeHtml(formatDate(teacher.joiningDate))}</p>
        </div>
      </div>

      <div class="teacher-contact">
        <span><i class="bi bi-envelope"></i> ${escapeHtml(teacher.email)}</span>
        <span><i class="bi bi-telephone"></i> ${escapeHtml(teacher.phone)}</span>
      </div>

      <div class="teacher-subjects">
        ${teacher.subjects.map((subject) => `<span class="badge badge-soft">${escapeHtml(subject)}</span>`).join("")}
      </div>

      <div class="teacher-classes">
        ${teacher.classes.map((className) => `<span class="badge badge-soft">${escapeHtml(className)}</span>`).join("")}
      </div>

      <div class="student-card-actions">
        <button class="btn btn-sm btn-outline-info" type="button" onclick="editTeacher('${teacher.id}')">Edit</button>
        <button class="btn btn-sm btn-outline-danger" type="button" onclick="deleteTeacher('${teacher.id}')">Delete</button>
      </div>
    </article>
  `).join(""));
}

function createTeacher() {
    const workspace = loadWorkspace();
    const teacherId = $("#teacherId").val();
    const now = new Date().toISOString();

    const teacherData = {
        id: teacherId || generateId("teacher"),
        firstName: $("#firstName").val().trim(),
        lastName: $("#lastName").val().trim(),
        email: $("#email").val().trim(),
        phone: $("#phone").val().trim(),
        subjects: parseCsvList($("#subjects").val()),
        classes: parseCsvList($("#classes").val()),
        status: $("#status").val(),
        joiningDate: $("#joiningDate").val(),
        createdAt: now,
        updatedAt: now
    };

    if (!teacherData.firstName || !teacherData.lastName || !teacherData.email || !teacherData.subjects.length || !teacherData.classes.length) {
        showStatus("Please complete the required teacher fields.", "warning");
        return;
    }

    const duplicateEmail = workspace.teachers.some((teacher) => {
        return teacher.email.toLowerCase() === teacherData.email.toLowerCase() &&
            teacher.id !== teacherData.id;
    });

    if (duplicateEmail) {
        showStatus("That teacher email already exists.", "danger");
        return;
    }

    if (teacherId) {
        const index = workspace.teachers.findIndex((teacher) => teacher.id === teacherId);
        if (index === -1) return;

        teacherData.createdAt = workspace.teachers[index].createdAt;
        workspace.teachers[index] = teacherData;

        workspace.activityLog.unshift({
            id: generateId("log"),
            module: "Teachers",
            action: "Updated teacher",
            detail: `Updated teacher ${teacherData.firstName} ${teacherData.lastName}`,
            createdAt: now
        });

        showStatus("Teacher updated successfully.", "success");
    } else {
        workspace.teachers.push(teacherData);

        workspace.activityLog.unshift({
            id: generateId("log"),
            module: "Teachers",
            action: "Created teacher",
            detail: `Created teacher ${teacherData.firstName} ${teacherData.lastName}`,
            createdAt: now
        });

        showStatus("Teacher created successfully.", "success");
    }

    workspace.activityLog = workspace.activityLog.slice(0, 50);
    saveWorkspace(workspace);
    resetTeacherForm();
    renderTeachers();
}

function editTeacher(id) {
    const workspace = loadWorkspace();
    const teacher = workspace.teachers.find((item) => item.id === id);

    if (!teacher) {
        showStatus("Teacher was not found.", "danger");
        return;
    }

    $("#teacherFormTitle").text("Edit Teacher");
    $("#teacherId").val(teacher.id);
    $("#firstName").val(teacher.firstName);
    $("#lastName").val(teacher.lastName);
    $("#email").val(teacher.email);
    $("#phone").val(teacher.phone);
    $("#subjects").val(teacher.subjects.join(", "));
    $("#classes").val(teacher.classes.join(", "));
    $("#status").val(teacher.status);
    $("#joiningDate").val(teacher.joiningDate);

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteTeacher(id) {
    const workspace = loadWorkspace();
    const teacher = workspace.teachers.find((item) => item.id === id);

    if (!teacher) {
        showStatus("Teacher was not found.", "danger");
        return;
    }

    if (!confirm(`Delete ${teacher.firstName} ${teacher.lastName}? Existing timetable entries will keep their teacher ID for audit history.`)) {
        return;
    }

    workspace.teachers = workspace.teachers.filter((item) => item.id !== id);
    workspace.activityLog.unshift({
        id: generateId("log"),
        module: "Teachers",
        action: "Deleted teacher",
        detail: `Deleted teacher ${teacher.firstName} ${teacher.lastName}`,
        createdAt: new Date().toISOString()
    });

    workspace.activityLog = workspace.activityLog.slice(0, 50);
    saveWorkspace(workspace);
    renderTeachers();
    showStatus("Teacher deleted successfully.", "success");
}

function filterTeachers() {
    renderTeachers();
}

function loadTeacherFormOptions() {
    const workspace = loadWorkspace();
    const subjects = [...new Set(workspace.teachers.flatMap((teacher) => teacher.subjects))].sort();
    const classes = [...new Set(workspace.teachers.flatMap((teacher) => teacher.classes))].sort();

    $("#filterSubject").html(`
    <option value="">All subjects</option>
    ${subjects.map((subject) => `<option>${escapeHtml(subject)}</option>`).join("")}
  `);

    $("#filterClass").html(`
    <option value="">All classes</option>
    ${classes.map((className) => `<option>${escapeHtml(className)}</option>`).join("")}
  `);
}

function resetTeacherForm() {
    $("#teacherFormTitle").text("Add Teacher");
    $("#teacherForm")[0].reset();
    $("#teacherId").val("");
    $("#joiningDate").val(getTodayDate());
}

$(document).ready(function () {
    $("#sidebarMount").html(renderSidebar("teachers"));
    applyThemeSettings();
    setActiveNav();

    loadTeacherFormOptions();
    resetTeacherForm();
    renderTeachers();

    $("#teacherForm").on("submit", function (event) {
        event.preventDefault();
        createTeacher();
    });

    $("#resetTeacherFormBtn").on("click", resetTeacherForm);

    $("#teacherSearch, #filterSubject, #filterClass, #filterStatus").on("input change", filterTeachers);
});