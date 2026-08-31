'use client';

import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';
import { useReactToPrint } from 'react-to-print';

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
}

export default function StudentCardModal({
  student,
  studentStatus,
  cardOpen,
  setCardOpen,
  academicYear = '2025-2026',
  logoUrl = '/udei-logo.png',
}: StudentCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handlePrint = useReactToPrint({
    contentRef: cardRef,
    documentTitle: `carte-etudiant-${student.last_name}-${student.first_name}`,
  });

  if (!cardOpen) return null;

  const captureCanvas = async () => {
    if (!cardRef.current) return null;
    return html2canvas(cardRef.current, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#ffffff',
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
        format: [85.6, 136],
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
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
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div
            ref={cardRef}
            id="printable-card"
            className="force-print-colors flex flex-col gap-4 rounded-2xl bg-white p-4"
          >
            {/* ===== FRONT SIDE ===== */}
            <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-green-500">
              <div className="relative bg-green-500 pb-83">
                <div className="flex items-center gap-2 px-4 pt-4">
                  <img
                    src={logoUrl}
                    alt="UDEI"
                    crossOrigin="anonymous"
                    className="h-10 w-10 rounded-full bg-white object-contain p-0.5"
                  />
                  <div>
                    <p className="text-[10px] font-bold uppercase leading-tight text-white">
                      Université d&apos;Études Internationales
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-extrabold text-white">UDEI</span>
                      <span className="h-3 flex-1 rounded bg-red-600" />
                    </div>
                  </div>
                </div>
              </div>

                <div className="relative -mt-80 rounded-tr-[20%] rounded-bl-[20%]  pb-2 pt-4  bg-green-700">
                     <div className="relative  rounded-tr-[20%] rounded-bl-[20%]   bg-white px-4 pb-6 pt-4  border-green-700">
                <h2 className="text-center text-base font-bold text-green-600">
                  CARTE {student.sex === 'M' || student.sex === 'Masculin' || student.sex === 'masculin' ? 'DE L\'ÉTUDIANT' : 'DE L\'ÉTUDIANTE'}
                </h2>

                <div className="mx-auto mt-3 h-32 w-28 overflow-hidden rounded-lg border-2 border-green-500 bg-gray-100">
                  {student.photo_url ? (
                    <img
                      src={student.photo_url}
                      alt={`${student.first_name} ${student.last_name}`}
                      crossOrigin="anonymous"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gray-200" />
                  )}
                </div>

                <div className="mt-4 space-y-1.5 rounded-lg bg-gray-100 p-3 text-sm">
                  <Row label="Nom:" value={student.last_name} />
                  <Row label="Prenom:" value={student.first_name} />
                  <Row label="Faculty:" value={student.faculty} />
                  <Row label="Code Étudiant:" value={student.student_code} />
                  <Row label="Niveau:" value={studentStatus.year_study} />
                  <Row label="NIF/NIN:" value={student.nif_cin} />
                  <Row label="GS:" value={null} />
                </div>

                <div className="mt-4 text-center">
                  <p className="text-sm font-bold text-green-600">Année Academique</p>
                  <p className="text-sm font-bold text-green-600">{studentStatus.academic_year}</p>
                </div>
              </div>
              </div>

              <div className="h-8 bg-green-500" />
            </div>

            {/* ===== BACK SIDE ===== */}
            <div className="relative overflow-hidden rounded-2xl border border-gray-100">
              <div className="h-4 bg-black" />
              <div className="space-y-4 bg-white px-4 py-4">
                <p className="text-[11px] leading-snug text-gray-600">
                  Cette carte est la propriété de l&apos;Université d&apos;Études
                  Internationales (UDEI). En cas de perte, merci de la retourner à
                  l&apos;administration de l&apos;université.
                </p>

                <div className="flex justify-center">
                  <QRCodeSVG value={student.id.toString()} size={120} />
                </div>

                <p className="text-[11px] leading-snug text-gray-600">
                  Cette carte doit être présentée à toute demande des autorités
                  universitaires. Elle est valable uniquement pour l&apos;année
                  académique en cours.
                </p>

                <div className="flex items-center justify-between pt-2">
                  <img
                    src={logoUrl}
                    alt="UDEI seal"
                    crossOrigin="anonymous"
                    className="h-14 w-14 object-contain opacity-80"
                  />
                  <div className="text-center">
                    {student.signature_url ? (
                      <img
                        src={student.signature_url}
                        alt="Signature"
                        crossOrigin="anonymous"
                        className="h-10 w-24 object-contain"
                      />
                    ) : (
                      <div className="h-10 w-24 border-b border-gray-400" />
                    )}
                    <p className="mt-1 text-xs font-semibold">Signature Autorisée</p>
                  </div>
                </div>
              </div>
              <div className="h-4 bg-black" />
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
    <div className="flex justify-between">
      <span className="font-semibold text-gray-800">{label}</span>
      <span className="text-gray-700">{value ?? '—'}</span>
    </div>
  );
}
