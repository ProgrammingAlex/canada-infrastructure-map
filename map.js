// Helper function to compute time since planned
function timeSincePlanned(dateStr) {
  const planned = new Date(dateStr);
  const now = new Date();
  let years = now.getFullYear() - planned.getFullYear();
  let months = now.getMonth() - planned.getMonth();
  let days = now.getDate() - planned.getDate();

  if (days < 0) {
    months -= 1;
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  let parts = [];
  if (years > 0) parts.push(`${years} year${years > 1 ? "s" : ""}`);
  if (months > 0) parts.push(`${months} month${months > 1 ? "s" : ""}`);
  if (years === 0 && months === 0) parts.push(`${days} day${days > 1 ? "s" : ""}`);

  return parts.join(", ") + " ago";
}

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
               <strong>Why planned:</strong> ${p.reason}<br>
               <strong>Planned:</strong> ${p.planned_date} (${timeSincePlanned(p.planned_date)})
            </div>`
          );
      }
    });
  })
  .catch(err => console.error('Error loading projects:', err));
