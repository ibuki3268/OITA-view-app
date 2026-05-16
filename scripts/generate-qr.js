#!/usr/bin/env node

/**
 * QRコード生成スクリプト
 * 投稿ページURLをQRコード画像として生成します
 *
 * 使用方法:
 * node scripts/generate-qr.js <base-url>
 * 例: node scripts/generate-qr.js https://oita-view.vercel.app
 */

const QRCode = require('qrcode')
const fs = require('fs')
const path = require('path')

const baseUrl = process.argv[2] || 'http://localhost:3000'
const uploadUrl = `${baseUrl}/upload`

const outputPath = path.join(__dirname, '../public/qr-code.png')

QRCode.toFile(outputPath, uploadUrl, {
  errorCorrectionLevel: 'H',
  type: 'image/png',
  quality: 0.95,
  margin: 1,
  width: 300,
}, (err) => {
  if (err) {
    console.error('QRコード生成失敗:', err)
    process.exit(1)
  }
  console.log(`✓ QRコード生成完了: ${outputPath}`)
  console.log(`  投稿URL: ${uploadUrl}`)
})
