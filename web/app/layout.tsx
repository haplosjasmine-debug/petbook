import type { Metadata } from "next";
import { Toaster } from "sonner";
import "leaflet/dist/leaflet.css";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: {
    default: "PetBook — Calm, caring pet appointments",
    template: "%s · PetBook",
  },
  description:
    "Book trusted pet groomers and veterinarians, keep pet records in one place, and never miss a reminder.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
