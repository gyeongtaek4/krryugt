/* 인수인계·사고 사진을 브라우저에서 1MB 이하로 준비한다. PDF는 원본을 유지한다. */
(() => {
  const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
  const PDF_TYPE = 'application/pdf';
  const IMAGE_MAX_BYTES = 1024 * 1024;
  const PDF_MAX_BYTES = 5 * 1024 * 1024;

  const isImage = file => IMAGE_TYPES.has(file?.type);
  const isPdf = file => file?.type === PDF_TYPE;
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

  async function prepare(file) {
    if (!file || (!isImage(file) && !isPdf(file))) throw Error('JPG/PNG/WebP 사진 또는 PDF 파일만 첨부하세요.');
    if (isPdf(file)) {
      if (file.size < 1 || file.size > PDF_MAX_BYTES) throw Error('PDF는 파일당 5MB 이하로 첨부하세요.');
      return { name: file.name, size: file.size, type: file.type, lastModified: file.lastModified, data: await readAsDataUrl(file), compressed: false, sourceName: file.name, sourceSize: file.size };
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
    PDF_MAX_BYTES
  });
})();
