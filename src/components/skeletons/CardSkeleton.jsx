import { Skeleton } from "../ui/Skeleton";
import Card from "../ui/Card";

export const CardSkeleton = ({ count = 3 }) => {
    return (
        <div className="grid gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <Card key={i} className="border border-gray-100 dark:border-gray-800">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-6 w-20 rounded-full" />
                                <Skeleton className="h-6 w-20 rounded-full" />
                            </div>

                            <div className="space-y-2">
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-4 w-32" />
                            </div>

                            <div className="flex items-center gap-4">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-4" />
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-4" />
                                <Skeleton className="h-4 w-16" />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Skeleton className="h-10 w-24 rounded-lg" />
                            <Skeleton className="h-10 w-24 rounded-lg" />
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
};

/**
 * QuoteCardSkeleton — matches the QuoteCard layout (gradient header + body + footer)
 */
export const QuoteCardSkeleton = ({ count = 2 }) => {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-md"
                >
                    {/* Header shimmer */}
                    <div className="bg-slate-200 dark:bg-slate-700 px-5 py-4 flex items-center gap-3">
                        <Skeleton className="w-11 h-11 rounded-xl !bg-slate-300 dark:!bg-slate-600" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-40 !bg-slate-300 dark:!bg-slate-600" />
                            <Skeleton className="h-3 w-20 !bg-slate-300 dark:!bg-slate-600" />
                        </div>
                        <div className="text-right space-y-2">
                            <Skeleton className="h-5 w-16 rounded-full !bg-slate-300 dark:!bg-slate-600" />
                            <Skeleton className="h-3 w-24 !bg-slate-300 dark:!bg-slate-600" />
                        </div>
                    </div>

                    {/* Body shimmer */}
                    <div className="px-5 py-4 bg-white dark:bg-slate-800 flex flex-wrap gap-x-6 gap-y-3">
                        {[1, 2, 3, 4].map((col) => (
                            <div key={col} className="flex-1 min-w-[120px] space-y-2">
                                <Skeleton className="h-3 w-16" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        ))}
                    </div>

                    {/* Footer shimmer */}
                    <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-8 w-28 rounded-lg" />
                    </div>
                </div>
            ))}
        </div>
    );
};
