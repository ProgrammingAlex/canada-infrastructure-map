const API_URL = 'https://backend-api-production-e1a3.up.railway.app/api';
let allProjects = [];
let allCompanies = [];
let allAssignments = [];
let currentEditId = null;

window.onload = () => loadProjects();

// ===== TAB SWITCHING =====
function switchTab(tab) {
    // Hide all sections
    document.getElementById('projectsSection').style.display = 'none';
    document.getElementById('companiesSection').style.display = 'none';
    document.getElementById('assignmentsSection').style.display = 'none';

    // Reset all tab styles
    document.getElementById('projectsTab').style.background = '#eee';
    document.getElementById('projectsTab').style.color = '#333';
    document.getElementById('companiesTab').style.background = '#eee';
    document.getElementById('companiesTab').style.color = '#333';
    document.getElementById('assignmentsTab').style.background = '#eee';
    document.getElementById('assignmentsTab').style.color = '#333';

    // Show selected section and highlight tab
    if (tab === 'projects') {
        document.getElementById('projectsSection').style.display = 'block';
        document.getElementById('projectsTab').style.background = '#1a73e8';
        document.getElementById('projectsTab').style.color = 'white';
        loadProjects();
    } else if (tab === 'companies') {
        document.getElementById('companiesSection').style.display = 'block';
        document.getElementById('companiesTab').style.background = '#1a73e8';
        document.getElementById('companiesTab').style.color = 'white';
        loadCompanies();
    } else if (tab === 'assignments') {
        document.getElementById('assignmentsSection').style.display = 'block';
        document.getElementById('assignmentsTab').style.background = '#1a73e8';
        document.getElementById('assignmentsTab').style.color = 'white';
        loadAssignments();
    }
}

// ===== PROJECTS SECTION =====

// Load all projects
async function loadProjects() {
    const loading = document.getElementById('loading');
    const container = document.getElementById('projectsContainer');
    const messageDiv = document.getElementById('message');

    loading.style.display = 'block';
    container.innerHTML = '';
    messageDiv.innerHTML = '';

    try {
        const response = await fetch(`${API_URL}/projects`);
        if (!response.ok) throw new Error('Failed to load projects');

        allProjects = await response.json();
        updateStats();
        applyFilters();

    } catch (error) {
        messageDiv.innerHTML = `<div class="error">Error loading projects: ${error.message}</div>`;
    } finally {
        loading.style.display = 'none';
    }
}

function applyFilters() {
    const provinceFilter = document.getElementById('provinceFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    const filtered = allProjects.filter(project => {
        return (!provinceFilter || project.province === provinceFilter)
            && (!statusFilter || project.status === statusFilter)
            && (!searchTerm ||
                project.name.toLowerCase().includes(searchTerm) ||
                project.province.toLowerCase().includes(searchTerm));
    });

    displayProjects(filtered);
}

function displayProjects(projects) {
    const container = document.getElementById('projectsContainer');

    if (projects.length === 0) {
        container.innerHTML = `
                <div class="empty-state">
                    <h3>No projects found</h3>
                    <p>Add a new project to get started!</p>
                </div>`;
        return;
    }

    container.innerHTML = projects.map(project => `
            <div class="project-card">
                <div class="project-name">${project.name}</div>
                <div class="project-info"><strong>Budget:</strong>
                    $${parseFloat(project.budget).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div class="project-info"><strong>Province:</strong> ${project.province}</div>
                <div class="project-info"><strong>City:</strong> ${project.city}</div>
                <div class="project-info"><strong>ID:</strong> ${project.id}</div>
                <span class="status-badge status-${project.status}">
                    ${project.status.replace('-', ' ').toUpperCase()}
                </span>

                <div class="project-actions">
                    <button class="btn-danger" onclick="deleteProject(${project.id}, '${project.name}')">Delete</button>
                </div>
            </div>
        `).join('');
}

function updateStats() {
    const total = allProjects.length;
    const totalBudget = allProjects.reduce((sum, p) => sum + parseFloat(p.budget), 0);
    const avgBudget = total ? totalBudget / total : 0;

    document.getElementById('totalProjects').textContent = total;
    document.getElementById('totalBudget').textContent = '$' + totalBudget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('avgBudget').textContent = '$' + avgBudget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function openAddModal() {
    currentEditId = null;
    document.getElementById('modalTitle').textContent = 'Add New Project';
    document.getElementById('projectForm').reset();
    document.getElementById('projectModal').classList.add('active');
}

function closeModal() {
    document.getElementById('projectModal').classList.remove('active');
}

async function saveProject(event) {
    event.preventDefault();
    const messageDiv = document.getElementById('message');
    messageDiv.innerHTML = '';

    const name = document.getElementById('projectName').value;
    const budget = parseFloat(document.getElementById('projectBudget').value);
    const status = document.getElementById('projectStatus').value;
    const province = document.getElementById('projectProvince').value;
    const city = document.getElementById('projectCity').value;

    let latitude = null, longitude = null;

    try {
        const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city + ', ' + province + ', Canada')}`
        );
        const geoData = await geoRes.json();

        if (geoData.length > 0) {
            latitude = geoData[0].lat;
            longitude = geoData[0].lon;
        } else {
            messageDiv.innerHTML = `<div class="error">Invalid location. Try another city/province.</div>`;
            return;
        }
    } catch {
        messageDiv.innerHTML = `<div class="error">Location service error. Try again.</div>`;
        return;
    }

    const projectData = {
        name,
        budget,
        status,
        province,
        city,
        latitude,
        longitude
    };

    try {
        const response = await fetch(`${API_URL}/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(projectData)
        });

        if (!response.ok) throw new Error('Failed to save project');

        const result = await response.json();
        messageDiv.innerHTML = `<div class="success">Project "${result.name}" created successfully!</div>`;

        closeModal();
        loadProjects();

        setTimeout(() => messageDiv.innerHTML = '', 3000);

    } catch (error) {
        messageDiv.innerHTML = `<div class="error">Error saving project: ${error.message}</div>`;
    }
}

async function deleteProject(id, name) {
    if (!confirm(`Delete "${name}"?`)) return;

    const messageDiv = document.getElementById('message');
    messageDiv.innerHTML = '';

    try {
        const response = await fetch(`${API_URL}/projects/${id}`, { method: 'DELETE' });

        if (!response.ok) throw new Error('Failed to delete project');

        messageDiv.innerHTML = `<div class="success">Project deleted successfully!</div>`;
        loadProjects();

        setTimeout(() => messageDiv.innerHTML = '', 3000);

    } catch (error) {
        messageDiv.innerHTML = `<div class="error">Error deleting project: ${error.message}</div>`;
    }
}

// FILE IMPORT HANDLING

document.getElementById('actual-btn').addEventListener('change', handleFileImport);

async function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const messageDiv = document.getElementById('message');
    messageDiv.innerHTML = '<div class="loading">Uploading and processing file...</div>';

    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_URL}/projects/import`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Import failed');
        }

        let resultHTML = `<div class="success">
            <strong>Import Complete!</strong><br>
            Total projects: ${result.total}<br>
            Successfully imported: ${result.successful}<br>
            Failed: ${result.failed}
        </div>`;

        if (result.failed > 0 && result.details.failed.length > 0) {
            resultHTML += '<div class="error"><strong>Failed Imports:</strong><br>';
            result.details.failed.slice(0, 5).forEach(fail => {
                resultHTML += `<strong>${fail.project}:</strong> ${fail.errors.join(', ')}<br>`;
            });
            if (result.details.failed.length > 5) {
                resultHTML += `...and ${result.details.failed.length - 5} more errors`;
            }
            resultHTML += '</div>';
        }

        messageDiv.innerHTML = resultHTML;

        if (result.successful > 0) {
            loadProjects();
        }

        setTimeout(() => messageDiv.innerHTML = '', 10000);

    } catch (error) {
        messageDiv.innerHTML = `<div class="error">Import error: ${error.message}</div>`;
        setTimeout(() => messageDiv.innerHTML = '', 5000);
    }

    event.target.value = '';
}

// ===== COMPANIES SECTION =====

// Load all companies
async function loadCompanies() {
    const loading = document.getElementById('companyLoading');
    const container = document.getElementById('companiesContainer');
    const messageDiv = document.getElementById('companyMessage');

    loading.style.display = 'block';
    container.innerHTML = '';
    messageDiv.innerHTML = '';

    try {
        const response = await fetch(`${API_URL}/companies`);
        if (!response.ok) throw new Error('Failed to load companies');

        allCompanies = await response.json();
        updateCompanyStats();
        applyCompanyFilters();

    } catch (error) {
        messageDiv.innerHTML = `<div class="error">Error loading companies: ${error.message}</div>`;
    } finally {
        loading.style.display = 'none';
    }
}

function applyCompanyFilters() {
    const provinceFilter = document.getElementById('companyProvinceFilter').value;
    const searchTerm = document.getElementById('companySearchInput').value.toLowerCase();

    const filtered = allCompanies.filter(company => {
        return (!provinceFilter || company.province === provinceFilter)
            && (!searchTerm ||
                company.name.toLowerCase().includes(searchTerm) ||
                company.province.toLowerCase().includes(searchTerm) ||
                company.city.toLowerCase().includes(searchTerm));
    });

    displayCompanies(filtered);
}

function displayCompanies(companies) {
    const container = document.getElementById('companiesContainer');

    if (companies.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No companies found</h3>
                <p>Add a new company to get started!</p>
            </div>`;
        return;
    }

    container.innerHTML = companies.map(company => `
        <div class="project-card">
            <div class="project-name">${company.name}</div>
            <div class="project-info"><strong>Province:</strong> ${company.province}</div>
            <div class="project-info"><strong>City:</strong> ${company.city}</div>
            ${company.email ? `<div class="project-info"><strong>Email:</strong> ${company.email}</div>` : ''}
            ${company.number ? `<div class="project-info"><strong>Phone:</strong> ${company.number}</div>` : ''}
            <div class="project-info"><strong>ID:</strong> ${company.id}</div>

            <div class="project-actions">
                <button class="btn-danger" onclick="deleteCompany(${company.id}, '${company.name.replace(/'/g, "\\'")}')">Delete</button>
            </div>
        </div>
    `).join('');
}

function updateCompanyStats() {
    const total = allCompanies.length;
    document.getElementById('totalCompanies').textContent = total;
}

function openAddCompanyModal() {
    document.getElementById('companyModalTitle').textContent = 'Add New Company';
    document.getElementById('companyForm').reset();
    document.getElementById('companyModal').classList.add('active');
}

function closeCompanyModal() {
    document.getElementById('companyModal').classList.remove('active');
}

async function saveCompany(event) {
    event.preventDefault();
    const messageDiv = document.getElementById('companyMessage');
    messageDiv.innerHTML = '';

    const name = document.getElementById('companyName').value;
    const province = document.getElementById('companyProvince').value;
    const city = document.getElementById('companyCity').value;
    const email = document.getElementById('companyEmail').value;
    const number = document.getElementById('companyNumber').value;

    const companyData = { name, province, city, email, number };

    try {
        const response = await fetch(`${API_URL}/companies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(companyData)
        });

        if (!response.ok) throw new Error('Failed to save company');

        const result = await response.json();
        messageDiv.innerHTML = `<div class="success">Company "${result.name}" created successfully!</div>`;

        closeCompanyModal();
        loadCompanies();

        setTimeout(() => messageDiv.innerHTML = '', 3000);

    } catch (error) {
        messageDiv.innerHTML = `<div class="error">Error saving company: ${error.message}</div>`;
    }
}

async function deleteCompany(id, name) {
    if (!confirm(`Delete "${name}"?`)) return;

    const messageDiv = document.getElementById('companyMessage');
    messageDiv.innerHTML = '';

    try {
        const response = await fetch(`${API_URL}/companies/${id}`, { method: 'DELETE' });

        if (!response.ok) throw new Error('Failed to delete company');

        messageDiv.innerHTML = `<div class="success">Company deleted successfully!</div>`;
        loadCompanies();

        setTimeout(() => messageDiv.innerHTML = '', 3000);

    } catch (error) {
        messageDiv.innerHTML = `<div class="error">Error deleting company: ${error.message}</div>`;
    }
}

// ===== ASSIGNMENTS SECTION =====

// Load all assignments
async function loadAssignments() {
    const loading = document.getElementById('assignmentLoading');
    const container = document.getElementById('assignmentsContainer');
    const messageDiv = document.getElementById('assignmentMessage');

    loading.style.display = 'block';
    container.innerHTML = '';
    messageDiv.innerHTML = '';

    try {
        const response = await fetch(`${API_URL}/assignments`);
        if (!response.ok) throw new Error('Failed to load assignments');

        allAssignments = await response.json();
        updateAssignmentStats();
        applyAssignmentFilters();

    } catch (error) {
        messageDiv.innerHTML = `<div class="error">Error loading assignments: ${error.message}</div>`;
    } finally {
        loading.style.display = 'none';
    }
}

function applyAssignmentFilters() {
    const searchTerm = document.getElementById('assignmentSearchInput').value.toLowerCase();

    const filtered = allAssignments.filter(assignment => {
        return (!searchTerm ||
            assignment.project_name.toLowerCase().includes(searchTerm) ||
            assignment.company_name.toLowerCase().includes(searchTerm) ||
            assignment.project_province.toLowerCase().includes(searchTerm));
    });

    displayAssignments(filtered);
}

function displayAssignments(assignments) {
    const container = document.getElementById('assignmentsContainer');

    if (assignments.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No assignments found</h3>
                <p>Assign a company to a project to get started!</p>
            </div>`;
        return;
    }

    container.innerHTML = assignments.map(assignment => `
        <div class="project-card">
            <div class="project-name">Assignment #${assignment.id}</div>
            <div class="project-info"><strong>Project:</strong> ${assignment.project_name}</div>
            <div class="project-info"><strong>Company:</strong> ${assignment.company_name}</div>
            <div class="project-info"><strong>Location:</strong> ${assignment.project_city}, ${assignment.project_province}</div>
            <div class="project-info"><strong>Status:</strong> ${assignment.project_status.replace('-', ' ').toUpperCase()}</div>
            <div class="project-info"><strong>Created:</strong> ${new Date(assignment.created_at).toLocaleDateString()}</div>

            <div class="project-actions">
                <button class="btn-danger" onclick="deleteAssignment(${assignment.id}, '${assignment.project_name}', '${assignment.company_name}')">Delete</button>
            </div>
        </div>
    `).join('');
}

function updateAssignmentStats() {
    const total = allAssignments.length;
    document.getElementById('totalAssignments').textContent = total;
}

async function openAddAssignmentModal() {
    document.getElementById('assignmentModalTitle').textContent = 'Add New Assignment';
    document.getElementById('assignmentForm').reset();

    // Load projects and companies for dropdowns
    try {
        const [projectsRes, companiesRes] = await Promise.all([
            fetch(`${API_URL}/projects`),
            fetch(`${API_URL}/companies`)
        ]);

        const projects = await projectsRes.json();
        const companies = await companiesRes.json();

        // Populate project dropdown
        const projectSelect = document.getElementById('assignmentProject');
        projectSelect.innerHTML = '<option value="">Select project...</option>' +
            projects.map(p => `<option value="${p.id}">${p.name} (${p.city}, ${p.province})</option>`).join('');

        // Populate company dropdown
        const companySelect = document.getElementById('assignmentCompany');
        companySelect.innerHTML = '<option value="">Select company...</option>' +
            companies.map(c => `<option value="${c.id}">${c.name} (${c.city}, ${c.province})</option>`).join('');

        document.getElementById('assignmentModal').classList.add('active');
    } catch (error) {
        const messageDiv = document.getElementById('assignmentMessage');
        messageDiv.innerHTML = `<div class="error">Error loading data: ${error.message}</div>`;
    }
}

function closeAssignmentModal() {
    document.getElementById('assignmentModal').classList.remove('active');
}

async function saveAssignment(event) {
    event.preventDefault();
    const messageDiv = document.getElementById('assignmentMessage');
    messageDiv.innerHTML = '';

    const project_id = parseInt(document.getElementById('assignmentProject').value);
    const company_id = parseInt(document.getElementById('assignmentCompany').value);

    const assignmentData = { project_id, company_id };

    try {
        const response = await fetch(`${API_URL}/assignments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(assignmentData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save assignment');
        }

        const result = await response.json();
        messageDiv.innerHTML = `<div class="success">Assignment created successfully!</div>`;

        closeAssignmentModal();
        loadAssignments();

        setTimeout(() => messageDiv.innerHTML = '', 3000);

    } catch (error) {
        messageDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
}

async function deleteAssignment(id, projectName, companyName) {
    if (!confirm(`Delete assignment between "${projectName}" and "${companyName}"?`)) return;

    const messageDiv = document.getElementById('assignmentMessage');
    messageDiv.innerHTML = '';

    try {
        const response = await fetch(`${API_URL}/assignments/${id}`, { method: 'DELETE' });

        if (!response.ok) throw new Error('Failed to delete assignment');

        messageDiv.innerHTML = `<div class="success">Assignment deleted successfully!</div>`;
        loadAssignments();

        setTimeout(() => messageDiv.innerHTML = '', 3000);

    } catch (error) {
        messageDiv.innerHTML = `<div class="error">Error deleting assignment: ${error.message}</div>`;
    }
}

// ===== MODAL CLOSE ON OUTSIDE CLICK =====
window.onclick = function(e) {
    const projectModal = document.getElementById('projectModal');
    const companyModal = document.getElementById('companyModal');
    const assignmentModal = document.getElementById('assignmentModal');
    if (e.target === projectModal) closeModal();
    if (e.target === companyModal) closeCompanyModal();
    if (e.target === assignmentModal) closeAssignmentModal();
};
