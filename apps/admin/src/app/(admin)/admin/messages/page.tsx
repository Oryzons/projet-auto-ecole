import { Suspense } from "react";

import { AdminMessagingView } from "@/components/messages/admin-messaging-view";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = { title: "Messages" };

export default function AdminMessagesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[calc(100svh-9rem)] rounded-2xl" />}>
      <AdminMessagingView />
    </Suspense>
  );
}
