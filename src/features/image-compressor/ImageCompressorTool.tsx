import { useEffect, useRef, useState } from "react";
import { Download, ImagePlus, RefreshCw, ShieldCheck, Sparkles, Upload, X } from "lucide-react";
import {
  blobToDataUrl,
  compressToTargetSize,
  formatBytes,
  formatTargetSize,
  isSupportedImageFile,
  prepareImageFile,
  type CompressionResult,
  type OutputFormat
} from "./image.utils";

const ACCEPTED_FORMATS = "JPG/JPEG, PNG, WebP, GIF, BMP, AVIF, HEIC/HEIF";

export default function ImageCompressorTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preparedBlob, setPreparedBlob] = useState<Blob | null>(null);
  const [originalPreview, setOriginalPreview] = useState("");
  const [resultPreview, setResultPreview] = useState("");
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [format, setFormat] = useState<OutputFormat>("image/webp");
  const [targetPreset, setTargetPreset] = useState("1024");
  const [customTargetKB, setCustomTargetKB] = useState("200");
  const targetKB = targetPreset === "custom" ? Number(customTargetKB) : Number(targetPreset);
  const targetValid = Number.isInteger(targetKB) && targetKB >= 20 && targetKB <= 1024;
  const targetBytes = targetValid ? Math.min(targetKB * 1024, 1024 * 1024 - 1) : 0;
  const targetLabel = targetKB === 1024 ? "1 MB" : `${targetKB} KB`;
  const [busy, setBusy] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!originalPreview) return;
    return () => URL.revokeObjectURL(originalPreview);
  }, [originalPreview]);

  async function chooseFile(next: File | undefined) {
    if (!next) return;
    if (!isSupportedImageFile(next)) {
      setError(`Choose one of these image formats: ${ACCEPTED_FORMATS}.`);
      return;
    }
    if (next.size > 30 * 1024 * 1024) {
      setError("For this lightweight tool, choose an image smaller than 30 MB.");
      return;
    }

    setError("");
    setPreparing(true);
    setFile(null);
    setPreparedBlob(null);
    setOriginalPreview("");
    setResult(null);
    setResultPreview("");

    try {
      const readableBlob = await prepareImageFile(next);
      setFile(next);
      setPreparedBlob(readableBlob);
      setOriginalPreview(URL.createObjectURL(readableBlob));
    } catch (e) {
      setError(e instanceof Error ? e.message : "This image could not be opened. Please choose another file.");
    } finally {
      setPreparing(false);
    }
  }

  async function runCompression() {
    if (!preparedBlob || !file) return;
    setBusy(true);
    setError("");
    try {
      const compressed = await compressToTargetSize(preparedBlob, format, targetBytes);
      setResult(compressed);
      setResultPreview(await blobToDataUrl(compressed.blob));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Compression failed. Please try another image.");
      setResult(null);
      setResultPreview("");
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (!result || !file) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement("a");
    const extension = format === "image/webp" ? "webp" : format === "image/png" ? "png" : "jpg";
    a.href = url;
    const sizeSuffix = targetKB === 1024 ? "under-1mb" : `under-${targetKB}kb`;
    a.download = `${file.name.replace(/\.[^.]+$/, "")}-${sizeSuffix}.${extension}`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function reset() {
    setFile(null);
    setPreparedBlob(null);
    setOriginalPreview("");
    setResultPreview("");
    setResult(null);
    setError("");
    setPreparing(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  const saving = file && result ? Math.max(0, Math.round((1 - result.blob.size / file.size) * 100)) : 0;

  return (
    <div className="tool-panel">
      <div className="panel-heading">
        <div>
          <span className="panel-kicker">TOOL 02</span>
          <h2>Image Compressor</h2>
          <p>Choose a file-size limit from 20 KB up to 1 MB, ready for upload or sharing.</p>
        </div>
        <span className="heading-icon mint"><ImagePlus size={23}/></span>
      </div>

      {preparing ? (
        <div className="upload-zone preparing-zone">
          <RefreshCw className="spin" size={25}/>
          <strong>Preparing your image…</strong>
          <small>Checking the format and creating a preview on your device.</small>
        </div>
      ) : !file ? (
        <button
          type="button"
          className={`upload-zone ${dragging ? "dragging" : ""}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); void chooseFile(e.dataTransfer.files?.[0]); }}
        >
          <span className="upload-icon"><Upload size={23}/></span>
          <strong>Drop an image here, or <span>browse files</span></strong>
          <small>{ACCEPTED_FORMATS} · Up to 30 MB</small>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.avif,.heic,.heif"
            hidden
            onChange={e => void chooseFile(e.target.files?.[0])}
          />
        </button>
      ) : (
        <>
          <div className="image-file-row">
            <div className="file-icon"><ImagePlus size={19}/></div>
            <div className="file-info">
              <strong>{file.name}</strong>
              <small>{file.type || "Image"} · {formatBytes(file.size)}</small>
            </div>
            <button className="icon-action" onClick={reset} aria-label="Remove image"><X size={18}/></button>
          </div>

          <div className="compress-settings">
            <div className="subheading"><strong>Compression settings</strong><span>Max: 1 MB</span></div>
            <div className="compression-control-grid">
              <label className="field-label">
                Output format
                <select value={format} onChange={e => { setFormat(e.target.value as OutputFormat); setResult(null); setResultPreview(""); }}>
                  <option value="image/webp">WebP — usually smallest</option>
                  <option value="image/jpeg">JPEG — widely compatible</option>
                  <option value="image/png">PNG — keeps transparency</option>
                </select>
              </label>
              <label className="field-label">
                Maximum output size
                <select value={targetPreset} onChange={e => { setTargetPreset(e.target.value); setResult(null); setResultPreview(""); }}>
                  <option value="100">100 KB</option>
                  <option value="200">200 KB</option>
                  <option value="300">300 KB</option>
                  <option value="500">500 KB</option>
                  <option value="750">750 KB</option>
                  <option value="1024">1 MB</option>
                  <option value="custom">Custom size…</option>
                </select>
              </label>
            </div>
            {targetPreset === "custom" && (
              <label className="field-label custom-target-field">
                Your target size (20–1024 KB)
                <div className="custom-target-input-wrap">
                  <input
                    type="number"
                    min="20"
                    max="1024"
                    step="10"
                    inputMode="numeric"
                    value={customTargetKB}
                    onChange={e => { setCustomTargetKB(e.target.value); setResult(null); setResultPreview(""); }}
                    aria-invalid={!targetValid}
                  />
                  <span>KB</span>
                </div>
                {!targetValid && <small className="target-validation">Enter a number between 20 and 1024 KB.</small>}
              </label>
            )}
            <p className="target-size-note">The selected size is a maximum. We’ll reduce quality and dimensions as needed; the result won’t exceed your chosen limit.</p>
            <p className="format-note">WebP and JPEG use adjustable quality. PNG keeps transparency, but may need more resizing.</p>
            <button className="button-primary full-width" disabled={busy || preparing || !targetValid} onClick={() => void runCompression()}>
              {busy ? <><RefreshCw className="spin" size={17}/> Compressing image…</> : <><Sparkles size={17}/> Compress to {targetLabel} or less</>}
            </button>
          </div>

          {result && (
            <div className="compression-result">
              <div className="result-top">
                <div>
                  <span className="success-label"><ShieldCheck size={15}/> TARGET REACHED</span>
                  <h3>{formatBytes(result.blob.size)}</h3>
                  <p>{saving}% smaller than original · {result.width} × {result.height}px</p>
                </div>
                <span className="under-badge">Max {formatTargetSize(targetBytes)}</span>
              </div>
              <div className="size-comparison">
                <div><span>Original</span><strong>{formatBytes(file.size)}</strong><div className="size-track"><i style={{width: "100%"}}/></div></div>
                <div><span>Compressed</span><strong>{formatBytes(result.blob.size)}</strong><div className="size-track compressed"><i style={{width: `${Math.max(3, Math.min(100, result.blob.size / Math.max(file.size, 1) * 100))}%`}}/></div></div>
              </div>
              <button className="button-primary full-width" onClick={download}><Download size={17}/> Download compressed image</button>
            </div>
          )}

          <div className="image-previews">
            <div><span className="image-preview-label">ORIGINAL</span><div className="image-preview-box"><img src={originalPreview} alt="Original upload"/></div></div>
            <div><span className="image-preview-label">COMPRESSED</span><div className="image-preview-box">{resultPreview ? <img src={resultPreview} alt="Compressed output"/> : <div className="waiting-preview"><ImagePlus size={24}/><span>Preview appears here</span></div>}</div></div>
          </div>
          <button className="reset-button" onClick={reset}>Choose another image</button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.avif,.heic,.heif"
            hidden
            onChange={e => void chooseFile(e.target.files?.[0])}
          />
        </>
      )}

      {error && <div className="error-text error-box">{error}</div>}
      <div className="compress-note"><ShieldCheck size={17}/><span><strong>Your image stays on your device.</strong> Compression runs locally in your browser; nothing is uploaded.</span></div>
    </div>
  );
}
