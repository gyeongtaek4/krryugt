/* 인수인계·사고 자료를 브라우저에서 사진 1MB, PDF 3MB 이하로 준비한다. */
(() => {
  const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
  const PDF_TYPE = 'application/pdf';
  const IMAGE_MAX_BYTES = 1024 * 1024;
  const PDF_MAX_BYTES = 3 * 1024 * 1024;
  const PDF_SOURCE_MAX_BYTES = 5 * 1024 * 1024;

  const isImage = file => IMAGE_TYPES.has(file?.type);
  const isPdf = file => file?.type === PDF_TYPE || /\.pdf$/i.test(String(file?.name || ''));
  const readAsDataUrl = blob => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(Error('첨부파일을 읽지 못했습니다.'));
    reader.readAsDataURL(blob);
  });
  const canvasBlob = (canvas, quality) => new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(Error('사진 압축에 실패했습니다.')), 'image/jpeg', quality);
  });
  const imageFromFile = file => new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(Error('사진 파일을 읽지 못했습니다.')); };
    image.src = url;
  });
  const compressedName = name => `${String(name || 'photo').replace(/\.[^.]+$/, '')}-압축.jpg`;
  const compressedPdfName = name => `${String(name || 'document').replace(/\.[^.]+$/, '')}-압축.pdf`;

  async function compressImage(file) {
    const image = await imageFromFile(file);
    const longestSide = Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height);
    let scale = Math.min(1, 2560 / Math.max(1, longestSide));

    for (let resizeAttempt = 0; resizeAttempt < 8; resizeAttempt += 1) {
      const width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
      const height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d', { alpha: false });
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      for (const quality of [0.9, 0.8, 0.7, 0.6, 0.5, 0.4]) {
        const blob = await canvasBlob(canvas, quality);
        if (blob.size <= IMAGE_MAX_BYTES) return blob;
      }
      scale *= 0.72;
    }
    throw Error('사진을 1MB 이하로 압축하지 못했습니다. 더 작은 사진을 선택하세요.');
  }

  async function compressPdf(file) {
    if (!window.pdfjsLib || !window.jspdf?.jsPDF) throw Error('PDF 압축 기능을 불러오지 못했습니다. 인터넷 연결을 확인한 뒤 다시 시도하세요.');
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const source = new Uint8Array(await file.arrayBuffer());
    const attempts = [
      { scale: 1.45, quality: 0.82 },
      { scale: 1.2, quality: 0.72 },
      { scale: 1, quality: 0.62 },
      { scale: 0.82, quality: 0.5 }
    ];

    for (const attempt of attempts) {
      let loadingTask;
      try {
        loadingTask = window.pdfjsLib.getDocument({ data: source.slice() });
        const sourcePdf = await loadingTask.promise;
        let output;
        for (let pageNumber = 1; pageNumber <= sourcePdf.numPages; pageNumber += 1) {
          const page = await sourcePdf.getPage(pageNumber);
          const pageSize = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: attempt.scale });
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(viewport.width));
          canvas.height = Math.max(1, Math.round(viewport.height));
          const context = canvas.getContext('2d', { alpha: false });
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: context, viewport }).promise;
          const imageData = canvas.toDataURL('image/jpeg', attempt.quality);
          if (!output) output = new window.jspdf.jsPDF({ unit: 'pt', format: [pageSize.width, pageSize.height], compress: true });
          else output.addPage([pageSize.width, pageSize.height]);
          output.addImage(imageData, 'JPEG', 0, 0, pageSize.width, pageSize.height, undefined, 'FAST');
        }
        await sourcePdf.destroy();
        const compressed = new Blob([output.output('arraybuffer')], { type: PDF_TYPE });
        if (compressed.size <= PDF_MAX_BYTES) return compressed;
      } catch (error) {
        throw Error(`PDF를 압축하지 못했습니다. ${error?.message || '암호화되었거나 손상된 파일일 수 있습니다.'}`);
      } finally {
        try { await loadingTask?.destroy(); } catch (_) { /* 이미 정리된 PDF 작업 */ }
      }
    }
    throw Error('PDF를 3MB 이하로 압축하지 못했습니다. 페이지 수나 해상도를 줄인 PDF를 선택하세요.');
  }

  async function prepare(file) {
    if (!file || (!isImage(file) && !isPdf(file))) throw Error('JPG/PNG/WebP 사진 또는 PDF 파일만 첨부하세요.');
    if (isPdf(file)) {
      if (file.size < 1 || file.size > PDF_SOURCE_MAX_BYTES) throw Error('PDF는 선택 시 파일당 5MB 이하로 첨부하세요.');
      const compressed = file.size > PDF_MAX_BYTES;
      const blob = compressed ? await compressPdf(file) : file;
      if (blob.size < 1 || blob.size > PDF_MAX_BYTES) throw Error('PDF를 3MB 이하로 준비하지 못했습니다.');
      return { name: compressed ? compressedPdfName(file.name) : file.name, size: blob.size, type: PDF_TYPE, lastModified: file.lastModified, data: await readAsDataUrl(blob), compressed, sourceName: file.name, sourceSize: file.size };
    }
    const compressed = file.size > IMAGE_MAX_BYTES;
    const blob = compressed ? await compressImage(file) : file;
    if (blob.size < 1 || blob.size > IMAGE_MAX_BYTES) throw Error('사진은 파일당 1MB 이하로 첨부하세요.');
    return {
      name: compressed ? compressedName(file.name) : file.name,
      size: blob.size,
      type: compressed ? 'image/jpeg' : file.type,
      lastModified: file.lastModified,
      data: await readAsDataUrl(blob),
      compressed,
      sourceName: file.name,
      sourceSize: file.size
    };
  }

  window.fleetAttachmentCompression = Object.freeze({
    prepare,
    isImage,
    IMAGE_MAX_BYTES,
    PDF_MAX_BYTES,
    PDF_SOURCE_MAX_BYTES
  });
})();
