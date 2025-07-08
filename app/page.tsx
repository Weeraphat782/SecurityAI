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
  Users,
} from "lucide-react"
import { typhoonAIService } from '@/lib/typhoon-ai-service'
import dynamic from 'next/dynamic'

const CrimeMap = dynamic(() => import('../components/CrimeMap'), { ssr: false })
const CrowdedMap = dynamic(() => import('../components/CrowdedMap'), { ssr: false })

const crimeHotspots = [
  { name: "BTS สยาม", crime_type: "ล้วงกระเป๋า", incident_count: 12, lat: 13.7456, lng: 100.5347 },
  { name: "BTS หมอชิต", crime_type: "ชิงทรัพย์", incident_count: 7, lat: 13.8020, lng: 100.5536 },
  { name: "สวนลุมพินี", crime_type: "ทำร้ายร่างกาย", incident_count: 3, lat: 13.7300, lng: 100.5410 },
  { name: "CentralWorld", crime_type: "ล้วงกระเป๋า", incident_count: 9, lat: 13.7466, lng: 100.5392 },
  { name: "ตลาดนัดจตุจักร", crime_type: "ชิงทรัพย์", incident_count: 5, lat: 13.7995, lng: 100.5510 },
  { name: "MRT ห้วยขวาง", crime_type: "ชิงทรัพย์", incident_count: 15, lat: 13.7766, lng: 100.5740 },
  { name: "สยามพารากอน", crime_type: "ล้วงกระเป๋า", incident_count: 8, lat: 13.7466, lng: 100.5347 },
  { name: "Terminal 21", crime_type: "ชิงทรัพย์", incident_count: 6, lat: 13.7466, lng: 100.5392 },
  { name: "MBK Center", crime_type: "ทำร้ายร่างกาย", incident_count: 4, lat: 13.7466, lng: 100.5347 },
  { name: "เซ็นทรัลพลาซา ลาดพร้าว", crime_type: "ล้วงกระเป๋า", incident_count: 11, lat: 13.7566, lng: 100.6447 },
  { name: "เซ็นทรัลพลาซา บางนา", crime_type: "ชิงทรัพย์", incident_count: 10, lat: 13.7066, lng: 100.6000 },
  { name: "เซ็นทรัลพลาซา แบริ่ง", crime_type: "ทำร้ายร่างกาย", incident_count: 13, lat: 13.6866, lng: 100.6200 },
  { name: "เซ็นทรัลพลาซา พระราม 9", crime_type: "ล้วงกระเป๋า", incident_count: 14, lat: 13.7566, lng: 100.5647 },
  { name: "เซ็นทรัลพลาซา อโศก", crime_type: "ชิงทรัพย์", incident_count: 16, lat: 13.7366, lng: 100.5600 },
  { name: "ตลาดประตูน้ำ", crime_type: "ทำร้ายร่างกาย", incident_count: 5, lat: 13.7566, lng: 100.6447 },
  { name: "ตลาดคลองเตย", crime_type: "ล้วงกระเป๋า", incident_count: 7, lat: 13.7066, lng: 100.6000 },
  { name: "ตลาดสี่มุมเมือง", crime_type: "ชิงทรัพย์", incident_count: 9, lat: 13.6866, lng: 100.6200 },
  { name: "ตลาดมีนบุรี", crime_type: "ทำร้ายร่างกาย", incident_count: 6, lat: 13.7566, lng: 100.5647 },
  { name: "ตลาดบางกะปิ", crime_type: "ล้วงกระเป๋า", incident_count: 8, lat: 13.7366, lng: 100.5600 },
  { name: "ตลาดลาดพร้าว", crime_type: "ชิงทรัพย์", incident_count: 12, lat: 13.7566, lng: 100.6447 },
  { name: "ตลาดบางแค", crime_type: "ทำร้ายร่างกาย", incident_count: 4, lat: 13.7066, lng: 100.6000 },
  { name: "ตลาดบางขุนเทียน", crime_type: "ล้วงกระเป๋า", incident_count: 6, lat: 13.6866, lng: 100.6200 },
  { name: "ตลาดบางนา", crime_type: "ชิงทรัพย์", incident_count: 8, lat: 13.7566, lng: 100.5647 },
  { name: "ตลาดบางพลี", crime_type: "ทำร้ายร่างกาย", incident_count: 5, lat: 13.7366, lng: 100.5600 },
  { name: "ตลาดบางบอน", crime_type: "ล้วงกระเป๋า", incident_count: 7, lat: 13.7566, lng: 100.6447 },
]

const crowdedAreas = [
  { name: "BTS สยาม", crowd_level: "สูงมาก", people_count: 5000, lat: 13.7456, lng: 100.5347 },
  { name: "CentralWorld", crowd_level: "สูง", people_count: 3500, lat: 13.7466, lng: 100.5392 },
  { name: "สยามพารากอน", crowd_level: "สูงมาก", people_count: 4500, lat: 13.7466, lng: 100.5347 },
  { name: "ตลาดนัดจตุจักร", crowd_level: "สูง", people_count: 3000, lat: 13.7995, lng: 100.5510 },
  { name: "Terminal 21", crowd_level: "ปานกลาง", people_count: 2000, lat: 13.7466, lng: 100.5392 },
  { name: "MBK Center", crowd_level: "สูง", people_count: 2800, lat: 13.7466, lng: 100.5347 },
  { name: "เซ็นทรัลพลาซา ลาดพร้าว", crowd_level: "สูงมาก", people_count: 4200, lat: 13.7566, lng: 100.6447 },
  { name: "เซ็นทรัลพลาซา บางนา", crowd_level: "สูง", people_count: 3800, lat: 13.7066, lng: 100.6000 },
  { name: "เซ็นทรัลพลาซา แบริ่ง", crowd_level: "ปานกลาง", people_count: 2200, lat: 13.6866, lng: 100.6200 },
  { name: "เซ็นทรัลพลาซา พระราม 9", crowd_level: "สูงมาก", people_count: 4800, lat: 13.7566, lng: 100.5647 },
  { name: "เซ็นทรัลพลาซา อโศก", crowd_level: "สูง", people_count: 3600, lat: 13.7366, lng: 100.5600 },
  { name: "ตลาดประตูน้ำ", crowd_level: "สูงมาก", people_count: 5200, lat: 13.7566, lng: 100.6447 },
  { name: "ตลาดคลองเตย", crowd_level: "สูง", people_count: 3900, lat: 13.7066, lng: 100.6000 },
  { name: "ตลาดสี่มุมเมือง", crowd_level: "ปานกลาง", people_count: 2400, lat: 13.6866, lng: 100.6200 },
  { name: "ตลาดมีนบุรี", crowd_level: "สูง", people_count: 3400, lat: 13.7566, lng: 100.5647 },
  { name: "ตลาดบางกะปิ", crowd_level: "สูงมาก", people_count: 4600, lat: 13.7366, lng: 100.5600 },
  { name: "ตลาดลาดพร้าว", crowd_level: "สูง", people_count: 3200, lat: 13.7566, lng: 100.6447 },
  { name: "ตลาดบางแค", crowd_level: "ปานกลาง", people_count: 2100, lat: 13.7066, lng: 100.6000 },
  { name: "ตลาดบางขุนเทียน", crowd_level: "สูงมาก", people_count: 4900, lat: 13.6866, lng: 100.6200 },
  { name: "ตลาดบางนา", crowd_level: "สูง", people_count: 3700, lat: 13.7566, lng: 100.5647 },
  { name: "ตลาดบางพลี", crowd_level: "ปานกลาง", people_count: 2300, lat: 13.7366, lng: 100.5600 },
  { name: "ตลาดบางบอน", crowd_level: "สูง", people_count: 3300, lat: 13.7566, lng: 100.6447 },
]

export default function AISecurityApp() {
  const [scanResult, setScanResult] = useState<any>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [textInput, setTextInput] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [nearbyHotspot, setNearbyHotspot] = useState<any>(null)
  const [nearbyCrowdedArea, setNearbyCrowdedArea] = useState<any>(null)

  // top 3 จุดที่ incident_count มากที่สุด (ใช้ useMemo ป้องกัน infinite loop)
  const topHotspots = useMemo(() => {
    return [...crimeHotspots].sort((a, b) => b.incident_count - a.incident_count).slice(0, 3)
  }, [])

  // top 3 จุดที่คนเยอะที่สุด
  const topCrowdedAreas = useMemo(() => {
    return [...crowdedAreas].sort((a, b) => b.people_count - a.people_count).slice(0, 3)
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
      return dist <= 2000 // 2 กม.
    })
    setNearbyHotspot(found || null)
  }, [userLocation, topHotspots])

  // ตรวจสอบว่าผู้ใช้อยู่ใกล้พื้นที่คนเยอะหรือไม่
  useEffect(() => {
    if (!userLocation) return
    const found = topCrowdedAreas.find(area => {
      const dist = getDistanceFromLatLonInMeters(userLocation.lat, userLocation.lng, area.lat, area.lng)
      return dist <= 2000 // 2 กม.
    })
    setNearbyCrowdedArea(found || null)
  }, [userLocation, topCrowdedAreas])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-4 sm:mb-8">
          {/* <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">AI Web Security System</h1> */}
          {/* <p className="text-sm sm:text-base text-gray-600">ระบบตรวจจับการหลอกลวงออนไลน์ด้วย AI</p> */}
        </div>

        <Tabs defaultValue="location" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="location" className="text-xs sm:text-sm">พื้นที่เสี่ยงอันตราย</TabsTrigger>
            <TabsTrigger value="crowded" className="text-xs sm:text-sm">พื้นที่คนเยอะ</TabsTrigger>
          </TabsList>

          <TabsContent value="location" className="space-y-4 sm:space-y-6">
              <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                  พื้นที่เสี่ยงอันตราย
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Button onClick={handleShareLocation} className="w-full sm:w-auto text-sm sm:text-base">
                    แชร์ Location
                  </Button>
                  {userLocation && (
                    <div className="mt-2 text-xs sm:text-sm">
                      <span>ตำแหน่งของคุณ: {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}</span>
                    </div>
                  )}
                  {userLocation && (
                    <div className="mt-2">
                      {nearbyHotspot ? (
                        <div className="text-red-600 font-semibold text-sm sm:text-base">
                          ⚠️ คุณอยู่ใกล้พื้นที่เสี่ยง: {nearbyHotspot.name} <br />
                          ประเภทคดี: {nearbyHotspot.crime_type} <br />
                          จำนวนคดี: {nearbyHotspot.incident_count}
                        </div>
                      ) : (
                        <div className="text-green-600 font-semibold text-sm sm:text-base">
                          ✅ คุณไม่ได้อยู่ใกล้พื้นที่เสี่ยงอันตราย
                      </div>
                    )}
                    </div>
                    )}
                  </div>
                <div className="space-y-3">
                  {topHotspots.map((area, index) => (
                    <div key={index} className="flex items-center justify-between p-3 sm:p-4 border rounded-lg">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-sm sm:text-base truncate">{area.name}</h3>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">{area.crime_type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">{area.incident_count} คดี</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="h-64 sm:h-96 md:h-[400px]">
                  <CrimeMap userLocation={userLocation} hotspots={crimeHotspots} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="crowded" className="space-y-4 sm:space-y-6">
              <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                  พื้นที่คนเยอะ
                </CardTitle>
                </CardHeader>
              <CardContent className="space-y-4">
                  <div className="space-y-3">
                  <Button onClick={handleShareLocation} className="w-full sm:w-auto text-sm sm:text-base">
                    แชร์ Location
                  </Button>
                  {userLocation && (
                    <div className="mt-2 text-xs sm:text-sm">
                      <span>ตำแหน่งของคุณ: {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}</span>
                    </div>
                  )}
                  {userLocation && (
                    <div className="mt-2">
                      {nearbyCrowdedArea ? (
                        <div className="text-orange-600 font-semibold text-sm sm:text-base">
                          ⚠️ คุณอยู่ใกล้พื้นที่คนเยอะ: {nearbyCrowdedArea.name} <br />
                          ระดับความแออัด: {nearbyCrowdedArea.crowd_level} <br />
                          จำนวนคน: {nearbyCrowdedArea.people_count} คน
                        </div>
                      ) : (
                        <div className="text-green-600 font-semibold text-sm sm:text-base">
                          ✅ คุณไม่ได้อยู่ใกล้พื้นที่คนเยอะ
                        </div>
                      )}
                    </div>
                  )}
            </div>
                    <div className="space-y-3">
                  {topCrowdedAreas.map((area, index) => (
                    <div key={index} className="flex items-center justify-between p-3 sm:p-4 border rounded-lg">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-sm sm:text-base truncate">{area.name}</h3>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">ระดับความแออัด: {area.crowd_level}</p>
                      </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">{area.people_count} คน</span>
                      </div>
                    </div>
                  ))}
                  </div>
                <div className="h-64 sm:h-96 md:h-[400px]">
                  <CrowdedMap userLocation={userLocation} crowdedAreas={crowdedAreas} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
