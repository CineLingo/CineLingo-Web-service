import { createBrowserClient } from "@supabase/ssr";

// Supabase upload response type (storage upload)
type SupabaseUploadResponse = {
  filePath: string;
  publicUrl: string;
  error?: string;
};

// Supabase delete response type
type SupabaseDeleteResponse = {
  success: boolean;
  error?: string;
};

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Export a default client instance for convenience
export const supabase = createClient();

/**
 * Upload audio file to Supabase Storage
 * @param file - The audio file to upload
 * @param fileName - Optional custom filename, defaults to file.name
 * @returns Promise with file path and public URL
 */
export async function uploadAudioFile(
  file: File,
  fileName?: string
): Promise<SupabaseUploadResponse> {
  try {
    const client = createClient();
    const bucketName = "prototype";

    // Generate unique filename if not provided
    const finalFileName = fileName || `${Date.now()}-${file.name}`;

    // Upload file to Supabase Storage
    const uploadResult = await client.storage
      .from(bucketName)
      .upload(finalFileName, file, {
        cacheControl: "3600",
        upsert: false
      });

    if (uploadResult.error) {
      return { filePath: '', publicUrl: '', error: uploadResult.error.message };
    }

    // Get public URL for the uploaded file
    const publicUrlData = client.storage
      .from(bucketName)
      .getPublicUrl(finalFileName);

    return {
      filePath: finalFileName,
      publicUrl: publicUrlData.data.publicUrl
    };
  } catch (error) {
    return {
      filePath: "",
      publicUrl: "",
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}

/**
 * Delete audio file from Supabase Storage
 * @param fileName - The filename to delete
 * @returns Promise with success status
 */
export async function deleteAudioFile(
  fileName: string
): Promise<SupabaseDeleteResponse> {
  try {
    const client = createClient();
    const bucketName = "prototype";

    const deleteResult = await client.storage
      .from(bucketName)
      .remove([fileName]);

    if (deleteResult.error) {
      return { success: false, error: deleteResult.error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}
