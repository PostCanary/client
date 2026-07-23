import { del_, get, postJson, postMultipart } from "@/api/http";
import type { UploadedDesignAsset } from "@/types/campaign";

export interface DesignAsset {
  url: string;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  width_px: number | null;
  height_px: number | null;
}

export interface DesignLibraryEntry {
  id: string;
  name: string;
  front_asset: DesignAsset;
  back_asset: DesignAsset | null;
  blank_back: boolean;
  uploaded_asset: UploadedDesignAsset;
  created_at: string;
  updated_at: string;
}

interface DesignUploadResponse {
  asset_id: string;
  url: string;
  mime_type: string;
  file_size_bytes: number;
  width_px: number | null;
  height_px: number | null;
}

export interface CreateDesignInput {
  name: string;
  front_asset: DesignAsset;
  back_asset: DesignAsset | null;
  blank_back: boolean;
}

export async function uploadDesignAsset(file: File): Promise<DesignAsset> {
  const form = new FormData();
  form.append("file", file);
  const uploaded = await postMultipart<DesignUploadResponse>("/api/design-uploads", form);
  return {
    url: uploaded.url,
    file_name: file.name,
    mime_type: uploaded.mime_type,
    file_size_bytes: uploaded.file_size_bytes,
    width_px: uploaded.width_px,
    height_px: uploaded.height_px,
  };
}

export async function listDesigns(): Promise<DesignLibraryEntry[]> {
  const response = await get<{ designs: DesignLibraryEntry[] }>("/api/designs");
  return response.designs ?? [];
}

export async function getDesign(id: string): Promise<DesignLibraryEntry> {
  const response = await get<{ design: DesignLibraryEntry }>(`/api/designs/${id}`);
  return response.design;
}

export async function createDesign(input: CreateDesignInput): Promise<DesignLibraryEntry> {
  const response = await postJson<{ design: DesignLibraryEntry }>("/api/designs", input);
  return response.design;
}

export async function deleteDesign(id: string): Promise<void> {
  await del_(`/api/designs/${id}`);
}
