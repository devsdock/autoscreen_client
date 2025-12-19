import Button from './Button';

const PageHeader = ({
  title,
  subtitle,
  actionLabel,
  actionIcon: ActionIcon,
  onAction,
  secondaryActionLabel,
  secondaryActionIcon: SecondaryActionIcon,
  onSecondaryAction,
  children,
  className = ''
}) => {
  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {subtitle && (
            <p className="text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>
        {(actionLabel || secondaryActionLabel || children) && (
          <div className="flex items-center gap-3 flex-shrink-0">
            {secondaryActionLabel && (
              <Button variant="secondary" onClick={onSecondaryAction}>
                {SecondaryActionIcon && <SecondaryActionIcon size={18} />}
                {secondaryActionLabel}
              </Button>
            )}
            {actionLabel && (
              <Button onClick={onAction}>
                {ActionIcon && <ActionIcon size={18} />}
                {actionLabel}
              </Button>
            )}
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;


