"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import ClinicService, { ClinicPayment, ClinicRapport } from "../../component/clinic/clinic";

type ClinicSection = "service" | "paiement" | "rapport";

const CLINIC_SECTIONS: { id: ClinicSection; label: string }[] = [
  { id: "service", label: "Services" },
  { id: "paiement", label: "Paiement" },
  { id: "rapport", label: "Rapports" },
];

export default function ClinicPage() {
  const [activeSection, setActiveSection] = useState<ClinicSection>("rapport");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Navigation entre les trois espaces de gestion de la clinique.
  const renderActiveSection = () => {
    if (activeSection === "service") return <ClinicService />;
    if (activeSection === "paiement") return <ClinicPayment />;
    return <ClinicRapport />;
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    let nextIndex: number;

    switch (event.key) {
      case "ArrowRight":
        nextIndex = (currentIndex + 1) % CLINIC_SECTIONS.length;
        break;
      case "ArrowLeft":
        nextIndex = (currentIndex - 1 + CLINIC_SECTIONS.length) % CLINIC_SECTIONS.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = CLINIC_SECTIONS.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    setActiveSection(CLINIC_SECTIONS[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <main className="min-h-screen bg-slate-50 px-3 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="border-b border-slate-200 pb-5">
          <p className="text-sm font-semibold uppercase text-emerald-800">Administration</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">Clinique</h1>
          <p className="mt-2 text-sm text-slate-600">Gestion des services, des paiements et des rapports.</p>
        </header>

        {/* Onglets tactiles avec état accessible pour les lecteurs d’écran. */}
        <nav role="tablist" aria-label="Sections de la clinique" aria-orientation="horizontal" className="grid grid-cols-3 gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
          {CLINIC_SECTIONS.map((section, index) => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                id={`clinic-tab-${section.id}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls="clinic-content"
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveSection(section.id)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                className={`min-h-11 rounded-md px-2 py-2 text-sm font-medium transition-colors sm:px-4 ${
                  isActive ? "bg-white text-emerald-900 shadow-sm" : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
                }`}
              >
                {section.label}
              </button>
            );
          })}
        </nav>

        {/* Contenu de l’onglet sélectionné. */}
        <section id="clinic-content" role="tabpanel" tabIndex={0} aria-labelledby={`clinic-tab-${activeSection}`} className="min-w-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
          {renderActiveSection()}
        </section>
      </div>
    </main>
  );
}