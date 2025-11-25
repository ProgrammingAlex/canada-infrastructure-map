let allProjects = [];

function timeSincePlanned(dateStr) {
  const planned = new Date(dateStr), now = new Date();
  let years = now.getFullYear() - planned.getFullYear();
  let months = now.getMonth() - planned.getMonth();
  let days = now.getDate() - planned.getDate();
  if (days < 0) { months -= 1; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
  if (months < 0) { years -= 1; months += 12; }
  let parts = [];
  if (years > 0) parts.push(`${years} year${years > 1 ? "s" : ""}`);
  if (months > 0) parts.push(`${months} month${months > 1 ? "s" : ""}`);
  if (years === 0 && months === 0) parts.push(`${days} day${days > 1 ? "s" : ""}`);
  return parts.join(", ") + " ago";
}

function getMarkerIcon(status) {
  return L.icon({
    iconUrl: status === "In-Progress"
      ? "marker-icon-green.png"
      : "marker-icon-blue.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -40],
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
  });
}

const map = L.map('map').setView([56.1304, -106.3468], 4);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let markerGroup = L.layerGroup().addTo(map);

function updateMarkers() {
  markerGroup.clearLayers();
  const province = document.getElementById("province-filter").value;
  const minBudget = parseFloat(document.getElementById("budget-filter").value || "0") * 1e9;
  allProjects
    .filter(p =>
      (province === "All" || p.province === province) &&
      p.budget >= minBudget &&
      p.latitude && p.longitude
    )
    .forEach(p => {
      L.marker([p.latitude, p.longitude], { icon: getMarkerIcon(p.status) })
        .bindPopup(
          `<div style="font-size:1.04em;">
             <b>${p.name}</b><br>
             <strong>Status:</strong> ${p.status}<br>
             <strong>Province:</strong> ${p.province}<br>
             <strong>Budget:</strong> $${(+p.budget).toLocaleString()}<br>
             <strong>About:</strong> ${p.description}<br>
             <strong>Why planned:</strong> ${p.reason}<br>
             <strong>Since:</strong> ${p.planned_date} (${timeSincePlanned(p.planned_date)})
          </div>`
        ).addTo(markerGroup);
    });
}
<script>
document.getElementById("admin-access-btn").addEventListener("click", function() {
    window.location.href = "admin.html";
});
</script>
fetch('projects.json')
  .then(res => res.json())
  .then(data => {
    allProjects = data;
    updateMarkers();
    document.getElementById("province-filter").addEventListener("change", updateMarkers);
    document.getElementById("budget-filter").addEventListener("change", updateMarkers);
  })
  .catch(err => console.error('Error loading projects:', err));
