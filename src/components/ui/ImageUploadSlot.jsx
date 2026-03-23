import { useRef } from "react";
import { Trash2 } from "lucide-react";

export default function ImageUploadSlot({
  icon: Icon,
  illustration,
  label,
  description,
  image,
  images,
  onUpload,
  onRemove,
  error,
  multiple = false,
}) {
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          onUpload({
            id: Date.now() + Math.random(),
            data: reader.result,
            name: file.name,
          });
        };
        reader.readAsDataURL(file);
      }
    });
    if (inputRef.current) inputRef.current.value = "";
  };

  // Single-image mode
  if (!multiple) {
    return (
      <div>
        <div
          onClick={() => !image && inputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-4 sm:p-5 text-center transition-all ${
            image
              ? "border-primary-400/30 dark:border-primary-500/30 bg-primary-50/50 dark:bg-primary-900/10"
              : error
                ? "border-red-300 dark:border-red-500/50 hover:border-red-400 cursor-pointer"
                : "border-slate-200 dark:border-slate-700 hover:border-primary-400/50 dark:hover:border-primary-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
          }`}
        >
          {image ? (
            <div>
              <div className="w-full h-28 sm:h-32 rounded-lg overflow-hidden">
                <img
                  src={image.data}
                  alt={image.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex gap-2 mt-2 justify-center">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="text-xs text-primary-600 dark:text-primary-400 font-medium hover:underline"
                >
                  Replace
                </button>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <button
                  type="button"
                  onClick={onRemove}
                  className="text-xs text-red-500 font-medium hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <>
              {illustration ? (
                <img src={illustration} alt={label} className="h-16 sm:h-20 mx-auto mb-2 object-contain" />
              ) : Icon ? (
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-2">
                  <Icon size={20} className="text-slate-400 dark:text-slate-500" />
                </div>
              ) : null}
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {label}
              </p>
              {description && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  {description}
                </p>
              )}
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                Click to upload
              </p>
            </>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
      </div>
    );
  }

  // Multi-image mode
  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-4 sm:p-5 text-center cursor-pointer transition-all ${
          error
            ? "border-red-300 dark:border-red-500/50 hover:border-red-400"
            : "border-slate-200 dark:border-slate-700 hover:border-primary-400/50 dark:hover:border-primary-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/50"
        }`}
      >
        {illustration ? (
          <img src={illustration} alt={label} className="h-16 sm:h-20 mx-auto mb-2 object-contain" />
        ) : Icon ? (
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-2">
            <Icon size={20} className="text-slate-400 dark:text-slate-500" />
          </div>
        ) : null}
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </p>
        {description && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            {description}
          </p>
        )}
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
          {images?.length ? "Click to add more" : "Click to upload"}
        </p>
      </div>
      {images?.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-3">
          {images.map((img) => (
            <div key={img.id} className="relative group">
              <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm transition-transform group-hover:scale-105">
                <img
                  src={img.data}
                  alt={img.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => onRemove(img.id)}
                className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
      {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
    </div>
  );
}
