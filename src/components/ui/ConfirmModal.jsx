import { AlertTriangle, Trash2, X as XIcon } from 'lucide-react';
import Modal, { ModalActions } from './Modal';
import Button from './Button';

const iconMap = {
  warning: AlertTriangle,
  danger: Trash2,
  info: AlertTriangle
};

const colorMap = {
  warning: 'bg-amber-100 text-amber-600',
  danger: 'bg-red-100 text-red-600',
  info: 'bg-blue-100 text-blue-600'
};

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  type = 'warning',
  loading = false
}) => {
  const Icon = iconMap[type];
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center">
        <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${colorMap[type]}`}>
          <Icon size={24} />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
        {message && (
          <p className="mt-2 text-sm text-slate-500">{message}</p>
        )}
      </div>
      <ModalActions className="justify-center">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button 
          variant={type === 'danger' ? 'danger' : 'primary'} 
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'Processing...' : confirmLabel}
        </Button>
      </ModalActions>
    </Modal>
  );
};

export default ConfirmModal;

