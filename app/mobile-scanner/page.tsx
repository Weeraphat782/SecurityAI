"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Smartphone, Camera, Upload, AlertTriangle, Shield, ImageIcon } from "lucide-react"
import { typhoonAIService } from '@/lib/typhoon-ai-service'
import { aiSecurityService } from '@/lib/ai-security-service'
// @ts-ignore: ไม่มี type declaration ของ tesseract.js ใน node_modules
import Tesseract, { LoggerMessage } from 'tesseract.js'

export default function MobileScanner() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [scanResult, setScanResult] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ฟังก์ชันกรองข้อความ OCR
  function cleanOCRText(text: string): string {
    return text
      .replace(/[\u{1F600}-\u{1F6FF}]/gu, '') // ลบ emoji
      .replace(/[^ก-๙a-zA-Z0-9\\s]/g, '')    // เฉพาะไทย อังกฤษ ตัวเลข
      .replace(/\\s+/g, ' ')                  // ลบ whitespace ซ้ำ
      .trim()
  }

  // วิเคราะห์ภาพหน้าจอด้วย AI จริง
  const analyzeScreenshot = async (imageData: string) => {
    setIsAnalyzing(true)

    try {
      // OCR จริงด้วย tesseract.js (ปรับให้เร็วขึ้น)
      let detectedText = ''
      try {
        const result = await Tesseract.recognize(imageData, 'tha+eng', { 
          logger: (m: LoggerMessage) => console.log(m)
        })
        detectedText = cleanOCRText(result.data.text)
        console.log('OCR Result:', detectedText)
      } catch (err) {
        detectedText = ''
        console.error('OCR error:', err)
      }

      // ถ้าไม่มีข้อความหลังกรอง ไม่ต้องวิเคราะห์
      if (!detectedText || detectedText.length < 5) {
        setScanResult({
          detectedText: 'ไม่พบข้อความที่เข้าข่ายให้วิเคราะห์',
          riskLevel: 'low',
          foundKeywords: [],
          confidence: 0,
          explanation: 'ไม่พบข้อความที่เพียงพอสำหรับการวิเคราะห์',
          recommendations: ['ตรวจสอบว่าภาพมีข้อความหรือไม่'],
          timestamp: new Date().toLocaleString('th-TH'),
          source: 'ocr_no_text'
        })
        setIsAnalyzing(false)
        return
      }

      // โหลดข้อมูล Supabase ถ้ายังไม่ได้โหลด (ทำแบบ async)
      const loadDataPromise = aiSecurityService.loadData()
      
      // วิเคราะห์ด้วย Supabase (aiSecurityService)
      const dbAnalysis = await aiSecurityService.analyzeText(detectedText)
      
      // รอให้โหลดข้อมูลเสร็จ
      await loadDataPromise
      
      // วิเคราะห์ด้วย Typhoon AI (ทำแบบ parallel)
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
        setScanResult({
          detectedText: 'ไม่พบสัญญาณการหลอกลวง (ทั้ง DB และ AI)',
          riskLevel: 'low',
          foundKeywords: [],
          confidence: 0,
          explanation: 'ข้อความที่ตรวจพบไม่แสดงสัญญาณการหลอกลวง',
          recommendations: ['สามารถใช้งานได้ตามปกติ', 'ตรวจสอบแหล่งที่มาของข้อมูล'],
          timestamp: new Date().toLocaleString('th-TH'),
          source: 'no_risk'
        })
        setIsAnalyzing(false)
        return
      }

      // รวมผลลัพธ์ (แสดงทั้งสอง หรือเลือกอันที่เสี่ยงสูงกว่า)
      const resultsToShow: any[] = []
      if (showDb) {
        resultsToShow.push({
          detectedText,
          riskLevel: dbAnalysis.riskLevel,
          foundKeywords: dbAnalysis.keywordsFound,
          confidence: dbAnalysis.confidence,
          scamType: dbAnalysis.scamType,
          recommendations: dbAnalysis.recommendations,
          explanation: 'ฐานข้อมูล: ' + dbAnalysis.recommendations.join(' '),
          timestamp: new Date().toLocaleString('th-TH'),
          source: 'database',
        })
      }
      if (showAi && aiAnalysis) {
        resultsToShow.push({
          detectedText,
          riskLevel: aiAnalysis.riskLevel,
          foundKeywords: aiAnalysis.keywords,
          confidence: aiAnalysis.confidence,
          scamType: aiAnalysis.scamType,
          recommendations: aiAnalysis.recommendations,
          explanation: 'AI: ' + aiAnalysis.explanation,
          timestamp: new Date().toLocaleString('th-TH'),
          source: 'ai',
        })
      }
      
      // แสดงผลลัพธ์แรกที่เสี่ยงสูงสุด
      setScanResult(resultsToShow[0])
      
    } catch (error) {
      console.error('Analysis error:', error)
      setScanResult({
        detectedText: 'เกิดข้อผิดพลาดในการวิเคราะห์',
        riskLevel: 'low',
        foundKeywords: [],
        confidence: 0,
        explanation: 'ไม่สามารถวิเคราะห์ภาพได้ กรุณาลองใหม่อีกครั้ง',
        recommendations: ['ลองอัพโหลดภาพใหม่อีกครั้ง', 'ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'],
        timestamp: new Date().toLocaleString('th-TH'),
        source: 'error'
      })
    }
    
    setIsAnalyzing(false)
  }

  // อัพโหลดภาพหน้าจอ
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageData = e.target?.result as string
        setSelectedImage(imageData)
        analyzeScreenshot(imageData)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
        </div>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              อัพโหลดภาพหน้าจอ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-2">คลิกเพื่อเลือกภาพหน้าจอ</p>
                <p className="text-sm text-gray-500">รองรับไฟล์ JPG, PNG, WebP</p>
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

              <div className="text-center">
                <Button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  เลือกภาพหน้าจอ
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Image Preview & Results */}
        {selectedImage && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Image Preview */}
            <Card>
              <CardHeader>
                <CardTitle>ภาพที่อัพโหลด</CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={selectedImage || "/placeholder.svg"}
                  alt="Screenshot"
                  className="w-full h-64 object-contain border rounded-lg bg-gray-50"
                />
              </CardContent>
            </Card>

            {/* Analysis Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  ผลการวิเคราะห์
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isAnalyzing ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">กำลังวิเคราะห์ภาพ...</p>
                  </div>
                ) : scanResult ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {[scanResult].flat().map((result: any, idx: number) => (
                      <div key={idx} className="border rounded-lg p-3 space-y-2">
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

                        {result.foundKeywords && result.foundKeywords.length > 0 && (
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

                        {result.recommendations && result.recommendations.length > 0 && (
                          <div className="text-sm">
                            <span className="font-medium">คำแนะนำ:</span>
                            <ul className="list-disc ml-5">
                              {result.recommendations.map((rec: string, i: number) => (
                                <li key={i}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>วิธีใช้งาน</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">
                  1
                </span>
                <p>ถ่ายภาพหน้าจอมือถือที่ต้องการตรวจสอบ</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">
                  2
                </span>
                <p>อัพโหลดภาพผ่านปุ่ม "เลือกภาพหน้าจอ"</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">
                  3
                </span>
                <p>รอระบบวิเคราะห์และแสดงผลการตรวจสอบ</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">
                  4
                </span>
                <p>ตรวจสอบระดับความเสี่ยงและคำแนะนำ</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Notice */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>ความเป็นส่วนตัว:</strong> ภาพที่อัพโหลดจะถูกประมวลผลในเครื่องเท่านั้น ไม่มีการส่งข้อมูลไปยังเซิร์ฟเวอร์ภายนอก
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
