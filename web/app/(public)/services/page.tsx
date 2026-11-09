import Link from "next/link";
import { Scissors, Search, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ServiceCard } from "@/components/service-card";
import { getPublicServices } from "@/lib/public-data";

export const metadata = { title: "Services" };

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const search = params.search?.trim() ?? "";
  const services = await getPublicServices(search);

  return (
    <section className="page-shell py-12">
      <div className="rounded-[2rem] bg-secondary/70 px-6 py-10 sm:px-10">
        <p className="eyebrow">Services</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">Care for every kind of pet</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Browse grooming, veterinary, and package services from verified PetBook partners.
        </p>
        <form action="/services" className="mt-6 flex max-w-2xl flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="search"
              defaultValue={search}
              placeholder="Search services, e.g. grooming"
              className="h-11 bg-white pl-10"
            />
          </div>
          <Button type="submit" className="h-11">
            Search
          </Button>
        </form>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Scissors, title: "Grooming", text: "Baths, haircuts, nail care" },
          { icon: Stethoscope, title: "Veterinary", text: "Checkups, vaccines, dental" },
          { icon: Search, title: "Packages", text: "Bundle sessions and save" },
        ].map((item) => (
          <Card key={item.title}>
            <CardContent className="flex items-center gap-3 p-4">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <item.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-black">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.text}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-black">
            {search ? `Results for “${search}”` : "All services"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {services.length} {services.length === 1 ? "service" : "services"} available
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/shops">Browse shops</Link>
        </Button>
      </div>

      {services.length ? (
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      ) : (
        <Card className="mt-6 border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <Search className="h-8 w-8 text-brand-600" />
            <h3 className="text-lg font-bold">No services found</h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Try a different search or browse partner shops to see what is available.
            </p>
            <Button asChild variant="outline" className="mt-2">
              <Link href="/services">Clear search</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
