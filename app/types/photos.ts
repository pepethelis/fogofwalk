export interface PhotoEntry {
  id: string
  file: File
  takenAtMs: number
  lng: number
  lat: number
  objectUrl?: string
}

export interface PhotoGroup {
  id: string
  photos: PhotoEntry[]
  lng: number
  lat: number
}
