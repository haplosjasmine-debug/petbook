import { Images, PawPrint } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import {
  DeleteGalleryButton,
  GalleryFormDialog,
} from "@/components/shop/gallery-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { shopGallery } from "@/lib/queries";
import { requireShop } from "@/lib/session";

export const metadata = { title: "Gallery" };

export default async function ShopGalleryPage() {
  const session = await requireShop();
  const items = await shopGallery(session.shop!.id).catch(() => []);

  return (
    <>
      <PageHeader
        eyebrow="Happy customers"
        title="Gallery"
        description="Compile your best customer photos so pet parents can see the care behind every visit."
        action={<GalleryFormDialog label="Add photo" />}
      />

      {items.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} className={item.active ? "overflow-hidden" : "overflow-hidden opacity-70"}>
              <div className="relative aspect-[4/3] bg-brand-50">
                <img
                  src={item.image_url}
                  alt={item.caption || "Happy customer"}
                  className="h-full w-full object-cover"
                />
                <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                  <Badge variant={item.active ? "success" : "secondary"}>
                    {item.active ? "Visible" : "Hidden"}
                  </Badge>
                  {item.featured ? <Badge variant="secondary">Homepage</Badge> : null}
                </div>
              </div>
              <CardContent className="p-4">
                <p className="line-clamp-2 text-sm font-bold">
                  {item.caption || "A very happy customer."}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <PawPrint className="h-3.5 w-3.5 text-brand-600" />
                  {[item.pet_name, item.customer_name].filter(Boolean).join(" - ") ||
                    "Happy customer"}
                </p>
                <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3">
                  <GalleryFormDialog item={item} label="Edit" variant="ghost" />
                  <DeleteGalleryButton itemId={item.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Images}
          title="No gallery photos yet"
          description="Add your first happy customer photo. A small compilation builds trust fast."
          action={<GalleryFormDialog label="Add your first photo" />}
        />
      )}

      <Card className="mt-6 border-dashed bg-white/60">
        <CardContent className="flex flex-col gap-3 p-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            Featured photos can show up on the PetBook homepage. Hidden photos stay in your
            workspace but are not shown to customers.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
