// Vercel 환경변수로 브라우저용 Supabase 공개 설정 파일을 생성한다.
// 이 값은 브라우저 연결에 필요한 공개값이며, Secret/service_role 키는 절대 사용하지 않는다.
const fs = require('node:fs');
const path = require('node:path');

const url = String(process.env.FLEET_SUPABASE_URL || '').trim();
const publishableKey = String(process.env.FLEET_SUPABASE_PUBLISHABLE_KEY || '').trim();

if (!/^https:\/\/.+\.supabase\.co$/i.test(url) || !publishableKey) {
  console.error('FLEET_SUPABASE_URL 및 FLEET_SUPABASE_PUBLISHABLE_KEY 환경변수를 설정하세요.');
  process.exit(1);
}

const output = [
  '// Vercel 배포 시 환경변수에서 자동 생성됩니다. 직접 수정하지 마세요.',
  `window.FLEET_SUPABASE_CONFIG = Object.freeze(${JSON.stringify({ url, publishableKey })});`,
  ''
].join('\n');

fs.writeFileSync(path.resolve(__dirname, '../dist/js/supabase-config.js'), output, 'utf8');
console.log('Supabase 공개 설정 파일을 환경변수로 생성했습니다.');
