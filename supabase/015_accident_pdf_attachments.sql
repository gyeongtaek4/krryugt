-- 사고 현장 자료: JPG/PNG/WebP 외 PDF도 업로드할 수 있도록 허용한다.
-- 화면 제한: 최대 3개, 파일당 5MB, 총 15MB.
update storage.buckets
set allowed_mime_types = array['image/jpeg','image/png','image/webp','application/pdf']
where id = 'accident-photos';
