// Create the map centered on Canada
const map = L.map('map').setView([56.1304, -106.3468], 4);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Load project data from projects.json
fetch('projects.json')
  .then(res => res.json())
  .then(projects => {
    projects.forEach(p => {
      if (p.latitude && p.longitude) {
        L.marker([p.latitude, p.longitude])
          .addTo(map)
          .bindPopup(
            `<b>${p.name}</b><br>` +
            `${p.status}<br>` +
            `${p.province}<br>` +
            `Budget: $${p.budget.toLocaleString()}`
          );
      }
    });
  })
  .catch(err => console.error('Error loading projects:', err));
