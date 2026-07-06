function renderSettingsForm() {
    const workspace = loadWorkspace();

    $("#schoolName").val(workspace.settings.schoolName);
    $("#adminEmail").val(workspace.settings.adminEmail);
    $("#currency").val(workspace.settings.currency);
    $("#academicSession").val(workspace.settings.academicSession);
    $("#darkMode").prop("checked", Boolean(workspace.settings.darkMode));
    $("#compactSidebar").prop("checked", Boolean(workspace.settings.compactSidebar));

    renderWorkspacePreview();
}

function saveSettings() {
    const workspace = loadWorkspace();

    workspace.settings.schoolName = $("#schoolName").val().trim();
    workspace.settings.adminEmail = $("#adminEmail").val().trim();
    workspace.settings.currency = $("#currency").val().trim().toUpperCase();
    workspace.settings.academicSession = $("#academicSession").val().trim();
    workspace.settings.darkMode = $("#darkMode").is(":checked");
    workspace.settings.compactSidebar = $("#compactSidebar").is(":checked");

    if (!workspace.settings.schoolName || !workspace.settings.adminEmail || !workspace.settings.currency || !workspace.settings.academicSession) {
        showStatus("Please complete all settings fields.", "warning");
        return;
    }

    workspace.activityLog.unshift({
        id: generateId("log"),
        module: "Settings",
        action: "Updated settings",
        detail: `Updated workspace settings for ${workspace.settings.schoolName}`,
        createdAt: new Date().toISOString()
    });

    workspace.activityLog = workspace.activityLog.slice(0, 50);
    saveWorkspace(workspace);

    $("#sidebarMount").html(renderSidebar("settings"));
    setActiveNav();
    renderWorkspacePreview();
    showStatus("Settings saved successfully.", "success");
}

function toggleDarkMode() {
    const workspace = loadWorkspace();
    workspace.settings.darkMode = $("#darkMode").is(":checked");
    saveWorkspace(workspace);
    applyThemeSettings();
    renderWorkspacePreview();
}

function toggleCompactSidebar() {
    const workspace = loadWorkspace();
    workspace.settings.compactSidebar = $("#compactSidebar").is(":checked");
    saveWorkspace(workspace);
    applyThemeSettings();
    renderWorkspacePreview();
}

function exportWorkspace() {
    const workspace = loadWorkspace();
    downloadJson("school-management-workspace.json", {
        exportedAt: new Date().toISOString(),
        workspace
    });
    showStatus("Workspace JSON exported.", "success");
}

function importWorkspace(event) {
    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (loadEvent) {
        try {
            const imported = JSON.parse(loadEvent.target.result);
            const workspace = imported.workspace || imported;

            const requiredArrays = ["students", "teachers", "attendance", "timetable", "grades", "feeRecords", "activityLog"];
            const hasValidShape = workspace.settings && requiredArrays.every((key) => Array.isArray(workspace[key]));

            if (!hasValidShape) {
                showStatus("Imported JSON does not match the workspace structure.", "danger");
                return;
            }

            workspace.activityLog.unshift({
                id: generateId("log"),
                module: "Settings",
                action: "Imported workspace",
                detail: "Imported workspace JSON backup",
                createdAt: new Date().toISOString()
            });

            saveWorkspace(workspace);
            $("#sidebarMount").html(renderSidebar("settings"));
            setActiveNav();
            renderSettingsForm();
            showStatus("Workspace imported successfully.", "success");
        } catch (error) {
            console.error(error);
            showStatus("Could not import workspace JSON.", "danger");
        } finally {
            $("#importWorkspaceInput").val("");
        }
    };

    reader.readAsText(file);
}

function resetDemoWorkspace() {
    if (!confirm("Reset all data to the bundled demo workspace? Current local changes will be replaced.")) {
        return;
    }

    resetWorkspace();
    $("#sidebarMount").html(renderSidebar("settings"));
    setActiveNav();
    renderSettingsForm();
    showStatus("Demo workspace restored.", "success");
}

function clearWorkspace() {
    if (!confirm("Clear the saved workspace from localStorage? The app will reseed demo data on reload.")) {
        return;
    }

    localStorage.removeItem(WORKSPACE_KEY);
    const workspace = loadWorkspace();

    workspace.activityLog.unshift({
        id: generateId("log"),
        module: "Settings",
        action: "Cleared workspace",
        detail: "Cleared localStorage and reseeded demo data",
        createdAt: new Date().toISOString()
    });

    saveWorkspace(workspace);
    $("#sidebarMount").html(renderSidebar("settings"));
    setActiveNav();
    renderSettingsForm();
    showStatus("Workspace cleared and demo data reseeded.", "success");
}

function renderWorkspacePreview() {
    const workspace = loadWorkspace();
    $("#workspaceJsonPreview").text(JSON.stringify(workspace, null, 2));
}

$(document).ready(function () {
    $("#sidebarMount").html(renderSidebar("settings"));
    applyThemeSettings();
    setActiveNav();

    renderSettingsForm();

    $("#settingsForm").on("submit", function (event) {
        event.preventDefault();
        saveSettings();
    });

    $("#darkMode").on("change", toggleDarkMode);
    $("#compactSidebar").on("change", toggleCompactSidebar);
    $("#exportWorkspaceBtn").on("click", exportWorkspace);
    $("#importWorkspaceInput").on("change", importWorkspace);
    $("#resetDemoWorkspaceBtn").on("click", resetDemoWorkspace);
    $("#clearWorkspaceBtn").on("click", clearWorkspace);

    $("#copyWorkspaceBtn").on("click", function () {
        copyText($("#workspaceJsonPreview").text(), "Workspace JSON copied.");
    });
});