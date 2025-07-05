export interface TyphoonAnalysisResult {
  isScam: boolean
  riskLevel: 'low' | 'medium' | 'high'
  confidence: number
  scamType: string
  keywords: string[]
  explanation: string
  recommendations: string[]
}

export class TyphoonAIService {
  // วิเคราะห์ข้อความด้วย Typhoon AI ผ่าน API Route
  async analyzeText(text: string): Promise<TyphoonAnalysisResult> {
    if (!text || text.trim().length === 0) {
      return {
        isScam: false,
        riskLevel: 'low',
        confidence: 0,
        scamType: 'No Content',
        keywords: [],
        explanation: 'ไม่มีเนื้อหาให้วิเคราะห์',
        recommendations: ['ไม่มีเนื้อหาให้วิเคราะห์']
      }
    }

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text })
      })

      if (!response.ok) {
        throw new Error('API request failed')
      }

      const analysis = await response.json()
      return analysis

    } catch (error) {
      console.error('Typhoon AI Error:', error)
      return this.fallbackAnalysis(text)
    }
  }

  // Fallback analysis เมื่อ Typhoon AI ไม่ทำงาน
  private fallbackAnalysis(text: string): TyphoonAnalysisResult {
    const scamKeywords = [
      'โอนเงิน', 'รางวัล', 'ฟรี', 'คลิก', 'ลิงก์', 'ธนาคาร', 'บัญชีถูกระงับ',
      'OTP', 'ยืนยัน', 'ตำรวจ', 'หมายจับ', 'ค่าปรับ', 'ลงทุน', 'กำไร',
      'หุ้น', 'คริปโต', 'บิทคอยน์', 'แจกรางวัล', 'iPhone'
    ]

    // วิเคราะห์บริบทแทนการเจอคำเฉยๆ
    const contextAnalysis = this.analyzeContext(text, scamKeywords)
    const foundKeywords = contextAnalysis.suspiciousKeywords
    const suspiciousSentences = contextAnalysis.suspiciousSentences

    const riskLevel = suspiciousSentences.length > 1 ? 'high' : 
                     suspiciousSentences.length > 0 ? 'medium' : 'low'

    const confidence = Math.min(suspiciousSentences.length * 25, 80)

    return {
      isScam: suspiciousSentences.length > 0,
      riskLevel,
      confidence,
      scamType: this.identifyScamType(foundKeywords),
      keywords: foundKeywords,
      explanation: suspiciousSentences.length > 0 ? 
        `พบประโยคที่สงสัย: ${suspiciousSentences.join('; ')}` : 
        'ไม่พบสัญญาณการหลอกลวง',
      recommendations: this.generateRecommendations(riskLevel, foundKeywords)
    }
  }

  // วิเคราะห์บริบท
  private analyzeContext(text: string, keywords: string[]): {
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
        const isSuspicious = this.isSentenceSuspicious(sentence, foundInSentence)
        
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
  private isSentenceSuspicious(sentence: string, keywords: string[]): boolean {
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

  private identifyScamType(keywords: string[]): string {
    if (keywords.includes('ธนาคาร') || keywords.includes('OTP')) return 'Call Center Scam'
    if (keywords.includes('คลิก') || keywords.includes('ลิงก์')) return 'Phishing Link'
    if (keywords.includes('รางวัล') || keywords.includes('แจกรางวัล')) return 'Social Media Scam'
    if (keywords.includes('ลงทุน') || keywords.includes('กำไร')) return 'Investment Scam'
    return 'Unknown Scam Type'
  }

  private generateRecommendations(riskLevel: string, keywords: string[]): string[] {
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

  // ฟังก์ชันสำหรับ Chatbot
  async analyzeForChatbot(userMessage: string): Promise<{
    response: string
    scamDetected: boolean
    riskLevel: 'low' | 'medium' | 'high' | null
  }> {
    const analysis = await this.analyzeText(userMessage)
    
    let response = ''
    if (analysis.riskLevel === 'high') {
      response = `⚠️ **พบสัญญาณการหลอกลวง!**\n\n${analysis.recommendations.join('\n')}\n\nประเภท: ${analysis.scamType}\nความมั่นใจ: ${analysis.confidence.toFixed(1)}%`
    } else if (analysis.riskLevel === 'medium') {
      response = `⚠️ **พบคำเสี่ยงบางคำ**\n\n${analysis.recommendations.join('\n')}\n\nประเภท: ${analysis.scamType}\nความมั่นใจ: ${analysis.confidence.toFixed(1)}%`
    } else {
      response = `✅ **เนื้อหาดูปลอดภัย**\n\n${analysis.recommendations.join('\n')}`
    }

    return {
      response,
      scamDetected: analysis.isScam,
      riskLevel: analysis.riskLevel
    }
  }
}

// สร้าง instance เดียว
export const typhoonAIService = new TyphoonAIService() 