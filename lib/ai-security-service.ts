import { supabase, ScamCategory, ScamRecord, ScanLog } from './supabase'

export interface ScamAnalysisResult {
  riskLevel: 'low' | 'medium' | 'high'
  confidence: number
  keywordsFound: string[]
  scamMatches: ScamRecord[]
  scamType: string
  detectedText: string
  recommendations: string[]
}

export interface ScanResult {
  scanType: 'screen_share' | 'mobile_upload' | 'text_input' | 'image_upload'
  detectedText: string
  detectedImageUrl?: string
  riskLevel: 'low' | 'medium' | 'high'
  confidenceScore: number
  keywordsFound: string[]
  scamMatches: any
  userLocation?: string
  scanResult: ScamAnalysisResult
}

export class AISecurityService {
  private scamCategories: ScamCategory[] = []
  private scamRecords: ScamRecord[] = []

  // โหลดข้อมูลจากฐานข้อมูล
  async loadData() {
    try {
      // โหลดประเภทการหลอกลวง
      const { data: categories } = await supabase
        .from('scam_categories')
        .select('*')
      this.scamCategories = categories || []

      // โหลดข้อมูลการหลอกลวง 5 ปีย้อนหลัง
      const { data: records } = await supabase
        .from('scam_records')
        .select('*')
        .order('reported_date', { ascending: false })
      this.scamRecords = records || []

      console.log('โหลดข้อมูลสำเร็จ:', {
        categories: this.scamCategories.length,
        records: this.scamRecords.length
      })
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการโหลดข้อมูล:', error)
    }
  }

  // วิเคราะห์ข้อความเพื่อตรวจจับการหลอกลวง
  async analyzeText(text: string): Promise<ScamAnalysisResult> {
    if (!text || text.trim().length === 0) {
      return {
        riskLevel: 'low',
        confidence: 0,
        keywordsFound: [],
        scamMatches: [],
        scamType: 'No Content',
        detectedText: text,
        recommendations: ['ไม่มีเนื้อหาให้วิเคราะห์']
      }
    }

    // ตรวจสอบคำสำคัญจากทุกประเภท
    const allKeywords = this.scamCategories.flatMap(cat => cat.keywords)
    
    // วิเคราะห์บริบทรอบคำสำคัญ
    const contextAnalysis = this.analyzeKeywordContext(text, allKeywords)
    const foundKeywords = contextAnalysis.suspiciousKeywords
    const suspiciousSentences = contextAnalysis.suspiciousSentences

    // หาการจับคู่กับข้อมูลการหลอกลวงในอดีต (เฉพาะคำที่สงสัยจริงๆ)
    const scamMatches = this.scamRecords.filter(record => 
      foundKeywords.some(keyword => 
        record.keywords_found.includes(keyword)
      )
    )

    // คำนวณระดับความเสี่ยง (ปรับให้เข้มงวดขึ้น)
    const riskLevel = this.calculateRiskLevelWithContext(foundKeywords, scamMatches, suspiciousSentences)
    
    // คำนวณความมั่นใจ (ปรับให้เข้มงวดขึ้น)
    const confidence = this.calculateConfidenceWithContext(foundKeywords, scamMatches, suspiciousSentences)
    
    // ระบุประเภทการหลอกลวง
    const scamType = this.identifyScamType(foundKeywords, scamMatches)
    
    // สร้างคำแนะนำ
    const recommendations = this.generateRecommendations(riskLevel, scamType, foundKeywords)

    return {
      riskLevel,
      confidence,
      keywordsFound: foundKeywords,
      scamMatches,
      scamType,
      detectedText: text,
      recommendations
    }
  }

  // วิเคราะห์บริบทรอบคำสำคัญ
  private analyzeKeywordContext(text: string, keywords: string[]): {
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
    
    // ลบคำซ้ำ
    return {
      suspiciousKeywords: [...new Set(suspiciousKeywords)],
      suspiciousSentences
    }
  }

  // ตรวจสอบว่าประโยคสงสัยหรือไม่
  private isSentenceSuspicious(sentence: string, keywords: string[]): boolean {
    const sentenceLower = sentence.toLowerCase()
    
    // คำที่บ่งชี้ความปลอดภัย (ลดความเสี่ยง)
    const safeIndicators = [
      'ข่าวสาร', 'ข่าว', 'บทความ', 'การศึกษา', 'วิจัย', 'สถิติ', 'รายงาน',
      'ประกาศ', 'แจ้งเตือน', 'เตือนภัย', 'ป้องกัน', 'ความปลอดภัย',
      'ธนาคารแห่งประเทศไทย', 'ก.ล.ต.', 'ตำรวจ', 'หน่วยงานราชการ',
      'เว็บไซต์ทางการ', 'https://', 'www.', '.gov.th', '.ac.th'
    ]
    
    // คำที่บ่งชี้การหลอกลวง (เพิ่มความเสี่ยง)
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
    const hasMoney = /(เงิน|บาท|บาท|บาท|บาท)/i.test(sentence)
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

  // คำนวณระดับความเสี่ยง (ปรับให้เข้มงวดขึ้น)
  private calculateRiskLevelWithContext(
    keywords: string[], 
    matches: ScamRecord[], 
    suspiciousSentences: string[]
  ): 'low' | 'medium' | 'high' {
    const keywordScore = keywords.length * 5  // ลดจาก 10 เป็น 5
    const matchScore = matches.length * 15    // ลดจาก 20 เป็น 15
    const sentenceScore = suspiciousSentences.length * 10
    
    const totalScore = keywordScore + matchScore + sentenceScore

    if (totalScore >= 40) return 'high'    // เพิ่มจาก 50 เป็น 40
    if (totalScore >= 15) return 'medium'  // เพิ่มจาก 20 เป็น 15
    return 'low'
  }

  // คำนวณความมั่นใจ (ปรับให้เข้มงวดขึ้น)
  private calculateConfidenceWithContext(
    keywords: string[], 
    matches: ScamRecord[], 
    suspiciousSentences: string[]
  ): number {
    const keywordConfidence = Math.min(keywords.length * 10, 40)  // ลดจาก 15 เป็น 10
    const matchConfidence = Math.min(matches.length * 8, 30)      // ลดจาก 10 เป็น 8
    const sentenceConfidence = Math.min(suspiciousSentences.length * 10, 30)
    
    return Math.min(keywordConfidence + matchConfidence + sentenceConfidence, 100)
  }

  // ระบุประเภทการหลอกลวง
  private identifyScamType(keywords: string[], matches: ScamRecord[]): string {
    if (matches.length > 0) {
      // ใช้ประเภทจากข้อมูลที่จับคู่ได้
      const scamTypes = matches.map(match => match.scam_type)
      const typeCounts = scamTypes.reduce((acc, type) => {
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      const mostCommonType = Object.entries(typeCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0]
      
      if (mostCommonType) {
        return this.formatScamType(mostCommonType)
      }
    }

    // ใช้คำสำคัญในการระบุประเภท
    const keywordTypes = this.scamCategories
      .filter(cat => cat.keywords.some(keyword => keywords.includes(keyword)))
      .map(cat => cat.name)

    return keywordTypes.length > 0 ? keywordTypes[0] : 'Unknown Scam Type'
  }

  // จัดรูปแบบประเภทการหลอกลวง
  private formatScamType(type: string): string {
    const typeMap: Record<string, string> = {
      'call_center': 'Call Center Scam',
      'phishing_link': 'Phishing Link',
      'social_media': 'Social Media Scam',
      'sms_email': 'SMS/Email Fraud',
      'investment': 'Investment Scam'
    }
    return typeMap[type] || type
  }

  // สร้างคำแนะนำ
  private generateRecommendations(riskLevel: string, scamType: string, keywords: string[]): string[] {
    const recommendations: string[] = []

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

    // คำแนะนำเฉพาะตามประเภท
    if (scamType.includes('Call Center')) {
      recommendations.push('📞 อย่าเชื่อโทรศัพท์ที่อ้างเป็นธนาคาร/ตำรวจ ให้โทรกลับไปที่หมายเลขจริง')
    } else if (scamType.includes('Phishing')) {
      recommendations.push('🔗 อย่าคลิกลิงก์ที่สงสัย ให้เข้าเว็บไซต์โดยตรง')
    } else if (scamType.includes('Investment')) {
      recommendations.push('📈 ระวังการลงทุนที่สัญญากำไรสูงผิดปกติ')
    }

    return recommendations
  }

  // บันทึกผลการสแกน
  async logScanResult(scanData: ScanResult): Promise<void> {
    try {
      const { error } = await supabase
        .from('scan_logs')
        .insert([{
          scan_type: scanData.scanType,
          detected_text: scanData.detectedText,
          detected_image_url: scanData.detectedImageUrl,
          risk_level: scanData.riskLevel,
          confidence_score: scanData.confidenceScore,
          keywords_found: scanData.keywordsFound,
          scam_matches: scanData.scamMatches,
          user_location: scanData.userLocation,
          scan_result: scanData.scanResult
        }])

      if (error) {
        console.error('เกิดข้อผิดพลาดในการบันทึกผลการสแกน:', error)
      } else {
        console.log('บันทึกผลการสแกนสำเร็จ')
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการบันทึกผลการสแกน:', error)
    }
  }

  // ดึงสถิติการหลอกลวง
  async getScamStatistics() {
    try {
      const { data, error } = await supabase
        .from('scam_records')
        .select('scam_type, risk_level, victim_count, financial_loss, reported_date')

      if (error) throw error

      // จัดกลุ่มข้อมูลตามประเภท
      const stats = data?.reduce((acc: Record<string, any>, record: any) => {
        const type = record.scam_type
        if (!acc[type]) {
          acc[type] = {
            count: 0,
            totalVictims: 0,
            totalLoss: 0,
            highRiskCount: 0
          }
        }
        acc[type].count++
        acc[type].totalVictims += record.victim_count
        acc[type].totalLoss += record.financial_loss
        if (record.risk_level === 'high') {
          acc[type].highRiskCount++
        }
        return acc
      }, {} as Record<string, any>)

      return stats || {}
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการดึงสถิติ:', error)
      return {}
    }
  }

  // ดึงข้อมูลพื้นที่เสี่ยง
  async getRiskLocations() {
    try {
      const { data, error } = await supabase
        .from('risk_locations')
        .select('*')
        .order('crime_count', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการดึงข้อมูลพื้นที่เสี่ยง:', error)
      return []
    }
  }

  // วิเคราะห์ข้อความสำหรับ Chatbot
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
      scamDetected: analysis.riskLevel !== 'low',
      riskLevel: analysis.riskLevel
    }
  }
}

// สร้าง instance เดียว
export const aiSecurityService = new AISecurityService() 