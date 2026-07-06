const timetableDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const timetablePeriods = [1, 2, 3, 4, 5, 6];
const timetableClasses = ["8", "9", "10"];
const timetableSections = ["A", "B"];

function getFilteredTimetable() {
    const workspace = loadWorkspace();
    const classSection = $("#filterClass").val();
    const teacherId = $("#filterTeacher").val();
    const subjectQuery = $("#filterSubject").val().toLowerCase().trim();

    return workspace.timetable.filter((entry) => {
        const entryClassSection = `${entry.classGrade}-${entry.section}`;

        return (!classSection || entryClassSection === classSection) &&
            (!teacherId || entry.teacherId === teacherId) &&
            (!subjectQuery || entry.subject.toLowerCase().includes(subjectQuery));
    });
}

function renderTimetableGrid() {
    const workspace = loadWorkspace();
    const entries = getFilteredTimetable();
    const classFilter = $("#filterClass").val();
    const teacherFilter = $("#filterTeacher").val();

    $("#timetableFilterNote").text(`${entries.length} visible entries`);

    if (!entries.length) {
        $("#timetableGridMount").html(renderEmptyState("No timetable entries match the current filters."));
        return;
    }

    const entryMap = entries.reduce((map, entry) => {
        const key = `${entry.day}-${entry.period}`;
        if (!map[key]) map[key] = [];
        map[key].push(entry);
        return map;
    }, {});

    $("#timetableGridMount").html(`
    <div class="timetable-grid">
      <div class="timetable-cell timetable-head">Period</div>
      ${timetableDays.map((day) => `<div class="timetable-cell timetable-head">${day}</div>`).join("")}

      ${timetablePeriods.map((period) => `
        <div class="timetable-cell timetable-period">P${period}</div>
        ${timetableDays.map((day) => {
        const cellEntries = entryMap[`${day}-${period}`] || [];

        return `
            <div class="timetable-cell">
              ${cellEntries.length ? cellEntries.map((entry) => `
                <article class="timetable-entry ${cellEntries.length > 1 ? "timetable-conflict" : ""}">
                  <h4>${escapeHtml(entry.subject)}</h4>
                  <p>${escapeHtml(entry.classGrade)}-${escapeHtml(entry.section)} · ${escapeHtml(getTeacherName(workspace, entry.teacherId))}</p>
                  <p class="mono">Day ${escapeHtml(entry.day)} / Period ${escapeHtml(entry.period)}</p>
                  <div class="timetable-entry-actions">
                    <button class="btn btn-sm btn-outline-info" type="button" onclick="editTimetableEntry('${entry.id}')">Edit</button>
                    <button class="btn btn-sm btn-outline-danger" type="button" onclick="deleteTimetableEntry('${entry.id}')">Delete</button>
                  </div>
                </article>
              `).join("") : `<span class="text-muted-custom">Open slot${classFilter || teacherFilter ? "" : ""}</span>`}
            </div>
          `;
    }).join("")}
      `).join("")}
    </div>
  `);
}

function createTimetableEntry() {
    const workspace = loadWorkspace();
    const timetableId = $("#timetableId").val();
    const now = new Date().toISOString();

    const entryData = {
        id: timetableId || generateId("timetable"),
        classGrade: $("#classGrade").val(),
        section: $("#section").val(),
        day: $("#day").val(),
        period: Number($("#period").val()),
        subject: $("#subject").val().trim(),
        teacherId: $("#teacherId").val(),
        createdAt: now,
        updatedAt: now
    };

    if (!entryData.subject || !entryData.teacherId) {
        showStatus("Please complete subject and teacher fields.", "warning");
        return;
    }

    const teacherConflict = preventTeacherDoubleBooking(
        entryData.teacherId,
        entryData.day,
        entryData.period,
        entryData.id
    );

    if (teacherConflict) {
        showStatus("This teacher is already booked for that day and period.", "danger");
        return;
    }

    const classConflict = workspace.timetable.some((entry) => {
        return entry.classGrade === entryData.classGrade &&
            entry.section === entryData.section &&
            entry.day === entryData.day &&
            Number(entry.period) === Number(entryData.period) &&
            entry.id !== entryData.id;
    });

    if (classConflict) {
        showStatus("This class already has a timetable entry for that day and period.", "danger");
        return;
    }

    if (timetableId) {
        const index = workspace.timetable.findIndex((entry) => entry.id === timetableId);
        if (index === -1) return;

        entryData.createdAt = workspace.timetable[index].createdAt;
        workspace.timetable[index] = entryData;

        workspace.activityLog.unshift({
            id: generateId("log"),
            module: "Timetable",
            action: "Updated timetable",
            detail: `Updated ${entryData.subject} for ${entryData.classGrade}-${entryData.section}`,
            createdAt: now
        });

        showStatus("Timetable entry updated successfully.", "success");
    } else {
        workspace.timetable.push(entryData);

        workspace.activityLog.unshift({
            id: generateId("log"),
            module: "Timetable",
            action: "Created timetable",
            detail: `Added ${entryData.subject} for ${entryData.classGrade}-${entryData.section}`,
            createdAt: now
        });

        showStatus("Timetable entry created successfully.", "success");
    }

    workspace.activityLog = workspace.activityLog.slice(0, 50);
    saveWorkspace(workspace);
    resetTimetableForm();
    loadTimetableOptions();
    renderTimetableGrid();
}

function editTimetableEntry(id) {
    const workspace = loadWorkspace();
    const entry = workspace.timetable.find((item) => item.id === id);

    if (!entry) {
        showStatus("Timetable entry was not found.", "danger");
        return;
    }

    $("#timetableFormTitle").text("Edit Timetable Entry");
    $("#timetableId").val(entry.id);
    $("#classGrade").val(entry.classGrade);
    $("#section").val(entry.section);
    $("#day").val(entry.day);
    $("#period").val(String(entry.period));
    $("#subject").val(entry.subject);
    $("#teacherId").val(entry.teacherId);

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteTimetableEntry(id) {
    const workspace = loadWorkspace();
    const entry = workspace.timetable.find((item) => item.id === id);

    if (!entry) {
        showStatus("Timetable entry was not found.", "danger");
        return;
    }

    if (!confirm(`Delete ${entry.subject} for ${entry.classGrade}-${entry.section} on ${entry.day} period ${entry.period}?`)) {
        return;
    }

    workspace.timetable = workspace.timetable.filter((item) => item.id !== id);
    workspace.activityLog.unshift({
        id: generateId("log"),
        module: "Timetable",
        action: "Deleted timetable",
        detail: `Deleted ${entry.subject} for ${entry.classGrade}-${entry.section}`,
        createdAt: new Date().toISOString()
    });

    workspace.activityLog = workspace.activityLog.slice(0, 50);
    saveWorkspace(workspace);
    renderTimetableGrid();
    showStatus("Timetable entry deleted successfully.", "success");
}

function filterTimetable() {
    renderTimetableGrid();
}

function preventTeacherDoubleBooking(teacherId, day, period, ignoreId = "") {
    const workspace = loadWorkspace();

    return workspace.timetable.some((entry) => {
        return entry.teacherId === teacherId &&
            entry.day === day &&
            Number(entry.period) === Number(period) &&
            entry.id !== ignoreId;
    });
}

function loadTimetableOptions() {
    const workspace = loadWorkspace();

    $("#classGrade").html(timetableClasses.map((item) => `<option>${item}</option>`).join(""));
    $("#section").html(timetableSections.map((item) => `<option>${item}</option>`).join(""));
    $("#day").html(timetableDays.map((item) => `<option>${item}</option>`).join(""));
    $("#period").html(timetablePeriods.map((item) => `<option>${item}</option>`).join(""));

    $("#teacherId").html(workspace.teachers.map((teacher) => `
    <option value="${teacher.id}">${escapeHtml(teacher.firstName)} ${escapeHtml(teacher.lastName)} · ${escapeHtml(teacher.subjects.join(", "))}</option>
  `).join(""));

    const classSections = [...new Set(workspace.students.map((student) => `${student.classGrade}-${student.section}`))].sort();

    $("#filterClass").html(`
    <option value="">All classes</option>
    ${classSections.map((item) => `<option>${escapeHtml(item)}</option>`).join("")}
  `);

    $("#filterTeacher").html(`
    <option value="">All teachers</option>
    ${workspace.teachers.map((teacher) => `<option value="${teacher.id}">${escapeHtml(teacher.firstName)} ${escapeHtml(teacher.lastName)}</option>`).join("")}
  `);
}

function resetTimetableForm() {
    $("#timetableFormTitle").text("Add Timetable Entry");
    $("#timetableForm")[0].reset();
    $("#timetableId").val("");
}

$(document).ready(function () {
    $("#sidebarMount").html(renderSidebar("timetable"));
    applyThemeSettings();
    setActiveNav();

    loadTimetableOptions();
    resetTimetableForm();
    renderTimetableGrid();

    $("#timetableForm").on("submit", function (event) {
        event.preventDefault();
        createTimetableEntry();
    });

    $("#resetTimetableFormBtn").on("click", resetTimetableForm);

    $("#filterClass, #filterTeacher, #filterSubject").on("input change", filterTimetable);

    $("#clearTimetableFiltersBtn").on("click", function () {
        $("#filterClass").val("");
        $("#filterTeacher").val("");
        $("#filterSubject").val("");
        renderTimetableGrid();
    });
});