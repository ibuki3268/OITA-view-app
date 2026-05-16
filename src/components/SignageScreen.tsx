'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Photo } from '@/types'
import { getAllPhotos, getTopPhotos, recordViewTime } from '@/lib/api'
import * as faceapi from 'face-api.js'

interface DisplayPhoto extends Photo {
  isTopPhoto?: boolean
}

export default function SignageScreen() {
  const [photos, setPhotos] = useState<DisplayPhoto[]>([])
  const [displayQueue, setDisplayQueue] = useState<DisplayPhoto[]>([])
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [cameraActive, setCameraActive] = useState(false)
  const [facesDetected, setFacesDetected] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const photoStartTimeRef = useRef<number>(0)
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const slideTimerRef = useRef<NodeJS.Timeout | null>(null)

  // モデルロード
  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        ])
        console.log('Face-API models loaded')
      } catch (error) {
        console.error('Failed to load face-api models:', error)
      }
    }
    loadModels()
  }, [])

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

  // カメラ初期化
  const initCamera = useCallback(async () => {
    if (!videoRef.current) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      })
      videoRef.current.srcObject = stream
      setCameraActive(true)
      startFaceDetection()
    } catch (error) {
      console.error('Camera error:', error)
    }
  }, [])

  // 顔検出ループ
  const startFaceDetection = useCallback(() => {
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current)

    detectionIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return

      try {
        const detections = await faceapi.detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        )
        setFacesDetected(detections.length > 0)
      } catch (error) {
        console.error('Face detection error:', error)
      }
    }, 100)
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
    }, 5000)

    return () => {
      if (slideTimerRef.current) clearInterval(slideTimerRef.current)
    }
  }, [displayQueue, handlePhotoChange])

  // カメラ初期化
  useEffect(() => {
    if (!loading) {
      initCamera()
    }
  }, [loading, initCamera])

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <p className="text-white text-2xl">読み込み中...</p>
      </div>
    )
  }

  const currentPhoto = displayQueue[currentPhotoIndex]

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative">
      {/* 写真スライドショー */}
      <div className="w-full h-full relative">
        {currentPhoto && (
          <div key={currentPhoto.id} className="animate-fadeInOut w-full h-full">
            <Image
              src={currentPhoto.image_url}
              alt="Displayed photo"
              fill
              className="object-cover"
              priority
            />
          </div>
        )}
      </div>

      {/* 顔検出カメラ（非表示） */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="hidden"
        style={{ display: 'none' }}
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* ステータス表示 */}
      <div className="absolute top-4 right-4 text-white text-sm bg-black bg-opacity-50 px-4 py-2 rounded">
        <p>視線検出: {facesDetected ? '✓ 中' : '✗'}</p>
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
        />
      </div>

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
