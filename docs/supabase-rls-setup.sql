-- ====================================
-- Supabase RLS ポリシー設定
-- Supabase SQL Editor でこれを全て実行
-- ====================================

-- 1. photos テーブル - SELECT（読み取り）
create policy "Allow anon select photos"
on public.photos
for select
to anon
using (true);

-- 2. photos テーブル - INSERT（投稿）
create policy "Allow anon insert photos"
on public.photos
for insert
to anon
with check (true);

-- 3. photos テーブル - UPDATE（視聴時間更新・RPC用）
create policy "Allow anon update photos"
on public.photos
for update
to anon
using (true)
with check (true);

-- 4. view_logs テーブル - INSERT（ログ記録）
create policy "Allow anon insert view_logs"
on public.view_logs
for insert
to anon
with check (true);

-- 5. Storage: photos バケット - SELECT（読み取り）
create policy "Allow anon select photos bucket"
on storage.objects
for select
to anon
using (bucket_id = 'photos');

-- 6. Storage: photos バケット - INSERT（アップロード）
create policy "Allow anon insert photos bucket"
on storage.objects
for insert
to anon
with check (bucket_id = 'photos');

-- ====================================
-- 確認用クエリ
-- ====================================
-- RLS 有効確認
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname='public';

-- ポリシー確認
-- SELECT * FROM pg_policies WHERE schemaname='public';
