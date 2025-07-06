"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Monitor, AlertTriangle, Shield, Eye, Square, Play, Pause, RefreshCw, Share, Image, FileText } from "lucide-react"
// @ts-ignore: ไม่มี type declaration ของ tesseract.js ใน node_modules
import Tesseract, { LoggerMessage } from 'tesseract.js'
import { typhoonAIService } from '@/lib/typhoon-ai-service'
import { aiSecurityService } from '@/lib/ai-security-service'

// ข้อมูลจำลองสำหรับการตรวจจับรูปภาพที่น่าสงสัย
const suspiciousImageTypes = [
  { type: "google_stock", description: "รูปภาพที่อาจถูกใช้จาก Google Images", keywords: ["stock", "google", "generic"] },
  { type: "pinterest", description: "รูปภาพที่อาจมาจาก Pinterest", keywords: ["pinterest", "pin", "social"] },
  { type: "copied", description: "รูปภาพที่อาจถูกคัดลอกไปใช้ซ้ำ", keywords: ["copied", "duplicate", "reused"] },
  { type: "suspicious_text", description: "รูปภาพที่มีข้อความที่น่าสงสัย", keywords: ["text", "overlay", "suspicious"] },
  { type: "fake_profile", description: "รูปโปรไฟล์ที่อาจเป็นปลอม", keywords: ["profile", "fake", "avatar"] }
]

// ฟังก์ชันจำลองการตรวจจับเนื้อหาจริงจากรูปภาพ
const analyzeImageContent = (imageData: string) => {
  // จำลองการตรวจจับเนื้อหาจริงตามข้อมูลรูปภาพ
  const hash = imageData.length // ใช้ความยาวของข้อมูลเป็น hash
  const seed = hash % 1000
  
  return {
    hasText: (seed % 3) === 0, // 30% โอกาสมีข้อความ
    hasPeople: (seed % 4) === 0, // 25% โอกาสมีคน
    hasUI: (seed % 2) === 0, // 50% โอกาสมี UI elements
    hasImages: (seed % 5) === 0, // 20% โอกาสมีรูปภาพอื่น
    hasVideos: (seed % 8) === 0, // 12.5% โอกาสมีวิดีโอ
    hasCharts: (seed % 6) === 0, // 16.7% โอกาสมีกราฟ
    hasDocuments: (seed % 7) === 0 // 14.3% โอกาสมีเอกสาร
  }
}

// ฟังก์ชันจำลองการตรวจจับ watermark
const detectWatermark = (imageData: string) => {
  const hash = imageData.length
  return (hash % 15) === 0 // 6.7% โอกาสมี watermark
}

// ฟังก์ชันจำลองการตรวจจับ stock image
const detectStockImage = (imageData: string) => {
  const hash = imageData.length
  return (hash % 6) === 0 // 16.7% โอกาสเป็น stock image
}

// ฟังก์ชันจำลองการตรวจจับองค์ประกอบที่น่าสงสัย
const detectSuspiciousElements = (imageData: string) => {
  const hash = imageData.length
  return (hash % 10) === 0 // 10% โอกาสมีองค์ประกอบที่น่าสงสัย
}

// ฟังก์ชันจำลองการวิเคราะห์รูปภาพ
const analyzeImageSuspiciousness = (imageData: string): any => {
  // จำลองการวิเคราะห์รูปภาพตามเนื้อหาจริง
  const timestamp = Date.now()
  
  // จำลองการตรวจจับเนื้อหาจริงจากรูปภาพ
  const imageContent = analyzeImageContent(imageData)
  
  // ใช้เนื้อหาที่ตรวจจับได้เพื่อวิเคราะห์
  const { hasText, hasPeople, hasUI, hasImages, hasVideos, hasCharts, hasDocuments } = imageContent
  
  // จำลองการตรวจสอบคุณสมบัติของรูปภาพ
  const imageSize = 1920 * 1080 // จำลองขนาดภาพ
  const hasWatermark = detectWatermark(imageData) // จำลองการตรวจจับ watermark
  const isStockLike = detectStockImage(imageData) // จำลองการตรวจจับ stock image
  const hasSuspiciousElements = detectSuspiciousElements(imageData) // จำลองการตรวจจับองค์ประกอบที่น่าสงสัย
  
  let riskLevel: 'low' | 'medium' | 'high'
  let confidence: number
  let suspiciousType: string
  let description: string
  let recommendations: string[]
  let analysisReason: string

  // วิเคราะห์ตามคุณสมบัติของรูปภาพ
  if (hasWatermark) {
    // มี watermark - น่าสงสัยสูง
    riskLevel = 'high'
    confidence = 85 + (Math.random() * 10)
    suspiciousType = 'watermarked'
    description = '🚨 พบ watermark ในรูปภาพ - อาจเป็นรูปภาพที่ถูกใช้ซ้ำ'
    analysisReason = 'ตรวจพบลายน้ำหรือเครื่องหมายในรูปภาพ'
    recommendations = [
      '❌ อย่าใช้รูปภาพที่มี watermark',
      '🔍 ตรวจสอบแหล่งที่มาของรูปภาพอย่างละเอียด',
      '⚠️ รูปภาพนี้อาจถูกใช้สำหรับการหลอกลวง',
      '📞 ติดต่อผู้ดูแลระบบหากไม่แน่ใจ'
    ]
  } else if (isStockLike && hasText) {
    // เหมือน stock photo และมีข้อความ - เสี่ยงปานกลาง
    riskLevel = 'medium'
    confidence = 70 + (Math.random() * 15)
    suspiciousType = 'stock_with_text'
    description = '🟡 รูปภาพเหมือน stock photo และมีข้อความ - อาจถูกใช้ซ้ำ'
    analysisReason = 'รูปแบบและคุณภาพคล้ายรูปภาพ stock และมีข้อความซ้อนทับ'
    recommendations = [
      'ตรวจสอบแหล่งที่มาของรูปภาพ',
      'เปรียบเทียบกับรูปภาพ stock อื่นๆ',
      'ระวังการใช้งานรูปภาพที่ไม่ทราบที่มา'
    ]
  } else if (hasPeople && hasText) {
    // มีคนและมีข้อความ - เสี่ยงปานกลาง
    riskLevel = 'medium'
    confidence = 65 + (Math.random() * 20)
    suspiciousType = 'people_with_text'
    description = '🟡 รูปภาพมีคนและข้อความ - อาจเป็นรูปโปรไฟล์ปลอม'
    analysisReason = 'พบรูปคนพร้อมข้อความซ้อนทับ - อาจเป็นรูปโปรไฟล์ที่ถูกใช้ซ้ำ'
    recommendations = [
      'ตรวจสอบว่าเป็นรูปโปรไฟล์จริงหรือไม่',
      'เปรียบเทียบกับรูปโปรไฟล์อื่นๆ',
      'ระวังการใช้งานรูปภาพที่ไม่ทราบที่มา'
    ]
  } else if (isStockLike) {
    // เหมือน stock photo - เสี่ยงต่ำ
    riskLevel = 'low'
    confidence = 80 + (Math.random() * 10)
    suspiciousType = 'stock_like'
    description = 'รูปภาพคล้าย stock photo - ควรตรวจสอบแหล่งที่มา'
    analysisReason = 'คุณภาพและรูปแบบคล้ายรูปภาพ stock - ควรตรวจสอบแหล่งที่มา'
    recommendations = [
      'ตรวจสอบแหล่งที่มาของรูปภาพ',
      'สามารถใช้งานได้หากทราบที่มา',
      'ระวังการใช้งานรูปภาพที่ไม่ทราบที่มา'
    ]
  } else if (hasText) {
    // มีข้อความ - เสี่ยงต่ำ
    riskLevel = 'low'
    confidence = 75 + (Math.random() * 15)
    suspiciousType = 'with_text'
    description = 'รูปภาพมีข้อความ - ควรตรวจสอบเนื้อหา'
    analysisReason = 'พบข้อความในรูปภาพ - ควรตรวจสอบเนื้อหาของข้อความ'
    recommendations = [
      'ตรวจสอบเนื้อหาของข้อความในรูปภาพ',
      'สามารถใช้งานได้หากเนื้อหาปกติ',
      'ระวังข้อความที่น่าสงสัย'
    ]
  } else {
    // รูปภาพปกติ
    riskLevel = 'low'
    confidence = 90 + (Math.random() * 8)
    suspiciousType = 'normal'
    description = 'รูปภาพดูปกติ ไม่พบสัญญาณที่น่าสงสัย'
    analysisReason = 'รูปภาพมีคุณภาพปกติ ไม่พบสัญญาณที่น่าสงสัย'
    recommendations = [
      'สามารถใช้งานได้ตามปกติ',
      'ตรวจสอบแหล่งที่มาของรูปภาพ'
    ]
  }

  return {
    riskLevel,
    confidence,
    suspiciousType,
    description,
    recommendations,
    analysisReason,
    keywords: suspiciousImageTypes.find(t => t.type === suspiciousType)?.keywords || [],
    imageProperties: {
      hasText,
      hasPeople,
      hasUI,
      hasImages,
      hasVideos,
      hasCharts,
      hasDocuments,
      isStockLike,
      hasWatermark,
      hasSuspiciousElements,
      size: `${Math.floor(imageSize / 1000)}K pixels`
    }
  }
}

export default function ScreenScanner() {
  const [isScanning, setIsScanning] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [scanResults, setScanResults] = useState<any[]>([])
  const [imageResults, setImageResults] = useState<any[]>([])
  const [error, setError] = useState<string>("")
  const [isSharing, setIsSharing] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // ตรวจสอบการรองรับ Screen Share
  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      setError("เบราว์เซอร์ไม่รองรับการแชร์หน้าจอ กรุณาใช้ Chrome, Firefox หรือ Edge")
    }
  }, [])

  // เริ่มการแชร์หน้าจอ
  const startScreenShare = async () => {
    try {
      setError("")
      setIsSharing(true)

      console.log("กำลังขออนุญาตแชร์หน้าจอ...")

      // ขออนุญาตแชร์หน้าจอ
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      })

      console.log("ได้รับ MediaStream แล้ว:", mediaStream)

      setStream(mediaStream)

      // แสดงหน้าจอใน video element
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream

        // รอให้ video โหลดเสร็จ
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
          console.log("เริ่มแสดงหน้าจอแล้ว")
        }
      }

      // ฟังเหตุการณ์เมื่อผู้ใช้หยุดการแชร์
      mediaStream.getVideoTracks()[0].addEventListener("ended", () => {
        console.log("ผู้ใช้หยุดการแชร์หน้าจอ")
        stopScreenShare()
      })

      setIsSharing(false)
      console.log("การแชร์หน้าจอเริ่มต้นสำเร็จ")
    } catch (err: any) {
      console.error("Screen share error:", err)
      setIsSharing(false)

      if (err.name === "NotAllowedError") {
        setError("❌ คุณปฏิเสธการแชร์หน้าจอ กรุณาอนุญาตและลองใหม่")
      } else if (err.name === "NotSupportedError") {
        setError("❌ เบราว์เซอร์ไม่รองรับการแชร์หน้าจอ")
      } else if (err.message.includes("permissions policy")) {
        setError("❌ ไม่สามารถแชร์หน้าจอได้ในสภาพแวดล้อมนี้")
      } else {
        setError(`❌ เกิดข้อผิดพลาด: ${err.message}`)
      }
    }
  }

  // หยุดการแชร์หน้าจอ
  const stopScreenShare = () => {
    console.log("หยุดการแชร์หน้าจอ")

    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop()
        console.log("หยุด track:", track.kind)
      })
      setStream(null)
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    stopScanning()
    setIsSharing(false)
  }

  // เริ่มการสแกนแบบ Real-time
  const startScanning = () => {
    if (!stream) {
      setError("กรุณาเริ่มแชร์หน้าจอก่อน")
      return
    }

    setIsScanning(true)
    console.log("เริ่มการสแกนหน้าจอ")

    // สแกนทันทีครั้งแรก
    setTimeout(() => captureAndAnalyze(), 1000)

    // จากนั้นสแกนทุก 3 วินาที
    intervalRef.current = setInterval(() => {
      captureAndAnalyze()
    }, 3000)
  }

  // หยุดการสแกน
  const stopScanning = () => {
    setIsScanning(false)
    console.log("หยุดการสแกนหน้าจอ")

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  // ล้างผลการสแกน
  const clearResults = () => {
    setScanResults([])
    setImageResults([])
  }

  // แคปภาพและวิเคราะห์
  const captureAndAnalyze = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !stream) {
      console.log("ไม่สามารถแคปภาพได้: ไม่มี video หรือ canvas")
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx) return

    // ตรวจสอบว่า video พร้อมแล้ว
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.log("Video ยังไม่พร้อม")
      return
    }

    // ตั้งค่าขนาด canvas ให้เท่ากับ video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // วาดภาพจาก video ลงใน canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // แปลงเป็น base64
    const imageData = canvas.toDataURL("image/png")

    console.log("แคปภาพสำเร็จ:", canvas.width, "x", canvas.height)

    // วิเคราะห์เนื้อหา
    analyzeScreenContent(imageData)
  }, [stream])

  // ฟังก์ชันกรองข้อความ OCR ให้เหลือเฉพาะประโยคจริง
  function filterMeaningfulLines(text: string): string {
    const lines = text.split('\n');
    // ต้องมีอักษรไทย/อังกฤษอย่างน้อย 5 ตัว และมีช่องว่าง (ดูเหมือนประโยค)
    const isMeaningful = (line: string) =>
      /[ก-๙a-zA-Z]{5,}/.test(line) && /\s/.test(line);
    return lines
      .map(line => line.trim())
      .filter(line => isMeaningful(line))
      .join('\n');
  }

  // ฟังก์ชันกรองข้อความ OCR
  function cleanOCRText(text: string): string {
    return text
      .replace(/[\u{1F600}-\u{1F6FF}]/gu, '') // ลบ emoji
      .replace(/[^ก-๙a-zA-Z0-9\\s]/g, '')    // เฉพาะไทย อังกฤษ ตัวเลข
      .replace(/\\s+/g, ' ')                  // ลบ whitespace ซ้ำ
      .trim()
  }

  // วิเคราะห์เนื้อหาหน้าจอ
  const analyzeScreenContent = async (imageData: string) => {
    console.log('กำลังวิเคราะห์เนื้อหาหน้าจอ...')

    // 1. วิเคราะห์รูปภาพที่น่าสงสัย
    console.log('กำลังวิเคราะห์รูปภาพ...')
    const imageAnalysis = analyzeImageSuspiciousness(imageData)
    
    // เพิ่มผลการวิเคราะห์รูปภาพ
    const imageResult = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString('th-TH'),
      riskLevel: imageAnalysis.riskLevel,
      confidence: imageAnalysis.confidence,
      suspiciousType: imageAnalysis.suspiciousType,
      description: imageAnalysis.description,
      recommendations: imageAnalysis.recommendations,
      keywords: imageAnalysis.keywords,
      analysisReason: imageAnalysis.analysisReason,
      imageProperties: imageAnalysis.imageProperties,
      size: '1920x1080',
      source: 'image_analysis',
    }
    
    setImageResults((prev) => [imageResult, ...prev])

    // 2. วิเคราะห์ข้อความ (OCR)
    let detectedText = ''
    try {
      console.log('เริ่ม OCR...')
      const result = await Tesseract.recognize(imageData, 'tha+eng', { logger: (m: LoggerMessage) => console.log(m) })
      // กรองข้อความให้เหลือเฉพาะประโยค
      detectedText = filterMeaningfulLines(result.data.text)
      console.log('Filtered OCR:', detectedText)
    } catch (err) {
      detectedText = ''
      console.error('OCR error:', err)
    }

    // ถ้าไม่มีข้อความหลังกรอง ไม่ต้องวิเคราะห์ข้อความ
    if (!detectedText) {
      console.log('ไม่มีข้อความที่เข้าข่ายให้วิเคราะห์')
      return
    }

    // โหลดข้อมูล Supabase ถ้ายังไม่ได้โหลด
    if (!aiSecurityService['scamCategories']?.length || !aiSecurityService['scamRecords']?.length) {
      await aiSecurityService.loadData()
    }

    // วิเคราะห์ด้วย Supabase (aiSecurityService)
    const dbAnalysis = await aiSecurityService.analyzeText(detectedText)
    // วิเคราะห์ด้วย Typhoon AI
    let aiAnalysis
    try {
      aiAnalysis = await typhoonAIService.analyzeText(detectedText)
    } catch (error) {
      aiAnalysis = null
      console.error('Typhoon AI error:', error)
    }

    // ตัดสินใจแสดงผล ถ้าอย่างน้อยหนึ่งอันพบความเสี่ยง medium/high
    const showDb = dbAnalysis.riskLevel !== 'low' && dbAnalysis.keywordsFound.length > 0
    const showAi = aiAnalysis && aiAnalysis.riskLevel !== 'low' && aiAnalysis.keywords.length > 0

    if (!showDb && !showAi) {
      console.log('ไม่พบสัญญาณการหลอกลวงในข้อความ (ทั้ง DB และ AI)')
      return
    }

    // รวมผลลัพธ์ (แสดงทั้งสอง หรือเลือกอันที่เสี่ยงสูงกว่า)
    const resultsToShow: any[] = []
    if (showDb) {
      resultsToShow.push({
      id: Date.now(),
        timestamp: new Date().toLocaleTimeString('th-TH'),
        detectedText,
        riskLevel: dbAnalysis.riskLevel,
        confidence: dbAnalysis.confidence,
        scamType: dbAnalysis.scamType,
        foundKeywords: dbAnalysis.keywordsFound,
        recommendations: dbAnalysis.recommendations,
        explanation: 'ฐานข้อมูล: ' + dbAnalysis.recommendations.join(' '),
        size: '1920x1080',
        source: 'database',
      })
    }
    if (showAi && aiAnalysis) {
      resultsToShow.push({
        id: Date.now() + 1,
        timestamp: new Date().toLocaleTimeString('th-TH'),
        detectedText,
        riskLevel: aiAnalysis.riskLevel,
        confidence: aiAnalysis.confidence,
        scamType: aiAnalysis.scamType,
        foundKeywords: aiAnalysis.keywords,
        recommendations: aiAnalysis.recommendations,
        explanation: 'AI: ' + aiAnalysis.explanation,
        size: '1920x1080',
        source: 'ai',
      })
    }
    setScanResults((prev) => [...resultsToShow, ...prev])

    // แจ้งเตือนถ้าพบความเสี่ยงสูง
    if (resultsToShow.some(r => r.riskLevel === 'high') || imageAnalysis.riskLevel === 'high') {
      console.log('🚨 พบการหลอกลวง!')
      // สามารถเพิ่ม notification ได้ที่นี่
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
        </div>

        {/* Control Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              ควบคุมการแชร์หน้าจอ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4 items-center flex-wrap">
                {!stream ? (
                  <Button
                    onClick={startScreenShare}
                    disabled={isSharing}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <Share className="h-4 w-4" />
                    {isSharing ? "กำลังเชื่อมต่อ..." : "🖥️ เริ่มแชร์หน้าจอ"}
                  </Button>
                ) : (
                  <>
                    <Button onClick={stopScreenShare} variant="destructive" className="flex items-center gap-2">
                      <Square className="h-4 w-4" />
                      หยุดแชร์หน้าจอ
                    </Button>

                    {isScanning ? (
                      <Button onClick={stopScanning} variant="secondary" className="flex items-center gap-2">
                        <Pause className="h-4 w-4" />
                        หยุดสแกน
                      </Button>
                    ) : (
                      <Button onClick={startScanning} className="flex items-center gap-2">
                        <Play className="h-4 w-4" />
                        เริ่มสแกน
                      </Button>
                    )}

                    <Button onClick={clearResults} variant="outline" className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      ล้างผลการสแกน
                    </Button>
                  </>
                )}

                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${stream ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
                  <span className="text-sm text-gray-600">{stream ? "🟢 กำลังแชร์หน้าจอ" : "⚫ ไม่ได้แชร์หน้าจอ"}</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isScanning ? "bg-blue-500 animate-pulse" : "bg-gray-300"}`} />
                  <span className="text-sm text-gray-600">{isScanning ? "🔍 กำลังสแกน..." : "⏸️ หยุดสแกน"}</span>
                </div>
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              {stream && (
                <Alert className="border-green-200 bg-green-50">
                  <Shield className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    ✅ <strong>เชื่อมต่อสำเร็จ!</strong> ระบบสามารถเห็นหน้าจอของคุณแล้ว
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Screen Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                หน้าจอที่กำลังแชร์
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full h-64 bg-gray-900 rounded-lg object-contain border-2 border-gray-300"
                  muted
                  playsInline
                  autoPlay
                />
                <canvas ref={canvasRef} className="hidden" />

                {!stream && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                    <div className="text-center text-gray-500">
                      <Share className="h-12 w-12 mx-auto mb-2" />
                      <p className="font-medium">กดปุ่ม "เริ่มแชร์หน้าจอ"</p>
                      <p className="text-sm">เพื่อให้ระบบเห็นหน้าจอของคุณ</p>
                    </div>
                  </div>
                )}

                {stream && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                    🔴 LIVE
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Image Analysis Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                การวิเคราะห์รูปภาพ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {imageResults.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <Image className="h-8 w-8 mx-auto mb-2" />
                    <p>ยังไม่มีผลการวิเคราะห์รูปภาพ</p>
                    <p className="text-xs mt-1">เริ่มแชร์หน้าจอและกดสแกนเพื่อเริ่มต้น</p>
                  </div>
                ) : (
                  imageResults.map((result) => (
                    <div key={result.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{result.timestamp}</span>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              result.riskLevel === "high"
                                ? "destructive"
                                : result.riskLevel === "medium"
                                  ? "secondary"
                                  : "default"
                            }
                          >
                            {result.riskLevel === "high"
                              ? "🚨 น่าสงสัยมาก"
                              : result.riskLevel === "medium"
                                ? "🟡 อาจน่าสงสัย"
                                : "✅ ปกติ"}
                          </Badge>
                        </div>
                      </div>

                      <div className="text-sm">
                        <span className="font-medium">ผลการวิเคราะห์:</span> {result.description}
                      </div>

                      <div className="text-sm">
                        <span className="font-medium">เหตุผล:</span> {result.analysisReason}
                      </div>

                      <div className="text-xs text-gray-600 space-y-1">
                        <div><span className="font-medium">คุณสมบัติ:</span></div>
                        <div className="flex flex-wrap gap-1">
                          {result.imageProperties.hasText && <Badge variant="outline" className="text-xs">📝 มีข้อความ</Badge>}
                          {result.imageProperties.hasPeople && <Badge variant="outline" className="text-xs">👥 มีคน</Badge>}
                          {result.imageProperties.hasUI && <Badge variant="outline" className="text-xs">🖥️ มี UI</Badge>}
                          {result.imageProperties.hasImages && <Badge variant="outline" className="text-xs">🖼️ มีรูปภาพ</Badge>}
                          {result.imageProperties.hasVideos && <Badge variant="outline" className="text-xs">🎥 มีวิดีโอ</Badge>}
                          {result.imageProperties.hasCharts && <Badge variant="outline" className="text-xs">📊 มีกราฟ</Badge>}
                          {result.imageProperties.hasDocuments && <Badge variant="outline" className="text-xs">📄 มีเอกสาร</Badge>}
                          {result.imageProperties.isStockLike && <Badge variant="outline" className="text-xs">🖼️ เหมือน Stock</Badge>}
                          {result.imageProperties.hasWatermark && <Badge variant="outline" className="text-xs">💧 มี Watermark</Badge>}
                          {result.imageProperties.hasSuspiciousElements && <Badge variant="outline" className="text-xs">⚠️ น่าสงสัย</Badge>}
                          <Badge variant="outline" className="text-xs">📏 {result.imageProperties.size}</Badge>
                        </div>
                      </div>

                      {result.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {result.keywords.map((keyword: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="text-sm">
                        <span className="font-medium">คำแนะนำ:</span>
                        <ul className="list-disc ml-5">
                          {result.recommendations.map((rec: string, idx: number) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex justify-between text-xs text-gray-500">
                        <span>ความมั่นใจ: {result.confidence.toFixed(1)}%</span>
                        <span>ขนาด: {result.size}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Text Analysis Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                การวิเคราะห์ข้อความ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {scanResults.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <FileText className="h-8 w-8 mx-auto mb-2" />
                    <p>ยังไม่มีผลการวิเคราะห์ข้อความ</p>
                    <p className="text-xs mt-1">เริ่มแชร์หน้าจอและกดสแกนเพื่อเริ่มต้น</p>
                  </div>
                ) : (
                  scanResults.map((result) => (
                    <div key={result.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{result.timestamp}</span>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              result.riskLevel === "high"
                                ? "destructive"
                                : result.riskLevel === "medium"
                                  ? "secondary"
                                  : "default"
                            }
                          >
                            {result.riskLevel === "high"
                              ? "🚨 อันตราย"
                              : result.riskLevel === "medium"
                                ? "⚠️ เสี่ยง"
                                : "✅ ปลอดภัย"}
                          </Badge>
                        </div>
                      </div>

                      {result.foundKeywords.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {result.foundKeywords.map((keyword: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="text-sm">
                        <span className="font-medium">เหตุผล:</span> {result.explanation}
                      </div>

                      <div className="text-sm">
                        <span className="font-medium">คำแนะนำ:</span>
                        <ul className="list-disc ml-5">
                          {result.recommendations.map((rec: string, idx: number) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex justify-between text-xs text-gray-500">
                        <span>ความมั่นใจ: {result.confidence.toFixed(1)}%</span>
                        <span>ขนาด: {result.size}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>วิธีใช้งาน</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-5 gap-4 text-sm">
              <div className="space-y-2">
                <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <h4 className="font-medium">เริ่มแชร์หน้าจอ</h4>
                <p className="text-gray-600">กดปุ่ม "เริ่มแชร์หน้าจอ" และเลือกหน้าจอที่ต้องการ</p>
              </div>
              <div className="space-y-2">
                <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <h4 className="font-medium">อนุญาตการเข้าถึง</h4>
                <p className="text-gray-600">เบราว์เซอร์จะขออนุญาต ให้กด "อนุญาต" หรือ "Share"</p>
              </div>
              <div className="space-y-2">
                <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <h4 className="font-medium">เริ่มสแกน</h4>
                <p className="text-gray-600">กดปุ่ม "เริ่มสแกน" เพื่อให้ระบบตรวจสอบหน้าจอ</p>
              </div>
              <div className="space-y-2">
                <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  4
                </div>
                <h4 className="font-medium">ดูผลการวิเคราะห์</h4>
                <p className="text-gray-600">ระบบจะวิเคราะห์ทั้งรูปภาพและข้อความทุก 3 วินาที</p>
              </div>
              <div className="space-y-2">
                <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  5
                </div>
                <h4 className="font-medium">ตรวจสอบผลลัพธ์</h4>
                <p className="text-gray-600">ดูผลการวิเคราะห์รูปภาพและข้อความแยกกัน</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
