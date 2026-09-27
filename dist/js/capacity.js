/* 관리자 전용 Supabase Storage·DB 사용량 조회 */
(() => {
  const storageLimitBytes = 1024 ** 3;
  const databaseLimitBytes = 500 * 1024 ** 2;
  const threshold = 80;
  const ids = {
    storage: { card: 'storageCapacityCard', percent: 'storageCapacityPercent', bar: 'storageCapacityBar', used: 'storageCapacityUsed', remaining: 'storageCapacityRemaining', limit: 'storageCapacityLimit' },
    database: { card: 'databaseCapacityCard', percent: 'databaseCapacityPercent', bar: 'databaseCapacityBar', used: 'databaseCapacityUsed', remaining: 'databaseCapacityRemaining', limit: 'databaseCapacityLimit' }
  };

  function formatBytes(value) {
    const bytes = Math.max(0, Number(value) || 0);
    if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
    if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  }

  function setMetric(kind, usedBytes, limitBytes) {
    const target = ids[kind];
    const used = Math.max(0, Number(usedBytes) || 0);
    const percent = limitBytes ? (used / limitBytes) * 100 : 0;
    const roundedPercent = Math.round(percent * 10) / 10;
    const state = percent >= 100 ? 'danger' : percent >= threshold ? 'warning' : '';
    document.getElementById(target.card).className = `capacity-card${state ? ` ${state}` : ''}`;
    document.getElementById(target.percent).textContent = `${roundedPercent}% 사용`;
    document.getElementById(target.bar).style.width = `${Math.min(percent, 100)}%`;
    document.getElementById(target.used).textContent = formatBytes(used);
    document.getElementById(target.remaining).textContent = formatBytes(Math.max(0, limitBytes - used));
    document.getElementById(target.limit).textContent = formatBytes(limitBytes);
    return { label: kind === 'storage' ? 'Storage' : 'DB', percent, state };
  }

  function setLoading() {
    Object.values(ids).forEach(target => {
      document.getElementById(target.percent).textContent = '확인 중';
      document.getElementById(target.bar).style.width = '0%';
    });
  }

  function updateAlert(metrics) {
    const alerts = metrics.filter(metric => metric.percent >= threshold);
    const message = alerts.length
      ? `${alerts.map(metric => `${metric.label} ${Math.round(metric.percent * 10) / 10}%`).join(', ')} 사용 중입니다. 무료 한도의 80%를 넘었습니다.`
      : 'Storage와 DB 모두 무료 한도의 80% 미만입니다.';
    document.getElementById('capacityAlertMessage').textContent = message;
    window.fleetCapacityNotice = alerts.length ? `용량 주의: ${message}` : '';
    return alerts.length;
  }

  async function refreshCapacityUsage({ announce = false } = {}) {
    if (window.fleetCurrentRole !== 'admin') return false;
    setLoading();
    const { data, error } = await window.fleetSupabaseClient.rpc('admin_get_capacity_usage');
    if (error) throw Error(error.message || 'Supabase 용량 정보를 불러오지 못했습니다.');
    const usage = Array.isArray(data) ? data[0] : data;
    if (!usage) throw Error('Supabase 용량 정보를 찾을 수 없습니다.');
    const storage = setMetric('storage', usage.storage_bytes, storageLimitBytes);
    const database = setMetric('database', usage.database_bytes, databaseLimitBytes);
    const alerts = updateAlert([storage, database]);
    document.getElementById('capacityUpdatedAt').textContent = `마지막 확인: ${new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date())}`;
    if (announce && alerts && window.showToast) showToast(`용량 주의: 무료 한도의 80%를 넘었습니다. 용량확인 메뉴에서 확인하세요.`);
    return true;
  }

  document.getElementById('refreshCapacity')?.addEventListener('click', () => {
    refreshCapacityUsage({ announce: true }).catch(error => {
      document.getElementById('capacityAlertMessage').textContent = error.message;
      if (window.showToast) showToast(error.message);
    });
  });

  window.refreshCapacityUsage = refreshCapacityUsage;
})();
