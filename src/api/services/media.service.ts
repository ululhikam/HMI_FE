import { endpoints } from '@/api/endpoints'
import { http } from '@/api/http'

export interface UploadResult {
  url: string
  filename: string
  size: number
}

export const mediaService = {
  upload(dataUrl: string, filename: string): Promise<UploadResult> {
    return http.post<UploadResult>(endpoints.media.upload, { data: dataUrl, filename })
  },
}
