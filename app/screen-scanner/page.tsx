"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Monitor, AlertTriangle, Shield, Eye, Square, Play, Pause, RefreshCw, Share } from "lucide-react"
// @ts-ignore: ไม่มี type declaration ของ tesseract.js ใน node_modules
import Tesseract, { LoggerMessage } from 'tesseract.js'
import { typhoonAIService } from '@/lib/typhoon-ai-service'
import { aiSecurityService } from '@/lib/ai-security-service'

export default function ScreenScanner() {
  const [isScanning, setIsScanning] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [scanResults, setScanResults] = useState<any[]>([])
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

    // OCR จริงด้วย tesseract.js
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

    // ถ้าไม่มีข้อความหลังกรอง ไม่ต้องวิเคราะห์
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
      console.log('ไม่พบสัญญาณการหลอกลวง (ทั้ง DB และ AI)')
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
    if (resultsToShow.some(r => r.riskLevel === 'high')) {
      console.log('🚨 พบการหลอกลวง!')
      // สามารถเพิ่ม notification ได้ที่นี่
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Share className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Screen Share Monitor</h1>
          </div>
          <p className="text-gray-600">แชร์หน้าจอเพื่อให้ระบบตรวจสอบการหลอกลวงแบบ Real-time</p>
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

        <div className="grid lg:grid-cols-2 gap-6">
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

          {/* Scan Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                ผลการสแกน Real-time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {scanResults.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <RefreshCw className="h-8 w-8 mx-auto mb-2" />
                    <p>ยังไม่มีผลการสแกน</p>
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
            <div className="grid md:grid-cols-4 gap-4 text-sm">
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
                <h4 className="font-medium">ดูผลการสแกน</h4>
                <p className="text-gray-600">ระบบจะแสดงผลการตรวจสอบทุก 3 วินาที</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
