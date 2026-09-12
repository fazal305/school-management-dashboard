# School Management Dashboard

A browser-based school management dashboard for managing students,
teachers, attendance, timetable, grades, fee tracking, dashboard
analytics, settings, and local workspace persistence.

## Live Links

- GitHub Repository: [fazal305/school-management-dashboard](https://github.com/fazal305/school-management-dashboard)
- Live Demo: [https://fazal305.github.io/school-management-dashboard/](https://fazal305.github.io/school-management-dashboard/)

## Overview

School Management Dashboard is a professional multi-page frontend application for internal school administration. It uses localStorage as a browser database so students, teachers, attendance, timetable entries, grades, fee records, settings, and activity logs persist across pages without a backend.

The interface is designed as a polished dark enterprise dashboard with responsive layouts, reusable navigation, module-specific workflows, Chart.js analytics, and practical CRUD behavior.

This is the primary build of a shared admin-dashboard shell (sidebar navigation, KPI cards, Chart.js analytics, dark enterprise theme) that's also adapted for a [CRM](https://github.com/fazal305/crm-dashboard), an [HR portal](https://github.com/fazal305/hr-management-portal), and a [CMS admin panel](https://github.com/fazal305/cms-admin-panel) — each swaps in domain-specific data and workflows on top of the same underlying system.

## Pages

- Dashboard: `index.html`
- Students: `students.html`
- Teachers: `teachers.html`
- Attendance: `attendance.html`
- Timetable: `timetable.html`
- Grades: `grades.html`
- Fee Tracking: `fee-tracking.html`
- Settings: `settings.html`

## Features

- Multi-page browser application architecture
- Shared sidebar navigation with active page highlighting
- Dashboard metrics for students, teachers, attendance, timetable, grades, and fees
- Attendance and class distribution charts
- Student CRUD with class, section, roll number, guardian details, status, search, and filters
- Teacher CRUD with subjects, assigned classes, status, search, and filters
- Attendance marking by class and section
- Duplicate attendance prevention per student and date
- Attendance summary cards and historical filters
- Weekly timetable grid by day and period
- Teacher double-booking prevention
- Grade recording with percentage and letter grade calculation
- Report card preview per student
- Fee ledger with payment status, due dates, totals, pending balance, and receipt preview
- Fee ledger JSON export
- Settings for school name, admin email, currency, academic session, dark mode, and compact sidebar
- Full workspace JSON export and import
- Demo data reset and localStorage clearing
- Responsive Bootstrap-based layout
- Page-specific CSS and JavaScript files

## Technologies Used

- HTML5
- CSS3
- Bootstrap 5
- jQuery
- Vanilla JavaScript
- Chart.js
- LocalStorage
- Blob API
- Clipboard API

## Learning Outcomes

- Build a no-build multi-page frontend application
- Organize shared and page-specific CSS
- Organize shared and page-specific JavaScript
- Persist structured application state in localStorage
- Implement CRUD workflows without a backend
- Build search and filter logic across multiple modules
- Render charts from browser state
- Prevent duplicate and conflicting workflow states
- Calculate grades, fee totals, pending balances, and dashboard summaries
- Export and import JSON data in the browser
- Create a professional portfolio-ready admin dashboard UI

## Architecture Notes

- Multi-page frontend architecture: Each major module has its own HTML file and uses normal browser links for navigation.
- Shared JavaScript utilities: `js/shared.js` contains workspace persistence, formatting, calculations, sidebar rendering, status messages, JSON download, clipboard helpers, theme handling, and ID generation.
- Shared CSS plus page-specific CSS: `styles.css` defines the global dashboard shell, sidebar, cards, forms, tables, badges, responsive rules, and theme variables. Each module has its own CSS file in `css/` for page-specific layouts.
- localStorage workspace model: The browser stores one workspace object containing settings, students, teachers, attendance, timetable, grades, fee records, and activity logs.
- Student/teacher CRUD workflows: Students and teachers can be created, edited, deleted, searched, filtered, and persisted locally.
- Attendance and timetable workflow state: Attendance prevents duplicate records for the same student and date. Timetable prevents a teacher from being assigned to two classes in the same day and period.
- Grade calculation and report card preview: Grade records calculate letter grades automatically and generate a student report card preview.
- Fee ledger and payment tracking: Fee records calculate totals, paid amounts, pending balances, status badges, summaries, receipt previews, and JSON exports.
- Chart.js dashboard rendering: The dashboard uses Chart.js for attendance distribution and class-wise student distribution.
- No-build browser architecture: There are no frameworks, package managers, build tools, or servers required. Bootstrap, Bootstrap Icons, jQuery, and Chart.js load through CDNs.

## Folder Structure

```text
school-management-dashboard/
  index.html
  students.html
  teachers.html
  attendance.html
  timetable.html
  grades.html
  fee-tracking.html
  settings.html

  styles.css

  css/
    dashboard.css
    students.css
    teachers.css
    attendance.css
    timetable.css
    grades.css
    fee-tracking.css
    settings.css

  js/
    shared.js
    dashboard.js
    students.js
    teachers.js
    attendance.js
    timetable.js
    grades.js
    fee-tracking.js
    settings.js

  README.md
  LICENSE
  .gitignore
```

How To Run Locally
git clone https://github.com/fazal305/school-management-dashboard.git
cd school-management-dashboard
start index.html
You can also open index.html directly from the project folder in any modern browser.
How To Use
Open index.html to view the dashboard.
Use the sidebar to move between Students, Teachers, Attendance, Timetable, Grades, Fee Tracking, and Settings.
Add or edit students and teachers first so the other modules have people to reference.
Mark attendance by choosing a date, class, and section.
Build timetable entries by selecting a class, day, period, teacher, and subject.
Record grades for students and preview report cards.
Record fee payments and preview receipts.
Use Settings to update school details, toggle UI preferences, export/import workspace JSON, reset demo data, or clear localStorage.
Sample Workflow
Add teacher: Go to Teachers, enter a faculty profile, assign subjects and classes, then save.
Add student: Go to Students, enter student details, assign class, section, roll number, guardian details, and status.
Build timetable entry: Go to Timetable, choose a day and period, assign a teacher and subject, then save.
Mark attendance: Go to Attendance, select date, class, and section, then mark each student as Present, Absent, Late, or Leave.
Record grade: Go to Grades, choose a student, subject, exam type, marks obtained, total marks, and term.
Record fee payment: Go to Fee Tracking, choose a student, month, fee components, payment amount, status, and due date.
Preview report card: Go to Grades and select a student in the Report Card Preview panel.
Export workspace: Go to Settings and download the full workspace JSON backup.
