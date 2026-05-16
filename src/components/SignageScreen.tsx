'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Photo } from '@/types'
import { getAllPhotos, recordViewTime } from '@/lib/api'

interface DisplayPhoto extends Photo {
  isTopPhoto?: boolean
}

export default function SignageScreen() {
  const [photos, setPhotos] = useState<DisplayPhoto[]>([])
  const [displayQueue, setDisplayQueue] = useState<DisplayPhoto[]>([])
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const photoStartTimeRef = useRef<number>(0)
  const slideTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 初期化：写真を取得してキューを構築
  useEffect(() => {
    const initPhotos = async () => {
      setLoading(true)
      const allPhotos = await getAllPhotos()
      setPhotos(allPhotos)
      buildDisplayQueue(allPhotos)
      setLoading(false)
    }
    initPhotos()
  }, [])

  // 表示キューを構築（ランダム＋上位写真を混在）
  const buildDisplayQueue = useCallback((photoList: Photo[]) => {
    if (photoList.length === 0) return

    // ランダムシャッフル
    const shuffled = [...photoList].sort(() => Math.random() - 0.5)
    const queue: DisplayPhoto[] = []

    // 5枚ごとに上位写真を挿入
    let topPhotoIndex = 0
    for (let i = 0; i < shuffled.length; i++) {
      queue.push({ ...shuffled[i], isTopPhoto: false })

      if ((i + 1) % 5 === 0 && topPhotoIndex < 3) {
        const topPhotos = photoList.sort((a, b) => b.total_view_time - a.total_view_time)
        queue.push({ ...topPhotos[topPhotoIndex], isTopPhoto: true })
        topPhotoIndex++
      }
    }

    setDisplayQueue(queue)
    setCurrentPhotoIndex(0)
    photoStartTimeRef.current = Date.now()
  }, [])

  // スライド切替時に前の写真の視聴時間を記録
  const handlePhotoChange = useCallback(async () => {
    if (displayQueue.length === 0) return

    const previousIndex = currentPhotoIndex === 0 ? displayQueue.length - 1 : currentPhotoIndex - 1
    const previousPhoto = displayQueue[previousIndex]

    if (previousPhoto && photoStartTimeRef.current > 0) {
      const duration = Math.floor((Date.now() - photoStartTimeRef.current) / 1000)
      if (duration > 0) {
        await recordViewTime(previousPhoto.id, duration)
      }
    }

    const nextIndex = (currentPhotoIndex + 1) % displayQueue.length
    setCurrentPhotoIndex(nextIndex)
    photoStartTimeRef.current = Date.now()
  }, [currentPhotoIndex, displayQueue])

  // スライドショー定期実行
  useEffect(() => {
    if (displayQueue.length === 0) return

    if (slideTimerRef.current) clearInterval(slideTimerRef.current)

    slideTimerRef.current = setInterval(() => {
      handlePhotoChange()
    }, 10000)

    return () => {
      if (slideTimerRef.current) clearInterval(slideTimerRef.current)
    }
  }, [displayQueue, handlePhotoChange])

  if (loading) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-black gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-600 border-t-white"></div>
        <div className="text-white text-xl">写真を読み込み中...</div>
      </div>
    )
  }

  const currentPhoto = displayQueue[currentPhotoIndex]

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative">
      {/* 写真スライドショー */}
      <div className="w-full h-full relative p-4">
        {currentPhoto && (
          <div key={currentPhoto.id} className="animate-fadeInOut w-full h-full relative bg-black">
            <Image
              src={currentPhoto.image_url}
              alt="Displayed photo"
              fill
              className="object-contain"
              priority
            />
          </div>
        )}
      </div>

      {/* ステータス表示 */}
      <div className="absolute top-4 right-4 text-white text-sm bg-black bg-opacity-50 px-4 py-2 rounded">
        <p>サイネージ稼働中</p>
        <p>写真: {currentPhotoIndex + 1} / {displayQueue.length}</p>
        {currentPhoto?.isTopPhoto && (
          <p className="text-yellow-400 font-bold">★ 人気の写真</p>
        )}
      </div>

      {/* QRコード（右下固定） */}
      <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg">
        <Image
          src="/qr-code.png"
          alt="Upload QR Code"
          width={120}
          height={120}
          loading="eager"
        />
      </div>

      <Link
        href="/upload"
        className="absolute bottom-4 left-4 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-zinc-900 shadow-lg transition hover:bg-white"
      >
        写真を投稿する
      </Link>

      {/* CSS for fade animation */}
      <style jsx>{`
        @keyframes fadeInOut {
          0% {
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
        .animate-fadeInOut {
          animation: fadeInOut 5s ease-in-out;
        }
      `}</style>
    </div>
  )
}
