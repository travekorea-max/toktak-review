-- 기존 사용자들의 이메일 자동 확인 처리
UPDATE auth.users
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
-- Storage bucket 생성 (campaign-images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-images', 'campaign-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage 정책 - 누구나 읽기 가능
CREATE POLICY "Anyone can view campaign images"
ON storage.objects FOR SELECT
USING (bucket_id = 'campaign-images');

-- Storage 정책 - 인증된 사용자는 업로드 가능
CREATE POLICY "Authenticated users can upload campaign images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'campaign-images' AND auth.role() = 'authenticated');

-- Storage 정책 - 본인이 업로드한 이미지만 삭제 가능
CREATE POLICY "Users can delete their own campaign images"
ON storage.objects FOR DELETE
USING (bucket_id = 'campaign-images' AND auth.uid()::text = (storage.foldername(name))[1]);
