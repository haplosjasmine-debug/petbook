import { Mail, Phone, Users } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import {
  DeleteStaffButton,
  StaffFormDialog,
} from "@/components/shop/staff-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { shopStaff } from "@/lib/queries";
import { requireShop } from "@/lib/session";
import { initials, titleCase } from "@/lib/utils";

export const metadata = { title: "Staff" };

export default async function ShopStaffPage() {
  const session = await requireShop();
  const staff = await shopStaff(session.shop!.id).catch(() => []);

  return (
    <>
      <PageHeader
        eyebrow="Team"
        title="Staff"
        description="Manage the people who care for your customers' pets."
        action={<StaffFormDialog label="Add staff" />}
      />

      {staff.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {staff.map((member) => (
            <Card key={member.id} className={member.active ? "" : "opacity-70"}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-100 text-lg font-black text-brand-700">
                    {initials(member.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black">{member.name}</h3>
                      <Badge variant={member.active ? "success" : "secondary"}>
                        {member.active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant={member.user ? "info" : "outline"}>
                        {member.user ? "Login enabled" : "No login"}
                      </Badge>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                      {titleCase(member.role)}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {member.bio || "No bio yet."}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {member.email ? (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" /> {member.email}
                        </span>
                      ) : null}
                      {member.phone ? (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" /> {member.phone}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end gap-1 border-t pt-3">
                  <StaffFormDialog member={member} label="Edit" variant="ghost" />
                  <DeleteStaffButton staffId={member.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No staff yet"
          description="Add your groomers, veterinarians, and assistants so customers can choose them."
          action={<StaffFormDialog label="Add your first staff member" />}
        />
      )}
    </>
  );
}
