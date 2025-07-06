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
const crowdIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/476/476863.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
})

export default function CrowdedMap({ userLocation, crowdedAreas }: {
  userLocation: { lat: number, lng: number } | null,
  crowdedAreas: { name: string, crowd_level: string, people_count: number, lat: number, lng: number }[]
}) {
  return (
    <MapContainer
      center={userLocation ? [userLocation.lat, userLocation.lng] : [13.7456, 100.5347]}
      zoom={14}
      style={{ height: '100%', width: '100%' }}
      className="rounded-lg"
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
      {crowdedAreas.map((area, idx) => (
        <Marker key={idx} position={[area.lat, area.lng]} icon={crowdIcon}>
          <Popup>
            <b>{area.name}</b><br />
            ระดับความแออัด: {area.crowd_level}<br />
            จำนวนคน: {area.people_count} คน
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
} 