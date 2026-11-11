import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";
import quoteService from "../../services/quoteService";
import geocodingService from "../../services/geocodingService";

/**
 * Address step before accepting a mobile fitter's quote on a workshop request
 * (client answers Q9 / Q10, 2 Nov 2026). The workshop form never asked for a
 * street, so the customer adds where the work should be done; the booking uses it.
 * Saved on that fitter's quote through PUT /customer/quotes/:quoteId/service-address.
 * The city is fixed to the request's city: the fitters quoted for that area.
 */
const ServiceAddressModal = ({ isOpen, quote, response, onCancel, onSaved }) => {
  const [form, setForm] = useState({ addressLine1: "", suburb: "", city: "", postalCode: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");

  // Prefill from the request each time the step opens
  useEffect(() => {
    if (!isOpen) return;
    const a = quote?.serviceLocation?.address || {};
    const saved = response?.customerAddress || {};
    setForm({
      addressLine1: saved.addressLine1 || a.addressLine1 || "",
      suburb: saved.suburb || a.suburb || "",
      city: a.city || "",
      postalCode: saved.postalCode || a.postalCode || "",
    });
    setErrors({});
    setServerError("");
  }, [isOpen, quote, response]);

  const providerName = response?.provider?.businessName || response?.provider?.name || "This fitter";

  const update = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.addressLine1.trim()) next.addressLine1 = "Enter the street address";
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }
    setSaving(true);
    setServerError("");
    try {
      const coordinates = await geocodingService.getCoordinates(
        [form.addressLine1, form.suburb, form.city, form.postalCode].filter(Boolean).join(", "),
      );
      const res = await quoteService.setServiceAddress(quote._id, {
        responseId: response._id,
        address: {
          addressLine1: form.addressLine1,
          suburb: form.suburb,
          postalCode: form.postalCode,
          ...(coordinates ? { coordinates } : {}),
        },
      });
      onSaved(res?.data?.customerAddress || null);
    } catch (err) {
      setServerError(err?.response?.data?.message || err?.message || "Could not save the address. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={saving ? () => {} : onCancel}
      title="Where should the fitter come?"
      description={`${providerName} comes to you instead of you going to a workshop. Add the address where the work should be done.`}
      size="md"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          label="Street address"
          required
          autoFocus
          icon={MapPin}
          value={form.addressLine1}
          onChange={update("addressLine1")}
          error={errors.addressLine1}
          placeholder="12 Florida Road"
          autoComplete="address-line1"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Suburb"
            value={form.suburb}
            onChange={update("suburb")}
            placeholder="Morningside"
            autoComplete="address-level3"
          />
          <Input
            label="City"
            value={form.city}
            disabled
            helperText="Fitters quoted for this city"
          />
        </div>
        <Input
          label="Postal code"
          value={form.postalCode}
          onChange={update("postalCode")}
          placeholder="4001"
          inputMode="numeric"
          maxLength={10}
          autoComplete="postal-code"
          className="sm:max-w-[50%]"
        />
        {serverError && (
          <p role="alert" className="text-sm text-red-600">
            {serverError}
          </p>
        )}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Save address and continue
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ServiceAddressModal;
