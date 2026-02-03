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
