export interface Photo {
  id: string
  image_url: string
  total_view_time: number
  created_at: string
}

export interface ViewLog {
  id: number
  photo_id: string
  duration: number
  created_at: string
}

export interface ViewState {
  currentPhotoId: string | null
  startTime: number
  faceDetected: boolean
}
