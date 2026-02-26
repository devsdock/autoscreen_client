import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  CreditCard,
  Wallet,
  Calendar,
  Receipt,
  Download,
  Clock,
  RotateCcw,
  History,
} from "lucide-react";
import useDashboardStore, {
  formatDate,
  formatCurrency,
} from "../../store/useDashboardStore";
import paymentService from "../../services/paymentService";
import bookingService from "../../services/bookingService";
import { downloadInvoice } from "../../utils/invoiceUtils";
import { formatServiceType } from "../../utils/dataMappers";
import PageHeader from "../../components/ui/PageHeader";
import Card, {
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import StatusBadge from "../../components/ui/StatusBadge";
import Button from "../../components/ui/Button";
import Tabs from "../../components/ui/Tabs";
import Input from "../../components/ui/Input";
import EmptyState from "../../components/ui/EmptyState";
import PaymentModal from "../../components/dashboard/PaymentModal";
import { PaymentsSkeleton } from "../../components/skeletons/PageSkeleton";

const Payments = () => {
  const { addToast } = useDashboardStore();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch payments from new Payment API
  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const res = await paymentService.getMyPayments({
          search: searchQuery,
        });

        if (res.success && res.data) {
          // Data is already normalized by backend
          setPayments(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch payments", err);
        addToast({ type: "error", message: "Failed to load payments" });
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [addToast, searchQuery]);

  // Calculate summary stats
  const totalSpent = payments
    .filter((p) => p.status === "Paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingTotal = payments
    .filter((p) => p.status === "Unpaid")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalRefunded = payments
    .filter((p) => p.status === "Refunded")
    .reduce((sum, p) => sum + (p.refundAmount || p.amount), 0);
  const lastPaid = payments
    .filter((p) => p.status === "Paid")
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

  const tabs = [
    { value: "all", label: "All", count: payments.length },
    {
      value: "pending",
      label: "Pending",
      count: payments.filter(
        (p) => p.status === "Unpaid" || p.status === "Pending",
      ).length,
    },
    {
      value: "completed",
      label: "Completed",
      count: payments.filter((p) => p.status === "Paid").length,
    },
    {
      value: "refunded",
      label: "Refunded",
      count: payments.filter((p) => p.status === "Refunded").length,
    },
    // Note: 'pending' tab counts both Unpaid and Pending for simplicity in this frontend logic
  ];

  // Client-side filtering for display (redundant if server filters, but good for snappy UI if we loaded all)
  const filteredPayments = payments.filter((payment) => {
    // Tab filter
    if (
      activeTab === "pending" &&
      payment.status !== "Unpaid" &&
      payment.status !== "Pending"
    )
      return false;
    if (activeTab === "completed" && payment.status !== "Paid") return false;
    if (activeTab === "refunded" && payment.status !== "Refunded") return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        (payment.transactionId &&
          payment.transactionId.toLowerCase().includes(query)) ||
        payment.bookingRef.toLowerCase().includes(query) ||
        payment.service.toLowerCase().includes(query) ||
        payment.providerName.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Sort by date, most recent first
  const sortedPayments = [...filteredPayments].sort((a, b) => {
    const dateA = a.date || a.dueDate;
    const dateB = b.date || b.dueDate;
    return new Date(dateB) - new Date(dateA);
  });

  const handleDownloadReceipt = (payment) => {
    downloadInvoice(payment.bookingId, payment.bookingRef, (msg, type) =>
      addToast({ message: msg, type }),
    );
  };

  if (loading) {
    return <PaymentsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        subtitle="View payment history and pending invoices"
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Wallet}
          value={formatCurrency(totalSpent)}
          label="Total Spent"
          iconBgColor="bg-green-50 dark:bg-green-900/20"
          iconColor="text-green-600 dark:text-green-400"
        />
        <StatCard
          icon={Clock}
          value={formatCurrency(pendingTotal)}
          label="Pending Payments"
          iconBgColor="bg-amber-50 dark:bg-amber-900/20"
          iconColor="text-amber-600 dark:text-amber-400"
        />
        <StatCard
          icon={RotateCcw}
          value={formatCurrency(totalRefunded)}
          label="Total Refunded"
          iconBgColor="bg-red-50 dark:bg-red-900/20"
          iconColor="text-red-600 dark:text-red-400"
        />
        <StatCard
          icon={History}
          value={lastPaid ? formatDate(lastPaid.date) : "N/A"}
          label="Last Payment"
          iconBgColor="bg-blue-50 dark:bg-blue-900/20"
          iconColor="text-blue-600 dark:text-blue-400"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          variant="pills"
        />
        <Input
          placeholder="Search by ID, booking, service..."
          icon={Search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-64"
        />
      </div>

      {/* Payments List */}
      {sortedPayments.length === 0 ? (
        <EmptyState
          iconType="payments"
          title="No payments yet"
          description="Payments are created when you accept a quote and confirm a booking."
        />
      ) : (
        <Card padding={false}>
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">
                    Payment ID
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">
                    Booking
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">
                    Service
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">
                    Provider
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">
                    Amount
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">
                    Date
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">
                    Method
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">
                    Status
                  </th>
                  <th className="text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sortedPayments.map((payment, index) => (
                  <tr
                    key={payment.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span
                        className="font-mono text-sm text-slate-600 dark:text-slate-400"
                        title={payment.transactionId}
                      >
                        {payment.transactionId?.slice(0, 8)}...
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/dashboard/bookings/${payment.bookingId}`}
                        className="font-mono text-sm text-primary-600 hover:text-primary-700"
                      >
                        {payment.bookingRef}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-900 dark:text-white">
                        {formatServiceType(payment.service)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {payment.providerName}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {formatCurrency(payment.amount)}
                        </span>
                        {payment.status === "Refunded" &&
                          payment.refundAmount > 0 && (
                            <span className="text-[10px] text-red-600 dark:text-red-400 font-medium">
                              Refund: {formatCurrency(payment.refundAmount)}
                            </span>
                          )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {payment.date
                          ? formatDate(payment.date)
                          : `Due ${formatDate(payment.dueDate)}`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {payment.method && payment.method !== "—"
                          ? payment.method
                          : "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={payment.status} type="payment" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {payment.status === "Unpaid" && (
                        <Button
                          size="sm"
                          onClick={() => setSelectedPayment(payment)}
                        >
                          Pay Now
                        </Button>
                      )}
                      {payment.status === "Paid" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleDownloadReceipt(payment)}
                        >
                          <Download size={14} />
                          Receipt
                        </Button>
                      )}
                      {(payment.status === "Pending" ||
                        payment.status === "Refunded" ||
                        payment.status === "Cancelled") && (
                        <Link to={`/dashboard/bookings/${payment.bookingId}`}>
                          <Button size="sm" variant="ghost">
                            View
                          </Button>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {sortedPayments.map((payment, index) => (
              <div key={payment.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-sm text-slate-500 dark:text-slate-400">
                      #
                      {payment.transactionId?.slice(0, 8) ||
                        (index + 1).toString().padStart(2, "0")}
                    </span>
                    <p className="font-semibold text-slate-900 dark:text-white mt-1">
                      {formatServiceType(payment.service)}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {payment.providerName}
                    </p>
                  </div>
                  <StatusBadge status={payment.status} type="payment" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {payment.date
                        ? formatDate(payment.date)
                        : `Due ${formatDate(payment.dueDate)}`}
                    </p>
                  </div>
                  <div>
                    {payment.status === "Unpaid" && (
                      <Button
                        size="sm"
                        onClick={() => setSelectedPayment(payment)}
                      >
                        Pay Now
                      </Button>
                    )}
                    {payment.status === "Paid" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDownloadReceipt(payment)}
                      >
                        Receipt
                      </Button>
                    )}
                    {(payment.status === "Pending" ||
                      payment.status === "Refunded" ||
                      payment.status === "Cancelled") && (
                      <Link to={`/dashboard/bookings/${payment.bookingId}`}>
                        <Button size="sm" variant="ghost">
                          View
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Payment Modal */}
      <PaymentModal
        payment={selectedPayment}
        isOpen={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
        onSuccess={() => {
          // Re-fetch handled by effect usually, but we can optimistically update
          setPayments((prev) =>
            prev.map((p) =>
              p.id === selectedPayment.id ? { ...p, status: "Paid" } : p,
            ),
          );
        }}
      />
    </div>
  );
};

export default Payments;
