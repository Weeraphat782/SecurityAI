"use client"
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const userIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/64/64113.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
})
const dangerIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/565/565547.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
})

export default function CrimeMap({ userLocation, hotspots }: {
  userLocation: { lat: number, lng: number } | null,
  hotspots: { name: string, crime_type: string, incident_count: number, lat: number, lng: number }[]
}) {
  return (
    <MapContainer
      center={userLocation ? [userLocation.lat, userLocation.lng] : [13.7456, 100.5347]}
      zoom={14}
      style={{ height: 400, width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
          <Popup>คุณอยู่ที่นี่</Popup>
        </Marker>
      )}
      {hotspots.map((hotspot, idx) => (
        <Marker key={idx} position={[hotspot.lat, hotspot.lng]} icon={dangerIcon}>
          <Popup>
            <b>{hotspot.name}</b><br />
            ประเภทคดี: {hotspot.crime_type}<br />
            จำนวนคดี: {hotspot.incident_count}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
} 