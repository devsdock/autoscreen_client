import bookingService from "../services/bookingService";

export const downloadInvoice = async (bookingId, toastCallback) => {
  try {
    const res = await bookingService.getInvoice(bookingId);
    if (res.success && res.data) {
      // Create a printable view of the invoice
      const invoice = res.data;
      const printWindow = window.open("", "_blank");
      printWindow.document.write(`
          <html>
            <head>
              <title>Invoice ${invoice.invoiceNumber}</title>
              <style>
                body { font-family: sans-serif; padding: 40px; color: #333; }
                .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
                .logo { font-size: 24px; font-weight: bold; color: #3b82f6; }
                .title { font-size: 28px; font-weight: bold; margin: 0; }
                .details { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
                .section-title { font-size: 14px; text-transform: uppercase; color: #666; margin-bottom: 10px; border-bottom: 1px solid #eee; }
                .table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
                .table th { text-align: left; padding: 12px; border-bottom: 2px solid #eee; background: #f9fafb; font-size: 14px; }
                .table th:first-child { width: 40%; }
                .table td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; }
                .totals { float: right; width: 300px; }
                .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
                .grand-total { border-top: 2px solid #3b82f6; margin-top: 10px; padding-top: 10px; font-weight: bold; font-size: 18px; color: #3b82f6; }
                .footer { margin-top: 100px; text-align: center; font-size: 12px; color: #999; }
                @media print { .no-print { display: none; } }
              </style>
            </head>
            <body>
              <div class="no-print" style="margin-bottom: 20px; text-align: right;">
                <button onclick="window.print()" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">Print Invoice</button>
              </div>
              <div class="header">
                <div>
                  <div class="logo">AutoScreen</div>
                  <div>Quality Auto Glass Services</div>
                </div>
                <div style="text-align: right;">
                  <h1 class="title">INVOICE</h1>
                  <div>${invoice.invoiceNumber}</div>
                  <div>Date: ${new Date(
                    invoice.date
                  ).toLocaleDateString()}</div>
                </div>
              </div>

              <div class="details">
                <div>
                  <div class="section-title">Billed To</div>
                  <div style="font-weight: bold;">${invoice.customer.name}</div>
                  <div>${invoice.customer.email || ""}</div>
                  <div>${invoice.customer.phone || ""}</div>
                </div>
                <div style="text-align: right;">
                  <div class="section-title">Provider</div>
                  <div style="font-weight: bold;">${
                    invoice.provider?.name || "AutoScreen Provider"
                  }</div>

                </div>
              </div>

              <table class="table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th style="text-align: center;">Qty</th>
                    <th style="text-align: right;">Unit Price</th>
                    <th style="text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoice.items
                    .map(
                      (item) => `
                    <tr>
                      <td>${item.description}</td>
                      <td style="text-align: center;">${item.quantity}</td>
                      <td style="text-align: right;">R${item.unitPrice.toFixed(
                        2
                      )}</td>
                      <td style="text-align: right;">R${item.amount.toFixed(
                        2
                      )}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>

              <div class="totals">
                <div class="total-row">
                  <span>Subtotal</span>
                  <span>R${invoice.totals.subtotal.toFixed(2)}</span>
                </div>
                ${
                  invoice.totals.vat > 0
                    ? `
                <div class="total-row">
                  <span>VAT</span>
                  <span>R${invoice.totals.vat.toFixed(2)}</span>
                </div>
                `
                    : ""
                }
                <div class="total-row grand-total">
                  <span>Total Amount</span>
                  <span>R${invoice.totals.total.toFixed(2)}</span>
                </div>
                <div style="margin-top: 20px; font-size: 14px;">
                  <div><strong>Payment Status:</strong> ${invoice.status.toUpperCase()}</div>
                  ${
                    invoice.paymentReference
                      ? `<div><strong>Reference:</strong> ${invoice.paymentReference}</div>`
                      : ""
                  }
                </div>
              </div>

              <div class="footer">
                <p>Thank you for choosing AutoScreen for your auto glass needs.</p>
                <p>&copy; ${new Date().getFullYear()} AutoScreen South Africa. All rights reserved.</p>
              </div>
            </body>
          </html>
        `);
      printWindow.document.close();
    }
  } catch (err) {
    console.error("Failed to download invoice:", err);
    if (toastCallback) {
      toastCallback("Failed to generate invoice");
    }
  }
};
