import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types สำหรับข้อมูล
export interface ScamCategory {
  id: number
  name: string
  description: string
  risk_level: 'low' | 'medium' | 'high'
  keywords: string[]
  created_at: string
}

export interface ScamRecord {
  id: number
  category_id: number
  title: string
  description: string
  scam_type: 'call_center' | 'phishing_link' | 'social_media' | 'sms_email' | 'investment'
  detected_text: string
  keywords_found: string[]
  risk_level: 'low' | 'medium' | 'high'
  confidence_score: number
  location: string
  reported_date: string
  victim_count: number
  financial_loss: number
  source: string
  created_at: string
}

export interface RiskLocation {
  id: number
  name: string
  address: string
  latitude: number
  longitude: number
  risk_level: 'low' | 'medium' | 'high'
  crime_count: number
  last_incident_date: string
  location_type: string
  created_at: string
}

export interface FakeProfile {
  id: number
  image_url: string
  original_source: string
  is_fake: boolean
  detection_method: string
  confidence_score: number
  scam_type: string
  created_at: string
}

export interface ScanLog {
  id: number
  scan_type: 'screen_share' | 'mobile_upload' | 'text_input' | 'image_upload'
  detected_text: string
  detected_image_url: string | null
  risk_level: 'low' | 'medium' | 'high'
  confidence_score: number
  keywords_found: string[]
  scam_matches: any
  user_location: string | null
  scan_result: any
  created_at: string
}

export interface ChatbotConversation {
  id: number
  session_id: string
  user_message: string
  bot_response: string
  scam_detected: boolean
  risk_level: 'low' | 'medium' | 'high' | null
  created_at: string
}

export interface AIPrediction {
  id: number
  model_version: string
  prediction_type: string
  accuracy_score: number
  precision_score: number
  recall_score: number
  f1_score: number
  training_data_size: number
  last_updated: string
} 