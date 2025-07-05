-- ข้อมูลจำลองสำหรับ AI Security System
-- ข้อมูล 5 ปีย้อนหลัง (2019-2024)

-- 1. ข้อมูลประเภทการหลอกลวง
INSERT INTO scam_categories (name, description, risk_level, keywords) VALUES
('Call Center Scam', 'การหลอกลวงผ่านโทรศัพท์ อ้างเป็นธนาคาร/ตำรวจ/บริษัท', 'high', ARRAY['ธนาคาร', 'ตำรวจ', 'หมายจับ', 'บัญชีถูกระงับ', 'โอนเงิน', 'ยืนยันตัวตน', 'OTP', 'รหัสผ่าน']),
('Phishing Link', 'การหลอกลวงผ่านลิงก์ปลอม ขโมยข้อมูลล็อกอิน', 'high', ARRAY['คลิกลิงก์', 'ยืนยัน', 'ล็อกอิน', 'รหัสผ่าน', 'อีเมล', 'เว็บไซต์', 'ธนาคาร', 'โอนเงิน']),
('Social Media Scam', 'การหลอกลวงผ่านโซเชียลมีเดีย', 'medium', ARRAY['รางวัล', 'ฟรี', 'คลิก', 'แชร์', 'ไลค์', 'ติดตาม', 'โอนเงิน', 'ลงทะเบียน']),
('SMS/Email Fraud', 'การหลอกลวงผ่านข้อความ/อีเมล', 'medium', ARRAY['รางวัล', 'โอนเงิน', 'คลิกลิงก์', 'ยืนยัน', 'OTP', 'รหัสผ่าน', 'ธนาคาร']),
('Investment Scam', 'การหลอกลวงการลงทุน หุ้น/คริปโต/ฟอเร็กซ์', 'high', ARRAY['ลงทุน', 'กำไร', 'หุ้น', 'คริปโต', 'บิทคอยน์', 'ฟอเร็กซ์', 'ROI', 'ผลตอบแทน']);

-- 2. ข้อมูลการหลอกลวง 5 ปีย้อนหลัง (2019-2024)
-- 2019
INSERT INTO scam_records (category_id, title, description, scam_type, detected_text, keywords_found, risk_level, confidence_score, location, reported_date, victim_count, financial_loss, source) VALUES
(1, 'Call Center Scam - ธนาคารกรุงเทพ', 'โทรมาอ้างเป็นธนาคารกรุงเทพ บัญชีถูกระงับ', 'call_center', 'ธนาคารกรุงเทพ: บัญชีของคุณถูกระงับ กรุณาโอนเงิน 10,000 บาทเพื่อยืนยันตัวตน', ARRAY['ธนาคาร', 'บัญชีถูกระงับ', 'โอนเงิน', 'ยืนยันตัวตน'], 'high', 95.5, 'กรุงเทพมหานคร', '2019-03-15', 45, 450000.00, 'police_report'),
(2, 'Phishing Link - Gmail', 'ส่งลิงก์ปลอมอีเมล Gmail', 'phishing_link', 'Gmail: บัญชีของคุณถูกแฮ็ก คลิกลิงก์เพื่อยืนยันตัวตน', ARRAY['Gmail', 'บัญชีถูกแฮ็ก', 'คลิกลิงก์', 'ยืนยันตัวตน'], 'high', 92.3, 'กรุงเทพมหานคร', '2019-06-22', 120, 1200000.00, 'cyber_crime_report'),
(3, 'Facebook Lottery Scam', 'โพสต์หลอกรางวัลลอตเตอรี่', 'social_media', '🎉 คุณได้รับรางวัล 1,000,000 บาท คลิกรับเลย!', ARRAY['รางวัล', 'คลิก', 'ลอตเตอรี่'], 'medium', 88.7, 'เชียงใหม่', '2019-08-10', 89, 890000.00, 'social_media_report');

-- 2020
INSERT INTO scam_records (category_id, title, description, scam_type, detected_text, keywords_found, risk_level, confidence_score, location, reported_date, victim_count, financial_loss, source) VALUES
(1, 'ตำรวจปลอม - หมายจับ', 'โทรมาอ้างเป็นตำรวจ มีหมายจับ', 'call_center', 'ตำรวจแจ้งความ: พบหมายจับในนามคุณ กรุณาโอนเงิน 50,000 บาทเพื่อชำระค่าปรับ', ARRAY['ตำรวจ', 'หมายจับ', 'โอนเงิน', 'ค่าปรับ'], 'high', 96.2, 'กรุงเทพมหานคร', '2020-01-08', 67, 3350000.00, 'police_report'),
(4, 'SMS Lottery Scam', 'ข้อความหลอกรางวัล', 'sms_email', '🎊 คุณได้รับรางวัล 500,000 บาท คลิกลิงก์เพื่อรับรางวัล', ARRAY['รางวัล', 'คลิกลิงก์'], 'medium', 85.4, 'ภูเก็ต', '2020-04-12', 156, 780000.00, 'sms_report'),
(5, 'Bitcoin Investment Scam', 'หลอกลงทุนบิทคอยน์', 'investment', '💰 ลงทุนบิทคอยน์ กำไร 500% ใน 7 วัน เริ่มต้นเพียง 1,000 บาท', ARRAY['ลงทุน', 'บิทคอยน์', 'กำไร', '500%'], 'high', 94.1, 'กรุงเทพมหานคร', '2020-07-25', 234, 2340000.00, 'investment_report');

-- 2021
INSERT INTO scam_records (category_id, title, description, scam_type, detected_text, keywords_found, risk_level, confidence_score, location, reported_date, victim_count, financial_loss, source) VALUES
(2, 'LINE Phishing', 'ลิงก์ปลอมผ่าน LINE', 'phishing_link', 'LINE: มีคนส่งข้อความหาคุณ คลิกลิงก์เพื่อดูข้อความ', ARRAY['LINE', 'คลิกลิงก์', 'ข้อความ'], 'high', 91.8, 'กรุงเทพมหานคร', '2021-02-14', 189, 1890000.00, 'cyber_crime_report'),
(3, 'Instagram Giveaway Scam', 'หลอกแจกรางวัลใน Instagram', 'social_media', '🎁 แจกรางวัล iPhone 13 ฟรี! แชร์โพสต์และติดตามเพื่อร่วมลุ้น', ARRAY['แจกรางวัล', 'ฟรี', 'แชร์', 'ติดตาม'], 'medium', 87.3, 'เชียงใหม่', '2021-05-30', 267, 534000.00, 'social_media_report'),
(1, 'Bank OTP Scam', 'หลอกขอ OTP ธนาคาร', 'call_center', 'ธนาคารกสิกรไทย: กรุณายืนยัน OTP ที่ส่งไปมือถือ', ARRAY['ธนาคาร', 'OTP', 'ยืนยัน'], 'high', 97.5, 'กรุงเทพมหานคร', '2021-09-18', 145, 1450000.00, 'police_report');

-- 2022
INSERT INTO scam_records (category_id, title, description, scam_type, detected_text, keywords_found, risk_level, confidence_score, location, reported_date, victim_count, financial_loss, source) VALUES
(5, 'Forex Trading Scam', 'หลอกลงทุนฟอเร็กซ์', 'investment', '📈 ลงทุนฟอเร็กซ์ กำไร 300% ต่อเดือน เริ่มต้น 5,000 บาท', ARRAY['ลงทุน', 'ฟอเร็กซ์', 'กำไร', '300%'], 'high', 93.7, 'กรุงเทพมหานคร', '2022-01-05', 178, 890000.00, 'investment_report'),
(4, 'Email Bank Scam', 'อีเมลหลอกธนาคาร', 'sms_email', 'ธนาคารไทยพาณิชย์: บัญชีของคุณถูกระงับ กรุณาคลิกลิงก์เพื่อยืนยัน', ARRAY['ธนาคาร', 'บัญชีถูกระงับ', 'คลิกลิงก์', 'ยืนยัน'], 'high', 95.2, 'กรุงเทพมหานคร', '2022-04-20', 203, 2030000.00, 'email_report'),
(3, 'TikTok Live Scam', 'หลอกใน TikTok Live', 'social_media', '🎯 Live แจกรางวัล! กดไลค์และคอมเมนต์เพื่อรับ iPhone 14', ARRAY['Live', 'แจกรางวัล', 'ไลค์', 'คอมเมนต์'], 'medium', 86.9, 'กรุงเทพมหานคร', '2022-08-12', 345, 690000.00, 'social_media_report');

-- 2023
INSERT INTO scam_records (category_id, title, description, scam_type, detected_text, keywords_found, risk_level, confidence_score, location, reported_date, victim_count, financial_loss, source) VALUES
(1, 'Tax Refund Scam', 'หลอกคืนภาษี', 'call_center', 'สรรพากร: คุณมีเงินคืนภาษี 25,000 บาท กรุณาโอนค่าธรรมเนียม 1,000 บาท', ARRAY['สรรพากร', 'เงินคืนภาษี', 'โอน', 'ค่าธรรมเนียม'], 'high', 96.8, 'กรุงเทพมหานคร', '2023-02-28', 89, 89000.00, 'police_report'),
(2, 'WhatsApp Phishing', 'ลิงก์ปลอมผ่าน WhatsApp', 'phishing_link', 'WhatsApp: มีคนส่งข้อความหาคุณ คลิกลิงก์เพื่อดู', ARRAY['WhatsApp', 'คลิกลิงก์', 'ข้อความ'], 'high', 92.1, 'กรุงเทพมหานคร', '2023-06-15', 167, 1670000.00, 'cyber_crime_report'),
(5, 'Crypto Investment Scam', 'หลอกลงทุนคริปโต', 'investment', '🚀 ลงทุน Ethereum กำไร 1000% ใน 30 วัน เริ่มต้น 10,000 บาท', ARRAY['ลงทุน', 'Ethereum', 'กำไร', '1000%'], 'high', 94.5, 'กรุงเทพมหานคร', '2023-10-08', 298, 2980000.00, 'investment_report');

-- 2024
INSERT INTO scam_records (category_id, title, description, scam_type, detected_text, keywords_found, risk_level, confidence_score, location, reported_date, victim_count, financial_loss, source) VALUES
(1, 'Insurance Scam', 'หลอกประกันภัย', 'call_center', 'ประกันชีวิต: คุณมีสิทธิ์รับเงินประกัน 100,000 บาท กรุณาโอนค่าธรรมเนียม 2,000 บาท', ARRAY['ประกันชีวิต', 'สิทธิ์', 'โอน', 'ค่าธรรมเนียม'], 'high', 95.7, 'กรุงเทพมหานคร', '2024-01-12', 67, 134000.00, 'police_report'),
(3, 'Telegram Crypto Scam', 'หลอกคริปโตผ่าน Telegram', 'social_media', '💎 ลงทุน Dogecoin กำไร 5000% ใน 7 วัน! เข้ากลุ่ม Telegram', ARRAY['ลงทุน', 'Dogecoin', 'กำไร', '5000%', 'Telegram'], 'high', 93.2, 'กรุงเทพมหานคร', '2024-03-25', 189, 1890000.00, 'social_media_report'),
(4, 'SMS Bank Scam', 'ข้อความหลอกธนาคาร', 'sms_email', 'ธนาคารกรุงศรี: บัญชีของคุณถูกระงับ กรุณาคลิกลิงก์เพื่อยืนยันตัวตน', ARRAY['ธนาคาร', 'บัญชีถูกระงับ', 'คลิกลิงก์', 'ยืนยันตัวตน'], 'high', 96.4, 'กรุงเทพมหานคร', '2024-05-18', 234, 2340000.00, 'sms_report');

-- 3. ข้อมูลพื้นที่เสี่ยง
INSERT INTO risk_locations (name, address, latitude, longitude, risk_level, crime_count, last_incident_date, location_type) VALUES
('ตลาดจตุจักร', 'ถนนกำแพงเพชร 3 แขวงลาดยาว เขตจตุจักร กรุงเทพมหานคร', 13.7563, 100.5018, 'high', 45, '2024-06-15', 'market'),
('สถานีรถไฟหัวลำโพง', 'ถนนพระราม 4 แขวงมหาพฤฒาราม เขตบางรัก กรุงเทพมหานคร', 13.7563, 100.5018, 'high', 38, '2024-06-10', 'station'),
('เซ็นทรัลเวิลด์', 'ถนนราชประสงค์ แขวงปทุมวัน เขตปทุมวัน กรุงเทพมหานคร', 13.7466, 100.5388, 'medium', 23, '2024-06-08', 'mall'),
('สนามบินสุวรรณภูมิ', 'ตำบลราชาเทวะ อำเภอบางพลี จังหวัดสมุทรปราการ', 13.6900, 100.7501, 'medium', 31, '2024-06-12', 'airport'),
('ตลาดไท', 'ถนนพหลโยธิน แขวงคลองถนน เขตสายไหม กรุงเทพมหานคร', 13.9207, 100.6447, 'high', 42, '2024-06-14', 'market'),
('สถานีรถไฟฟ้า BTS สนามกีฬาแห่งชาติ', 'ถนนพระราม 1 แขวงวังใหม่ เขตปทุมวัน กรุงเทพมหานคร', 13.7466, 100.5388, 'medium', 19, '2024-06-05', 'station'),
('ห้างสรรพสินค้า MBK Center', 'ถนนพระราม 1 แขวงวังใหม่ เขตปทุมวัน กรุงเทพมหานคร', 13.7466, 100.5388, 'medium', 27, '2024-06-11', 'mall'),
('ตลาดประตูน้ำ', 'ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร', 13.6900, 100.7501, 'high', 35, '2024-06-13', 'market');

-- 4. ข้อมูลรูปภาพโปรไฟล์ปลอม
INSERT INTO fake_profiles (image_url, original_source, is_fake, detection_method, confidence_score, scam_type) VALUES
('https://example.com/fake_profile_1.jpg', 'https://www.instagram.com/real_person_1', true, 'reverse_search', 95.2, 'social_media'),
('https://example.com/fake_profile_2.jpg', 'https://www.facebook.com/real_person_2', true, 'ai_detection', 87.6, 'investment'),
('https://example.com/fake_profile_3.jpg', 'https://www.linkedin.com/real_person_3', true, 'reverse_search', 92.1, 'call_center'),
('https://example.com/fake_profile_4.jpg', 'https://www.twitter.com/real_person_4', true, 'ai_detection', 89.3, 'phishing_link'),
('https://example.com/fake_profile_5.jpg', 'https://www.pinterest.com/real_person_5', true, 'reverse_search', 94.7, 'social_media');

-- 5. ข้อมูล AI Prediction Model
INSERT INTO ai_predictions (model_version, prediction_type, accuracy_score, precision_score, recall_score, f1_score, training_data_size) VALUES
('v1.0', 'data_phishing', 94.2, 92.8, 95.6, 94.2, 15000),
('v1.0', 'financial_scam', 96.1, 95.3, 96.9, 96.1, 18000),
('v1.1', 'data_phishing', 95.8, 94.2, 97.4, 95.8, 20000),
('v1.1', 'financial_scam', 97.3, 96.8, 97.8, 97.3, 22000); 