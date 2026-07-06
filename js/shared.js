const WORKSPACE_KEY = "schoolManagementDashboardWorkspace";

const defaultWorkspace = {
    settings: {
        schoolName: "NightCity Public School",
        adminEmail: "admin@example.com",
        currency: "PKR",
        academicSession: "2026-2027",
        darkMode: true,
        compactSidebar: false
    },
    students: [],
    teachers: [],
    attendance: [],
    timetable: [],
    grades: [],
    feeRecords: [],
    activityLog: []
};

function escapeHtml(str) {
    return String(str ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function generateId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatDate(dateString) {
    if (!dateString) return "Not set";
    const date = new Date(`${dateString}T00:00:00`);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

function getTodayDate() {
    return new Date().toISOString().slice(0, 10);
}

function formatCurrency(value) {
    const workspace = loadWorkspace();
    const currency = workspace.settings.currency || "PKR";
    return `${currency} ${Number(value || 0).toLocaleString("en-US")}`;
}

function loadWorkspace() {
    const saved = localStorage.getItem(WORKSPACE_KEY);

    if (!saved) {
        const seededWorkspace = seedDemoData();
        saveWorkspace(seededWorkspace);
        return seededWorkspace;
    }

    try {
        const parsed = JSON.parse(saved);
        return {
            ...structuredClone(defaultWorkspace),
            ...parsed,
            settings: {
                ...defaultWorkspace.settings,
                ...(parsed.settings || {})
            },
            students: parsed.students || [],
            teachers: parsed.teachers || [],
            attendance: parsed.attendance || [],
            timetable: parsed.timetable || [],
            grades: parsed.grades || [],
            feeRecords: parsed.feeRecords || [],
            activityLog: parsed.activityLog || []
        };
    } catch (error) {
        console.error("Workspace parse failed:", error);
        const seededWorkspace = seedDemoData();
        saveWorkspace(seededWorkspace);
        return seededWorkspace;
    }
}

function saveWorkspace(workspace) {
    localStorage.setItem(WORKSPACE_KEY, JSON.stringify(workspace));
    applyThemeSettings();
}

function resetWorkspace() {
    const workspace = seedDemoData();
    saveWorkspace(workspace);
    return workspace;
}

function seedDemoData() {
    const now = new Date().toISOString();
    const today = getTodayDate();

    const students = [
        {
            id: "student-ahmed-khan",
            firstName: "Ahmed",
            lastName: "Khan",
            rollNumber: "S-1024",
            classGrade: "9",
            section: "A",
            guardianName: "Tariq Khan",
            guardianContact: "+92-300-1234567",
            status: "Active",
            admissionDate: "2024-04-12",
            createdAt: now,
            updatedAt: now
        },
        {
            id: "student-zainab-fatima",
            firstName: "Zainab",
            lastName: "Fatima",
            rollNumber: "S-1025",
            classGrade: "9",
            section: "A",
            guardianName: "Shahid Fatima",
            guardianContact: "+92-301-2244668",
            status: "Active",
            admissionDate: "2024-04-15",
            createdAt: now,
            updatedAt: now
        },
        {
            id: "student-bilal-hussain",
            firstName: "Bilal",
            lastName: "Hussain",
            rollNumber: "S-1026",
            classGrade: "9",
            section: "B",
            guardianName: "Naveed Hussain",
            guardianContact: "+92-302-9876543",
            status: "Inactive",
            admissionDate: "2023-08-20",
            createdAt: now,
            updatedAt: now
        },
        {
            id: "student-mahnoor-sheikh",
            firstName: "Mahnoor",
            lastName: "Sheikh",
            rollNumber: "S-1030",
            classGrade: "10",
            section: "A",
            guardianName: "Samina Sheikh",
            guardianContact: "+92-303-3344556",
            status: "Active",
            admissionDate: "2023-04-05",
            createdAt: now,
            updatedAt: now
        },
        {
            id: "student-hassan-raza",
            firstName: "Hassan",
            lastName: "Raza",
            rollNumber: "S-1031",
            classGrade: "10",
            section: "A",
            guardianName: "Ali Raza",
            guardianContact: "+92-304-1122334",
            status: "Active",
            admissionDate: "2023-04-08",
            createdAt: now,
            updatedAt: now
        },
        {
            id: "student-areeba-iqbal",
            firstName: "Areeba",
            lastName: "Iqbal",
            rollNumber: "S-1032",
            classGrade: "10",
            section: "B",
            guardianName: "Farhan Iqbal",
            guardianContact: "+92-305-7788990",
            status: "Graduated",
            admissionDate: "2022-03-18",
            createdAt: now,
            updatedAt: now
        },
        {
            id: "student-talha-farooq",
            firstName: "Talha",
            lastName: "Farooq",
            rollNumber: "S-1010",
            classGrade: "8",
            section: "A",
            guardianName: "Nasir Farooq",
            guardianContact: "+92-306-1212121",
            status: "Active",
            admissionDate: "2025-01-10",
            createdAt: now,
            updatedAt: now
        },
        {
            id: "student-rida-aslam",
            firstName: "Rida",
            lastName: "Aslam",
            rollNumber: "S-1011",
            classGrade: "8",
            section: "A",
            guardianName: "Mariam Aslam",
            guardianContact: "+92-307-5656565",
            status: "Active",
            admissionDate: "2025-01-11",
            createdAt: now,
            updatedAt: now
        },
        {
            id: "student-danish-malik",
            firstName: "Danish",
            lastName: "Malik",
            rollNumber: "S-1012",
            classGrade: "8",
            section: "B",
            guardianName: "Kamran Malik",
            guardianContact: "+92-308-3434343",
            status: "Inactive",
            admissionDate: "2024-09-02",
            createdAt: now,
            updatedAt: now
        },
        {
            id: "student-sara-yousuf",
            firstName: "Sara",
            lastName: "Yousuf",
            rollNumber: "S-1038",
            classGrade: "10",
            section: "B",
            guardianName: "Yousuf Ahmed",
            guardianContact: "+92-309-9090909",
            status: "Active",
            admissionDate: "2023-05-09",
            createdAt: now,
            updatedAt: now
        }
    ];

    const teachers = [
        {
            id: "teacher-sana-malik",
            firstName: "Sana",
            lastName: "Malik",
            email: "sana@example.com",
            phone: "+92-321-1234567",
            subjects: ["Mathematics", "Physics"],
            classes: ["9-A", "10-A"],
            status: "Active",
            joiningDate: "2021-08-01",
            createdAt: now,
            updatedAt: now
        },
        {
            id: "teacher-imran-qureshi",
            firstName: "Imran",
            lastName: "Qureshi",
            email: "imran@example.com",
            phone: "+92-322-3456789",
            subjects: ["English"],
            classes: ["8-A", "9-B", "10-B"],
            status: "Active",
            joiningDate: "2020-09-15",
            createdAt: now,
            updatedAt: now
        },
        {
            id: "teacher-fariha-siddiqui",
            firstName: "Fariha",
            lastName: "Siddiqui",
            email: "fariha@example.com",
            phone: "+92-323-5566778",
            subjects: ["Biology", "Chemistry"],
            classes: ["9-A", "10-A", "10-B"],
            status: "On Leave",
            joiningDate: "2019-07-22",
            createdAt: now,
            updatedAt: now
        },
        {
            id: "teacher-waqas-anjum",
            firstName: "Waqas",
            lastName: "Anjum",
            email: "waqas@example.com",
            phone: "+92-324-2233445",
            subjects: ["Computer Science"],
            classes: ["8-A", "9-B", "10-A"],
            status: "Active",
            joiningDate: "2022-02-01",
            createdAt: now,
            updatedAt: now
        },
        {
            id: "teacher-nadia-baig",
            firstName: "Nadia",
            lastName: "Baig",
            email: "nadia@example.com",
            phone: "+92-325-6677889",
            subjects: ["Urdu", "Islamiyat"],
            classes: ["8-A", "8-B", "9-A"],
            status: "Resigned",
            joiningDate: "2018-04-12",
            createdAt: now,
            updatedAt: now
        }
    ];

    const attendanceStatuses = [
        "Present", "Present", "Late", "Absent", "Present",
        "Leave", "Present", "Present", "Absent", "Late",
        "Present", "Present", "Present", "Absent", "Leave",
        "Present", "Late", "Present", "Present", "Absent"
    ];

    const attendance = Array.from({ length: 20 }, (_, index) => {
        const student = students[index % students.length];
        const date = index < 10 ? today : "2026-07-05";

        return {
            id: `attendance-${index + 1}`,
            studentId: student.id,
            date,
            status: attendanceStatuses[index],
            classGrade: student.classGrade,
            section: student.section,
            notes: index % 5 === 0 ? "Parent notified where required." : "",
            createdAt: now
        };
    });

    const timetable = [
        ["9", "A", "Monday", 1, "Mathematics", "teacher-sana-malik"],
        ["9", "A", "Monday", 2, "English", "teacher-imran-qureshi"],
        ["9", "A", "Tuesday", 1, "Chemistry", "teacher-fariha-siddiqui"],
        ["9", "B", "Tuesday", 2, "Computer Science", "teacher-waqas-anjum"],
        ["10", "A", "Wednesday", 1, "Physics", "teacher-sana-malik"],
        ["10", "A", "Wednesday", 2, "Biology", "teacher-fariha-siddiqui"],
        ["8", "A", "Thursday", 1, "English", "teacher-imran-qureshi"],
        ["8", "A", "Thursday", 2, "Computer Science", "teacher-waqas-anjum"],
        ["8", "B", "Friday", 1, "Urdu", "teacher-nadia-baig"],
        ["10", "B", "Friday", 2, "English", "teacher-imran-qureshi"],
        ["9", "A", "Wednesday", 3, "Islamiyat", "teacher-nadia-baig"],
        ["9", "B", "Monday", 3, "Computer Science", "teacher-waqas-anjum"],
        ["10", "B", "Tuesday", 3, "Chemistry", "teacher-fariha-siddiqui"],
        ["8", "A", "Friday", 3, "Mathematics", "teacher-sana-malik"],
        ["10", "A", "Thursday", 3, "Physics", "teacher-sana-malik"]
    ].map((entry, index) => ({
        id: `timetable-${index + 1}`,
        classGrade: entry[0],
        section: entry[1],
        day: entry[2],
        period: entry[3],
        subject: entry[4],
        teacherId: entry[5],
        createdAt: now,
        updatedAt: now
    }));

    const grades = [
        ["student-ahmed-khan", "Mathematics", "Midterm", 78, 100],
        ["student-zainab-fatima", "Mathematics", "Midterm", 91, 100],
        ["student-bilal-hussain", "English", "Quiz", 32, 50],
        ["student-mahnoor-sheikh", "Biology", "Final", 84, 100],
        ["student-hassan-raza", "Physics", "Assignment", 44, 50],
        ["student-areeba-iqbal", "Chemistry", "Final", 73, 100],
        ["student-talha-farooq", "Computer Science", "Quiz", 45, 50],
        ["student-rida-aslam", "English", "Midterm", 88, 100],
        ["student-danish-malik", "Urdu", "Assignment", 35, 50],
        ["student-sara-yousuf", "Biology", "Final", 94, 100]
    ].map((grade, index) => ({
        id: `grade-${index + 1}`,
        studentId: grade[0],
        subject: grade[1],
        examType: grade[2],
        marksObtained: grade[3],
        totalMarks: grade[4],
        grade: calculateGradeLetter(grade[3], grade[4]),
        term: "2026-2027",
        createdAt: now,
        updatedAt: now
    }));

    const feeRecords = students.map((student, index) => {
        const totals = [
            [8000, 1500, 500, 10000, "Paid"],
            [8000, 1500, 500, 6000, "Partial"],
            [7500, 1200, 500, 0, "Unpaid"],
            [9000, 1800, 800, 11600, "Paid"],
            [9000, 1800, 800, 7000, "Partial"],
            [9000, 1800, 800, 0, "Overdue"],
            [7000, 1200, 400, 8600, "Paid"],
            [7000, 1200, 400, 0, "Unpaid"],
            [7000, 1200, 400, 3000, "Partial"],
            [9000, 1800, 800, 0, "Overdue"]
        ][index];

        return {
            id: `fee-${index + 1}`,
            studentId: student.id,
            month: "July 2026",
            tuitionFee: totals[0],
            transportFee: totals[1],
            examFee: totals[2],
            amountPaid: totals[3],
            status: totals[4],
            dueDate: "2026-07-10",
            paidDate: totals[4] === "Paid" ? "2026-07-04" : "",
            createdAt: now,
            updatedAt: now
        };
    });

    const activityLog = [
        {
            id: "log-1",
            module: "Students",
            action: "Created student",
            detail: "Created student Ahmed Khan",
            createdAt: now
        },
        {
            id: "log-2",
            module: "Teachers",
            action: "Assigned teacher",
            detail: "Assigned Sana Malik to Mathematics for 9-A",
            createdAt: now
        },
        {
            id: "log-3",
            module: "Attendance",
            action: "Marked attendance",
            detail: "Marked today's attendance for class 9-A",
            createdAt: now
        },
        {
            id: "log-4",
            module: "Timetable",
            action: "Created schedule",
            detail: "Added Computer Science period for 9-B",
            createdAt: now
        },
        {
            id: "log-5",
            module: "Grades",
            action: "Recorded marks",
            detail: "Recorded Midterm Mathematics marks",
            createdAt: now
        },
        {
            id: "log-6",
            module: "Fees",
            action: "Payment posted",
            detail: "Posted July 2026 fee payment for Zainab Fatima",
            createdAt: now
        }
    ];

    return {
        settings: structuredClone(defaultWorkspace.settings),
        students,
        teachers,
        attendance,
        timetable,
        grades,
        feeRecords,
        activityLog
    };
}

function addActivityLog(module, action, detail) {
    const workspace = loadWorkspace();

    workspace.activityLog.unshift({
        id: generateId("log"),
        module,
        action,
        detail,
        createdAt: new Date().toISOString()
    });

    workspace.activityLog = workspace.activityLog.slice(0, 50);
    saveWorkspace(workspace);
}

function getStudentName(workspace, studentId) {
    const student = workspace.students.find((item) => item.id === studentId);
    return student ? `${student.firstName} ${student.lastName}` : "Unknown student";
}

function getTeacherName(workspace, teacherId) {
    const teacher = workspace.teachers.find((item) => item.id === teacherId);
    return teacher ? `${teacher.firstName} ${teacher.lastName}` : "Unassigned";
}

function calculateStudentCountByClass(workspace, classGrade, section) {
    return workspace.students.filter((student) => {
        const classMatch = !classGrade || student.classGrade === classGrade;
        const sectionMatch = !section || student.section === section;
        return classMatch && sectionMatch;
    }).length;
}

function calculateAttendanceStats(workspace, date) {
    const records = workspace.attendance.filter((record) => record.date === date);

    return {
        total: records.length,
        present: records.filter((record) => record.status === "Present").length,
        absent: records.filter((record) => record.status === "Absent").length,
        late: records.filter((record) => record.status === "Late").length,
        leave: records.filter((record) => record.status === "Leave").length
    };
}

function calculateGradeLetter(marksObtained, totalMarks) {
    const percentage = totalMarks > 0 ? (Number(marksObtained) / Number(totalMarks)) * 100 : 0;

    if (percentage >= 90) return "A+";
    if (percentage >= 85) return "A";
    if (percentage >= 80) return "A-";
    if (percentage >= 75) return "B+";
    if (percentage >= 70) return "B";
    if (percentage >= 65) return "C+";
    if (percentage >= 60) return "C";
    if (percentage >= 50) return "D";
    return "F";
}

function calculateClassAverage(workspace, classGrade, subject) {
    const studentIds = workspace.students
        .filter((student) => !classGrade || student.classGrade === classGrade)
        .map((student) => student.id);

    const records = workspace.grades.filter((grade) => {
        const classMatch = studentIds.includes(grade.studentId);
        const subjectMatch = !subject || grade.subject === subject;
        return classMatch && subjectMatch;
    });

    if (!records.length) return 0;

    const totalPercentage = records.reduce((sum, grade) => {
        return sum + ((Number(grade.marksObtained) / Number(grade.totalMarks)) * 100);
    }, 0);

    return Math.round(totalPercentage / records.length);
}

function calculateFeeTotal(feeRecord) {
    return Number(feeRecord.tuitionFee || 0) +
        Number(feeRecord.transportFee || 0) +
        Number(feeRecord.examFee || 0);
}

function calculateFeeSummary(workspace) {
    return workspace.feeRecords.reduce((summary, record) => {
        const total = calculateFeeTotal(record);
        const paid = Number(record.amountPaid || 0);

        summary.totalBilled += total;
        summary.totalCollected += paid;
        summary.totalPending += Math.max(total - paid, 0);

        if (record.status === "Paid") summary.paid += 1;
        if (record.status === "Partial") summary.partial += 1;
        if (record.status === "Unpaid") summary.unpaid += 1;
        if (record.status === "Overdue") summary.overdue += 1;

        return summary;
    }, {
        totalBilled: 0,
        totalCollected: 0,
        totalPending: 0,
        paid: 0,
        partial: 0,
        unpaid: 0,
        overdue: 0
    });
}

function renderSidebar(activePage) {
    const workspace = loadWorkspace();

    const navItems = [
        ["index.html", "dashboard", "bi-grid-1x2-fill", "Dashboard"],
        ["students.html", "students", "bi-people-fill", "Students"],
        ["teachers.html", "teachers", "bi-person-workspace", "Teachers"],
        ["attendance.html", "attendance", "bi-calendar-check-fill", "Attendance"],
        ["timetable.html", "timetable", "bi-table", "Timetable"],
        ["grades.html", "grades", "bi-award-fill", "Grades"],
        ["fee-tracking.html", "fee-tracking", "bi-cash-coin", "Fee Tracking"],
        ["settings.html", "settings", "bi-gear-fill", "Settings"]
    ];

    return `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-brand">
        <div class="brand-mark"><i class="bi bi-mortarboard-fill"></i></div>
        <div class="brand-copy">
          <p class="brand-title">${escapeHtml(workspace.settings.schoolName)}</p>
          <p class="brand-subtitle">Admin Control Center</p>
        </div>
      </div>

      <nav class="sidebar-nav" aria-label="Primary navigation">
        ${navItems.map((item) => `
          <a class="nav-link ${activePage === item[1] ? "active" : ""}" href="${item[0]}" data-page="${item[1]}">
            <span class="nav-icon"><i class="bi ${item[2]}"></i></span>
            <span class="nav-text">${item[3]}</span>
          </a>
        `).join("")}
      </nav>

      <div class="sidebar-footer">
        <strong>${escapeHtml(workspace.settings.academicSession)}</strong>
        <div>${escapeHtml(workspace.settings.adminEmail)}</div>
      </div>
    </aside>
  `;
}

function setActiveNav() {
    const currentFile = window.location.pathname.split("/").pop() || "index.html";

    $(".nav-link").removeClass("active");
    $(`.nav-link[href="${currentFile}"]`).addClass("active");
}

function showStatus(message, type = "success") {
    if (!$("#statusArea").length) {
        $("body").append('<div class="status-area" id="statusArea"></div>');
    }

    const id = generateId("status");
    const status = $(`
    <div class="status-message ${escapeHtml(type)}" id="${id}">
      ${escapeHtml(message)}
    </div>
  `);

    $("#statusArea").append(status);

    setTimeout(() => {
        $(`#${id}`).fadeOut(200, function () {
            $(this).remove();
        });
    }, 3200);
}

function renderEmptyState(message) {
    return `
    <div class="empty-state">
      <div>
        <strong>No records found</strong>
        <span>${escapeHtml(message)}</span>
      </div>
    </div>
  `;
}

function downloadJson(filename, data) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

function copyText(text, message = "Copied to clipboard.") {
    if (!navigator.clipboard) {
        showStatus("Clipboard is not available in this browser.", "warning");
        return;
    }

    navigator.clipboard
        .writeText(text)
        .then(() => showStatus(message, "success"))
        .catch(() => showStatus("Could not copy text.", "danger"));
}

function applyThemeSettings() {
    const saved = localStorage.getItem(WORKSPACE_KEY);
    if (!saved) return;

    try {
        const workspace = JSON.parse(saved);
        document.body.classList.toggle("light-mode", !workspace.settings.darkMode);
        document.body.classList.toggle("compact-sidebar", Boolean(workspace.settings.compactSidebar));
    } catch (error) {
        console.error("Theme settings failed:", error);
    }
}

function slugify(text) {
    return String(text || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

$(document).ready(function () {
    applyThemeSettings();

    $(document).on("click", "[data-toggle-sidebar]", function () {
        $("body").toggleClass("sidebar-open");
    });

    $(document).on("click", ".sidebar .nav-link", function () {
        $("body").removeClass("sidebar-open");
    });

    setActiveNav();
});