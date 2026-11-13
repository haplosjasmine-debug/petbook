import { NextResponse } from "next/server";
import { customerSession, unauthorized } from "@/lib/authz";
import { directusFileUrl, DirectusError, uploadDirectusFile } from "@/lib/directus";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await customerSession();
  if (!session) return unauthorized();

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Choose an image to upload." }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ message: "Only image files can be uploaded." }, { status: 400 });
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { message: "Images must be smaller than 8 MB." },
        { status: 400 }
      );
    }

    const uploaded = await uploadDirectusFile(file);
    return NextResponse.json(
      { id: uploaded.id, url: directusFileUrl(uploaded.id) },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof DirectusError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Unable to upload the image." }, { status: 500 });
  }
}
