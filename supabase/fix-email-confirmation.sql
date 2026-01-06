-- 기존 사용자들의 이메일 자동 확인 처리
UPDATE auth.users
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
