import { AdminSupportInbox } from "@/components/admin/support-inbox";

export default function AdminSupportPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Customer Support</h1>
        <p className="mt-1 text-sm text-muted-foreground">In-app conversations with clients. Replies notify the client instantly.</p>
      </div>
      <AdminSupportInbox />
    </div>
  );
}
