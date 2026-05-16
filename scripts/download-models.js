#!/usr/bin/env node

/**
 * face-api.js モデルファイルダウンロードスクリプト
 * ブラウザから直接読み込むため、publicに配置します
 */

const https = require('https')
const fs = require('fs')
const path = require('path')

const modelsDir = path.join(__dirname, '../public/models')
const modelUrls = {
  'tiny_face_detector_model-weights_manifest.json': 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.8/dist/models/tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-weights.bin': 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.8/dist/models/tiny_face_detector_model-weights.bin',
  'face_landmark_68_model-weights_manifest.json': 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.8/dist/models/face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-weights.bin': 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.8/dist/models/face_landmark_68_model-weights.bin',
}

// ディレクトリ作成
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true })
}

// ファイルダウンロード関数
const downloadFile = (url, filepath) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath)
    https.get(url, (response) => {
      response.pipe(file)
      file.on('finish', () => {
        file.close()
        resolve()
      })
    }).on('error', (err) => {
      fs.unlink(filepath, () => {})
      reject(err)
    })
  })
}

// 全ファイルダウンロード
;(async () => {
  try {
    console.log('face-api.js モデルダウンロード開始...')
    for (const [filename, url] of Object.entries(modelUrls)) {
      const filepath = path.join(modelsDir, filename)
      console.log(`  ダウンロード中: ${filename}`)
      await downloadFile(url, filepath)
    }
    console.log('✓ モデルダウンロード完了')
  } catch (error) {
    console.error('✗ ダウンロード失敗:', error.message)
    process.exit(1)
  }
})()
