import { Cloudinary } from "@cloudinary/url-gen";
import { auto } from "@cloudinary/url-gen/actions/resize";
import { autoGravity } from "@cloudinary/url-gen/qualifiers/gravity";

// Cloudinary configuration
export const CLOUD_NAME = "bfnmpuzf";
export const UPLOAD_PRESET = "splitzy_unsigned"; // Create this preset in Cloudinary Dashboard

// Initialize Cloudinary instance
export const cld = new Cloudinary({
  cloud: { cloudName: CLOUD_NAME },
});

// Get optimized image URL
export const getOptimizedImageUrl = (
  publicId: string,
  width: number = 200,
  height: number = 200
) => {
  return cld
    .image(publicId)
    .format("auto")
    .quality("auto")
    .resize(auto().gravity(autoGravity()).width(width).height(height))
    .toURL();
};

// Get avatar image URL
export const getAvatarUrl = (publicId: string, size: number = 150) => {
  return cld
    .image(publicId)
    .format("auto")
    .quality("auto")
    .resize(auto().gravity(autoGravity()).width(size).height(size))
    .toURL();
};

// Upload image to Cloudinary
export const uploadToCloudinary = async (
  file: File,
  folder: string = "splitzy"
): Promise<{ publicId: string; url: string }> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Failed to upload image to Cloudinary");
  }

  const data = await response.json();
  return {
    publicId: data.public_id,
    url: data.secure_url,
  };
};

// Upload profile avatar
export const uploadAvatar = async (
  file: File,
  userId: string
): Promise<{ publicId: string; url: string }> => {
  return uploadToCloudinary(file, `splitzy/avatars/${userId}`);
};

// Upload payment slip
export const uploadSlip = async (
  file: File,
  tripId: string
): Promise<{ publicId: string; url: string }> => {
  return uploadToCloudinary(file, `splitzy/slips/${tripId}`);
};
