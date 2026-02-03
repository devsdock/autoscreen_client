import { Skeleton } from "../ui/Skeleton";
import Card from "../ui/Card";

export const ProfileSkeleton = () => {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Card>
                <div className="flex flex-col md:flex-row items-center gap-6 p-6">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <div className="flex-1 space-y-3 w-full">
                        <div className="flex justify-between items-start">
                            <div className="space-y-2 w-full">
                                <Skeleton className="h-8 w-48" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                            <Skeleton className="h-8 w-24" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                        </div>
                    </div>
                </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                <Card className="h-full">
                    <div className="p-6 space-y-4">
                        <Skeleton className="h-6 w-32 mb-4" />
                        <div className="space-y-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                <Card className="h-full">
                    <div className="p-6 space-y-4">
                        <Skeleton className="h-6 w-32 mb-4" />
                        <div className="space-y-4">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};
