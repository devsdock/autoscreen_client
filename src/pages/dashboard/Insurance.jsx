import { useState, useEffect, useMemo } from "react";
import {
  Shield,
  FileText,
  Pencil,
  Plus,
  Building2,
  Hash,
  CheckCircle,
  Search,
  User,
} from "lucide-react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Modal, { ModalActions } from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import PremiumSelect from "../../components/ui/PremiumSelect";
import StatusBadge from "../../components/ui/StatusBadge";
import profileService from "../../services/profileService";
import insurerService from "../../services/insurerService";
import useDashboardStore from "../../store/useDashboardStore";

/* ─── Cover type options ─── */
const COVER_TYPES = [
  { value: "comprehensive", label: "Comprehensive" },
  { value: "third-party", label: "Third Party" },
  { value: "glass-only", label: "Glass Only" },
  { value: "not-sure", label: "Not Sure" },
];

const COVER_BADGE = {
  comprehensive: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "third-party": "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  "glass-only": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "not-sure": "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

const Insurance = () => {
  const addToast = useDashboardStore((s) => s.addToast);
  const user = useDashboardStore((s) => s.user);

  /* ─── State ─── */
  const [insurance, setInsurance] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [insurers, setInsurers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  /* ─── Modal state ─── */
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalErrors, setModalErrors] = useState({});
  const [modalData, setModalData] = useState({
    insurerId: "",
    policyNumber: "",
    policyHolderName: "",
    coverType: "",
    hasGlassCover: false,
  });

  /* ─── Derived ─── */
  const hasInsurance = !!(insurance && (insurance.insurer || insurance.insurerId || insurance.provider));

  const insurerName =
    insurance?.insurer?.name ||
    insurers.find((i) => i._id === insurance?.insurerId)?.name ||
    insurance?.provider ||
    "—";

  const coverLabel = COVER_TYPES.find((c) => c.value === insurance?.coverType)?.label || insurance?.coverType || "—";

  const policyHolder = insurance?.policyHolderName || (user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "") || "—";

  const insurerOptions = insurers.map((ins) => ({ label: ins.name, value: String(ins._id) }));

  const filteredBookings = useMemo(() => {
    if (!searchQuery.trim()) return bookings;
    const q = searchQuery.toLowerCase();
    return bookings.filter((b) => {
      const ref = (b.reference || b.bookingRef || b.bookingNumber || "").toLowerCase();
      const provider = (b.providerName || b.provider?.businessName || b.provider?.name || "").toLowerCase();
      const insurer = (b.insurerName || b.insurer?.name || "").toLowerCase();
      return ref.includes(q) || provider.includes(q) || insurer.includes(q);
    });
  }, [bookings, searchQuery]);

  /* ─── Fetch ─── */
  const fetchData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const [insuranceRes, bookingsRes, insurersRes] = await Promise.all([
        profileService.getInsurance(),
        profileService.getInsuranceBookings(),
        insurerService.getActiveInsurers(),
      ]);
      if (insuranceRes?.success && insuranceRes.data) setInsurance(insuranceRes.data);
      if (bookingsRes?.success && bookingsRes.data) setBookings(bookingsRes.data);
      if (insurersRes?.success && insurersRes.data) setInsurers(insurersRes.data);
    } catch {
      addToast?.({ type: "error", message: "Failed to load insurance data" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(true); }, []);

  /* ─── Modal handlers ─── */
  const openModal = () => {
    if (hasInsurance) {
      /* Ensure insurerId is a plain string for PremiumSelect matching */
      const savedInsurerId = String(insurance.insurer?._id || insurance.insurerId || "");
      setModalData({
        insurerId: savedInsurerId,
        policyNumber: insurance.policyNumber || "",
        policyHolderName: insurance.policyHolderName || "",
        coverType: insurance.coverType || "",
        hasGlassCover: insurance.hasGlassCover || false,
      });
    } else {
      const customerName = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || (user.name || "") : "";
      setModalData({ insurerId: "", policyNumber: "", policyHolderName: customerName, coverType: "", hasGlassCover: false });
    }
    setModalErrors({});
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setModalErrors({}); };

  const handleSave = async () => {
    const errors = {};
    if (!modalData.insurerId) errors.insurerId = "Please select an insurer";
    if (!modalData.policyNumber?.trim()) errors.policyNumber = "Policy number is required";
    if (!modalData.coverType) errors.coverType = "Please select a cover type";
    if (Object.keys(errors).length) { setModalErrors(errors); return; }

    setSaving(true);
    try {
      /* Check if insurerId is a real ObjectId or a custom-typed name */
      const isObjectId = /^[a-f\d]{24}$/i.test(modalData.insurerId);
      const res = await profileService.updateInsurance({
        insurerId: isObjectId ? modalData.insurerId : null,
        customInsurerName: isObjectId ? null : modalData.insurerId,
        policyNumber: modalData.policyNumber.trim(),
        policyHolderName: modalData.policyHolderName.trim(),
        coverType: modalData.coverType,
        hasGlassCover: modalData.hasGlassCover,
      });
      if (res.success) {
        closeModal();
        addToast?.({ type: "success", message: hasInsurance ? "Insurance details updated" : "Insurance details added" });
        await fetchData(false);
      }
    } catch {
      addToast?.({ type: "error", message: "Failed to save insurance details" });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (d) => { try { return new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }); } catch { return "—"; } };
  const formatCurrency = (v) => { if (v == null) return "—"; return `R ${Number(v).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; };

  /* ─── Loading skeleton ─── */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-40 bg-slate-200 dark:bg-slate-800 rounded-[8px] animate-pulse" />
          <div className="h-4 w-64 bg-slate-200 dark:bg-slate-800 rounded-[8px] animate-pulse" />
        </div>
        <Card><div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-[8px] animate-pulse" />)}</div></Card>
        <Card><div className="space-y-3">{[1,2].map(i => <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-[8px] animate-pulse" />)}</div></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Page Header ─── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Insurance</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your insurance details and view claim history</p>
      </div>

      {/* ═══ 1. MY INSURANCE DETAILS ═══ */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
              <Shield size={20} className="text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">My Insurance</h2>
          </div>

          {/* Edit button — ONLY when insurance exists */}
          {hasInsurance && (
            <Button
              variant="secondary"
              size="sm"
              onClick={openModal}
              className="!bg-orange-50 !text-orange-600 !border-orange-200 hover:!bg-orange-100 dark:!bg-orange-900/20 dark:!text-orange-400 dark:!border-orange-700 dark:hover:!bg-orange-900/30"
            >
              <Pencil size={14} />
              Edit
            </Button>
          )}
        </div>

        {hasInsurance ? (
          /* ── Info rows ── */
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-slate-500 dark:text-slate-400">Insurer</span>
              <span className="text-sm font-medium text-slate-900 dark:text-white">{insurerName}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-slate-500 dark:text-slate-400">Policy Number</span>
              <span className="text-sm font-mono font-medium text-slate-900 dark:text-white">{insurance.policyNumber || "—"}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-slate-500 dark:text-slate-400">Policy Holder</span>
              <span className="text-sm font-medium text-slate-900 dark:text-white">{policyHolder}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-slate-500 dark:text-slate-400">Cover Type</span>
              <span className={`inline-flex items-center px-2.5 py-[3px] text-xs font-semibold rounded-full ${COVER_BADGE[insurance.coverType] || COVER_BADGE["not-sure"]}`}>
                {coverLabel}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-slate-500 dark:text-slate-400">Glass Cover</span>
              {insurance.hasGlassCover ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-[3px] text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                  <CheckCircle size={12} /> Yes
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-[3px] text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  No
                </span>
              )}
            </div>
          </div>
        ) : (
          /* ── Empty state — Add Insurance CTA ── */
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mb-4">
              <Shield size={28} className="text-primary-500 dark:text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">No insurance added yet</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
              Add your insurance details to make future claims easier and faster.
            </p>
            <Button variant="primary" onClick={openModal}>
              <Plus size={18} /> Add Insurance Details
            </Button>
          </div>
        )}
      </Card>

      {/* ═══ 2. STATS STRIP (only when insurance exists) ═══ */}
      {hasInsurance && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-green-50 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <FileText size={20} className="text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Insurance Bookings</p>
                <p className="text-base font-semibold text-slate-900 dark:text-white">{bookings.length}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                <Shield size={20} className="text-primary-600 dark:text-primary-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cover Type</p>
                <p className="text-base font-semibold text-slate-900 dark:text-white">{coverLabel}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ═══ 3. BOOKING HISTORY ═══ */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-[10px] bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
            <FileText size={20} className="text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Booking History</h2>
        </div>

        {/* Search bar — only show when there are bookings */}
        {bookings.length > 0 && (
          <div className="mb-4">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by booking ref, provider, or insurer..."
                className="w-full pl-10 pr-4 h-[40px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[8px] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>
          </div>
        )}

        {filteredBookings.length > 0 ? (
          <div className="space-y-3">
            {filteredBookings.map((booking) => (
              <div
                key={booking._id || booking.id}
                className="bg-slate-50 dark:bg-slate-800/50 rounded-[8px] p-4 border border-slate-100 dark:border-slate-700/50"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0">
                    <span className="text-sm font-mono font-semibold text-slate-900 dark:text-white flex-shrink-0">
                      {booking.reference || booking.bookingRef || booking.bookingNumber || "—"}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
                      {booking.scheduledDate ? formatDate(booking.scheduledDate) : booking.createdAt ? formatDate(booking.createdAt) : "—"}
                    </span>
                  </div>
                  <div className="flex-shrink-0">
                    <StatusBadge status={booking.bookingStatus || booking.status} type="booking" size="sm" />
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                  {(booking.serviceDescription || booking.service?.name || booking.serviceType) && (
                    <div className="min-w-0 sm:col-span-2 lg:col-span-4">
                      <span className="text-slate-500 dark:text-slate-400">Service: </span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {Array.isArray(booking.serviceDescription)
                          ? booking.serviceDescription.map((line, i) => (
                              <span key={i}>{line}{i < booking.serviceDescription.length - 1 && <br />}</span>
                            ))
                          : booking.serviceDescription || booking.service?.name || booking.serviceType}
                      </span>
                    </div>
                  )}
                  {(booking.providerName || booking.provider?.businessName) && (
                    <div className="min-w-0">
                      <span className="text-slate-500 dark:text-slate-400">Provider: </span>
                      <span className="text-slate-700 dark:text-slate-300 truncate">{booking.providerName || booking.provider?.businessName}</span>
                    </div>
                  )}
                  {(booking.insurerName || booking.insurer?.name) && (
                    <div className="min-w-0">
                      <span className="text-slate-500 dark:text-slate-400">Insurer: </span>
                      <span className="text-slate-700 dark:text-slate-300 truncate">{booking.insurerName || booking.insurer?.name}</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="text-slate-500 dark:text-slate-400">Excess: </span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {booking.excessAmount === 0
                        ? "Fully Covered by Insurance"
                        : formatCurrency(booking.excessAmount)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : bookings.length > 0 && searchQuery.trim() ? (
          /* No search results */
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <Search size={32} className="text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">No bookings match &ldquo;{searchQuery}&rdquo;</p>
          </div>
        ) : (
          /* No bookings at all */
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <FileText size={28} className="text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">No insurance bookings</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
              When you use insurance for a booking, it will appear here.
            </p>
          </div>
        )}
      </Card>

      {/* ═══ ADD / EDIT MODAL ═══ */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={hasInsurance ? "Edit Insurance Details" : "Add Insurance Details"}
        description="Your insurance information helps us process claims faster."
        size="md"
      >
        <div className="space-y-4">
          {/* Insurer */}
          <PremiumSelect
            label="Insurer"
            placeholder="Search or type your insurer name"
            value={modalData.insurerId}
            options={insurerOptions}
            onChange={(val) => {
              /* If user typed a new insurer name (isCreatable returns the typed string as value) */
              const isExisting = insurerOptions.some((o) => o.value === val);
              if (!isExisting && val) {
                /* Add the custom entry to local options so it shows as selected */
                setInsurers((prev) => [...prev, { _id: val, name: val, isCustom: true }]);
              }
              setModalData((p) => ({ ...p, insurerId: val }));
              setModalErrors((p) => ({ ...p, insurerId: undefined }));
            }}
            error={modalErrors.insurerId}
            searchable
            isCreatable
            required
            icon={Building2}
          />

          {/* Policy Number */}
          <Input
            label="Policy Number"
            placeholder="e.g. POL-123456"
            value={modalData.policyNumber}
            onChange={(e) => { setModalData(p => ({ ...p, policyNumber: e.target.value })); setModalErrors(p => ({ ...p, policyNumber: undefined })); }}
            error={modalErrors.policyNumber}
            required
            icon={Hash}
          />

          {/* Policy Holder Name */}
          <Input
            label="Policy Holder Name"
            placeholder="Leave blank if you are the policy holder"
            value={modalData.policyHolderName}
            onChange={(e) => setModalData(p => ({ ...p, policyHolderName: e.target.value }))}
            icon={User}
          />

          {/* Cover Type */}
          <PremiumSelect
            label="Cover Type"
            placeholder="Select your cover type"
            value={modalData.coverType}
            options={COVER_TYPES}
            onChange={(val) => { setModalData(p => ({ ...p, coverType: val })); setModalErrors(p => ({ ...p, coverType: undefined })); }}
            error={modalErrors.coverType}
            required
            icon={Shield}
          />

          {/* Glass Cover toggle */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={modalData.hasGlassCover}
                  onChange={(e) => setModalData(p => ({ ...p, hasGlassCover: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer-checked:bg-primary-600 dark:peer-checked:bg-primary-500 transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4" />
              </div>
              <div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Glass Cover</span>
                <p className="text-xs text-slate-500 dark:text-slate-400">Does your policy specifically include glass cover? This determines if glass repairs are covered under your plan.</p>
              </div>
            </label>
          </div>
        </div>

        <ModalActions>
          <Button variant="secondary" onClick={closeModal} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : hasInsurance ? "Save Changes" : "Add Insurance"}
          </Button>
        </ModalActions>
      </Modal>
    </div>
  );
};

export default Insurance;
