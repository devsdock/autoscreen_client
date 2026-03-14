import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import useDashboardStore from "../../store/useDashboardStore";
import QuoteDetailPanel from "../../components/dashboard/QuoteDetailPanel";

const QuoteDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { quotes, fetchQuotes, fetchQuoteDetails, addToast } = useDashboardStore();
  const [isLoading, setIsLoading] = useState(false);

  // Ensure quotes are loaded
  useEffect(() => {
    if (quotes.length === 0) {
      fetchQuotes();
    }
  }, [quotes.length, fetchQuotes]);

  // Fetch specific quote details
  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const found = quotes.find((q) => q.id === id);
      if (!found) {
        setIsLoading(true);
        const fetched = await fetchQuoteDetails(id);
        if (!fetched) {
          addToast("Quote not found or belongs to a different account.", "error");
          navigate("/dashboard/quotes", { replace: true });
        }
        setIsLoading(false);
      }
    };
    load();
  }, [id, quotes, fetchQuoteDetails, addToast, navigate]);

  const quote = quotes.find((q) => q.id === id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Back navigation */}
      <button
        onClick={() => navigate("/dashboard/quotes")}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-4 self-start"
      >
        <ArrowLeft size={16} />
        Back to Quote Requests
      </button>

      {/* Detail content */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <QuoteDetailPanel
          quote={quote || null}
          onClose={() => navigate("/dashboard/quotes")}
        />
      </div>
    </div>
  );
};

export default QuoteDetailPage;
