import { ExternalLink, Store } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ShopSettingsForm } from "@/components/shop/shop-settings-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { directusAdminUrl } from "@/lib/config";
import { directusFileUrl } from "@/lib/directus";
import { requireShop } from "@/lib/session";

export const metadata = { title: "Shop settings" };

export default async function ShopSettingsPage() {
  const session = await requireShop();
  const shop = session.shop!;

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Shop settings"
        description="Keep your public profile and contact details up to date."
      />

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Store className="h-4 w-4 text-brand-600" /> Public profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ShopSettingsForm shop={shop} logoUrl={directusFileUrl(shop.logo)} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Shop slug</span>
                <span className="font-mono text-xs font-semibold">{shop.slug}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={shop.active ? "success" : "secondary"}>
                  {shop.active ? "Active" : "Paused"}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Featured</span>
                <span className="font-semibold">{shop.featured ? "Yes" : "No"}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Content & media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Cover images, announcements, and homepage content are managed in Directus. Shop
                owners can request content changes through the platform team.
              </p>
              <Button asChild variant="outline" size="sm" className="w-full">
                <a href={directusAdminUrl()} target="_blank" rel="noreferrer">
                  Open Directus admin <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
