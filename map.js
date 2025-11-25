// Custom marker icon for 'Planned'
function getMarkerIcon() {
  return L.icon({
    iconUrl: "marker-icon-blue.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -40],
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
  });
}

// Initialize map
const map = L.map('map').setView([56.1304, -106.3468], 4);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Fetch and display planned projects
fetch('projects.json')
  .then(res => res.json())
  .then(projects => {
    projects.forEach(p => {
      if (p.status === "Planned" && p.latitude && p.longitude) {
        L.marker([p.latitude, p.longitude], { icon: getMarkerIcon() })
          .addTo(map)
          .bindPopup(
            `<div style="font-size:1.04em;">
               <b>${p.name}</b><br>
               <strong>Province:</strong> ${p.province}<br>
               <strong>Planned Budget:</strong> $${(+p.budget).toLocaleString()}<br>
               <strong>About:</strong> ${p.description}<br>
               <strong>Why planned:</strong> ${p.reason}
            </div>`
          );
      }
    });
  })
  .catch(err => console.error('Error loading projects:', err));
