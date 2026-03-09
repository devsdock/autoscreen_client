import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Car,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Star,
  MoreVertical,
  FileText,
} from "lucide-react";
import useDashboardStore from "../../store/useDashboardStore";
import profileService from "../../services/profileService";
import vehicleService from "../../services/vehicleService";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import PremiumSelect from "../../components/ui/PremiumSelect";
import Modal, { ModalActions } from "../../components/ui/Modal";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { bodyTypes, yearOptions } from "../../data/vehicles";

const Vehicles = () => {
  const { addToast } = useDashboardStore();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Vehicle modal
  const [vehicleModal, setVehicleModal] = useState({ open: false, vehicle: null });
  const [vehicleForm, setVehicleForm] = useState({
    make: "",
    model: "",
    year: "",
    bodyType: "Sedan",
    registration: "",
    hasAdasCamera: false,
    hasRainSensor: false,
  });

  // Make/model data
  const [availableMakes, setAvailableMakes] = useState([]);
  const [availableModels, setAvailableModels] = useState([]);
  const [makeLookup, setMakeLookup] = useState({});
  const [isFetchingMakes, setIsFetchingMakes] = useState(false);
  const [isFetchingModels, setIsFetchingModels] = useState(false);

  // Delete confirmation
  const [deleteVehicleId, setDeleteVehicleId] = useState(null);

  // Fetch vehicles
  const fetchVehicles = async () => {
    setIsLoading(true);
    try {
      const res = await profileService.getVehicles();
      if (res.success) {
        const mapped = (res.data || []).map((v) => ({
          id: v._id,
          make: v.make,
          model: v.model,
          year: v.year,
          bodyType: v.bodyType || "Sedan",
          registration: v.registrationNumber || "",
          hasAdasCamera: v.hasAdasCamera || false,
          hasRainSensor: v.hasRainSensor || false,
          isDefault: v.isDefault,
        }));
        setVehicles(mapped);
      }
    } catch {
      addToast({ type: "error", message: "Failed to load vehicles" });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch makes
  useEffect(() => {
    const fetchMakes = async () => {
      setIsFetchingMakes(true);
      try {
        const makes = await vehicleService.getAllMakes();
        if (makes?.length > 0) {
          setAvailableMakes(makes.map((m) => m.name));
          const lookup = {};
          makes.forEach((m) => { lookup[m.name] = m._id; });
          setMakeLookup(lookup);
        }
      } catch {}
      finally { setIsFetchingMakes(false); }
    };
    fetchMakes();
    fetchVehicles();
  }, []);

  // Fetch models when make changes
  useEffect(() => {
    const fetchModels = async () => {
      if (!vehicleForm.make) return;
      setIsFetchingModels(true);
      try {
        const makeIdOrName = makeLookup[vehicleForm.make] || vehicleForm.make;
        const models = await vehicleService.getModelsByMake(makeIdOrName);
        setAvailableModels(models.map((m) => m.name));
      } catch {
        setAvailableModels([]);
      } finally {
        setIsFetchingModels(false);
      }
    };
    fetchModels();
  }, [vehicleForm.make, makeLookup]);

  const openVehicleModal = (vehicle = null) => {
    if (vehicle) {
      setVehicleForm({
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        bodyType: vehicle.bodyType,
        registration: vehicle.registration || "",
        hasAdasCamera: vehicle.hasAdasCamera || false,
        hasRainSensor: vehicle.hasRainSensor || false,
      });
    } else {
      setVehicleForm({
        make: "", model: "", year: "", bodyType: "Sedan",
        registration: "", hasAdasCamera: false, hasRainSensor: false,
      });
    }
    setVehicleModal({ open: true, vehicle });
  };

  const handleSaveVehicle = async () => {
    if (!vehicleForm.make || !vehicleForm.model || !vehicleForm.year) {
      addToast({ type: "error", message: "Make, model, and year are required" });
      return;
    }
    if (!vehicleForm.registration?.trim()) {
      addToast({ type: "error", message: "Registration number is required" });
      return;
    }
    setIsSaving(true);
    try {
      const data = {
        make: vehicleForm.make,
        model: vehicleForm.model,
        year: parseInt(vehicleForm.year),
        bodyType: vehicleForm.bodyType,
        registrationNumber: vehicleForm.registration,
        hasAdasCamera: vehicleForm.hasAdasCamera,
        hasRainSensor: vehicleForm.hasRainSensor,
      };

      let res;
      if (vehicleModal.vehicle) {
        res = await profileService.updateVehicle(vehicleModal.vehicle.id, data);
      } else {
        res = await profileService.addVehicle(data);
      }

      if (res.success) {
        const mapped = (res.data || []).map((v) => ({
          id: v._id,
          make: v.make,
          model: v.model,
          year: v.year,
          bodyType: v.bodyType || "Sedan",
          registration: v.registrationNumber || "",
          hasAdasCamera: v.hasAdasCamera || false,
          hasRainSensor: v.hasRainSensor || false,
          isDefault: v.isDefault,
        }));
        setVehicles(mapped);
        setVehicleModal({ open: false, vehicle: null });
        addToast({
          type: "success",
          message: vehicleModal.vehicle ? "Vehicle updated" : "Vehicle added",
        });
      }
    } catch {
      addToast({ type: "error", message: "Failed to save vehicle" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetPrimary = async (vehicleId) => {
    setIsSaving(true);
    try {
      const res = await profileService.updateVehicle(vehicleId, { isDefault: true });
      if (res.success) {
        const mapped = (res.data || []).map((v) => ({
          id: v._id,
          make: v.make,
          model: v.model,
          year: v.year,
          bodyType: v.bodyType || "Sedan",
          registration: v.registrationNumber || "",
          hasAdasCamera: v.hasAdasCamera || false,
          hasRainSensor: v.hasRainSensor || false,
          isDefault: v.isDefault,
        }));
        setVehicles(mapped);
        addToast({ type: "success", message: "Primary vehicle updated" });
      }
    } catch {
      addToast({ type: "error", message: "Failed to set primary vehicle" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteVehicle = async () => {
    setIsSaving(true);
    try {
      const res = await profileService.deleteVehicle(deleteVehicleId);
      if (res.success) {
        const mapped = (res.data || []).map((v) => ({
          id: v._id,
          make: v.make,
          model: v.model,
          year: v.year,
          bodyType: v.bodyType || "Sedan",
          registration: v.registrationNumber || "",
          hasAdasCamera: v.hasAdasCamera || false,
          hasRainSensor: v.hasRainSensor || false,
          isDefault: v.isDefault,
        }));
        setVehicles(mapped);
        addToast({ type: "success", message: "Vehicle removed" });
      }
    } catch {
      addToast({ type: "error", message: "Failed to remove vehicle" });
    } finally {
      setDeleteVehicleId(null);
      setIsSaving(false);
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-8 w-40 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            <div className="h-4 w-64 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <div className="h-[140px] bg-slate-100 dark:bg-slate-800 animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-7">
        <div>
          <h1 className="font-display text-[1.75rem] font-bold text-slate-900 dark:text-white tracking-[-0.025em] leading-[1.2]">
            My Vehicles
          </h1>
          <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1.5">
            Your saved vehicles and glass specifications
          </p>
        </div>
        <button
          onClick={() => openVehicleModal()}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-[15px] font-semibold text-white shadow-sm transition-all duration-150 hover:-translate-y-px hover:shadow-md"
          style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
        >
          <Plus size={16} />
          Add Vehicle
        </button>
      </div>

      {/* Vehicle Grid */}
      {vehicles.length === 0 ? (
        <div
          onClick={() => openVehicleModal()}
          className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl min-h-[280px] flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all duration-200 p-8"
        >
          <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center transition-colors">
            <Plus size={24} className="text-slate-400" />
          </div>
          <p className="text-base font-bold text-slate-700 dark:text-slate-300">
            Add Your First Vehicle
          </p>
          <p className="text-sm text-slate-400 text-center">
            Save your vehicle details for faster quoting
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...vehicles].sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0)).map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onEdit={() => openVehicleModal(vehicle)}
              onDelete={() => setDeleteVehicleId(vehicle.id)}
              onGetQuote={() => navigate("/dashboard/quotes/new", { state: { prefillVehicle: vehicle } })}
              onSetPrimary={() => handleSetPrimary(vehicle.id)}
            />
          ))}

          {/* Add Vehicle Card */}
          <div
            onClick={() => openVehicleModal()}
            className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl min-h-[280px] flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all duration-200 p-8"
          >
            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Plus size={24} className="text-slate-400" />
            </div>
            <p className="text-base font-bold text-slate-700 dark:text-slate-300">
              Add Vehicle
            </p>
            <p className="text-sm text-slate-400 text-center">
              Save your vehicle for faster quoting
            </p>
          </div>
        </div>
      )}

      {/* Vehicle Modal */}
      <Modal
        isOpen={vehicleModal.open}
        onClose={() => setVehicleModal({ open: false, vehicle: null })}
        title={vehicleModal.vehicle ? "Edit Vehicle" : "Add Vehicle"}
        size="md"
      >
        <div className="space-y-4">
          <PremiumSelect
            label="Make"
            options={availableMakes}
            value={vehicleForm.make}
            onChange={(val) => {
              setVehicleForm((prev) => ({ ...prev, make: val, model: "" }));
              setAvailableModels([]);
              if (val && !availableMakes.includes(val)) {
                vehicleService.createMake(val).then((created) => {
                  if (created?._id) {
                    setAvailableMakes((prev) => prev.includes(val) ? prev : [...prev, val]);
                    setMakeLookup((prev) => ({ ...prev, [val]: created._id }));
                  }
                }).catch(() => {});
              }
            }}
            required
            isSearchable
            isCreatable
            isClearable
            loading={isFetchingMakes}
            placeholder="Select make"
          />
          <PremiumSelect
            label="Model"
            options={availableModels}
            value={vehicleForm.model}
            onChange={(val) => {
              setVehicleForm((prev) => ({ ...prev, model: val }));
              if (val && !availableModels.includes(val) && vehicleForm.make) {
                const makeIdOrName = makeLookup[vehicleForm.make] || vehicleForm.make;
                vehicleService.createModel(makeIdOrName, val).then(() => {
                  setAvailableModels((prev) => prev.includes(val) ? prev : [...prev, val]);
                }).catch(() => {});
              }
            }}
            required
            isSearchable
            isCreatable
            isClearable
            disabled={!vehicleForm.make}
            loading={isFetchingModels}
            placeholder={!vehicleForm.make ? "Select make first" : "Search or select model"}
            emptyMessage={!vehicleForm.make ? "Please select a make first" : "No models found"}
          />
          <div className="grid grid-cols-2 gap-4">
            <PremiumSelect
              label="Year"
              options={yearOptions.map(String)}
              value={vehicleForm.year?.toString() || ""}
              onChange={(val) => setVehicleForm((prev) => ({ ...prev, year: val }))}
              required
            />
            <PremiumSelect
              label="Body Type"
              options={bodyTypes}
              value={vehicleForm.bodyType}
              onChange={(val) => setVehicleForm((prev) => ({ ...prev, bodyType: val }))}
            />
          </div>
          <Input
            label="Registration Number"
            placeholder="e.g., CA 123-456"
            value={vehicleForm.registration}
            onChange={(e) => setVehicleForm((prev) => ({ ...prev, registration: e.target.value }))}
            required
          />
          <div className="grid grid-cols-2 gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <input
                type="checkbox"
                checked={vehicleForm.hasAdasCamera}
                onChange={(e) => setVehicleForm((prev) => ({ ...prev, hasAdasCamera: e.target.checked }))}
                className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">ADAS Camera</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <input
                type="checkbox"
                checked={vehicleForm.hasRainSensor}
                onChange={(e) => setVehicleForm((prev) => ({ ...prev, hasRainSensor: e.target.checked }))}
                className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Rain Sensor</span>
            </label>
          </div>
        </div>
        <ModalActions>
          <Button variant="secondary" onClick={() => setVehicleModal({ open: false, vehicle: null })}>
            Cancel
          </Button>
          <Button onClick={handleSaveVehicle} disabled={isSaving}>
            {isSaving && <Loader2 className="animate-spin mr-2" size={16} />}
            {vehicleModal.vehicle ? "Save Changes" : "Add Vehicle"}
          </Button>
        </ModalActions>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteVehicleId}
        onClose={() => setDeleteVehicleId(null)}
        onConfirm={handleDeleteVehicle}
        title="Remove Vehicle"
        message="Are you sure you want to remove this vehicle? This action cannot be undone."
        confirmLabel={isSaving ? "Removing..." : "Remove"}
        confirmVariant="danger"
        disabled={isSaving}
      />

    </div>
  );
};

/* ─── Vehicle Card (matching HTML design) ─── */
const VehicleCard = ({ vehicle, onEdit, onDelete, onGetQuote, onSetPrimary }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const isPrimary = vehicle.isDefault;
  const vehicleName = `${vehicle.make || ""} ${vehicle.model || ""}`.trim();
  const yearText = vehicle.year ? `${vehicle.year} · ` : "";

  const triggerRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  return (
    <div
      className={`bg-white dark:bg-slate-900 border rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 relative ${
        isPrimary
          ? "border-primary-300 dark:border-primary-700"
          : "border-slate-200 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-800"
      }`}
    >
      {/* Visual header */}
      <div
        className={`h-[140px] relative rounded-t-2xl overflow-hidden flex items-center justify-center ${
          isPrimary
            ? "bg-gradient-to-br from-primary-900 to-primary-800"
            : "bg-gradient-to-br from-slate-800 to-slate-700"
        }`}
      >
        <Car
          size={100}
          className="text-white/15"
          strokeWidth={1}
        />
        {isPrimary && (
          <div className="absolute top-3 left-3 bg-primary-600 text-white text-[10px] font-bold uppercase tracking-[.05em] px-2.5 py-[.2rem] rounded-full" style={{ boxShadow: "0 4px 14px rgba(37,99,235,.25)" }}>
            Primary
          </div>
        )}

        {/* Kebab menu trigger — top right */}
        <button
          ref={triggerRef}
          onClick={() => setMenuOpen(!menuOpen)}
          className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-white/15 hover:bg-white/25 text-white"
        >
          <MoreVertical size={16} />
        </button>
      </div>

      {/* Kebab dropdown — positioned outside overflow-hidden area */}
      {menuOpen && (
        <div ref={menuRef} className="absolute right-3 top-[52px] w-40 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1.5 z-50 animate-in fade-in zoom-in duration-200">
          <button
            onClick={() => { setMenuOpen(false); onEdit(); }}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <Edit2 size={14} className="text-slate-400" />
            Edit
          </button>
          {!isPrimary && (
            <>
              <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
              <button
                onClick={() => { setMenuOpen(false); onSetPrimary(); }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors"
              >
                <Star size={14} />
                Set as Primary
              </button>
            </>
          )}
          <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
          <button
            onClick={() => { setMenuOpen(false); onDelete(); }}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
          >
            <Trash2 size={14} />
            Remove
          </button>
        </div>
      )}

      {/* Body */}
      <div className="p-5">
        {vehicle.registration && (
          <span className="inline-block font-mono text-[15px] font-medium text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 mb-2.5">
            {vehicle.registration}
          </span>
        )}
        <div className="font-display text-[1.0625rem] font-bold text-slate-900 dark:text-white leading-[1.2]">
          {vehicleName || "Unknown Vehicle"}
        </div>
        <div className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
          {yearText}{vehicle.bodyType || "Sedan"}
        </div>

        {(vehicle.hasAdasCamera || vehicle.hasRainSensor) && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {vehicle.hasAdasCamera && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
                ADAS
              </span>
            )}
            {vehicle.hasRainSensor && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
                Rain Sensor
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer — Get Quote CTA (matches HTML vc-foot) */}
      <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 flex gap-2.5">
        <button
          onClick={onGetQuote}
          className="w-full flex items-center justify-center gap-2 py-[.4375rem] px-3.5 rounded-lg text-[13px] font-semibold text-white shadow-sm transition-all duration-150 hover:-translate-y-px hover:shadow-md"
          style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
        >
          Get Quote
        </button>
      </div>
    </div>
  );
};

export default Vehicles;
