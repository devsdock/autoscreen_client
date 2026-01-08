import { useState } from 'react';
import { Star, MessageSquare, Loader2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

const ReviewModal = ({ isOpen, onClose, onSubmit, booking, isLoading }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (rating === 0) return;
    onSubmit({ score: rating, review: comment });
  };

  const handleClose = () => {
    setRating(0);
    setComment('');
    onClose();
  };

  if (!booking) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Submit a Review"
      size="md"
    >
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Star size={32} className="text-primary-600 dark:text-primary-400 fill-current" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Rate your experience
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            How was the service provided by <span className="font-semibold text-slate-700 dark:text-slate-300">{booking.providerName}</span>?
          </p>
        </div>

        {/* Star Rating */}
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="p-1 transition-transform active:scale-95 focus:outline-none"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
            >
              <Star
                size={40}
                className={`
                  transition-colors duration-200
                  ${(hoverRating || rating) >= star 
                    ? 'text-amber-400 fill-amber-400' 
                    : 'text-slate-200 dark:text-slate-700'
                  }
                `}
              />
            </button>
          ))}
        </div>

        {/* Comment Box */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <MessageSquare size={16} className="text-slate-400" />
            Your feedback (Optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us what you liked or how they can improve..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={rating === 0 || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={18} />
                Submitting...
              </>
            ) : (
              'Submit Review'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ReviewModal;
