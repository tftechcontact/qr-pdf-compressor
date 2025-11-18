// app.js - main logic for web PWA MVP
// Libraries used: html5-qrcode, qrcodejs, browser-image-compression, jsPDF, html2canvas

// --- Basic tab navigation
document.querySelectorAll('.tabs button').forEach(btn=>{
  btn.addEventListener('click', ()=> {
    document.querySelectorAll('.tabs button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const target = btn.getAttribute('data-tab');
    document.querySelectorAll('.tabpane').forEach(t=>t.classList.remove('active'));
    document.getElementById('tab-' + target).classList.add('active');
  });
});

// ----- QR generate
const qrInput = document.getElementById('qr-input');
const btnGen = document.getElementById('btn-gen-qr');
const qrcodeDiv = document.getElementById('qrcode');
const btnDownloadQR = document.getElementById('btn-download-qr');
const btnShareQR = document.getElementById('btn-share-qr');

let qrObj = null;
btnGen.addEventListener('click', ()=>{
  qrcodeDiv.innerHTML = '';
  const value = qrInput.value.trim();
  if(!value) return alert('Enter text or URL to generate.');
  qrObj = new QRCode(qrcodeDiv, { text: value, width: 240, height: 240 });
});

btnDownloadQR.addEventListener('click', ()=>{
  if(!qrObj) return alert('Generate a QR code first.');
  const img = qrcodeDiv.querySelector('img') || qrcodeDiv.querySelector('canvas');
  if(!img) return alert('No QR found.');
  // canvas or img
  if(img.tagName === 'IMG') {
    const a = document.createElement('a'); a.href = img.src; a.download = 'qr.png'; a.click();
  } else {
    const url = img.toDataURL('image/png');
    const a = document.createElement('a'); a.href = url; a.download = 'qr.png'; a.click();
  }
});

btnShareQR.addEventListener('click', async ()=>{
  try {
    const el = qrcodeDiv.querySelector('img') || qrcodeDiv.querySelector('canvas');
    if(!el) return alert('Generate QR first.');
    const dataUrl = el.tagName === 'IMG' ? el.src : el.toDataURL('image/png');
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const filesArray = [ new File([blob], 'qr.png', { type: blob.type }) ];
    if(navigator.canShare && navigator.canShare({ files: filesArray })) {
      await navigator.share({ files: filesArray, title: 'QR Code' });
    } else {
      alert('Sharing not supported on this browser. Download instead.');
    }
  } catch(e){ console.error(e); alert('Share failed'); }
});

// ----- QR scan (html5-qrcode)
const qrReaderDiv = document.getElementById('qr-reader');
const btnStartScan = document.getElementById('btn-start-scan');
const btnStopScan = document.getElementById('btn-stop-scan');
const scanText = document.getElementById('scan-text');

let html5QrcodeScanner = null;
btnStartScan.addEventListener('click', async ()=>{
  btnStartScan.disabled = true;
  btnStopScan.disabled = false;
  scanText.textContent = 'Scanning...';
  html5QrcodeScanner = new Html5Qrcode("qr-reader");
  try {
    await html5QrcodeScanner.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 },
      (decodedText, decodedResult) => {
        scanText.textContent = decodedText;
      },
      (errorMessage) => { /* ignore non-fatal errors */ }
    );
  } catch(err) {
    alert('Camera start failed: ' + err);
    btnStartScan.disabled = false;
    btnStopScan.disabled = true;
  }
});

btnStopScan.addEventListener('click', async ()=>{
  if(html5QrcodeScanner) {
    await html5QrcodeScanner.stop();
    html5QrcodeScanner.clear();
    html5QrcodeScanner = null;
    scanText.textContent = 'Stopped';
  }
  btnStartScan.disabled = false;
  btnStopScan.disabled = true;
});

// ----- PDF creation (jsPDF + html2canvas)
const pdfText = document.getElementById('pdf-text');
const pdfImagesInput = document.getElementById('pdf-images');
const btnCreatePdf = document.getElementById('btn-create-pdf');
const pdfStatus = document.getElementById('pdf-status');

let pdfImageFiles = [];
pdfImagesInput.addEventListener('change', (e)=>{
  pdfImageFiles = Array.from(e.target.files || []);
  pdfStatus.textContent = `Selected images: ${pdfImageFiles.length}`;
});

btnCreatePdf.addEventListener('click', async ()=>{
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  let y = 40;
  const leftMargin = 40;
  const maxWidth = 520;

  // add text
  if(pdfText.value.trim()){
    doc.setFontSize(12);
    const lines = doc.splitTextToSize(pdfText.value, maxWidth);
    doc.text(lines, leftMargin, y);
    y += lines.length * 14 + 20;
  }

  // images
  for(let i=0;i<pdfImageFiles.length;i++){
    const file = pdfImageFiles[i];
    const imgData = await fileToDataUrl(file);
    // fit into page
    const img = new Image();
    await new Promise(r => { img.onload = r; img.src = imgData; });
    const ratio = img.width / img.height;
    const displayWidth = Math.min(maxWidth, img.width);
    const displayHeight = displayWidth / ratio;
    if(y + displayHeight > 770) { doc.addPage(); y = 40; }
    doc.addImage(imgData, 'JPEG', leftMargin, y, displayWidth, displayHeight);
    y += displayHeight + 10;
  }

  doc.save('document.pdf');
});

function fileToDataUrl(file){
  return new Promise((res, rej)=>{
    const reader = new FileReader();
    reader.onload = ()=> res(reader.result);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

// ----- Image compression (browser-image-compression)
const compressInput = document.getElementById('compress-input');
const qualityRange = document.getElementById('quality-range');
const qualityLabel = document.getElementById('quality-label');
const btnCompress = document.getElementById('btn-compress');
const compressResults = document.getElementById('compress-results');
const btnDownloadAll = document.getElementById('btn-download-all');

let compressFiles = [];
let compressedBlobs = [];

qualityRange.addEventListener('input', ()=>{
  qualityLabel.textContent = (qualityRange.value / 100).toFixed(2);
});

compressInput.addEventListener('change', (e)=>{
  compressFiles = Array.from(e.target.files || []);
  compressResults.innerHTML = `<p>Selected ${compressFiles.length} files</p>`;
  compressedBlobs = [];
  btnDownloadAll.disabled = true;
});

btnCompress.addEventListener('click', async ()=>{
  if(!compressFiles.length) return alert('Choose images first.');
  compressResults.innerHTML = '<p>Compressing…</p>';
  compressedBlobs = [];

  for(const file of compressFiles){
    const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true, initialQuality: qualityRange.value / 100 };
    try {
      const compressedFile = await imageCompression(file, options);
      compressedBlobs.push(compressedFile);
    } catch(e){
      console.error('compress error', e);
    }
  }

  // show previews and sizes
  compressResults.innerHTML = '';
  compressedBlobs.forEach((b, i)=>{
    const url = URL.createObjectURL(b);
    const orig = compressFiles[i];
    const wrap = document.createElement('div');
    wrap.innerHTML = `<div><img src="${url}" /><p>Original: ${formatBytes(orig.size)} → Compressed: ${formatBytes(b.size)}</p>
      <a href="${url}" download="compressed-${i}.jpg">Download</a></div>`;
    compressResults.appendChild(wrap);
  });
  if(compressedBlobs.length) btnDownloadAll.disabled = false;
});

btnDownloadAll.addEventListener('click', ()=>{
  compressedBlobs.forEach((b, i)=>{
    const url = URL.createObjectURL(b);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compressed-${i}.jpg`;
    a.click();
  });
});

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B','KB','MB','GB','TB'];
  const i = Math.floor(Math.log(bytes)/Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// --- Service worker registration for PWA
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=> {
    navigator.serviceWorker.register('service-worker.js').catch(err => console.warn('SW failed', err));
  });
}
