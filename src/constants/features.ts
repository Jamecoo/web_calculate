// Feature flags.
//
// STORAGE_ENABLED gates every feature that reads/writes image storage
// (profile avatar upload, trip payment-slip upload). Now using Cloudinary
// instead of Firebase Storage for better performance and easier setup.
export const STORAGE_ENABLED = true
