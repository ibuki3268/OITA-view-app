import { supabase } from './supabase'

/**
 * Supabaseから全ての写真を取得
 */
export async function getAllPhotos() {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching photos:', error)
    return []
  }
  return data || []
}

/**
 * 上位の写真を取得（total_view_time順）
 */
export async function getTopPhotos(limit: number = 5) {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .order('total_view_time', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching top photos:', error)
    return []
  }
  return data || []
}

/**
 * 写真の視聴時間を更新するRPCを呼び出し
 */
export async function recordViewTime(photoId: string, duration: number) {
  const { error } = await supabase.rpc('increment_view_time', {
    p_photo_id: photoId,
    p_duration: duration,
  })

  if (error) {
    console.error('Error recording view time:', error)
    return false
  }
  return true
}

/**
 * 新しい写真をアップロード
 */
export async function uploadPhoto(file: File): Promise<string | null> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}.${fileExt}`
  const filePath = `photos/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('photos')
    .upload(filePath, file, { upsert: true })

  if (uploadError) {
    console.error('Error uploading photo:', uploadError)
    return null
  }

  const { data: publicUrlData } = supabase.storage
    .from('photos')
    .getPublicUrl(filePath)

  return publicUrlData.publicUrl
}

/**
 * 新しい写真をDBに保存
 */
export async function savePhotoToDb(imageUrl: string) {
  const { data, error } = await supabase
    .from('photos')
    .insert([{ image_url: imageUrl, total_view_time: 0 }])
    .select()

  if (error) {
    console.error('Error saving photo:', error)
    return null
  }
  return data?.[0] || null
}
