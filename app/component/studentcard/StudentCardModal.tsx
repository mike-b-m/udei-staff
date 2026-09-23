'use client';

import { useRef, useState, type SyntheticEvent } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';
import { useReactToPrint } from 'react-to-print';

const DEFAULT_LOGO = '/image/icon.png';
const DEFAULT_AVATAR = '/image/icon.png';

const getSafeImageSrc = (value?: string | null, fallback = DEFAULT_LOGO) =>
  value && value.trim() ? value : fallback;

const handleBrokenImage = (event: SyntheticEvent<HTMLImageElement>, fallback = DEFAULT_LOGO) => {
  const img = event.currentTarget;
  if (img.dataset.fallbackApplied === 'true') return;
  img.dataset.fallbackApplied = 'true';
  img.src = fallback;
};

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  faculty: string;
 sex: string;
  year: string;
  nif_cin: string;
  student_code: string;
  photo_url?: string | null;
  signature_url?: string | null;
  gs:string | null; // Added gs property to the Student interface
}

interface Status {
  id: string;
  year_study: string;
  year_completed: string;
  academic_year: string;
  faculty_completion: boolean;
}

interface StudentCardModalProps {
  student: Student;
  studentStatus: Status;
  cardOpen: boolean;
  setCardOpen: (open: boolean) => void;
  academicYear?: string;
  logoUrl?: string;
  gs?: string; // Added gs property to the props
}

export default function StudentCardModal({
  student,
  studentStatus,
  cardOpen,
  setCardOpen,
  academicYear = '2025-2026',
  logoUrl = '/image/icon.png',
  gs = 'GS1', // Default value for GS
}: StudentCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handlePrint = useReactToPrint({
    contentRef: cardRef,
    documentTitle: `carte-etudiant-${student.last_name}-${student.first_name}`,
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 8mm;
      }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      html, body {
        margin: 0 !important;
        background: #fff !important;
      }
      body {
        display: flex;
        justify-content: center;
        align-items: center;
      }
      #printable-card {
        width: 120mm !important;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 0 !important;
        margin: 0 auto;
        background: #fff;
      }
      .card-side {
        box-shadow: none !important;
      }
    `,
    //removeAfterPrint: true,
  });

  if (!cardOpen) return null;

  const captureCanvas = async () => {
    if (!cardRef.current) return null;
    return html2canvas(cardRef.current, {
      scale: 4,
      useCORS: true,
      backgroundColor: '#ffffff',
      allowTaint: true,
      logging: false,
      width: cardRef.current.scrollWidth,
      height: cardRef.current.scrollHeight,
      windowWidth: cardRef.current.scrollWidth,
      windowHeight: cardRef.current.scrollHeight,
    });
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const canvas = await captureCanvas();
      if (!canvas) return;
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const maxWidth = pageWidth - margin * 2;
      const maxHeight = pageHeight - margin * 2;
      const ratio = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
      const imgWidth = canvas.width * ratio;
      const imgHeight = canvas.height * ratio;
      const x = (pageWidth - imgWidth) / 2;
      const y = (pageHeight - imgHeight) / 2;

      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight, undefined, 'FAST');
      pdf.save(`carte-etudiant-${student.last_name}-${student.first_name}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadImage = async (format: 'png' | 'jpeg') => {
    setDownloading(true);
    try {
      const canvas = await captureCanvas();
      if (!canvas) return;

      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      const quality = format === 'jpeg' ? 0.95 : undefined;
      const dataUrl = canvas.toDataURL(mimeType, quality);

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `carte-etudiant-${student.last_name}-${student.first_name}.${
        format === 'jpeg' ? 'jpg' : 'png'
      }`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={() => setCardOpen(false)}
    >
      {/* Modal box: capped height + scroll */}
      <div
        className="relative flex max-h-[90vh] w-full max-w-sm flex-col rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={() => setCardOpen(false)}
          className="absolute -top-3 -right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-600 shadow-lg hover:bg-gray-100"
          aria-label="Fermer"
        >
          ✕
        </button>

        {/* Scrollable area */}
        <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto bg-slate-50">
          <div
            ref={cardRef}
            id="printable-card"
            className="force-print-colors flex w-[120mm] items-center justify-center gap-4 rounded-2xl bg-white p-3"
            style={{ minWidth: '120mm' }}
          >
            <div className="flex w-full items-start justify-center gap-4">
              {/* ===== FRONT SIDE ===== */}
              <div
                className="card-side relative overflow-hidden rounded-[18px] border border-slate-200 bg-green-500 shadow-lg ring-1 ring-slate-200"
                style={{ width: '54mm', height: '86mm' }}
              >
                <div className="flex h-full flex-col">
                  <div className="flex items-center gap-2 bg-green-500 px-3 pb-2 pt-3">
                    <img
                      src={logoUrl}
                      alt="UDEI"
                      crossOrigin="anonymous"
                      onError={(event) => handleBrokenImage(event, DEFAULT_LOGO)}
                      className="h-7 w-7 rounded-full bg-white object-contain p-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold uppercase leading-tight text-white">
                        Université d&apos;Études Internationales
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="text-[13px] font-extrabold text-white">UDEI</span>
                        <span className="h-1.5 flex-1 rounded bg-red-600" />
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 bg-green-700/95 px-3 pb-2 pt-2 rounded-tr-4xl">
                    <div className="h-full rounded-[18px] bg-white px-2.5 pb-2 pt-2">
                      <h2 className="text-center text-[9px] font-bold uppercase tracking-wide text-green-700">
                        {student.sex === 'M' || student.sex === 'Masculin' || student.sex === 'masculin'
                          ? 'Carte de l\'étudiant'
                          : 'Carte de l\'étudiante'}
                      </h2>

                      <div className="mt-2 flex flex-col items-center gap-1">
                        <div className="h-16 w-14 overflow-hidden rounded-md border-2 border-green-600 bg-gray-100">
                          {student.photo_url ? (
                            <img
                              src={getSafeImageSrc(student.photo_url, DEFAULT_AVATAR)}
                              alt={`${student.first_name} ${student.last_name}`}
                              crossOrigin="anonymous"
                              onError={(event) => handleBrokenImage(event, DEFAULT_AVATAR)}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-gray-200" />
                          )}
                        </div>

                        <div className="flex-1 space-y-1 text-[8px] text-gray-700">
                          <Row label="Nom" value={student.last_name} />
                          <Row label="Prénom" value={student.first_name} />
                          <Row label="Fac" value={student.faculty} />
                          <Row label="Code" value={student.student_code} />
                          <Row label="Niveau" value={studentStatus.year_study} />
                          <Row label="GS" value={student.gs} />
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[8px] font-semibold text-green-700">
                        <span>Année Academique</span>
                        <span>{academicYear || studentStatus.academic_year}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ===== BACK SIDE ===== */}
              <div
                className="card-side relative overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-lg ring-1 ring-slate-200"
                style={{ width: '54mm', height: '86mm' }}
              >
                <div className="flex h-full flex-col">
                  <div className="h-2.5 bg-black" />
                  <div className="flex flex-1 flex-col justify-between bg-white px-3 py-2">
                    <p className="text-[6.5px] leading-snug text-gray-600">
                      Cette carte est la propriété de l&apos;Université d&apos;Études
                      Internationales (UDEI). En cas de perte, merci de la retourner à
                      l&apos;administration.
                    </p>

                    <div className="flex items-center justify-center">
                      <QRCodeSVG value={student.id.toString()} size={54} />
                    </div>

                    <p className="text-[6.5px] leading-snug text-gray-600"> 
                      #5 Village Zao, Maïs Gâté 13 (Bloc Gérald bataille) Port-au-Prince HAITI
                      
                    </p>

                    <div className="flex items-end justify-between gap-2">
                      <img
                        src={getSafeImageSrc(logoUrl, DEFAULT_LOGO)}
                        alt="UDEI seal"
                        crossOrigin="anonymous"
                        onError={(event) => handleBrokenImage(event, DEFAULT_LOGO)}
                        className="h-8 w-8 object-contain opacity-80"
                      />
                      <div className="flex flex-col items-center">
                        {student.signature_url ? (
                          <img
                            src={getSafeImageSrc(student.signature_url, DEFAULT_LOGO)}
                            alt="Signature"
                            crossOrigin="anonymous"
                            onError={(event) => handleBrokenImage(event, DEFAULT_LOGO)}
                            className="h-6 w-16 object-contain"
                          />
                        ) : (
                          <div className="h-6 w-16 border-b border-gray-400" />
                        )}
                        <p className="mt-0.5 text-[6px] font-semibold text-gray-700">
                          Signature Autorisée
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="h-2.5 bg-black" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 border-t border-gray-100 p-4">
          <button
            onClick={() => handlePrint()}
            className="min-w-[45%] flex-1 rounded-lg bg-gray-100 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
          >
            🖨️ Imprimer
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="min-w-[45%] flex-1 rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
          >
            {downloading ? '...' : '⬇️ PDF'}
          </button>
          <button
            onClick={() => handleDownloadImage('png')}
            disabled={downloading}
            className="min-w-[45%] flex-1 rounded-lg bg-blue-50 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-60"
          >
            {downloading ? '...' : '🖼️ PNG'}
          </button>
          <button
            onClick={() => handleDownloadImage('jpeg')}
            disabled={downloading}
            className="min-w-[45%] flex-1 rounded-lg bg-amber-50 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-60"
          >
            {downloading ? '...' : '🖼️ JPG'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between gap-1">
      <span className="font-semibold text-gray-800">{label}</span>
      <span className="truncate text-right text-gray-700">{value ?? '—'}</span>
    </div>
  );
}
