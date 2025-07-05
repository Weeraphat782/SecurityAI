"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Shield,
  MapPin,
  MessageSquare,
  Camera,
  Phone,
  Mail,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Upload,
} from "lucide-react"
import { typhoonAIService } from '@/lib/typhoon-ai-service'
import dynamic from 'next/dynamic'

const CrimeMap = dynamic(() => import('@/components/CrimeMap'), { ssr: false })

const crimeHotspots = [
  { name: "BTS สยาม", crime_type: "ล้วงกระเป๋า", incident_count: 12, lat: 13.7456, lng: 100.5347 },
  { name: "BTS หมอชิต", crime_type: "ชิงทรัพย์", incident_count: 7, lat: 13.8020, lng: 100.5536 },
  { name: "สวนลุมพินี", crime_type: "ทำร้ายร่างกาย", incident_count: 3, lat: 13.7300, lng: 100.5410 },
  { name: "CentralWorld", crime_type: "ล้วงกระเป๋า", incident_count: 9, lat: 13.7466, lng: 100.5392 },
  { name: "ตลาดนัดจตุจักร", crime_type: "ชิงทรัพย์", incident_count: 5, lat: 13.7995, lng: 100.5510 },
  { name: "MRT ห้วยขวาง", crime_type: "ชิงทรัพย์", incident_count: 15, lat: 13.7766, lng: 100.5740 },
]

export default function AISecurityApp() {
  const [scanResult, setScanResult] = useState<any>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [textInput, setTextInput] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [nearbyHotspot, setNearbyHotspot] = useState<any>(null)

  // top 3 จุดที่ incident_count มากที่สุด (ใช้ useMemo ป้องกัน infinite loop)
  const topHotspots = useMemo(() => {
    return [...crimeHotspots].sort((a, b) => b.incident_count - a.incident_count).slice(0, 3)
  }, [])

  // Mock scam detection function
  const detectScam = async (text: string) => {
    setIsScanning(true)
    
    // วิเคราะห์ข้อความจริงด้วย Typhoon AI
    const analysis = await typhoonAIService.analyzeText(text)

    setScanResult({
      type: "text",
      riskLevel: analysis.riskLevel,
      foundKeywords: analysis.keywords,
      confidence: analysis.confidence,
      scamType: analysis.scamType,
      explanation: analysis.explanation,
      recommendations: analysis.recommendations,
    })
    setIsScanning(false)
  }

  // Mock image analysis
  const analyzeImage = async (file: File) => {
    setIsScanning(true)
    await new Promise((resolve) => setTimeout(resolve, 3000))

    const fakeProfiles = ["fake_profile_1.jpg", "scammer_photo.png", "stolen_image.jpg"]
    const isScam = Math.random() > 0.6

    setScanResult({
      type: "image",
      riskLevel: isScam ? "high" : "low",
      isReversed: true,
      originalSource: isScam ? "Found in scam database" : "Original image",
      confidence: Math.random() * 100,
      scamType: isScam ? "Fake Profile" : "Legitimate Image",
    })
    setIsScanning(false)
  }

  // ฟังก์ชันคำนวณระยะห่าง (Haversine formula)
  function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371000 // Radius of the earth in m
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a =
      0.5 - Math.cos((lat2 - lat1) * Math.PI / 180) / 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      (1 - Math.cos((lon2 - lon1) * Math.PI / 180)) / 2
    return R * 2 * Math.asin(Math.sqrt(a))
  }

  // ขอ location เมื่อกดปุ่ม (ไม่ขออัตโนมัติ)
  const handleShareLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      })
    } else {
      alert('เบราว์เซอร์ของคุณไม่รองรับการแชร์ Location')
    }
  }

  // ตรวจสอบว่าผู้ใช้อยู่ใกล้ hotspot หรือไม่ (เมื่อ userLocation เปลี่ยน)
  useEffect(() => {
    if (!userLocation) return
    const found = topHotspots.find(hotspot => {
      const dist = getDistanceFromLatLonInMeters(userLocation.lat, userLocation.lng, hotspot.lat, hotspot.lng)
      return dist <= 5000 // 5 กม.
    })
    setNearbyHotspot(found || null)
  }, [userLocation, topHotspots])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">AI Web Security System</h1>
          </div>
          <p className="text-gray-600">ระบบตรวจจับการหลอกลวงออนไลน์ด้วย AI</p>
        </div>

        <Tabs defaultValue="location" className="space-y-6">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="location">พื้นที่เสี่ยงอันตราย</TabsTrigger>
          </TabsList>

          <TabsContent value="location" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  พื้นที่เสี่ยงอันตราย
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Button onClick={handleShareLocation}>แชร์ Location</Button>
                  {userLocation && (
                    <div className="mt-2 text-sm">
                      <span>ตำแหน่งของคุณ: {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}</span>
                    </div>
                  )}
                  {userLocation && (
                    <div className="mt-2">
                      {nearbyHotspot ? (
                        <div className="text-red-600 font-semibold">
                          ⚠️ คุณอยู่ใกล้พื้นที่เสี่ยง: {nearbyHotspot.name} <br />
                          ประเภทคดี: {nearbyHotspot.crime_type} <br />
                          จำนวนคดี: {nearbyHotspot.incident_count}
                        </div>
                      ) : (
                        <div className="text-green-600 font-semibold">
                          ✅ คุณไม่ได้อยู่ใกล้พื้นที่เสี่ยงอันตราย
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {topHotspots.map((area, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-gray-500" />
                        <div>
                          <h3 className="font-medium">{area.name}</h3>
                          <p className="text-sm text-gray-600">{area.crime_type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{area.incident_count} คดี</span>
                      </div>
                    </div>
                  ))}
                </div>
                <CrimeMap userLocation={userLocation} hotspots={topHotspots} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
