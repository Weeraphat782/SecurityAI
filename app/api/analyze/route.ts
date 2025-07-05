import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize the client with your API key and the OpenTyphoon base URL
const openai = new OpenAI({
  apiKey: process.env.TYPHOON_API_KEY || '',
  baseURL: 'https://api.opentyphoon.ai/v1',
})

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || text.trim().length === 0) {
      return NextResponse.json({
        isScam: false,
        riskLevel: 'low',
        confidence: 0,
        scamType: 'No Content',
        keywords: [],
        explanation: 'ไม่มีเนื้อหาให้วิเคราะห์',
        recommendations: ['ไม่มีเนื้อหาให้วิเคราะห์']
      })
    }

    // ตรวจสอบ API Key
    if (!process.env.TYPHOON_API_KEY) {
      console.error('TYPHOON_API_KEY ไม่ได้ตั้งค่า')
      return NextResponse.json(fallbackAnalysis(text))
    }

    const response = await openai.chat.completions.create({
      model: 'typhoon-v2.1-12b-instruct',
      messages: [
        {
          role: 'system',
          content: `คุณเป็น AI Security Expert ที่เชี่ยวชาญในการตรวจจับการหลอกลวงออนไลน์

ข้อมูลการหลอกลวง 5 ปีย้อนหลัง (2019-2024):
- Call Center Scam: 1,250 คดี (โทรมาอ้างเป็นธนาคาร/ตำรวจ)
- Phishing Link: 890 คดี (ลิงก์ปลอม ขโมย login)
- Social Media Scam: 670 คดี (โพสต์หลอกในโซเชียล)
- SMS/Email Fraud: 445 คดี (ข้อความหลอก)
- Investment Scam: 298 คดี (หลอกลงทุน)

คำสำคัญที่บ่งชี้การหลอกลวง:
- เงิน/โอนเงิน/รางวัล/ฟรี/คลิก/ลิงก์
- ธนาคาร/บัญชีถูกระงับ/OTP/ยืนยัน
- ตำรวจ/หมายจับ/ค่าปรับ/คดี
- ลงทุน/กำไร/หุ้น/คริปโต/บิทคอยน์
- แจกรางวัล/iPhone/รางวัลใหญ่

กรุณาวิเคราะห์ข้อความที่ให้มาและตอบกลับในรูปแบบ JSON เท่านั้น:

{
  "isScam": boolean,
  "riskLevel": "low" | "medium" | "high",
  "confidence": number (0-100),
  "scamType": "string",
  "keywords": ["array", "of", "keywords"],
  "explanation": "string",
  "recommendations": ["array", "of", "recommendations"]
}`
        },
        {
          role: 'user',
          content: `วิเคราะห์ข้อความนี้: "${text}"`
        }
      ],
      max_tokens: 512,
      temperature: 0.3
    })

    const result = response.choices[0]?.message?.content
    if (!result) {
      throw new Error('ไม่ได้รับผลลัพธ์จาก Typhoon AI')
    }

    console.log('Typhoon AI Response:', result)

    // พยายาม parse JSON
    let jsonStr = result.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```/, '').replace(/```$/, '').trim();
    }
    const analysis = JSON.parse(jsonStr);

    return NextResponse.json({
      isScam: analysis.isScam || false,
      riskLevel: analysis.riskLevel || 'low',
      confidence: analysis.confidence || 0,
      scamType: analysis.scamType || 'Unknown',
      keywords: analysis.keywords || [],
      explanation: analysis.explanation || '',
      recommendations: analysis.recommendations || []
    })

  } catch (error) {
    console.error('Typhoon AI Error:', error)
    return NextResponse.json(fallbackAnalysis(''))
  }
}

// Fallback analysis เมื่อ Typhoon AI ไม่ทำงาน
function fallbackAnalysis(text: string) {
  const scamKeywords = [
    'โอนเงิน', 'รางวัล', 'ฟรี', 'คลิก', 'ลิงก์', 'ธนาคาร', 'บัญชีถูกระงับ',
    'OTP', 'ยืนยัน', 'ตำรวจ', 'หมายจับ', 'ค่าปรับ', 'ลงทุน', 'กำไร',
    'หุ้น', 'คริปโต', 'บิทคอยน์', 'แจกรางวัล', 'iPhone'
  ]

  // วิเคราะห์บริบทแทนการเจอคำเฉยๆ
  const contextAnalysis = analyzeContext(text, scamKeywords)
  const foundKeywords = contextAnalysis.suspiciousKeywords
  const suspiciousSentences = contextAnalysis.suspiciousSentences

  const riskLevel = suspiciousSentences.length > 1 ? 'high' : 
                   suspiciousSentences.length > 0 ? 'medium' : 'low'

  const confidence = Math.min(suspiciousSentences.length * 25, 80)

  return {
    isScam: suspiciousSentences.length > 0,
    riskLevel,
    confidence,
    scamType: identifyScamType(foundKeywords),
    keywords: foundKeywords,
    explanation: suspiciousSentences.length > 0 ? 
      `พบประโยคที่สงสัย: ${suspiciousSentences.join('; ')}` : 
      'ไม่พบสัญญาณการหลอกลวง',
    recommendations: generateRecommendations(riskLevel, foundKeywords)
  }
}

// วิเคราะห์บริบท
function analyzeContext(text: string, keywords: string[]): {
  suspiciousKeywords: string[]
  suspiciousSentences: string[]
} {
  const suspiciousKeywords: string[] = []
  const suspiciousSentences: string[] = []
  
  // แยกเป็นประโยค
  const sentences = text.split(/[.!?।]/).filter(s => s.trim().length > 0)
  
  for (const sentence of sentences) {
    const sentenceLower = sentence.toLowerCase()
    const foundInSentence = keywords.filter(keyword => 
      sentenceLower.includes(keyword.toLowerCase())
    )
    
    if (foundInSentence.length > 0) {
      // ตรวจสอบบริบทว่าสงสัยหรือไม่
      const isSuspicious = isSentenceSuspicious(sentence, foundInSentence)
      
      if (isSuspicious) {
        suspiciousKeywords.push(...foundInSentence)
        suspiciousSentences.push(sentence.trim())
      }
    }
  }
  
  return {
    suspiciousKeywords: [...new Set(suspiciousKeywords)],
    suspiciousSentences
  }
}

// ตรวจสอบว่าประโยคสงสัยหรือไม่
function isSentenceSuspicious(sentence: string, keywords: string[]): boolean {
  const sentenceLower = sentence.toLowerCase()
  
  // คำที่บ่งชี้ความปลอดภัย
  const safeIndicators = [
    'ข่าวสาร', 'ข่าว', 'บทความ', 'การศึกษา', 'วิจัย', 'สถิติ', 'รายงาน',
    'ประกาศ', 'แจ้งเตือน', 'เตือนภัย', 'ป้องกัน', 'ความปลอดภัย',
    'ธนาคารแห่งประเทศไทย', 'ก.ล.ต.', 'ตำรวจ', 'หน่วยงานราชการ',
    'เว็บไซต์ทางการ', 'https://', 'www.', '.gov.th', '.ac.th'
  ]
  
  // คำที่บ่งชี้การหลอกลวง
  const scamIndicators = [
    'โอนเงินด่วน', 'โอนเงินทันที', 'โอนเงินตอนนี้', 'โอนเงินภายใน 1 ชั่วโมง',
    'รางวัลใหญ่', 'รางวัลมหาศาล', 'รางวัลพิเศษ', 'รางวัลเฉพาะคุณ',
    'ฟรี 100%', 'ฟรีทันที', 'ฟรีไม่มีเงื่อนไข', 'ฟรีไม่มีค่าใช้จ่าย',
    'กำไร 500%', 'กำไร 1000%', 'กำไรมหาศาล', 'กำไรทันที',
    'ลงทุนน้อย กำไรมาก', 'ลงทุน 1000 ได้ 10000',
    'คลิกลิงก์เพื่อรับ', 'คลิกลิงก์เพื่อโอน', 'คลิกลิงก์เพื่อยืนยัน',
    'OTP ด่วน', 'รหัส OTP', 'ยืนยัน OTP', 'ส่ง OTP',
    'หมายจับ', 'ค่าปรับ', 'คดีความ', 'ถูกฟ้อง', 'ถูกดำเนินคดี',
    'บัญชีถูกระงับ', 'บัญชีถูกบล็อก', 'บัญชีมีปัญหา',
    'ธนาคารแจ้ง', 'ธนาคารขอ', 'ธนาคารต้องการ', 'ธนาคารติดต่อ'
  ]
  
  // ตรวจสอบคำบ่งชี้ความปลอดภัย
  const hasSafeIndicator = safeIndicators.some(indicator => 
    sentenceLower.includes(indicator.toLowerCase())
  )
  
  // ตรวจสอบคำบ่งชี้การหลอกลวง
  const hasScamIndicator = scamIndicators.some(indicator => 
    sentenceLower.includes(indicator.toLowerCase())
  )
  
  // ตรวจสอบรูปแบบการหลอกลวง
  const hasUrgency = /(ด่วน|ทันที|ตอนนี้|ภายใน|รีบ|เร่ง|ฉุกเฉิน)/i.test(sentence)
  const hasPressure = /(ต้อง|จำเป็น|สำคัญ|ขาดไม่ได้|ห้ามพลาด)/i.test(sentence)
  const hasMoney = /(เงิน|บาท)/i.test(sentence)
  const hasAction = /(คลิก|กด|โอน|ส่ง|ยืนยัน|ให้)/i.test(sentence)
  
  // ถ้ามีคำบ่งชี้ความปลอดภัย ให้ลดความเสี่ยง
  if (hasSafeIndicator) {
    return false
  }
  
  // ถ้ามีคำบ่งชี้การหลอกลวง ให้เพิ่มความเสี่ยง
  if (hasScamIndicator) {
    return true
  }
  
  // ตรวจสอบรูปแบบการหลอกลวง
  const urgencyScore = hasUrgency ? 2 : 0
  const pressureScore = hasPressure ? 2 : 0
  const moneyScore = hasMoney ? 1 : 0
  const actionScore = hasAction ? 1 : 0
  const keywordScore = keywords.length
  
  const totalScore = urgencyScore + pressureScore + moneyScore + actionScore + keywordScore
  
  // ต้องมีคะแนนสูงพอถึงจะสงสัย
  return totalScore >= 4
}

function identifyScamType(keywords: string[]): string {
  if (keywords.includes('ธนาคาร') || keywords.includes('OTP')) return 'Call Center Scam'
  if (keywords.includes('คลิก') || keywords.includes('ลิงก์')) return 'Phishing Link'
  if (keywords.includes('รางวัล') || keywords.includes('แจกรางวัล')) return 'Social Media Scam'
  if (keywords.includes('ลงทุน') || keywords.includes('กำไร')) return 'Investment Scam'
  return 'Unknown Scam Type'
}

function generateRecommendations(riskLevel: string, keywords: string[]): string[] {
  const recommendations = []

  if (riskLevel === 'high') {
    recommendations.push('⚠️ พบสัญญาณการหลอกลวง! แนะนำให้ระวังและไม่ดำเนินการตามข้อความนี้')
    recommendations.push('🔒 อย่าให้ข้อมูลส่วนตัว เช่น รหัสผ่าน, OTP, หมายเลขบัตร')
    recommendations.push('💰 อย่าโอนเงินหรือชำระค่าธรรมเนียมใดๆ')
  } else if (riskLevel === 'medium') {
    recommendations.push('⚠️ พบคำเสี่ยงบางคำ แนะนำให้ตรวจสอบให้ดีก่อนดำเนินการ')
    recommendations.push('🔍 ตรวจสอบแหล่งที่มาของข้อความให้แน่ใจ')
  } else {
    recommendations.push('✅ เนื้อหาดูปลอดภัย แต่ควรระวังเสมอ')
  }

  return recommendations
} 