/* Q&A와 운행가이드는 활성 회원이 열람하고, 관리자만 작성·관리한다. */
(() => {
  const el = id => document.getElementById(id);
  const qnaRows = el('qnaRows'), guideRows = el('guideRows');
  if (!qnaRows || !guideRows) return;

  let qnaItems = [], guideItems = [], qnaEditingId = null;
  const isAdmin = () => window.fleetCurrentRole === 'admin';
  const safe = value => escapeHtml(String(value || ''));
  const displayDate = value => value ? new Date(value).toLocaleDateString('ko-KR') : '—';

  function renderQna() {
    el('qnaAdminPanel').hidden = !isAdmin();
    const keyword = el('qnaSearch').value.trim().toLowerCase();
    const items = qnaItems.filter(item => `${item.title} ${item.question_body} ${item.answer_body}`.toLowerCase().includes(keyword));
    qnaRows.innerHTML = items.length ? items.map(item => `<article class="knowledge-item">
      <div class="knowledge-item-header"><div><h3>${safe(item.title)}</h3><p class="knowledge-item-meta">등록일 ${displayDate(item.created_at)}${item.updated_at && item.updated_at !== item.created_at ? ` · 수정일 ${displayDate(item.updated_at)}` : ''}</p></div>
      ${isAdmin() ? `<div class="knowledge-actions"><button class="row-edit" type="button" data-qna-edit="${safe(item.id)}">수정</button><button class="row-delete" type="button" data-qna-delete="${safe(item.id)}">삭제</button></div>` : ''}</div>
      <p class="knowledge-question">${safe(item.question_body)}</p><div class="knowledge-answer"><strong>관리자 답변</strong>${safe(item.answer_body)}</div></article>`).join('') : '<p class="knowledge-empty">등록된 Q&amp;A가 없습니다.</p>';
  }

  function renderGuides() {
    el('guideAdminPanel').hidden = !isAdmin();
    guideRows.innerHTML = guideItems.length ? guideItems.map(item => `<article class="knowledge-item">
      <div class="knowledge-item-header"><div><h3>${safe(item.title)}</h3><p class="knowledge-item-meta">등록일 ${displayDate(item.created_at)} · ${safe(item.file_name)} · ${Math.ceil(Number(item.file_size || 0) / 1024)}KB</p></div>
      <div class="knowledge-actions"><button class="row-edit" type="button" data-guide-view="${safe(item.id)}">열람</button><button class="button" type="button" data-guide-download="${safe(item.id)}">다운로드</button>${isAdmin() ? `<button class="row-delete" type="button" data-guide-delete="${safe(item.id)}">삭제</button>` : ''}</div></div>
      ${item.description ? `<p class="knowledge-description">${safe(item.description)}</p>` : ''}<span class="knowledge-guide-file">${safe(item.file_name)}</span></article>`).join('') : '<p class="knowledge-empty">등록된 운행가이드가 없습니다.</p>';
  }

  async function refreshKnowledgeFromSupabase() {
    if (!window.fleetCurrentUser || !window.fleetSupabaseClient) return;
    const [{ data: questions, error: questionError }, { data: guides, error: guideError }] = await Promise.all([
      window.fleetSupabaseClient.from('fleet_questions').select('*').order('updated_at', { ascending: false }),
      window.fleetSupabaseClient.from('fleet_guides').select('*').order('created_at', { ascending: false })
    ]);
    if (questionError || guideError) throw Error('Q&A 또는 운행가이드를 불러오지 못했습니다. 011_knowledge_center.sql 실행이 필요할 수 있습니다.');
    qnaItems = questions || [];
    guideItems = guides || [];
    renderQna(); renderGuides();
  }
  window.refreshKnowledgeFromSupabase = refreshKnowledgeFromSupabase;

  function resetQnaForm() {
    qnaEditingId = null;
    el('qnaForm').reset();
    el('qnaError').textContent = '';
    el('qnaFormTitle').textContent = 'Q&A 등록';
    el('qnaSave').textContent = 'Q&A 등록';
    el('qnaCancelEdit').hidden = true;
  }

  el('qnaSearch').addEventListener('input', renderQna);
  el('qnaCancelEdit').addEventListener('click', resetQnaForm);
  qnaRows.addEventListener('click', async event => {
    const edit = event.target.closest('[data-qna-edit]');
    const remove = event.target.closest('[data-qna-delete]');
    if (!isAdmin()) return;
    if (edit) {
      const item = qnaItems.find(row => row.id === edit.dataset.qnaEdit);
      if (!item) return;
      qnaEditingId = item.id;
      el('qnaTitle').value = item.title;
      el('qnaQuestion').value = item.question_body;
      el('qnaAnswer').value = item.answer_body;
      el('qnaFormTitle').textContent = 'Q&A 수정';
      el('qnaSave').textContent = '수정 저장';
      el('qnaCancelEdit').hidden = false;
      el('qnaAdminPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (remove) {
      const item = qnaItems.find(row => row.id === remove.dataset.qnaDelete);
      if (!item || !window.confirm(`Q&A “${item.title}”을(를) 삭제할까요?`)) return;
      const { error } = await window.fleetSupabaseClient.from('fleet_questions').delete().eq('id', item.id);
      if (error) return showToast(error.message || 'Q&A를 삭제하지 못했습니다.');
      await refreshKnowledgeFromSupabase();
      showToast('Q&A를 삭제했습니다.');
    }
  });

  el('qnaForm').addEventListener('submit', async event => {
    event.preventDefault();
    el('qnaError').textContent = '';
    if (!isAdmin()) return;
    const title = el('qnaTitle').value.trim(), question = el('qnaQuestion').value.trim(), answer = el('qnaAnswer').value.trim();
    if (!title || !question || !answer) { el('qnaError').textContent = '질문 제목·내용과 관리자 답변을 모두 입력하세요.'; return; }
    const button = el('qnaSave'); button.disabled = true;
    try {
      const values = { title, question_body: question, answer_body: answer, updated_by: window.fleetCurrentUser.id };
      const request = qnaEditingId
        ? window.fleetSupabaseClient.from('fleet_questions').update(values).eq('id', qnaEditingId)
        : window.fleetSupabaseClient.from('fleet_questions').insert({ ...values, created_by: window.fleetCurrentUser.id });
      const { error } = await request;
      if (error) throw error;
      const message = qnaEditingId ? 'Q&A를 수정했습니다.' : 'Q&A를 등록했습니다.';
      resetQnaForm(); await refreshKnowledgeFromSupabase(); showToast(message);
    } catch (error) { el('qnaError').textContent = error.message || 'Q&A 저장에 실패했습니다.'; }
    finally { button.disabled = false; }
  });

  async function guideSignedUrl(item) {
    const { data, error } = await window.fleetSupabaseClient.storage.from('fleet-guides').createSignedUrl(item.file_path, 900);
    if (error || !data?.signedUrl) throw Error('가이드 PDF 링크를 만들지 못했습니다.');
    return data.signedUrl;
  }
  guideRows.addEventListener('click', async event => {
    const view = event.target.closest('[data-guide-view]');
    const download = event.target.closest('[data-guide-download]');
    const remove = event.target.closest('[data-guide-delete]');
    const id = (view || download || remove)?.dataset.guideView || (view || download || remove)?.dataset.guideDownload || (view || download || remove)?.dataset.guideDelete;
    const item = guideItems.find(row => row.id === id);
    if (!item) return;
    try {
      if (view) { window.open(await guideSignedUrl(item), '_blank', 'noopener'); return; }
      if (download) {
        const { data, error } = await window.fleetSupabaseClient.storage.from('fleet-guides').download(item.file_path);
        if (error || !data) throw Error('PDF를 내려받지 못했습니다.');
        const url = URL.createObjectURL(data), link = document.createElement('a');
        link.href = url; link.download = item.file_name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); return;
      }
      if (remove && isAdmin()) {
        if (!window.confirm(`운행가이드 “${item.title}”과 PDF를 삭제할까요?`)) return;
        const { error } = await window.fleetSupabaseClient.from('fleet_guides').delete().eq('id', item.id);
        if (error) throw error;
        const { error: fileError } = await window.fleetSupabaseClient.storage.from('fleet-guides').remove([item.file_path]);
        await refreshKnowledgeFromSupabase();
        showToast(fileError ? '가이드 기록은 삭제했지만 PDF 정리에 실패했습니다.' : '운행가이드와 PDF를 삭제했습니다.');
      }
    } catch (error) { showToast(error.message || '운행가이드 처리에 실패했습니다.'); }
  });

  el('guideForm').addEventListener('submit', async event => {
    event.preventDefault();
    el('guideError').textContent = '';
    if (!isAdmin()) return;
    const title = el('guideTitle').value.trim(), description = el('guideDescription').value.trim(), file = el('guideFile').files[0];
    if (!title || !file) { el('guideError').textContent = '가이드 제목과 PDF 파일을 입력하세요.'; return; }
    if ((!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') || file.size < 1 || file.size > 20 * 1024 * 1024) { el('guideError').textContent = 'PDF 파일만 등록할 수 있으며 파일당 20MB 이하여야 합니다.'; return; }
    const button = el('guideSave'); button.disabled = true;
    const path = `${window.fleetCurrentUser.id}/${crypto.randomUUID()}.pdf`;
    try {
      const { error: uploadError } = await window.fleetSupabaseClient.storage.from('fleet-guides').upload(path, file, { contentType: 'application/pdf', upsert: false });
      if (uploadError) throw uploadError;
      const { error: insertError } = await window.fleetSupabaseClient.from('fleet_guides').insert({ title, description, file_path: path, file_name: file.name, file_size: file.size, created_by: window.fleetCurrentUser.id });
      if (insertError) { await window.fleetSupabaseClient.storage.from('fleet-guides').remove([path]); throw insertError; }
      el('guideForm').reset(); await refreshKnowledgeFromSupabase(); showToast('운행가이드 PDF를 등록했습니다.');
    } catch (error) { el('guideError').textContent = error.message || '운행가이드 저장에 실패했습니다.'; }
    finally { button.disabled = false; }
  });

  renderQna(); renderGuides();
})();
