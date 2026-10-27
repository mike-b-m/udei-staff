"use client"
import { supabase } from "../db"
import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";

type ClinicReportPeriod = "day" | "week" | "month" | "year";

type ClinicReceipt = {
  id: number;
  created_at: string;
  student_name: string | null;
  year: number | null;
  total_price: number | string | null;
  insert_by: string | null;
  discount: number | string | null;
};

type ClinicPaymentLine = {
  id: number;
  receipt_id: number | null;
  service_name: string | null;
  quantity: number | string | null;
  price: number | string | null;
};

type ClinicStudent = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  faculty: string | null;
};

type ClinicServiceRecord = {
  id: string | number;
  service_name: string;
  price: number | string | null;
  is_principal?: boolean | null;
};

type SavedClinicReceipt = {
  receipt: ClinicReceipt;
  lines: ClinicPaymentLine[];
};

// Outils partagés pour les périodes de rapport, les montants et le logo.
const localDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getClinicPeriodBounds = (dateValue: string, period: ClinicReportPeriod) => {
  const [year, month, day] = dateValue.split("-").map(Number);
  const start = new Date(year, month - 1, day);

  if (period === "week") {
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  } else if (period === "month") {
    start.setDate(1);
  }

  const end = new Date(start);
  if (period === "day") end.setDate(end.getDate() + 1);
  if (period === "week") end.setDate(end.getDate() + 7);
  if (period === "month") end.setMonth(end.getMonth() + 1);
  if (period === "year") end.setFullYear(end.getFullYear() + 1);

  return { start, end };
};

const normalizeText = (value: string | null | undefined) =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .toLocaleLowerCase()
    .trim();

const formatClinicAmount = (amount: number) =>
  new Intl.NumberFormat("fr-HT", { maximumFractionDigits: 2 }).format(amount);

const getClinicLogoDataUrl = async (): Promise<string | null> => {
  try {
    const response = await fetch("/image/h.png");
    if (!response.ok) return null;

    const imageBlob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(imageBlob);
    });
  } catch {
    return null;
  }
};

type PendingAction =
  | { kind: "create"; name: string; price: number }
  | { kind: "update"; service: ClinicServiceRecord; name: string; price: number }
  | { kind: "delete"; service: ClinicServiceRecord };

type EditingState = { service: ClinicServiceRecord; name: string; price: string; error: string };

// Turns Supabase/Postgres errors into messages a user can understand.
const describeError = (error: { message: string; code?: string }) => {
  switch (error.code) {
    case "23503":
      return "This service is used elsewhere (invoices, visits…) and cannot be deleted.";
    case "23505":
      return "A service with this name already exists.";
    case "42501":
      return "You do not have permission to do this.";
    default:
      return /fetch|network/i.test(error.message)
        ? "Network problem. Check your connection and try again."
        : error.message;
  }
};

// Generic modal shell: backdrop, Escape to close, click outside to close.
function Modal({
  title,
  onClose,
  locked,
  children,
}: {
  title: string;
  onClose: () => void;
  locked?: boolean;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !locked) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, locked]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !locked) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl"
      >
        {children}
      </div>
    </div>
  );
}

// Formulaire d’ajout des prestations proposées par la clinique.
export default function ClinicService() {
  const [serviceName, setServiceName] = useState("");
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [savedServices, setSavedServices] = useState<ClinicServiceRecord[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [servicesError, setServicesError] = useState("");

  const [editing, setEditing] = useState<EditingState | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Recharge la liste pour afficher les données persistées dans Supabase.
  const refreshSavedServices = async () => {
    const { data, error } = await supabase
      .from("clinic_service")
      .select("*")
      .order("service_name", { ascending: true });

    if (error) {
      setServicesError(`Impossible de charger les services : ${error.message}`);
    } else {
      setSavedServices((data ?? []) as ClinicServiceRecord[]);
      setServicesError("");
    }

    setIsLoadingServices(false);
  };

  useEffect(() => {
    let isCurrent = true;

    const loadServices = async () => {
      const { data, error } = await supabase
        .from("clinic_service")
        .select("*")
        .order("service_name", { ascending: true });

      if (!isCurrent) return;
      if (error) {
        setServicesError(`Impossible de charger les services : ${error.message}`);
      } else {
        setSavedServices((data ?? []) as ClinicServiceRecord[]);
        setServicesError("");
      }
      setIsLoadingServices(false);
    };

    void loadServices();
    return () => {
      isCurrent = false;
    };
  }, []);

  // Auto-dismiss the toast.
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const validate = (name: string, rawPrice: string): { ok: true; price: number } | { ok: false; error: string } => {
    if (!name.trim()) return { ok: false, error: "Service name is required." };
    const value = Number(rawPrice);
    if (rawPrice.trim() === "" || !Number.isFinite(value)) return { ok: false, error: "Enter a valid price." };
    if (value < 0) return { ok: false, error: "The price cannot be negative." };
    return { ok: true, price: value };
  };

  // Step 1 (add): validate, then ask for confirmation.
  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    const result = validate(serviceName, price);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setActionError("");
    setPending({ kind: "create", name: serviceName.trim(), price: result.price });
  };

  // Step 1 (edit): validate, then ask for confirmation.
  const handleEditSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;

    const result = validate(editing.name, editing.price);
    if (!result.ok) {
      setEditing({ ...editing, error: result.error });
      return;
    }

    const unchanged =
      editing.name.trim() === editing.service.service_name &&
      result.price === Number(editing.service.price);
    if (unchanged) {
      setEditing({ ...editing, error: "No changes to save." });
      return;
    }

    setActionError("");
    setPending({ kind: "update", service: editing.service, name: editing.name.trim(), price: result.price });
  };

  // Step 2: the user confirmed, run the action.
  const runPending = async () => {
    if (!pending) return;
    setIsProcessing(true);
    setActionError("");

    let error: { message: string; code?: string } | null = null;

    try {
      if (pending.kind === "create") {
        const res = await supabase
          .from("clinic_service")
          .insert({ service_name: pending.name, price: pending.price });
        error = res.error;
      } else if (pending.kind === "update") {
        const res = await supabase
          .from("clinic_service")
          .update({ service_name: pending.name, price: pending.price })
          .eq("id", pending.service.id)
          .select("id");
        error = res.error;
        // RLS can block an update without returning an error.
        if (!error && (res.data?.length ?? 0) === 0) {
          error = { message: "The service was not updated. It may have been deleted or you lack permission." };
        }
      } else {
        const res = await supabase
          .from("clinic_service")
          .delete()
          .eq("id", pending.service.id)
          .select("id");
        error = res.error;
        if (!error && (res.data?.length ?? 0) === 0) {
          error = { message: "The service was not deleted. It may already be gone or you lack permission." };
        }
      }
    } catch (e) {
      error = { message: e instanceof Error ? e.message : "Unexpected error." };
    }

    setIsProcessing(false);

    if (error) {
      setActionError(describeError(error));
      return; // keep the popup open so the user can retry or cancel
    }

    const successText =
      pending.kind === "create" ? "Service saved." : pending.kind === "update" ? "Service updated." : "Service deleted.";

    if (pending.kind === "create") {
      setServiceName("");
      setPrice("");
      setMessage("");
    }
    if (pending.kind === "update") setEditing(null);

    setPending(null);
    setToast({ type: "success", text: successText });
    await refreshSavedServices();
  };

  const closeConfirm = () => {
    if (isProcessing) return;
    setPending(null);
    setActionError("");
  };

  const confirmContent = () => {
    if (!pending) return null;

    if (pending.kind === "delete") {
      return {
        title: "Delete this service?",
        body: (
          <>
            <span className="font-semibold">{pending.service.service_name}</span> will be permanently removed. This
            cannot be undone.
          </>
        ),
        button: "Delete",
        danger: true,
      };
    }

    if (pending.kind === "update") {
      return {
        title: "Save these changes?",
        body: (
          <ul className="space-y-1 text-sm">
            <li>
              Name: <span className="text-gray-500 line-through">{pending.service.service_name}</span>{" "}
              <span className="font-semibold">{pending.name}</span>
            </li>
            <li>
              Price:{" "}
              <span className="text-gray-500 line-through">
                {formatClinicAmount(Number(pending.service.price) || 0)}
              </span>{" "}
              <span className="font-semibold">{formatClinicAmount(pending.price)}</span>
            </li>
          </ul>
        ),
        button: "Save changes",
        danger: false,
      };
    }

    return {
      title: "Save this service?",
      body: (
        <>
          <span className="font-semibold">{pending.name}</span> at{" "}
          <span className="font-semibold">{formatClinicAmount(pending.price)}</span> HT will be added.
        </>
      ),
      button: "Save service",
      danger: false,
    };
  };

  const confirm = confirmContent();

  return (
    <div className="w-full max-w-3xl space-y-5">
      {/* Toast */}
      {toast && (
        <div
          role="status"
          className={`fixed right-4 top-4 z-[60] rounded-md px-4 py-3 text-sm font-medium text-white shadow-lg ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.text}
        </div>
      )}

      <form onSubmit={handleSave} className="w-full max-w-xl space-y-5 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <label className="block space-y-1 text-sm font-medium text-gray-700">
          Nom du service
          <input
            className="w-full rounded-md border border-gray-300 px-3 py-2 font-normal"
            type="text"
            value={serviceName}
            onChange={(event) => setServiceName(event.target.value)}
            required
          />
        </label>

        <label className="block space-y-1 text-sm font-medium text-gray-700">
          Tarif
          <input
            className="w-full rounded-md border border-gray-300 px-3 py-2 font-normal"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            required
          />
        </label>

        <button
          className="min-h-11 rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={isProcessing}
        >
          Enregistrer le service
        </button>
        {message && <p role="alert" className="text-sm text-red-700">{message}</p>}
      </form>

      {/* Liste des prestations déjà enregistrées avec leur tarif actuel. */}
      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm" aria-labelledby="clinic-services-title">
        <header className="flex items-center justify-between gap-3 border-b border-gray-200 p-4">
          <div>
            <h2 id="clinic-services-title" className="font-semibold text-gray-900">Services enregistrés</h2>
            <p className="mt-1 text-sm text-gray-500">{savedServices.length} prestation(s)</p>
          </div>
          <button
            type="button"
            onClick={() => void refreshSavedServices()}
            disabled={isLoadingServices}
            className="min-h-11 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Actualiser
          </button>
        </header>

        {servicesError ? (
          <p role="alert" className="p-4 text-sm text-red-700">{servicesError}</p>
        ) : isLoadingServices ? (
          <p className="p-4 text-sm text-gray-500">Chargement des services…</p>
        ) : savedServices.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">Aucun service enregistré pour le moment.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {savedServices.map((service) => (
              <li key={service.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="wrap-break-word font-medium text-gray-900">{service.service_name}</p>
                  <p className="mt-1 text-sm text-gray-500">{service.is_principal ? "Service principal" : "Autre service"}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <p className="font-semibold text-gray-900">{formatClinicAmount(Number(service.price) || 0)} HT</p>
                  <button
                    type="button"
                    onClick={() =>
                      setEditing({
                        service,
                        name: service.service_name,
                        price: String(service.price ?? ""),
                        error: "",
                      })
                    }
                    disabled={isProcessing}
                    className="min-h-11 rounded-md border border-gray-500 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActionError("");
                      setPending({ kind: "delete", service });
                    }}
                    disabled={isProcessing}
                    className="min-h-11 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Edit popup (hidden while the confirmation is showing, values are kept if the user cancels) */}
      {editing && !pending && (
        <Modal title="Edit service" onClose={() => setEditing(null)}>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Edit service</h3>
            <label className="block space-y-1 text-sm font-medium text-gray-700">
              Nom du service
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 font-normal"
                type="text"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value, error: "" })}
                autoFocus
              />
            </label>
            <label className="block space-y-1 text-sm font-medium text-gray-700">
              Tarif
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 font-normal"
                type="number"
                min="0"
                step="0.01"
                value={editing.price}
                onChange={(e) => setEditing({ ...editing, price: e.target.value, error: "" })}
              />
            </label>
            {editing.error && <p role="alert" className="text-sm text-red-700">{editing.error}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="min-h-11 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-11 rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
              >
                Save
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirmation popup (add, edit, delete) */}
      {pending && confirm && (
        <Modal title={confirm.title} onClose={closeConfirm} locked={isProcessing}>
          <h3 className="text-lg font-semibold text-gray-900">{confirm.title}</h3>
          <div className="mt-2 text-sm text-gray-700">{confirm.body}</div>

          {actionError && (
            <p role="alert" className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {actionError}
            </p>
          )}

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={closeConfirm}
              disabled={isProcessing}
              className="min-h-11 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void runPending()}
              disabled={isProcessing}
              className={`min-h-11 rounded-md px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 ${
                confirm.danger ? "bg-red-600 hover:bg-red-700" : "bg-blue-700 hover:bg-blue-800"
              }`}
            >
              {isProcessing ? "Please wait…" : actionError ? "Try again" : confirm.button}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
// Sélection de l’étudiant, saisie des quantités et création du reçu.
export function ClinicPayment() {
  const [payment, setPayment] = useState<Array<{ serviceName: string; quantity: number; price: number; is_principal: boolean }>>([]);
  const [faculties, setFaculties] = useState<string[]>([]);
  const [studyYears, setStudyYears] = useState<number[]>([]);
  const [students, setStudents] = useState<ClinicStudent[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedReceipt, setSavedReceipt] = useState<SavedClinicReceipt | null>(null);
  const [discountInput, setDiscountInput] = useState("");
  const [display, setDisplay] = useState(false);
  const [cashier, setCashier] = useState("");
  const [addYear, setAddYear] = useState(0);
const [studentSearch, setStudentSearch] = useState("");

  useEffect(() => {
    const fetchPaymentOptions = async () => {
      const [serviceResult, studentResult, statusResult] = await Promise.all([
        supabase.from("clinic_service").select("*"),
        supabase.from("student").select("id, faculty"),
        supabase.from("student_status").select("year_study"),
      ]);

      const { data: serviceData, error: serviceError } = serviceResult;
      if (serviceError) {
        console.error("Error fetching services:", serviceError);
        setMessage(`Impossible de charger les services : ${serviceError.message}`);
        return;
      }
const { data: { user } } = await supabase.auth.getUser()
                    const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', user?.id)
              .single()
              setCashier(profile?.full_name || "Utilisateur non identifié");
      const normalizedService = serviceData ?? [];
      setPayment(
        normalizedService.map((item) => ({
          serviceName: item.service_name,
          quantity: 0,
          price: Number(item.price ?? 0),
          is_principal: item.is_principal ?? false,
        }))
      );

      if (studentResult.error) {
        setMessage(`Impossible de charger les filtres étudiants : ${studentResult.error.message}`);
      } else {
        setFaculties([...new Set((studentResult.data ?? []).map((student) => student.faculty).filter((faculty): faculty is string => Boolean(faculty)))].sort());
      }

      if (statusResult.error) {
        setMessage(`Impossible de charger les années d’études : ${statusResult.error.message}`);
      } else {
        const years = [...new Set((statusResult.data ?? []).map((status) => Number(status.year_study)).filter((year) => Number.isFinite(year)))].sort((a, b) => a - b);
        setStudyYears(years);
      }
    };

    void fetchPaymentOptions();
  }, []);

  useEffect(() => {
    let isCurrent = true;

    const fetchStudents = async () => {
      setIsLoadingStudents(true);
      let statusQuery = supabase.from("student_status").select("student_id, year_study");
      if (selectedYear) statusQuery = statusQuery.eq("year_study", Number(selectedYear));

      const { data: statusRows, error: statusError } = await statusQuery;
      if (statusError) {
        if (isCurrent) {
          setStudents([]);
          setSelectedStudentId("");
          setMessage(`Impossible de filtrer les étudiants : ${statusError.message}`);
          setIsLoadingStudents(false);
        }
        return;
      }

      const studentIds = [...new Set((statusRows ?? []).map((row) => row.student_id).filter((id) => id !== null))];
      if (studentIds.length === 0) {
        if (isCurrent) {
          setStudents([]);
          setSelectedStudentId("");
          setIsLoadingStudents(false);
        }
        return;
      }

      const { data: studentRows, error: studentsError } = await supabase
        .from("student")
        .select("id, first_name, last_name, faculty")
        .in("id", studentIds);

      if (!isCurrent) return;
      if (studentsError) {
        setStudents([]);
        setSelectedStudentId("");
        setMessage(`Impossible de charger les étudiants : ${studentsError.message}`);
        setIsLoadingStudents(false);
        return;
      }

      const filteredStudents = (studentRows ?? [])
        .filter((student) => !selectedFaculty || student.faculty === selectedFaculty)
        .map((student) => ({
          id: String(student.id),
          first_name: student.first_name,
          last_name: student.last_name,
          faculty: student.faculty,
        }));

      setStudents(filteredStudents);
      setSelectedStudentId((current) =>
        current && filteredStudents.some((student) => student.id === current)
          ? current
          : filteredStudents[0]?.id ?? ""
      );
      setIsLoadingStudents(false);
    };

    void fetchStudents();
    return () => {
      isCurrent = false;
    };
  }, [selectedFaculty, selectedYear]);
  // Students matching the search box (every typed word must appear in the name, any order)
const visibleStudents = useMemo(() => {
  const terms = normalizeText(studentSearch).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return students;
  return students.filter((student) => {
    const haystack = normalizeText(`${student.last_name ?? ""} ${student.first_name ?? ""}`);
    return terms.every((term) => haystack.includes(term));
  });
}, [students, studentSearch]);

// Keep the selected student valid: if it is filtered out, select the first match (or none)
useEffect(() => {
  setSelectedStudentId((current) =>
    visibleStudents.some((student) => student.id === current)
      ? current
      : visibleStudents[0]?.id ?? ""
  );
}, [visibleStudents]);
  const selectedStudent = students.find((student) => student.id === selectedStudentId) ?? null;
  const studentName = selectedStudent
    ? `${selectedStudent.last_name?.toUpperCase() ?? ""} ${selectedStudent.first_name ?? ""}`.trim()
    : "";

  const updateQuantity = (serviceName: string, quantity: number) => {
    const safeQuantity = Math.max(0, Number(quantity) || 0);
    setSavedReceipt(null);
    setPayment((current) =>
      current.map((item) =>
        item.serviceName === serviceName
          ? { ...item, quantity: safeQuantity }
          : item
      )
    );
  };

  const validItems = payment.filter((item) => item.quantity > 0);
  const grandTotal = validItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const discountAmount = Number(discountInput) || 0;
  const totalAfterDiscount = Math.max(0, grandTotal - discountAmount);

  const handleSaveInvoice = async () => {
    if (!selectedStudent || !selectedYear) {
      setMessage("Sélectionnez une année d’études et un étudiant avant d’enregistrer le reçu.");
      return;
    }

    if (discountAmount < 0 || discountAmount > grandTotal) {
      setMessage("La réduction doit être comprise entre 0 et le sous-total.");
      return;
    }

    const hasNegativeValue = payment.some((item) => item.quantity < 0);
    if (hasNegativeValue) {
      setMessage("La quantité ne peut pas être négative.");
      return;
    }

    const invoiceRows = payment
      .filter((item) => item.serviceName && item.quantity > 0)
      .map((item) => ({
        service_name: item.serviceName,
        quantity: Number(item.quantity),
        price: Number(item.price)*Number(item.quantity),
      }));

    if (invoiceRows.length === 0) {
      setMessage("Ajoutez au moins un service avec une quantité supérieure à zéro.");
      return;
    }

    setIsSaving(true);
    setMessage("");
    setSavedReceipt(null);

    const { data, error } = await supabase.rpc("insert_clinic_invoice", {
      p_student_name: studentName,
      p_year: Number(selectedYear)+Number(addYear),
      p_total_price: totalAfterDiscount,
      p_discount: discountAmount,
      p_line_items: invoiceRows,
    });

    if (error) {
      setIsSaving(false);
      setMessage(`Impossible d’enregistrer le reçu : ${error.message}`);
      return;
    }

    const receiptId = Number(data);
    if (!Number.isSafeInteger(receiptId) || receiptId <= 0) {
      setIsSaving(false);
      setMessage("Le reçu a été enregistré, mais la base de données n’a pas renvoyé un identifiant valide.");
      return;
    }

    const [receiptResult, linesResult] = await Promise.all([
      supabase
        .from("clinic_receipt")
        .select("id, created_at, student_name, year, total_price, insert_by, discount")
        .eq("id", receiptId)
        .single(),
      supabase
        .from("clinic_pay")
        .select("id, receipt_id, service_name, quantity, price")
        .eq("receipt_id", receiptId)
        .order("id", { ascending: true }),
    ]);

    setIsSaving(false);
    if (receiptResult.error || linesResult.error || !receiptResult.data) {
      setMessage(`Le reçu n° ${receiptId} est enregistré, mais ses détails n’ont pas pu être chargés : ${receiptResult.error?.message ?? linesResult.error?.message ?? "Reçu introuvable."}`);
      return;
    }

    setSavedReceipt({
      receipt: receiptResult.data as ClinicReceipt,
      lines: (linesResult.data ?? []) as ClinicPaymentLine[],
    });
    setMessage(`Le reçu n° ${receiptId} a été enregistré et chargé depuis la base de données.`);
  };

  // Mise en page indépendante pour imprimer le reçu enregistré en base.
  const printSavedReceipt = () => {
    if (!savedReceipt) return;

    const escapeHtml = (value: string | number) => String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[character] ?? character);
    const rows = savedReceipt.lines.map((line) => `<tr><td>${escapeHtml(line.service_name ?? "Prestation")}</td><td class="number">${escapeHtml(Number(line.quantity) || 0)}</td><td class="number">$ ${escapeHtml(formatClinicAmount(Number(line.price) || 0))} HT</td></tr>`).join("");
    const receipt = savedReceipt.receipt;
    const printWindow = window.open("", "_blank", "width=800,height=900");
    if (!printWindow) {
      setMessage("Autorisez les fenêtres contextuelles pour imprimer ce reçu.");
      return;
    }

    const subtotal = (Number(receipt.total_price) || 0) + (Number(receipt.discount) || 0);
    printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Reçu clinique n° ${receipt.id}</title><style>*{box-sizing:border-box;margin:0;padding:0}
      html,body{width:100%;min-width:0}body{font:10px Arial,sans-serif;color:#111827;max-width:none;margin:0;padding:2mm}body *{font-size:10px!important}
      .logo-section{width:100%;text-align:center;margin-bottom:2mm}.logo{display:block;width:100%;height:auto;max-height:22mm;object-fit:contain}.info{text-align:center;border-bottom:1px solid #ddd;padding-bottom:1mm;margin-bottom:2mm}
      header{text-align:center;border-bottom:2px solid #111827;padding:1mm;margin-bottom:2mm}h1{margin:0}
      .meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:2mm;margin:2mm 0;overflow-wrap:anywhere}
      table{width:100%;table-layout:fixed;border-collapse:collapse;margin-top:2mm}th,td{padding:1mm;border-bottom:1px solid #d1d5db;text-align:left;overflow-wrap:anywhere;word-break:break-word}th:first-child,td:first-child{width:56%}th:nth-child(2),td:nth-child(2){width:18%}th:nth-child(3),td:nth-child(3){width:26%}th{border-top:1px solid #111827;border-bottom:1px solid #111827}.number{text-align:right}.grand-total{display:flex;justify-content:space-between;border-top:2px solid #111827;margin-top:2mm;padding:2mm 1mm;font-weight:bold}.footer{text-align:center;margin-top:3mm;color:#6b7280}
      .totals>div{display:flex;justify-content:space-between;padding:1mm}.totals .grand-total{margin-top:1mm;padding:2mm 1mm}
      @page{size:auto;margin:3mm}@media print{html,body{width:100%;height:auto}body{max-width:none;margin:0;padding:0}.meta{grid-template-columns:repeat(2,minmax(0,1fr))}tr{break-inside:avoid}}@media print and (max-width:100mm){.meta{grid-template-columns:1fr}}</style></head><body><div class="logo-section"><img src="${window.location.origin}/image/h.png" alt="Logo de l’UDEI" class="logo"></div>
      <div class="info">
        <div>#5 Village Zao, Maïs Gâté 13 (Bloc Gérald bataille) Port-au-Prince HAITI
        </div>
        <div class="text-center">+(509) 40 03 4090 / +(509) 48809772 </div>
        </div>
        <header><h1>Reçu clinique</h1><div>Reçu n° ${receipt.id}</div></header><div class="meta"><div><strong>Étudiant :</strong> ${escapeHtml(receipt.student_name ?? "Non renseigné")}</div><div><strong>Année d’études :</strong> ${escapeHtml(receipt.year ?? "-")}</div><div><strong>Date :</strong> ${escapeHtml(new Date(receipt.created_at).toLocaleString("fr-HT"))}</div></div><table><thead><tr><th>Prestation</th><th class="number">Quantité</th><th class="number">Montant</th></tr></thead><tbody>${rows}</tbody></table><div class="totals"><div><span>Sous-total</span><span>$ ${formatClinicAmount(subtotal)} HT</span></div><div><span>Réduction</span><span>− $ ${formatClinicAmount(Number(receipt.discount) || 0)} HT</span></div><div class="grand-total"><span>Total à payer</span><span>$ ${formatClinicAmount(Number(receipt.total_price) || 0)} HT</span></div></div><div class="footer"><strong>NB</strong> : le montant n’est remboursable en aucun cas.</div><div class="footer">Émis par :<strong> ${escapeHtml(cashier)}</strong></div><script>window.addEventListener('load',()=>window.print())</script></body></html>`);
    printWindow.document.close();
  };

  return (
    <div className="max-w-3xl space-y-5 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col items-start justify-between gap-3 border-b border-gray-200 pb-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-medium text-gray-700">Paiement de la clinique</h2>
          <p className="text-sm text-gray-500">
            {studentName || "Sélectionnez un étudiant"} · Année {selectedYear || "-"}
          </p>
        </div>
        <div className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700">
          À payer : $ {formatClinicAmount(totalAfterDiscount)} HT
        </div>
      </div>

      {/* Filtres pour limiter les étudiants selon leur faculté et leur année d’études. */}
      <div className="grid gap-4 rounded-md border border-gray-200 bg-gray-50 p-4 md:grid-cols-3">
        <div className="space-y-1 md:col-span-3">
  <label htmlFor="clinic-student-search" className="text-sm font-medium text-gray-700">
    Rechercher un étudiant
  </label>
  <div className="flex gap-2">
    <input
      id="clinic-student-search"
      type="text"
      value={studentSearch}
      onChange={(event) => {
        setStudentSearch(event.target.value);
        setSavedReceipt(null);
      }}
      placeholder="Nom ou prénom..."
      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2"
    />
    <button
      type="button"
      onClick={() => setStudentSearch("")}
      disabled={!studentSearch}
      className="rounded-md bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50"
    >
      Effacer
    </button>
  </div>
  {studentSearch.trim() && (
    <p className="text-xs text-gray-500" role="status">
      {visibleStudents.length} étudiant{visibleStudents.length > 1 ? "s" : ""} trouvé{visibleStudents.length > 1 ? "s" : ""}
    </p>
  )}
</div>
<label className="space-y-1 text-sm font-medium text-gray-700">
          Faculté
          <select
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2"
            value={selectedFaculty}
            onChange={(event) => {
              setSelectedFaculty(event.target.value);
              setSavedReceipt(null);
            }}
          >
            <option value="">Toutes les facultés</option>
            {faculties.map((faculty) => <option key={faculty} value={faculty}>{faculty}</option>)}
            <option value="Autres">Autres</option>
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium text-gray-700">
          Année d’études
          <select
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2"
            value={selectedYear}
            onChange={(event) => {
              setSelectedYear(event.target.value);
              setSavedReceipt(null);
            }}
          >
            <option value="">Toutes les années</option>
            {studyYears.map((year) => <option key={year} value={String(year)}>Année {year}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium text-gray-700">
          Étudiant
          <select
  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2"
  value={selectedStudentId}
  disabled={isLoadingStudents || visibleStudents.length === 0}
  onChange={(event) => {
    setSelectedStudentId(event.target.value);
    setSavedReceipt(null);
  }}
>
  <option value="">
    {isLoadingStudents
      ? "Chargement des étudiants…"
      : visibleStudents.length === 0
        ? "Aucun étudiant trouvé"
        : "Sélectionner un étudiant"}
  </option>
  {visibleStudents.map((student) => (
    <option key={student.id} value={student.id}>
      {student.last_name} {student.first_name}
    </option>
  ))}
</select>
        </label>
      </div>
        {/* add x year  */}
        {/* Réduction fixe appliquée au sous-total des prestations. */}
      <section className="grid gap-3 rounded-md border border-gray-200 bg-gray-50 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <label className="block space-y-1 text-sm font-medium text-gray-700">
          Ajouter x Années 
          <input
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2"
            type="number"
            min="0"
            max={6}
            step="1"
            inputMode="decimal"
            value={addYear}
            onChange={(event) => {
              setAddYear(Number(event.target.value));
            }}
            placeholder="0"
          />
        </label>
      </section>
      {/* Réduction fixe appliquée au sous-total des prestations. */}
      <section className="grid gap-3 rounded-md border border-gray-200 bg-gray-50 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <label className="block space-y-1 text-sm font-medium text-gray-700">
          Réduction (HT)
          <input
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2"
            type="number"
            min="0"
            max={grandTotal}
            step="0.01"
            inputMode="decimal"
            value={discountInput}
            onChange={(event) => {
              setDiscountInput(event.target.value);
              setSavedReceipt(null);
            }}
            placeholder="0"
          />
        </label>
        <div className="text-sm text-gray-600 sm:text-right">
          <p>Sous-total : $ {formatClinicAmount(grandTotal)} HT</p>
          <p>Réduction : − $ {formatClinicAmount(discountAmount)} HT</p>
        </div>
      </section>

      {/* Lignes de prestations : colonnes sur grand écran, champs identifiés sur téléphone. */}
      <div className="space-y-3">
        <div className="hidden grid-cols-[2fr_1fr_1fr_1fr] gap-3 border-b border-gray-200 pb-2 text-sm font-medium text-gray-700 md:grid">
          <span>Prestation</span>
          <span>Quantité</span>
          <span>Tarif</span>
          <span>Total</span>
        </div>

        {payment.filter((item) => item.is_principal === true).map((item) => {
          const itemTotal = item.quantity * item.price;

          return (
            <div key={item.serviceName} className="grid grid-cols-2 items-center gap-3 rounded-md border border-gray-200 p-3 md:grid-cols-[2fr_1fr_1fr_1fr]">
              <span className="col-span-2 font-medium text-gray-800 md:col-span-1">{item.serviceName}</span>
              <label className="space-y-1 text-xs text-gray-500 md:text-sm md:text-gray-700">
                <span className="md:hidden">Quantité</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={item.quantity}
                  onChange={(event) => updateQuantity(item.serviceName, Number(event.target.value))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                />
              </label>
              <div className="text-sm text-gray-700"><span className="block text-xs text-gray-500 md:hidden">Tarif</span> ${formatClinicAmount(item.price)} HT</div>
              <div className="text-sm font-medium text-gray-800"><span className="block text-xs text-gray-500 md:hidden">Total</span> ${formatClinicAmount(itemTotal)} HT</div>
            </div>
          );
        })}
      </div>
      <button type="button" aria-expanded={display} className="min-h-11 rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300" onClick={()=>setDisplay(!display)}>
        {display ? "Masquer les autres prestations" : "Afficher les autres prestations"}
      </button>
      <div>
        {display && payment.filter((item) => item.is_principal === false).map((item) => {
          const itemTotal = item.quantity * item.price;

          return (
            <div key={item.serviceName} className="mb-3 grid grid-cols-2 items-center gap-3 rounded-md border border-gray-200 p-3 md:grid-cols-[2fr_1fr_1fr_1fr]">
              <span className="col-span-2 font-medium text-gray-800 md:col-span-1">{item.serviceName}</span>
              <label className="space-y-1 text-xs text-gray-500 md:text-sm md:text-gray-700">
                <span className="md:hidden">Quantité</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={item.quantity}
                  onChange={(event) => updateQuantity(item.serviceName, Number(event.target.value))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                />
              </label>
              <div className="text-sm text-gray-700"><span className="block text-xs text-gray-500 md:hidden">Tarif</span>$ {formatClinicAmount(item.price)} HT</div>
              <div className="text-sm font-medium text-gray-800"><span className="block text-xs text-gray-500 md:hidden">Total</span>{formatClinicAmount(itemTotal)} HT</div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t border-gray-200 pt-3 text-sm font-semibold text-gray-800">
        <span>Total après réduction</span>
        <span>$ {formatClinicAmount(totalAfterDiscount)} HT</span>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSaveInvoice}
          disabled={isSaving || isLoadingStudents || !selectedStudent || !selectedYear}
          className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Enregistrement…" : "Enregistrer le reçu"}
        </button>

      </div>

      {message && <p className="text-sm text-gray-700">{message}</p>}

      {savedReceipt && (
        <section className="space-y-4 rounded-md border border-emerald-200 bg-emerald-50/40 p-4" aria-label="Reçu clinique enregistré">
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-emerald-200 pb-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Reçu enregistré n° {savedReceipt.receipt.id}</h3>
              <p className="text-sm text-gray-600">Enregistré le {new Date(savedReceipt.receipt.created_at).toLocaleString("fr-HT")}</p>
            </div>
            <button
              type="button"
              onClick={printSavedReceipt}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Imprimer / enregistrer en PDF
            </button>
          </header>
          <div className="grid gap-2 text-sm text-gray-700 sm:grid-cols-3">
            <p><strong>Étudiant :</strong> {savedReceipt.receipt.student_name || "Non renseigné"}</p>
            <p><strong>Année d’études :</strong> {savedReceipt.receipt.year ?? "-"}</p>
            <p><strong>Identifiant du reçu :</strong> {savedReceipt.receipt.id}</p>
          </div>
          <div className="divide-y divide-gray-200">
            {savedReceipt.lines.map((line) => (
              <div key={line.id} className="flex items-center justify-between gap-4 py-2 text-sm">
                <span>{line.service_name || "Prestation"} · Qté {line.quantity}</span>
                <span className="whitespace-nowrap font-medium">{formatClinicAmount(Number(line.price) || 0)} HT</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between border-t border-emerald-200 pt-3 font-semibold text-gray-900">
            <span>Sous-total</span>
            <span>$ {formatClinicAmount((Number(savedReceipt.receipt.total_price) || 0) + (Number(savedReceipt.receipt.discount) || 0))} HT</span>
          </div>
          <div className="flex justify-between text-sm text-gray-700">
            <span>Réduction</span>
            <span>− $ {formatClinicAmount(Number(savedReceipt.receipt.discount) || 0)} HT</span>
          </div>
          <div className="flex justify-between border-t border-emerald-200 pt-3 font-semibold text-gray-900">
            <span>Total enregistré</span>
            <span>$ {formatClinicAmount(Number(savedReceipt.receipt.total_price) || 0)} HT</span>
          </div>
        </section>
      )}
    </div>
  );
}
// Rapport filtrable avec synthèse des reçus et prestations enregistrées.
export function ClinicRapport(){
  const [period, setPeriod] = useState<ClinicReportPeriod>("day");
  const [selectedDate, setSelectedDate] = useState(() => localDateInputValue(new Date()));
  const [receipts, setReceipts] = useState<ClinicReceipt[]>([]);
  const [paymentLines, setPaymentLines] = useState<ClinicPaymentLine[]>([]);
  const [cashierNames, setCashierNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isCurrent = true;

    const fetchReport = async () => {
      setIsLoading(true);
      setErrorMessage("");

      const { start, end } = getClinicPeriodBounds(selectedDate, period);
      const { data: receiptData, error: receiptError } = await supabase
        .from("clinic_receipt")
        .select("id, created_at, student_name, year, total_price, insert_by, discount")
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString())
        .order("created_at", { ascending: false });

      if (receiptError) {
        if (isCurrent) {
          setErrorMessage(receiptError.message);
          setReceipts([]);
          setPaymentLines([]);
          setIsLoading(false);
        }
        return;
      }

      const reportReceipts = (receiptData ?? []) as ClinicReceipt[];
      const receiptIds = reportReceipts.map((receipt) => receipt.id);
      const creatorIds = [...new Set(reportReceipts.map((receipt) => receipt.insert_by).filter((id): id is string => Boolean(id)))];

      const [lineResult, profileResult] = await Promise.all([
        receiptIds.length
          ? supabase
              .from("clinic_pay")
              .select("id, receipt_id, service_name, quantity, price")
              .in("receipt_id", receiptIds)
          : Promise.resolve({ data: [], error: null }),
        creatorIds.length
          ? supabase.from("profiles").select("id, full_name, email").in("id", creatorIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (!isCurrent) return;

      if (lineResult.error || profileResult.error) {
        setErrorMessage(lineResult.error?.message ?? profileResult.error?.message ?? "Impossible de charger les détails du rapport.");
        setIsLoading(false);
        return;
      }

      const names = Object.fromEntries(
        (profileResult.data ?? []).map((profile) => [
          profile.id,
          profile.full_name || profile.email || "Utilisateur inconnu",
        ])
      );

      setReceipts(reportReceipts);
      setPaymentLines((lineResult.data ?? []) as ClinicPaymentLine[]);
      setCashierNames(names);
      setIsLoading(false);
    };

    void fetchReport();
    return () => {
      isCurrent = false;
    };
  }, [period, selectedDate]);

  const totalRevenue = receipts.reduce((sum, receipt) => sum + (Number(receipt.total_price) || 0), 0);
  const totalDiscounts = receipts.reduce((sum, receipt) => sum + (Number(receipt.discount) || 0), 0);
  const lineTotal = (line: ClinicPaymentLine) => Number(line.price || 0);
  const periodLabel = period === "day" ? "Journée" : period === "week" ? "Semaine" : period === "month" ? "Mois" : "Année";
  const { start: reportStart, end: reportEnd } = getClinicPeriodBounds(selectedDate, period);
  const reportPeriodText = `${reportStart.toLocaleDateString("fr-HT")} au ${new Date(reportEnd.getTime() - 1).toLocaleDateString("fr-HT")}`;
  const reportRows = receipts.map((receipt) => {
    const items = paymentLines.filter((line) => line.receipt_id === receipt.id);
    return {
      date: new Date(receipt.created_at).toLocaleString(),
      receiptId: receipt.id,
      student: receipt.student_name || "Étudiant non renseigné",
      year: receipt.year ?? "-",
      services: items.map((item) => `${item.service_name || "Prestation"} (Qté ${item.quantity}, total ${formatClinicAmount(lineTotal(item))} HT)`).join(" ; ") || "Aucune prestation",
      cashier: receipt.insert_by ? cashierNames[receipt.insert_by] || "Utilisateur inconnu" : "Non renseigné",
      discount: Number(receipt.discount) || 0,
      total: Number(receipt.total_price) || 0,
    };
  });
  const reportYears = Array.from({ length: 6 }, (_, index) => new Date().getFullYear() - index);

  const xmlEscape = (value: string | number) => String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
  })[character] ?? character);

  // Export du rapport filtré dans un classeur compatible avec Excel.
  const exportExcel = () => {
    const headers = ["Date", "Reçu", "Étudiant", "Année d’études", "Prestations", "Caissier", "Réduction", "Total net"];
    const worksheetRows = [
      ["Rapport clinique", `${periodLabel} : ${reportPeriodText}`],
      ["Nombre de reçus", receipts.length],
      ["Réductions totales", totalDiscounts],
      ["Total net encaissé", totalRevenue],
      [],
      headers,
      ...reportRows.map((row) => [row.date, row.receiptId, row.student, row.year, row.services, row.cashier, row.discount, row.total]),
    ];
    const xmlRows = worksheetRows.map((row) => `<Row>${row.map((value) => {
      if (value === undefined || value === null || value === "") return "<Cell/>";
      const numeric = typeof value === "number";
      return `<Cell><Data ss:Type="${numeric ? "Number" : "String"}">${xmlEscape(value)}</Data></Cell>`;
    }).join("")}</Row>`).join("");
    const workbook = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Rapport clinique"><Table>${xmlRows}</Table></Worksheet></Workbook>`;
    const blob = new Blob([workbook], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rapport-clinique-${period}-${selectedDate}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Génération du PDF avec le logo et les lignes correspondant au filtre actif.
  const exportPdf = async () => {
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const logoDataUrl = await getClinicLogoDataUrl();
    const columns = [
      { label: "Date", x: 12, width: 28 },
      { label: "Reçu", x: 40, width: 16 },
      { label: "Étudiant", x: 56, width: 36 },
      { label: "Année", x: 92, width: 16 },
      { label: "Prestations", x: 108, width: 74 },
      { label: "Caissier", x: 182, width: 34 },
      { label: "Réduction", x: 216, width: 26 },
      { label: "Total net", x: 242, width: 43 },
    ];
    let y = 16;

    const drawHeader = () => {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setFillColor(243, 244, 246);
      pdf.rect(12, y - 5, pageWidth - 24, 8, "F");
      columns.forEach((column) => pdf.text(column.label, column.x + 1, y));
      y += 6;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
    };

    if (logoDataUrl) {
      pdf.addImage(logoDataUrl, "PNG", 12, y, 68, 15);
    }
    y += logoDataUrl ? 20 : 0;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text("Rapport de la clinique", 12, y);
    y += 7;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(`${periodLabel} : ${reportPeriodText} | Reçus : ${receipts.length} | Réductions : ${formatClinicAmount(totalDiscounts)} HT | Net : ${formatClinicAmount(totalRevenue)} HT`, 12, y);
    y += 9;
    drawHeader();

    reportRows.forEach((row) => {
      const values = [row.date, `#${row.receiptId}`, row.student, String(row.year), row.services, row.cashier, formatClinicAmount(row.discount), formatClinicAmount(row.total)];
      const wrapped = values.map((value, index) => pdf.splitTextToSize(value, columns[index].width - 2) as string[]);
      const rowHeight = Math.max(...wrapped.map((lines) => lines.length), 1) * 4 + 3;
      if (y + rowHeight > pageHeight - 12) {
        pdf.addPage();
        y = 16;
        drawHeader();
      }
      wrapped.forEach((lines, index) => pdf.text(lines, columns[index].x + 1, y));
      y += rowHeight;
      pdf.setDrawColor(229, 231, 235);
      pdf.line(12, y - 2, pageWidth - 12, y - 2);
    });

    pdf.save(`rapport-clinique-${period}-${selectedDate}.pdf`);
  };

  // Page d’impression autonome du rapport, avec logo et synthèse de la période.
  const printReport = () => {
    const escapeHtml = (value: string | number) => xmlEscape(value);
    const rows = reportRows.map((row) => `<tr><td>${escapeHtml(row.date)}</td><td>n° ${row.receiptId}</td><td>${escapeHtml(row.student)}</td><td>${escapeHtml(row.year)}</td><td>${escapeHtml(row.services)}</td><td>${escapeHtml(row.cashier)}</td><td class="amount">− ${formatClinicAmount(row.discount)} HT</td><td class="amount">${formatClinicAmount(row.total)} HT</td></tr>`).join("");
    const printWindow = window.open("", "_blank", "width=1100,height=800");
    if (!printWindow) return;

    printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Rapport de la clinique</title><style>body{font:12px Arial,sans-serif;color:#1f2937;margin:24px}.logo-section{width:100%;text-align:center;margin-bottom:12px}.logo{display:block;width:100%;height:auto;max-height:24mm;object-fit:contain}.info{text-align:center;font-size:10px;border-bottom:1px solid #ddd;padding:4px;margin-bottom:12px}h1{margin:0 0 8px;font-size:22px}.summary{margin:16px 0}table{width:100%;border-collapse:collapse;font-size:10px}th{background:#e5e7eb;text-align:left}th,td{border:1px solid #d1d5db;padding:7px;vertical-align:top}.amount{text-align:right;white-space:nowrap}tbody tr:nth-child(even){background:#f9fafb}@page{size:landscape;margin:12mm}@media print{body{margin:0}thead{display:table-header-group}tr{break-inside:avoid}}</style></head><body><div class="logo-section"><img src="${window.location.origin}/image/h.png" alt="Logo de l’UDEI" class="logo"><div class="info">#5, Village Zao, Maïs Gâté 13 (Bloc Gérald Bataille), Port-au-Prince, Haïti<br>+(509) 40 03 4090 / +(509) 48 80 97 72</div></div><h1>Rapport de la clinique</h1><p>${escapeHtml(periodLabel)} : ${escapeHtml(reportPeriodText)}</p><div class="summary">Nombre de reçus : ${receipts.length} | Réductions : ${formatClinicAmount(totalDiscounts)} HT | Total net encaissé : ${formatClinicAmount(totalRevenue)} HT</div><table><thead><tr><th>Date</th><th>Reçu</th><th>Étudiant</th><th>Année</th><th>Prestations</th><th>Caissier</th><th>Réduction</th><th>Total net</th></tr></thead><tbody>${rows || '<tr><td colspan="8">Aucun reçu pour cette période.</td></tr>'}</tbody></table><script>window.addEventListener('load',()=>window.print())</script></body></html>`);
    printWindow.document.close();
  };

  return (
    <section className="w-full max-w-6xl space-y-5 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <header className="flex flex-col gap-4 border-b border-gray-200 pb-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Rapport de la clinique</h2>
          <p className="text-sm text-gray-500">Synthèse des reçus et prestations pour la période choisie.</p>
        </div>
        {/* Filtres et actions restent facilement accessibles sur petit écran. */}
        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end">
          <label className="space-y-1 text-sm font-medium text-gray-700">
            Période
            <select
              className="block min-h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 sm:w-auto"
              value={period}
              onChange={(event) => setPeriod(event.target.value as ClinicReportPeriod)}
            >
              <option value="day">Jour</option>
              <option value="week">Semaine</option>
              <option value="month">Mois</option>
              <option value="year">Année</option>
            </select>
          </label>
          {period === "year" ? (
            <label className="space-y-1 text-sm font-medium text-gray-700">
              Année du rapport
              <select
                className="block min-h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 sm:w-auto"
                value={selectedDate.slice(0, 4)}
                onChange={(event) => setSelectedDate(`${event.target.value}-01-01`)}
              >
                {reportYears.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </label>
          ) : (
            <label className="space-y-1 text-sm font-medium text-gray-700">
              {period === "day" ? "Date" : "Date dans la période"}
              <input
                className="block min-h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 sm:w-auto"
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
            </label>
          )}
        </div>
        <div className="col-span-2 grid grid-cols-3 gap-2 sm:flex" aria-label="Exporter le rapport de la clinique">
          <button type="button" onClick={exportExcel} disabled={isLoading || receipts.length === 0} className="min-h-11 rounded-md border border-green-700 px-2 py-2 text-xs font-medium text-green-800 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:text-sm">Excel</button>
          <button type="button" onClick={exportPdf} disabled={isLoading || receipts.length === 0} className="min-h-11 rounded-md border border-red-700 px-2 py-2 text-xs font-medium text-red-800 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:text-sm">Télécharger le PDF</button>
          <button type="button" onClick={printReport} disabled={isLoading} className="min-h-11 rounded-md border border-gray-400 px-2 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:text-sm">Imprimer</button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-md bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Reçus · {periodLabel.toLowerCase()}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-800">{receipts.length}</p>
        </div>
        <div className="rounded-md bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Réductions accordées</p>
          <p className="mt-1 text-2xl font-semibold text-gray-800">− $ {formatClinicAmount(totalDiscounts)} HT</p>
        </div>
        <div className="rounded-md bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Montant total encaissé</p>
          <p className="mt-1 text-2xl font-semibold text-gray-800">$ {formatClinicAmount(totalRevenue)} HT</p>
        </div>
        <div className="rounded-md bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Prestations facturées</p>
          <p className="mt-1 text-2xl font-semibold text-gray-800">{paymentLines.length}</p>
        </div>
      </div>

      {errorMessage && <p role="alert" className="text-sm text-red-700">{errorMessage}</p>}
      {isLoading ? (
        <p className="py-6 text-center text-sm text-gray-500">Chargement du rapport…</p>
      ) : receipts.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">Aucun reçu pour cette période.</p>
      ) : (
        <>
          {/* Présentation en cartes sans défilement horizontal sur téléphone. */}
          <div className="space-y-3 md:hidden">
            {receipts.map((receipt) => {
              const items = paymentLines.filter((line) => line.receipt_id === receipt.id);
              return (
                <article key={receipt.id} className="space-y-3 rounded-md border border-slate-200 p-3">
                  <header className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2">
                    <div className="min-w-0">
                      <h3 className="wrap-break-word font-semibold text-slate-900">{receipt.student_name || "Étudiant non renseigné"}</h3>
                      <p className="mt-1 text-xs text-slate-500">{new Date(receipt.created_at).toLocaleString("fr-HT")}</p>
                    </div>
                    <span className="shrink-0 rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">Reçu n° {receipt.id}</span>
                  </header>
                  <p className="text-sm text-slate-600">Année d’études : {receipt.year ?? "-"}</p>
                  <div className="space-y-2">
                    {items.length ? items.map((item) => (
                      <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                        <span className="min-w-0 wrap-break-word">{item.service_name || "Prestation"} · Qté {item.quantity}</span>
                        <span className="shrink-0 font-medium">{formatClinicAmount(lineTotal(item))} HT</span>
                      </div>
                    )) : <p className="text-sm text-slate-500">Aucune prestation détaillée.</p>}
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Réduction</span>
                    <span>− $ {formatClinicAmount(Number(receipt.discount) || 0)} HT</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 text-sm">
                    <span className="wrap-break-word text-slate-500">Caissier : {receipt.insert_by ? cashierNames[receipt.insert_by] || "Utilisateur inconnu" : "Non renseigné"}</span>
                    <strong className="shrink-0">{formatClinicAmount(Number(receipt.total_price) || 0)} HT</strong>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Tableau détaillé pour les écrans moyens et larges. */}
          <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-190 border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Reçu</th>
                <th className="px-3 py-2 font-medium">Étudiant</th>
                <th className="px-3 py-2 font-medium">Année</th>
                <th className="px-3 py-2 font-medium">Prestations</th>
                <th className="px-3 py-2 font-medium">Caissier</th>
                <th className="px-3 py-2 text-right font-medium">Réduction</th>
                <th className="px-3 py-2 text-right font-medium">Total net</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((receipt) => {
                const items = paymentLines.filter((line) => line.receipt_id === receipt.id);

                return (
                  <tr key={receipt.id} className="border-b border-gray-100 align-top text-gray-700">
                    <td className="whitespace-nowrap px-3 py-3">{new Date(receipt.created_at).toLocaleString("fr-HT")}</td>
                    <td className="px-3 py-3">n° {receipt.id}</td>
                    <td className="px-3 py-3">{receipt.student_name || "Étudiant non renseigné"}</td>
                    <td className="px-3 py-3">{receipt.year ?? "-"}</td>
                    <td className="px-3 py-3">
                      <ul className="space-y-1">
                        {items.map((item) => (
                          <li key={item.id}>
                            {item.service_name || "Prestation"} · Qté {item.quantity} · Total $ {formatClinicAmount(lineTotal(item))} HT
                          </li>
                        ))}
                        {items.length === 0 && <li className="text-gray-400">Aucune prestation détaillée</li>}
                      </ul>
                    </td>
                    <td className="px-3 py-3">{receipt.insert_by ? cashierNames[receipt.insert_by] || "Utilisateur inconnu" : "Non renseigné"}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right">− $ {formatClinicAmount(Number(receipt.discount) || 0)} HT</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right font-semibold">$ {formatClinicAmount(Number(receipt.total_price) || 0)} HT</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      )}
    </section>
  );
}