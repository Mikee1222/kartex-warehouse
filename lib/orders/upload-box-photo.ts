import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "order-photos";

export async function uploadBoxPhoto(
  supabase: SupabaseClient,
  orderId: string,
  boxNumber: number,
  file: File,
): Promise<{ publicUrl: string }> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp", "heic"].includes(ext)
    ? ext
    : "jpg";
  const fileName = `orders/${orderId}/box-${boxNumber}-${Date.now()}.${safeExt}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || `image/${safeExt}`,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(fileName);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error: insertError } = await supabase.from("order_photos").insert({
    order_id: orderId,
    photo_url: publicUrl,
    photo_type: "box",
    box_number: boxNumber,
    created_by: user?.id ?? null,
  });

  if (insertError) {
    throw new Error(insertError.message);
  }

  return { publicUrl };
}
