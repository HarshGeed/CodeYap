import { NextRequest, NextResponse } from "next/server";
import cloudinary from "cloudinary";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export const POST = async (req: NextRequest) => {
  try{
  const formData = await req.formData();
  const files = formData.getAll("file");

  if (!files || !Array.isArray(files) || files.length === 0) {
    return NextResponse.json(
      { error: "No valid file uploaded" },
      { status: 400 }
    );
  }

  const urls: string[] = [];

  for (const file of files) {
    if (!(file instanceof File)) continue;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await new Promise<cloudinary.UploadApiResponse>(
      (resolve, reject) => {
        const stream = cloudinary.v2.uploader.upload_stream(
          {
            folder: "CodeYap_Data",
            resource_type: "auto", // handles image/video/etc
          },
          (error, result) => {
            if (error || !result) reject(error);
            else resolve(result);
          }
        );

        stream.end(buffer);
      }
    );
    urls.push(result.secure_url);
  }

  return NextResponse.json({ urls }, { status: 200 });
}catch(error){
  console.log(error);
}
};