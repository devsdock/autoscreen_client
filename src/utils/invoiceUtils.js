import bookingService from "../services/bookingService";

export const downloadInvoice = async (
  bookingId,
  bookingNumber,
  toastCallback,
) => {
  try {
    // Call backend to get PDF blob
    const blob = await bookingService.getInvoice(bookingId);

    // Create a download link
    const url = window.URL.createObjectURL(
      new Blob([blob], { type: "application/pdf" }),
    );
    const link = document.createElement("a");
    link.href = url;

    // Set filename
    // Use bookingNumber if available, otherwise fallback to bookingId
    const filename = `Invoice-${bookingNumber || bookingId}.pdf`;
    link.setAttribute("download", filename);

    document.body.appendChild(link);
    link.click();

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 100);

    if (toastCallback) {
      toastCallback("Invoice downloading...", "success");
    }
  } catch (err) {
    console.error("Failed to download invoice:", err);
    if (toastCallback) {
      toastCallback("Failed to generate invoice. Please try again.");
    }
  }
};
