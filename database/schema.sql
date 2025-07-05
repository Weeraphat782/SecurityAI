-- AI Security System Database Schema
-- Supabase PostgreSQL

-- 1. ตารางประเภทการหลอกลวง
CREATE TABLE scam_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high')),
  keywords TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. ตารางข้อมูลการหลอกลวง 5 ปีย้อนหลัง
CREATE TABLE scam_records (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES scam_categories(id),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  scam_type VARCHAR(50) CHECK (scam_type IN ('call_center', 'phishing_link', 'social_media', 'sms_email', 'investment')),
  detected_text TEXT,
  keywords_found TEXT[],
  risk_level VARCHAR(20),
  confidence_score DECIMAL(5,2),
  location VARCHAR(100),
  reported_date DATE,
  victim_count INTEGER DEFAULT 0,
  financial_loss DECIMAL(12,2) DEFAULT 0,
  source VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. ตารางพื้นที่เสี่ยง
CREATE TABLE risk_locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  address TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  risk_level VARCHAR(20),
  crime_count INTEGER DEFAULT 0,
  last_incident_date DATE,
  location_type VARCHAR(50), -- market, mall, station, etc.
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. ตารางรูปภาพโปรไฟล์ปลอม
CREATE TABLE fake_profiles (
  id SERIAL PRIMARY KEY,
  image_url TEXT,
  original_source TEXT,
  is_fake BOOLEAN DEFAULT true,
  detection_method VARCHAR(50), -- reverse_search, ai_detection
  confidence_score DECIMAL(5,2),
  scam_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. ตารางการสแกน
CREATE TABLE scan_logs (
  id SERIAL PRIMARY KEY,
  scan_type VARCHAR(20) CHECK (scan_type IN ('screen_share', 'mobile_upload', 'text_input', 'image_upload')),
  detected_text TEXT,
  detected_image_url TEXT,
  risk_level VARCHAR(20),
  confidence_score DECIMAL(5,2),
  keywords_found TEXT[],
  scam_matches JSONB,
  user_location VARCHAR(100),
  scan_result JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. ตาราง AI Chatbot
CREATE TABLE chatbot_conversations (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(100),
  user_message TEXT,
  bot_response TEXT,
  scam_detected BOOLEAN DEFAULT false,
  risk_level VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. ตาราง AI Prediction Model
CREATE TABLE ai_predictions (
  id SERIAL PRIMARY KEY,
  model_version VARCHAR(20),
  prediction_type VARCHAR(50), -- data_phishing, financial_scam
  accuracy_score DECIMAL(5,2),
  precision_score DECIMAL(5,2),
  recall_score DECIMAL(5,2),
  f1_score DECIMAL(5,2),
  training_data_size INTEGER,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Indexes สำหรับประสิทธิภาพ
CREATE INDEX idx_scam_records_date ON scam_records(reported_date);
CREATE INDEX idx_scam_records_type ON scam_records(scam_type);
CREATE INDEX idx_scan_logs_type ON scan_logs(scan_type);
CREATE INDEX idx_scan_logs_created ON scan_logs(created_at);
CREATE INDEX idx_risk_locations_coords ON risk_locations(latitude, longitude); 