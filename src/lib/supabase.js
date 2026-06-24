import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('Missing Supabase env vars. Check your .env file.')
}

export const supabase = createClient(url, key)

// Upload a file to the public project-assets bucket, return its public URL.
export async function uploadAsset(file, path) {
  const { error } = await supabase.storage
    .from('project-assets')
    .upload(path, file, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('project-assets').getPublicUrl(path)
  return data.publicUrl
}
