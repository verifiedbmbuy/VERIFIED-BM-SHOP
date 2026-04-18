export interface LocalMediaUploadParams {
  file: File;
  pathPrefix?: string;
  slug?: string;
  fileName?: string;
  altText?: string;
  caption?: string;
  description?: string;
  width?: number;
  height?: number;
}

export interface LocalMediaFile {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  width: number | null;
  height: number | null;
  alt_text: string;
  caption: string;
  description?: string;
  url: string;
  url_slug: string | null;
  created_at: string;
}

export const uploadLocalMedia = async ({
  file,
  pathPrefix = "",
  slug,
  fileName,
  altText = "",
  caption = "",
  description = "",
  width,
  height,
}: LocalMediaUploadParams): Promise<LocalMediaFile> => {
  const formData = new FormData();
  formData.append("file", file, file.name);
  if (pathPrefix) formData.append("pathPrefix", pathPrefix);
  if (slug) formData.append("slug", slug);
  if (fileName) formData.append("fileName", fileName);
  formData.append("altText", altText);
  formData.append("caption", caption);
  formData.append("description", description);
  if (typeof width === "number") formData.append("width", String(width));
  if (typeof height === "number") formData.append("height", String(height));

  const response = await fetch("/media-local.php?action=upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload local media file.");
  }

  const payload = await response.json();
  if (!payload?.file) {
    throw new Error("Invalid local media upload response.");
  }

  return payload.file as LocalMediaFile;
};
