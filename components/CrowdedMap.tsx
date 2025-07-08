"use client"
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'
import React from 'react'

const userIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/64/64113.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
})

function HeatmapLayer({ points }: { points: Array<[number, number, number]> }) {
  const map = useMap()
  React.useEffect(() => {
    if (!map || !(L as any).heatLayer) return
    // Remove previous heat layer if exists
    let heatLayer: any = (map as any)._heatLayer
    if (heatLayer) {
      map.removeLayer(heatLayer)
    }
    heatLayer = (L as any).heatLayer(points, { radius: 35, blur: 25, maxZoom: 17, gradient: { 0.2: 'blue', 0.4: 'lime', 0.7: 'yellow', 1.0: 'red' } })
    heatLayer.addTo(map)
    ;(map as any)._heatLayer = heatLayer
    return () => {
      if (map && heatLayer) map.removeLayer(heatLayer)
    }
  }, [map, points])
  return null
}

export default function CrowdedMap({ userLocation, crowdedAreas }: {
  userLocation: { lat: number, lng: number } | null,
  crowdedAreas: { name: string, crowd_level: string, people_count: number, lat: number, lng: number }[]
}) {
  // Prepare heatmap points: [lat, lng, intensity]
  const heatPoints: [number, number, number][] = crowdedAreas.map(area => [area.lat, area.lng, Math.max(0.1, area.people_count / 100)])
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
      <HeatmapLayer points={heatPoints} />
    </MapContainer>
  )
} 