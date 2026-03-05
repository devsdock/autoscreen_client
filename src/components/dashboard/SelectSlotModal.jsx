import { useState, useEffect } from "react";
import {
  Clock,
  Loader2,
  AlertCircle,
  User,
} from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import PremiumDatePicker from "../ui/PremiumDatePicker";
import PremiumSelect from "../ui/PremiumSelect";
import quoteService from "../../services/quoteService";

const SelectSlotModal = ({
  isOpen,
  onClose,
  onConfirm,
  provider,
  isLoading: externalLoading,
}) => {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [dayInfo, setDayInfo] = useState(null);
  const [error, setError] = useState("");

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedDate("");
      setSelectedSlot("");
      setAvailableSlots([]);
      setDayInfo(null);
      setError("");
    }
  }, [isOpen]);

  // Fetch availability when date changes
  useEffect(() => {
    if (!selectedDate || !provider?.id) return;

    const fetchAvailability = async () => {
      setIsLoadingSlots(true);
      setError("");
      setSelectedSlot("");

      try {
        const result = await quoteService.getProviderAvailability(
          provider.id,
          selectedDate,
        );

        if (result.success) {
          setDayInfo(result.data);
          setAvailableSlots(result.data.slots || []);
        } else {
          setError("Failed to load availability");
          setAvailableSlots([]);
        }
      } catch (err) {
        setError("Failed to load availability. Please try again.");
        setAvailableSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchAvailability();
  }, [selectedDate, provider?.id]);

  const handleConfirm = () => {
    if (!selectedDate || !selectedSlot) return;
    onConfirm({
      scheduledDate: selectedDate,
      scheduledTimeSlot: selectedSlot,
    });
  };

  // Min date = tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div>
          <span>Schedule Booking</span>
          <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
            Select a date & time
          </p>
        </div>
      }
      size="md"
    >
      <div className="space-y-5">
        {/* Provider Info */}
        {provider && (
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <User
                size={20}
                className="text-primary-600 dark:text-primary-400"
              />
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">
                {provider.name}
              </p>
              {provider.price && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Quote: R{provider.price}
                  {provider.turnaround &&
                    ` · ${provider.turnaround}`}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Date Picker */}
        <PremiumDatePicker
          label="Select Date"
          value={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          placeholder="Choose a date"
          minDate={minDate}
          required
        />

        {/* Time Slots */}
        {selectedDate && (
          <div>
            {isLoadingSlots ? (
              <div className="flex items-center justify-center py-8">
                <Loader2
                  size={24}
                  className="animate-spin text-primary-500"
                />
                <span className="ml-2 text-sm text-slate-500">
                  Loading available slots...
                </span>
              </div>
            ) : error ? (
              <div className="p-4 bg-danger-50 dark:bg-danger-900/20 rounded-xl text-center">
                <AlertCircle
                  size={20}
                  className="mx-auto text-danger-500 mb-2"
                />
                <p className="text-sm text-danger-600 dark:text-danger-400">
                  {error}
                </p>
              </div>
            ) : dayInfo && !dayInfo.isOpen ? (
              <div className="p-4 bg-warning-50 dark:bg-warning-900/20 rounded-xl text-center">
                <AlertCircle
                  size={20}
                  className="mx-auto text-warning-500 mb-2"
                />
                <p className="text-sm text-warning-600 dark:text-warning-400">
                  Provider is closed on{" "}
                  {dayInfo.dayOfWeek?.charAt(0).toUpperCase() +
                    dayInfo.dayOfWeek?.slice(1)}
                  . Please select a different date.
                </p>
              </div>
            ) : (
              <PremiumSelect
                label="Select Time Slot"
                icon={Clock}
                value={selectedSlot}
                onChange={(val) => setSelectedSlot(val)}
                options={availableSlots.map((slot) => ({
                  value: slot,
                  label: slot,
                }))}
                placeholder={
                  availableSlots.length > 0
                    ? "Choose a time slot"
                    : "No slots — try a different date"
                }
                emptyMessage="No time slots available for this date"
                disabled={availableSlots.length === 0}
                required
              />
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1 whitespace-nowrap"
            onClick={handleConfirm}
            loading={externalLoading}
            disabled={!selectedDate || !selectedSlot}
          >
            Confirm & Book
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SelectSlotModal;
