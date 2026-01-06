-- ============================================
-- Supabase Auth 연동 (간소화 버전)
-- ============================================

-- Auth 사용자 생성 시 public.users에 자동 추가
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, role, status)
    VALUES (
        NEW.id,
        NEW.email,
        'reviewer',
        'active'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auth 사용자 삭제 시 public.users도 삭제
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.users WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
    AFTER DELETE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_delete();
