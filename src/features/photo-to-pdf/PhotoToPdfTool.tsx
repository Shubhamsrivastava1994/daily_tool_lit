import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Download, FileText, ImagePlus, LoaderCircle, ShieldCheck, SlidersHorizontal, Trash2, Upload, X } from "lucide-react";
import { createPhotoPdf, readableFileSize, type PageOrientation, type PageSize } from "./photoToPdf.utils";

type PhotoItem = { id: string; file: File; previewUrl: string };
const MAX_PHOTOS = 10;
const MAX_FILE_BYTES = 30 * 1024 * 1024;

export default function PhotoToPdfTool() {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const photosRef = useRef<PhotoItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [orientation, setOrientation] = useState<PageOrientation>("portrait");
  const [margin, setMargin] = useState("10");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pdfBytes, setPdfBytes] = useState<number | null>(null);

  useEffect(() => { photosRef.current = photos; }, [photos]);
  useEffect(() => () => {
    photosRef.current.forEach(photo => URL.revokeObjectURL(photo.previewUrl));
  }, []);

  function addFiles(list: FileList | File[]) {
    const incoming = Array.from(list);
    setError("");
    setSuccess("");
    setPdfBytes(null);

    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      setError("You can add up to 10 photos. Remove a photo before adding another.");
      return;
    }

    const accepted: PhotoItem[] = [];
    for (const file of incoming) {
      if (accepted.length >= room) break;
      if (!file.type.startsWith("image/")) {
        setError(`"${file.name}" is not recognised as an image and was skipped.`);
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        setError(`"${file.name}" is larger than 30 MB and was skipped.`);
        continue;
      }
      accepted.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, file, previewUrl: URL.createObjectURL(file) });
    }

    if (incoming.length > room) {
      setError(`Only ${room} more photo${room === 1 ? "" : "s"} can be added. The limit is 10.`);
    }
    if (accepted.length) setPhotos(current => [...current, ...accepted].slice(0, MAX_PHOTOS));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removePhoto(id: string) {
    const found = photos.find(photo => photo.id === id);
    if (found) URL.revokeObjectURL(found.previewUrl);
    setPhotos(current => current.filter(photo => photo.id !== id));
    setPdfBytes(null);
    setSuccess("");
  }

  function movePhoto(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= photos.length) return;
    const reordered = [...photos];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setPhotos(reordered);
    setPdfBytes(null);
    setSuccess("");
  }

  function clearAll() {
    photos.forEach(photo => URL.revokeObjectURL(photo.previewUrl));
    setPhotos([]);
    setPdfBytes(null);
    setError("");
    setSuccess("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function downloadPdf() {
    if (!photos.length || busy) return;
    setBusy(true);
    setError("");
    setSuccess("");
    setPdfBytes(null);
    try {
      const { createPhotoPdf } = await import("./photoToPdf.utils");
      const blob = await createPhotoPdf(photos.map(photo => photo.file), {
        pageSize,
        orientation,
        marginMm: Number(margin)
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "photos.pdf";
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      setPdfBytes(blob.size);
      setSuccess("Your PDF is ready and the download has started.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the PDF. Try using JPG, PNG, or WebP images.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="tool-panel photo-pdf-panel">
      <div className="panel-heading">
        <div>
          <span className="panel-kicker">TOOL 03</span>
          <h2>Photo to PDF</h2>
          <p>Combine up to 10 photos into one PDF document.</p>
        </div>
        <span className="heading-icon warm"><FileText size={23}/></span>
      </div>

      <button
        type="button"
        className="photo-pdf-upload"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={event => event.preventDefault()}
        onDrop={event => { event.preventDefault(); addFiles(event.dataTransfer.files); }}
        disabled={photos.length >= MAX_PHOTOS}
      >
        <span className="photo-upload-icon"><Upload size={21}/></span>
        <strong>{photos.length >= MAX_PHOTOS ? "Photo limit reached" : "Choose photos or drop them here"}</strong>
        <small>{photos.length} of {MAX_PHOTOS} selected · JPG, PNG, WebP and browser-supported image formats · Up to 30 MB each</small>
        <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={event => event.target.files && addFiles(event.target.files)}/>
      </button>

      {photos.length > 0 && (
        <div className="photo-list-section">
          <div className="subheading">
            <strong>Your photos</strong>
            <button className="photo-clear-button" onClick={clearAll}><Trash2 size={14}/> Clear all</button>
          </div>
          <p className="photo-hint">Each photo becomes one PDF page. Use the arrows to change page order.</p>
          <div className="photo-list">
            {photos.map((photo, index) => (
              <div className="photo-item" key={photo.id}>
                <img src={photo.previewUrl} alt={`Selected photo ${index + 1}`}/>
                <span className="photo-order">{String(index + 1).padStart(2, "0")}</span>
                <span className="photo-file-info"><strong>{photo.file.name}</strong><small>{readableFileSize(photo.file.size)}</small></span>
                <div className="photo-row-actions">
                  <button className="icon-action" onClick={() => movePhoto(index, -1)} disabled={index === 0} aria-label="Move photo up"><ArrowUp size={15}/></button>
                  <button className="icon-action" onClick={() => movePhoto(index, 1)} disabled={index === photos.length - 1} aria-label="Move photo down"><ArrowDown size={15}/></button>
                  <button className="icon-action delete" onClick={() => removePhoto(photo.id)} aria-label="Remove photo"><X size={15}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pdf-options">
        <div className="pdf-options-header">
          <span className="pdf-settings-icon"><SlidersHorizontal size={18}/></span>
          <div className="pdf-options-title">
            <h3>PDF page settings</h3>
            <p>Choose how your photos should fit on each page.</p>
          </div>
          <span className="pdf-page-count">{photos.length} {photos.length === 1 ? "page" : "pages"}</span>
        </div>
        <div className="pdf-settings-grid">
          <label className="pdf-setting-field"><span>Paper size</span>
            <select value={pageSize} onChange={event => setPageSize(event.target.value as PageSize)}>
              <option value="a4">A4</option>
              <option value="letter">US Letter</option>
            </select>
          </label>
          <label className="pdf-setting-field"><span>Orientation</span>
            <select value={orientation} onChange={event => setOrientation(event.target.value as PageOrientation)}>
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </label>
          <label className="pdf-setting-field"><span>Page margin</span>
            <select value={margin} onChange={event => setMargin(event.target.value)}>
              <option value="0">No margin</option>
              <option value="5">5 mm</option>
              <option value="10">10 mm</option>
              <option value="15">15 mm</option>
            </select>
          </label>
        </div>
        <p className="pdf-settings-hint">Each image will be fitted inside the printable area, without stretching.</p>
        <button className="button-primary full-width pdf-convert-button" disabled={!photos.length || busy} onClick={() => void downloadPdf()}>
          {busy ? <><LoaderCircle className="spin" size={17}/> Creating your PDF…</> : <><Download size={17}/> Convert {photos.length || ""} photo{photos.length === 1 ? "" : "s"} to PDF</>}
        </button>
        {success && <div className="pdf-success"><ShieldCheck size={16}/><span>{success}{pdfBytes !== null ? ` File size: ${readableFileSize(pdfBytes)}.` : ""}</span></div>}
        {error && <div className="error-text error-box">{error}</div>}
      </div>

      <div className="compress-note"><ShieldCheck size={17}/><span><strong>Private by design.</strong> Your photos are processed in your browser and are not uploaded to a server.</span></div>
    </div>
  );
}