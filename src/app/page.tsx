import SignageScreen from '@/components/SignageScreen'

export const metadata = {
  title: '大分の魅力ギャラリー | リアルタイムサイネージ',
  description: '視線を集めた地元の魅力がリアルタイムに浮かび上がるデジタルサイネージ',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function Home() {
  return <SignageScreen />
