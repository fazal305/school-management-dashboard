let attendanceChartInstance = null;
let classDistributionChartInstance = null;

function renderDashboardStats() {
    const workspace = loadWorkspace();
    const today = getTodayDate();
    const attendanceStats = calculateAttendanceStats(workspace, today);
    const feeSummary = calculateFeeSummary(workspace);
    const todayName = new Date(`${today}T00:00:00`).toLocaleDateString("en-US", { weekday: "long" });
    const scheduledToday = workspace.timetable.filter((entry) => entry.day === todayName).length;

    const cards = [
        {
            label: "Total Students",
            value: workspace.students.length,
            note: `${workspace.students.filter((student) => student.status === "Active").length} active students`,
            icon: "bi-people-fill"
        },
        {
            label: "Total Teachers",
            value: workspace.teachers.length,
            note: `${workspace.teachers.filter((teacher) => teacher.status === "Active").length} active faculty`,
            icon: "bi-person-workspace"
        },
        {
            label: "Present Today",
            value: attendanceStats.present,
            note: `${attendanceStats.late} late, ${attendanceStats.leave} on leave`,
            icon: "bi-calendar-check-fill"
        },
        {
            label: "Absent Today",
            value: attendanceStats.absent,
            note: `${attendanceStats.total} attendance records today`,
            icon: "bi-calendar-x-fill"
        },
        {
            label: "Classes Today",
            value: scheduledToday,
            note: `${todayName} timetable periods`,
            icon: "bi-table"
        },
        {
            label: "Collected Fees",
            value: formatCurrency(feeSummary.totalCollected),
            note: `${feeSummary.paid} paid records`,
            icon: "bi-cash-coin"
        },
        {
            label: "Pending Fees",
            value: formatCurrency(feeSummary.totalPending),
            note: `${feeSummary.partial + feeSummary.unpaid + feeSummary.overdue} records need attention`,
            icon: "bi-exclamation-diamond-fill"
        },
        {
            label: "Grade Records",
            value: workspace.grades.length,
            note: `${workspace.settings.academicSession} academic session`,
            icon: "bi-award-fill"
        }
    ];

    $("#dashboardStats").html(cards.map((card) => `
    <article class="stat-card">
      <div class="d-flex align-items-start justify-content-between gap-3">
        <div>
          <p class="stat-label">${escapeHtml(card.label)}</p>
          <p class="stat-value">${escapeHtml(card.value)}</p>
          <p class="stat-note">${escapeHtml(card.note)}</p>
        </div>
        <span class="nav-icon"><i class="bi ${card.icon}"></i></span>
      </div>
    </article>
  `).join(""));
}

function renderAttendanceChart() {
    const workspace = loadWorkspace();
    const today = getTodayDate();
    const stats = calculateAttendanceStats(workspace, today);
    const ctx = document.getElementById("attendanceChart");

    $("#attendanceDateBadge").text(formatDate(today));

    if (!ctx || typeof Chart === "undefined") return;

    if (attendanceChartInstance) {
        attendanceChartInstance.destroy();
    }

    attendanceChartInstance = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Present", "Absent", "Late", "Leave"],
            datasets: [
                {
                    data: [stats.present, stats.absent, stats.late, stats.leave],
                    backgroundColor: ["#4ade80", "#fb7185", "#facc15", "#94a3b8"],
                    borderColor: "rgba(255,255,255,0.16)",
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue("--text")
                    }
                }
            }
        }
    });
}

function renderClassDistributionChart() {
    const workspace = loadWorkspace();
    const ctx = document.getElementById("classDistributionChart");

    if (!ctx || typeof Chart === "undefined") return;

    const classMap = workspace.students.reduce((map, student) => {
        const key = `${student.classGrade}-${student.section}`;
        map[key] = (map[key] || 0) + 1;
        return map;
    }, {});

    const labels = Object.keys(classMap).sort();
    const values = labels.map((label) => classMap[label]);

    if (classDistributionChartInstance) {
        classDistributionChartInstance.destroy();
    }

    classDistributionChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [
                {
                    label: "Students",
                    data: values,
                    backgroundColor: "rgba(34, 211, 238, 0.62)",
                    borderColor: "#22d3ee",
                    borderWidth: 1,
                    borderRadius: 12
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: { color: getComputedStyle(document.documentElement).getPropertyValue("--muted") },
                    grid: { color: "rgba(154,171,199,0.12)" }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0,
                        color: getComputedStyle(document.documentElement).getPropertyValue("--muted")
                    },
                    grid: { color: "rgba(154,171,199,0.12)" }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function renderRecentActivityLog() {
    const workspace = loadWorkspace();
    const logs = workspace.activityLog.slice(0, 8);

    if (!logs.length) {
        $("#recentActivityLog").html(renderEmptyState("Activity will appear here as you manage the workspace."));
        return;
    }

    $("#recentActivityLog").html(`
    <div class="activity-list">
      ${logs.map((log) => `
        <article class="activity-item">
          <p class="activity-title">${escapeHtml(log.module)} · ${escapeHtml(log.action)}</p>
          <p class="activity-detail">${escapeHtml(log.detail)}</p>
          <p class="activity-time">${escapeHtml(new Date(log.createdAt).toLocaleString())}</p>
        </article>
      `).join("")}
    </div>
  `);
}

function renderQuickActions() {
    const actions = [
        {
            href: "students.html",
            icon: "bi-person-plus-fill",
            title: "Add Student",
            text: "Create a student profile and assign class, section, and roll number."
        },
        {
            href: "teachers.html",
            icon: "bi-person-workspace",
            title: "Manage Teachers",
            text: "Assign subjects, classes, and faculty status."
        },
        {
            href: "attendance.html",
            icon: "bi-calendar-check-fill",
            title: "Mark Attendance",
            text: "Record today’s attendance by class and section."
        },
        {
            href: "timetable.html",
            icon: "bi-table",
            title: "Build Timetable",
            text: "Schedule periods while preventing teacher double-booking."
        },
        {
            href: "grades.html",
            icon: "bi-award-fill",
            title: "Record Grades",
            text: "Calculate percentages and preview report cards."
        },
        {
            href: "fee-tracking.html",
            icon: "bi-cash-coin",
            title: "Track Fees",
            text: "Post payments, monitor pending balances, and preview receipts."
        }
    ];

    $("#quickActions").html(actions.map((action) => `
    <a class="action-card" href="${action.href}">
      <span class="action-icon"><i class="bi ${action.icon}"></i></span>
      <span>
        <h3>${escapeHtml(action.title)}</h3>
        <p>${escapeHtml(action.text)}</p>
      </span>
    </a>
  `).join(""));
}

$(document).ready(function () {
    $("#sidebarMount").html(renderSidebar("dashboard"));
    applyThemeSettings();
    setActiveNav();

    renderDashboardStats();
    renderAttendanceChart();
    renderClassDistributionChart();
    renderRecentActivityLog();
    renderQuickActions();
});