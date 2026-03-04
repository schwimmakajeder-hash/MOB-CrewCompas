import L from 'leaflet';

// Fix for default Leaflet marker icons in Vite due to bundler paths
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

document.addEventListener('DOMContentLoaded', () => {
  const startScreen = document.getElementById('start-screen');
  const mapScreen = document.getElementById('map-screen');
  const mobButton = document.getElementById('mob-button');
  const resetButton = document.getElementById('reset-button');
  const statusText = document.getElementById('status-text');

  const latVal = document.getElementById('lat-val');
  const lonVal = document.getElementById('lon-val');
  const timeVal = document.getElementById('time-val');
  const accVal = document.getElementById('acc-val');

  let map = null;
  let marker = null;

  function initMap(lat, lon) {
    if (!map) {
      // Map requires absolute positioning to resize properly or flex filling
      map = L.map('map').setView([lat, lon], 16);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(map);

      // Custom Red Marker
      const redIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      marker = L.marker([lat, lon], {icon: redIcon}).addTo(map);
      marker.bindPopup("<b>MOB Position</b>").openPopup();
    } else {
      map.setView([lat, lon], 16);
      marker.setLatLng([lat, lon]);
    }

    // Force map to recalculate size after displaying wrapper
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }

  function formatCoord(coord, isLat) {
    const dir = isLat ? (coord >= 0 ? "N" : "S") : (coord >= 0 ? "E" : "W");
    const abs = Math.abs(coord);
    const deg = Math.floor(abs);
    const min = ((abs - deg) * 60).toFixed(3);
    return `${dir} ${deg}° ${min}'`;
  }

  mobButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
      statusText.innerText = 'Geolocation wird vom Browser nicht unterstützt!';
      return;
    }

    statusText.innerText = 'Position wird abgerufen...';
    mobButton.style.transform = 'scale(0.9)';
    
    // Attempt high accuracy position request
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const accuracy = position.coords.accuracy;
        const timestamp = new Date(position.timestamp);

        latVal.innerText = formatCoord(lat, true);
        lonVal.innerText = formatCoord(lon, false);
        accVal.innerText = `± ${Math.round(accuracy)} m`;
        timeVal.innerText = timestamp.toLocaleTimeString('de-DE', { hour12: false });

        // Switch screens
        startScreen.classList.remove('active');
        mapScreen.classList.add('active');

        // Reset button state
        statusText.innerText = 'Drücken um Position sofort zu speichern';
        mobButton.style.transform = 'scale(1)';

        initMap(lat, lon);
      },
      (error) => {
        let msg = '';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            msg = "Berechtigung auf Standort verweigert.";
            break;
          case error.POSITION_UNAVAILABLE:
            msg = "Standortinformationen sind nicht verfügbar.";
            break;
          case error.TIMEOUT:
            msg = "Zeitüberschreitung der Standortanfrage.";
            break;
          default:
            msg = "Ein unbekannter Fehler ist aufgetreten.";
            break;
        }
        statusText.innerText = msg;
        mobButton.style.transform = 'scale(1)';
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });

  resetButton.addEventListener('click', () => {
    mapScreen.classList.remove('active');
    startScreen.classList.add('active');
    
    // Clear values
    latVal.innerText = '--.------°';
    lonVal.innerText = '--.------°';
    accVal.innerText = '- m';
    timeVal.innerText = '--:--:--';
  });
});
