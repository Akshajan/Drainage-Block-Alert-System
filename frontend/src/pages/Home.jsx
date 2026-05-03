import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import { io } from 'socket.io-client';

// Fix typical Leaflet default icon bug in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const makeSensorIcon = (label) => L.divIcon({
  html: `<div style="background:#05239e; color:white; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:bold; border:2px solid white; box-shadow:0 2px 4px rgba(0,0,0,0.3);">${label}</div>`,
  className: '',
  iconSize: [26, 26],
  iconAnchor: [13, 13]
});

const markerClassPending = L.divIcon({ html: `<div style="background:#ef4444; width:12px; height:12px; border-radius:50%; border:1px solid black;"></div>`, className: ''});
const markerClassResolved = L.divIcon({ html: `<div style="background:#10b981; width:12px; height:12px; border-radius:50%; border:1px solid black;"></div>`, className: ''});

const SENSORS = [
  { id: "s1", name: "Sensor 1", label: "S1", lat: 8.508711, lng: 76.944873 },
  { id: "s2", name: "Sensor 2", label: "S2", lat: 8.505226, lng: 76.942288 },
  { id: "s3", name: "Sensor 3", label: "S3", lat: 8.504053, lng: 76.938559 },
  { id: "s4", name: "Sensor 4", label: "S4", lat: 8.506787, lng: 76.939088 },
];

export default function Home() {
  const [reports, setReports] = useState([]);
  const [segmentData, setSegmentData] = useState(null);

  useEffect(() => {
    // Fetch reports from backend
    axios.get('http://localhost:3000/api/reports')
      .then(res => setReports(res.data.reports))
      .catch(err => console.error("Could not fetch reports:", err));

    // Initial fetch of segment status
    axios.get('http://localhost:3000/api/latest/segment?segment_id=SEG_A')
      .then(res => setSegmentData(res.data?.data))
      .catch(err => console.error("Segment fetch error:", err));

    // Setup Socket.IO for real-time updates
    const socket = io('http://localhost:3000');
    
    socket.on('segmentUpdate', (newData) => {
      if (newData && newData.data) {
        setSegmentData(newData.data);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const parseCoordinates = (url) => {
    try {
      if (!url) return null;
      if (url.includes('openstreetmap.org')) {
          const urlObj = new URL(url);
          const mlat = urlObj.searchParams.get('mlat');
          const mlon = urlObj.searchParams.get('mlon');
          if (mlat && mlon) return { lat: parseFloat(mlat), lng: parseFloat(mlon) };
      }
      return null;
    } catch(e) { return null; }
  };

  const isBlocked = segmentData?.is_blocked === 1 || segmentData?.is_blocked === "1" || segmentData?.is_blocked === true;

  return (
    <div>
      <h2 style={{marginTop: 0}}>Reported Locations Map</h2>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <MapContainer center={[8.503899, 76.940743]} zoom={14} style={{ height: '60vh', width: '100%', zIndex: 0 }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          {/* User Reports */}
          {reports.map((r, idx) => {
            const coords = parseCoordinates(r.block_location);
            if (!coords) return null;
            return (
              <Marker key={idx} position={[coords.lat, coords.lng]} icon={r.status === 'resolved' ? markerClassResolved : markerClassPending}>
                <Popup>
                  <b>{r.name}</b><br/>{r.block_details}<br/>
                  <small>{new Date(r.reported_at).toLocaleString()}</small>
                </Popup>
              </Marker>
            );
          })}

          {/* Sensors */}
          {SENSORS.map(s => (
            <Marker key={s.id} position={[s.lat, s.lng]} icon={makeSensorIcon(s.label)}>
              <Popup>{s.name}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <h2>Sensor-Based Status</h2>
      <div className="card">
        <p><strong>Segment updated at:</strong> {segmentData?.time ? new Date(segmentData.time).toLocaleString() : 'Loading...'}</p>
        <p>
          <strong>Status:</strong>{' '}
          <span className={`badge ${isBlocked ? 'red' : 'green'}`}>
            {isBlocked ? 'BLOCK DETECTED' : 'NO BLOCK'}
          </span>
        </p>
      </div>

      <h2>News Feed</h2>
      {reports.map(r => (
        <div className="card" key={r.id}>
          <div style={{ display: 'flex', gap: '15px' }}>
             <img src={r.photo_path ? `http://localhost:3000/uploads/${r.photo_path.split('/').pop()}` : `http://localhost:3000/images/default-drainage.jpg`} alt="report" style={{width: '200px', borderRadius: '8px', objectFit: 'cover'}} />
             <div>
                <h3>{r.name}</h3>
                <p>{r.block_details}</p>
                <p style={{color: 'var(--muted)', fontSize: '0.9rem'}}>{new Date(r.reported_at).toLocaleString()}</p>
                <span className={`badge ${r.status === 'resolved' ? 'green' : 'red'}`}>
                  {r.status.toUpperCase()}
                </span>
             </div>
          </div>
        </div>
      ))}
    </div>
  );
}
