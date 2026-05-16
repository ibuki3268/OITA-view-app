'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { uploadPhoto, savePhotoToDb } from '@/lib/api'

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cameraActive, setCameraActive] = useState(false)

  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  // ファイル選択時の処理
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      setError(null)
    }
  }

  // カメラ起動
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraActive(true)
      }
    } catch (error) {
      setError('カメラへのアクセスが拒否されました')
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
  }

  // 写真撮影
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    const video = videoRef.current
    canvasRef.current.width = video.videoWidth
    canvasRef.current.height = video.videoHeight
    ctx.drawImage(video, 0, 0)

    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' })
        setSelectedFile(file)
        setPreview(canvasRef.current!.toDataURL())
        stopCamera()
      }
    }, 'image/jpeg', 0.85)
  }

  // アップロード処理
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      setError('写真を選択してください')
      return
    }

    setUploading(true)
    setError(null)

    try {
      // Storageにアップロード
      const imageUrl = await uploadPhoto(selectedFile)
      if (!imageUrl) {
        throw new Error('画像のアップロードに失敗しました')
      }

      // DBに保存
      const savedPhoto = await savePhotoToDb(imageUrl)
      if (!savedPhoto) {
        throw new Error('写真の保存に失敗しました。SupabaseのRLSポリシーを確認してください')
      }

      setSuccess(true)
      setSelectedFile(null)
      setPreview(null)

      // 5秒後にフォームをリセット
      setTimeout(() => {
        setSuccess(false)
      }, 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-amber-50 px-4 py-6 flex items-center justify-center">
      <div className="w-full max-w-xl rounded-3xl bg-white/90 p-6 shadow-2xl ring-1 ring-black/5 backdrop-blur sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Upload</p>
            <h1 className="mt-1 text-3xl font-bold text-zinc-900">写真を投稿</h1>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              見入った地元の魅力を、その場でギャラリーに追加できます。
            </p>
          </div>
          <Link
            href="/"
            className="shrink-0 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
          >
            サイネージへ戻る
          </Link>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            ✓ ギャラリーに追加されました！
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4">
          {/* プレビュー */}
          {preview && (
            <div className="mb-4 overflow-hidden rounded-2xl bg-zinc-100 shadow-sm">
              <div className="relative aspect-[4/3] w-full">
                <img
                  src={preview}
                  alt="Preview"
                  className="absolute inset-0 h-full w-full object-contain"
                />
              </div>
            </div>
          )}

          {/* カメラプレビュー */}
          {cameraActive && (
            <div className="mb-4 relative overflow-hidden rounded-2xl bg-black aspect-[4/3]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={capturePhoto}
                className="absolute bottom-2 right-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold"
              >
                📷 撮影
              </button>
            </div>
          )}

          {/* ボタングループ */}
          <div className="space-y-3">
            {!cameraActive && !preview && (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-lg font-semibold transition"
                >
                  📁 アルバムから選択
                </button>
                <button
                  type="button"
                  onClick={startCamera}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition"
                >
                  📷 カメラで撮影
                </button>
              </>
            )}

            {(preview || cameraActive) && (
              <>
                <button
                  type="submit"
                  disabled={uploading || !preview}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold transition"
                >
                  {uploading ? '投稿中...' : '✓ 投稿する'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreview(null)
                    setSelectedFile(null)
                    stopCamera()
                  }}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition"
                >
                  ✕ キャンセル
                </button>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </form>

        <canvas ref={canvasRef} className="hidden" />

        <p className="text-xs text-gray-500 text-center mt-6">
          写真はギャラリーのサイネージに表示されます
        </p>
      </div>
    </div>
  )
}
