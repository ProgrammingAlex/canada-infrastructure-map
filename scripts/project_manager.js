const API_URL = 'https://backend-api-production-e1a3.up.railway.app/api';
let allProjects = [];
let currentEditId = null;

window.onload = () => loadProjects();

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
                    <button class="btn-danger" onclick="deleteProject(${project.id}, '${project.name}')">🗑️ Delete</button>
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
        messageDiv.innerHTML = `<div class="success">✓ Project "${result.name}" created successfully!</div>`;

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

        messageDiv.innerHTML = `<div class="success">✓ Project deleted successfully!</div>`;
        loadProjects();

        setTimeout(() => messageDiv.innerHTML = '', 3000);

    } catch (error) {
        messageDiv.innerHTML = `<div class="error">Error deleting project: ${error.message}</div>`;
    }
}

// Close modal on outside click
window.onclick = function(e) {
    const modal = document.getElementById('projectModal');
    if (e.target === modal) closeModal();
};
