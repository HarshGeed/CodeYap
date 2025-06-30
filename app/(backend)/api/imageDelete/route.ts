import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const POST = async (req: Request) => {
  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
    }

    // Extract the public ID from the image URL
    const publicId = extractPublicId(imageUrl);
    console.log("This is the public id", publicId);

    if (!publicId) {
      return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
    }

    // Delete the image from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== "ok") {
      return NextResponse.json({ error: "Failed to delete image" }, { status: 500 });
    }

    return NextResponse.json({ message: "Image deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting image:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
};

// Helper function to extract the public ID from the Cloudinary URL
const extractPublicId = (url: string): string | null => {
  try {
    // Find the part after '/upload/' and before the file extension
    const uploadIndex = url.indexOf("/upload/");
    if (uploadIndex === -1) return null;
    let publicIdWithExtension = url.substring(uploadIndex + 8); // 8 = length of '/upload/'
    // Remove version if present (e.g., v1751256491/)
    publicIdWithExtension = publicIdWithExtension.replace(/^v\d+\//, "");
    // Remove query params if any
    publicIdWithExtension = publicIdWithExtension.split("?")[0];
    // Remove file extension
    const lastDot = publicIdWithExtension.lastIndexOf(".");
    if (lastDot === -1) return publicIdWithExtension;
    return publicIdWithExtension.substring(0, lastDot);
  } catch (error) {
    console.error("Error extracting public ID:", error);
    return null;
  }
};