import { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Mail,
  Phone,
  Clock,
  Send,
  Upload,
  HelpCircle,
  X,
  CheckCircle2,
  FileText as FileIcon,
} from "lucide-react";
import useDashboardStore from "../../store/useDashboardStore";
import PageHeader from "../../components/ui/PageHeader";
import Card, {
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import PremiumSelect from "../../components/ui/PremiumSelect";
import Textarea from "../../components/ui/Textarea";
import Accordion from "../../components/ui/Accordion";
import Modal from "../../components/ui/Modal";
import { faqData } from "../../data/faq";
import { getPublicSettings } from "../../services/publicSettingsService";
import supportTicketService from "../../services/supportTicketService";

const Support = () => {
  const { bookings, addToast } = useDashboardStore();
  const [publicSettings, setPublicSettings] = useState({
    supportEmail: "support@autoscreen.co.za",
    supportPhone: "078 965 9317",
    supportWhatsApp: "078 965 9317",
  });
  const [issueForm, setIssueForm] = useState({
    type: "",
    bookingId: "",
    subject: "",
    description: "",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const settings = await getPublicSettings();
      if (settings) {
        setPublicSettings({
          supportEmail: settings.supportEmail || "support@autoscreen.co.za",
          supportPhone: settings.supportPhone || "078 965 9317",
          supportWhatsApp: settings.supportWhatsApp || "078 965 9317",
        });
      }
    };
    fetchSettings();
  }, []);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState(null);
  const [formKey, setFormKey] = useState(0); // bump to remount form & reset PremiumSelect
  const fileInputRef = useRef(null);

  const issueTypes = [
    { value: "booking", label: "Booking issue" },
    { value: "payment", label: "Payment issue" },
    { value: "provider", label: "Provider complaint" },
    { value: "technical", label: "Technical problem" },
    { value: "other", label: "Other" },
  ];

  const recentBookings = bookings.slice(0, 5).map((b) => ({
    value: b.id,
    label: `${b.id} - ${b.service}`,
  }));

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    addFiles(files);
  };

  const addFiles = (newFiles) => {
    const validFiles = newFiles.filter((file) => file.size <= 10 * 1024 * 1024); // 10MB limit
    if (validFiles.length < newFiles.length) {
      addToast({ type: "error", message: "Some files exceed the 10MB limit" });
    }

    setUploadedFiles((prev) => {
      const updated = [...prev, ...validFiles];
      return updated.slice(0, 5); // Max 5 files
    });
  };

  const removeFile = (index) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  const handleSubmitIssue = async (e) => {
    e.preventDefault();

    if (!issueForm.type || !issueForm.subject || !issueForm.description) {
      addToast({
        type: "error",
        message: "Please fill in all required fields",
      });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("type", issueForm.type);
      formData.append("subject", issueForm.subject);
      formData.append("description", issueForm.description);
      if (issueForm.bookingId)
        formData.append("referenceId", issueForm.bookingId);
      uploadedFiles.forEach((file) => formData.append("files", file));

      const res = await supportTicketService.createTicket(formData);
      if (res.success) {
        setTicketNumber(res.data.ticketNumber);
        // Clear form inputs immediately
        setIssueForm({ type: "", bookingId: "", subject: "", description: "" });
        setUploadedFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setFormKey((k) => k + 1); // remount form so PremiumSelect resets
        setIsSubmitted(true);
        addToast({
          type: "success",
          message: "Support ticket submitted successfully!",
        });
      }
    } catch (error) {
      console.error("Failed to submit ticket", error);
      addToast({
        type: "error",
        message: "Failed to submit ticket. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setIssueForm({
      type: "",
      bookingId: "",
      subject: "",
      description: "",
    });
    setUploadedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsSubmitted(false);
    setTicketNumber(null);
    setFormKey((k) => k + 1); // remount form so PremiumSelect resets
  };

  const handleWhatsAppClick = () => {
    const cleanNumber = publicSettings.supportWhatsApp.replace(/[^\d+]/g, "");
    window.open(
      `https://wa.me/${cleanNumber.startsWith("+") ? cleanNumber.substring(1) : cleanNumber}`,
      "_blank",
    );
  };

  const handleEmailClick = () => {
    window.location.href = `mailto:${publicSettings.supportEmail}`;
  };

  const handlePhoneClick = () => {
    window.location.href = `tel:${publicSettings.supportPhone.replace(/[^\d+]/g, "")}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Help & Support"
        subtitle="Get help with your bookings and account"
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Contact & FAQ */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Options */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-4">
                <button
                  onClick={handleWhatsAppClick}
                  className="flex flex-col items-center p-6 bg-green-50 dark:bg-green-950/20 rounded-xl hover:bg-green-100 dark:hover:bg-green-950/30 transition-colors group"
                >
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <MessageSquare size={24} className="text-white" />
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    WhatsApp
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Chat with us
                  </span>
                </button>

                <button
                  onClick={handleEmailClick}
                  className="flex flex-col items-center p-6 bg-blue-50 dark:bg-blue-950/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors group"
                >
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Mail size={24} className="text-white" />
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Email
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {publicSettings.supportEmail}
                  </span>
                </button>

                <button
                  onClick={handlePhoneClick}
                  className="flex flex-col items-center p-6 bg-purple-50 dark:bg-purple-950/20 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-950/30 transition-colors group"
                >
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Phone size={24} className="text-white" />
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Phone
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {publicSettings.supportPhone}
                  </span>
                </button>
              </div>

              <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center gap-3 border border-slate-100 dark:border-slate-800">
                <Clock
                  size={20}
                  className="text-slate-400 dark:text-slate-500"
                />
                <div className="text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Business Hours:{" "}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">
                    Mon – Fri: 08:00 – 17:00 | Sat: 09:00 – 13:00
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle size={20} />
                Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion items={faqData} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Report Issue */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Report an Issue</CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                Describe your issue and we'll get back to you within 24 hours
              </p>
            </CardHeader>
            <CardContent>
              {/* The form is now always rendered here. Success message is shown in a Modal. */}
              <form
                key={formKey}
                onSubmit={handleSubmitIssue}
                className="space-y-4"
              >
                <PremiumSelect
                  label="Issue Type"
                  options={issueTypes.map((opt) => opt.label)}
                  value={
                    issueTypes.find((opt) => opt.value === issueForm.type)
                      ?.label || ""
                  }
                  onChange={(val) => {
                    const selected = issueTypes.find(
                      (opt) => opt.label === val,
                    );
                    setIssueForm((prev) => ({
                      ...prev,
                      type: selected?.value || "",
                    }));
                  }}
                  required
                  placeholder="Select issue type"
                />

                {recentBookings.length > 0 && (
                  <PremiumSelect
                    label="Related Booking (optional)"
                    options={recentBookings.map((opt) => opt.label)}
                    value={
                      recentBookings.find(
                        (opt) => opt.value === issueForm.bookingId,
                      )?.label || ""
                    }
                    onChange={(val) => {
                      const selected = recentBookings.find(
                        (opt) => opt.label === val,
                      );
                      setIssueForm((prev) => ({
                        ...prev,
                        bookingId: selected?.value || "",
                      }));
                    }}
                    placeholder="Select a booking..."
                    searchable
                  />
                )}

                <Input
                  label="Subject"
                  placeholder="Brief description of the issue"
                  value={issueForm.subject}
                  onChange={(e) =>
                    setIssueForm((prev) => ({
                      ...prev,
                      subject: e.target.value,
                    }))
                  }
                  required
                />

                <Textarea
                  label="Description"
                  placeholder="Please provide as much detail as possible..."
                  value={issueForm.description}
                  onChange={(e) =>
                    setIssueForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={5}
                  required
                />

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                      border-2 border-dashed rounded-xl p-4 sm:p-6 text-center transition-all cursor-pointer
                      ${
                        isDragging
                          ? "border-primary-500 bg-primary-50/50 dark:bg-primary-900/10"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                      }
                    `}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    multiple
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  <Upload
                    size={24}
                    className={`mx-auto mb-2 ${isDragging ? "text-primary-500 scale-110" : "text-slate-400 dark:text-slate-500"} transition-all`}
                  />
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Drag & drop files here or{" "}
                    <span className="text-primary-600 dark:text-primary-400 font-medium">
                      browse
                    </span>
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Max 5 files, 10MB each
                  </p>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    {uploadedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileIcon
                            size={16}
                            className="text-primary-500 flex-shrink-0"
                          />
                          <span className="text-xs text-slate-700 dark:text-slate-300 truncate">
                            {file.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(idx);
                          }}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  loading={loading}
                  disabled={loading}
                >
                  <Send size={16} />
                  {loading ? "Submitting..." : "Submit Issue"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Quick Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                  1
                </span>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Check the FAQ section first – your question might already be
                  answered
                </p>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                  2
                </span>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Include your booking ID when reporting issues for faster
                  resolution
                </p>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                  3
                </span>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  For urgent matters, WhatsApp is the fastest way to reach us
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={isSubmitted}
        onClose={handleReset}
        title="Issue Reported"
        size="sm"
      >
        <div className="py-4 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} />
          </div>
          {ticketNumber && (
            <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 mb-2">
              Ticket #{ticketNumber}
            </p>
          )}
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Your issue has been successfully submitted. Our support team will
            get back to you within 24 hours.
          </p>
          <div className="space-y-3">
            {/* <Button
              variant="primary"
              className="w-full"
              onClick={() =>
                (window.location.href = "/customer/dashboard/messages")
              }
            >
              <MessageSquare size={16} />
              View in Messages
            </Button> */}
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleReset}
            >
              Report Another Issue
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Support;
