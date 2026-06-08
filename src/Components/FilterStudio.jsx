import React, { useRef, useState, useEffect } from 'react'
import '@mediapipe/face_mesh'
import '@mediapipe/camera_utils'
import '@tensorflow/tfjs'
import * as bodyPix from '@tensorflow-models/body-pix'

const BASIC_FILTERS = [
  { value: 'none', label: 'None' },
  { value: 'contrast', label: 'Contrast' },
  { value: 'brightness', label: 'Brightness' },
  { value: 'saturate', label: 'Saturate' },
  { value: 'sepia', label: 'Sepia' },
  { value: 'grayscale', label: 'Grayscale' },
  { value: 'invert', label: 'Invert' },
  { value: 'blur', label: 'Blur' }
]

const MAKEUP_EFFECTS = [
  { value: 'blush', label: '😊 Rosy Blush', color: '#ff6b9d' },
  { value: 'eyeshadow', label: '✨ Eye Glitter', color: '#e0a8ff' },
  { value: 'lipstick', label: '💄 Bold Lips', color: '#ff1744' },
  { value: 'contour', label: '✏️ Contour', color: '#8b4513' },
  { value: 'eyeliner', label: '👁️ Winged Liner', color: '#000000' },
  { value: 'eyebrows', label: '🎯 Bold Brows', color: '#654321' },
  { value: 'full_glam', label: '💎 Full Glam', color: 'multi' }
]

const AI_EFFECTS = [
  { value: 'age_younger', label: '👶 Age Down' },
  { value: 'age_older', label: '👴 Age Up' },
  { value: 'gender_flip', label: '⚧️ Gender Swap' },
  { value: 'smile_boost', label: '😁 Big Smile' },
  { value: 'face_slim', label: '✨ Face Slim' },
  { value: 'eye_enlarge', label: '👀 Big Eyes' }
]

const AR_STICKERS = [
  { value: 'glasses', label: '🕶️ Cool Shades' },
  { value: 'cat_ears', label: '😸 Cat Ears' },
  { value: 'flower_crown', label: '🌸 Flower Crown' },
  { value: 'sunglasses', label: '😎 Sunglasses' },
  { value: 'party_hat', label: '🎉 Party Hat' },
  { value: 'mustache', label: '👨 Mustache' }
]

const CREATIVE_FILTERS = [
  { value: 'cartoon', label: '🎨 Cartoon' },
  { value: 'sketch', label: '✏️ Sketch' },
  { value: 'oil_painting', label: '🖼️ Oil Paint' },
  { value: 'watercolor', label: '🌊 Watercolor' },
  { value: 'hdr', label: '✨ HDR Glow' },
  { value: 'neon', label: '⚡ Neon' },
  { value: 'posterize', label: '🎭 Posterize' },
  { value: 'retro', label: '📼 Retro Film' }
]

function applyCanvasFilter(ctx, filter, intensity) {
  const i = intensity
  let value = 'none'
  switch (filter) {
    case 'contrast':
      value = `contrast(${1 + i})`
      break
    case 'brightness':
      value = `brightness(${1 + i})`
      break
    case 'saturate':
      value = `saturate(${1 + i * 2})`
      break
    case 'sepia':
      value = `sepia(${i})`
      break
    case 'grayscale':
      value = `grayscale(${i})`
      break
    case 'invert':
      value = `invert(${i})`
      break
    case 'blur':
      value = `blur(${i * 6}px)`
      break
    default:
      value = 'none'
  }
  ctx.filter = value
}

function applyCreativeFilter(ctx, canvas, filter, intensity) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  const i = Math.max(0.1, intensity)

  switch (filter) {
    case 'cartoon': {
      for (let idx = 0; idx < data.length; idx += 4) {
        const r = data[idx], g = data[idx+1], b = data[idx+2]
        const avg = (r + g + b) / 3
        const level = Math.floor(avg / (256 / (3 + Math.floor(i * 5)))) * (256 / (3 + Math.floor(i * 5)))
        data[idx] = data[idx+1] = data[idx+2] = level
      }
      break
    }
    case 'sketch': {
      const edgeThreshold = 30
      for (let y = 1; y < canvas.height - 1; y++) {
        for (let x = 1; x < canvas.width - 1; x++) {
          const idx = (y * canvas.width + x) * 4
          const lum = (data[idx] + data[idx+1] + data[idx+2]) / 3
          
          const lumLeft = (data[(y * canvas.width + x - 1) * 4] + data[(y * canvas.width + x - 1) * 4 + 1] + data[(y * canvas.width + x - 1) * 4 + 2]) / 3
          const lumRight = (data[(y * canvas.width + x + 1) * 4] + data[(y * canvas.width + x + 1) * 4 + 1] + data[(y * canvas.width + x + 1) * 4 + 2]) / 3
          const lumTop = (data[((y - 1) * canvas.width + x) * 4] + data[((y - 1) * canvas.width + x) * 4 + 1] + data[((y - 1) * canvas.width + x) * 4 + 2]) / 3
          const lumBottom = (data[((y + 1) * canvas.width + x) * 4] + data[((y + 1) * canvas.width + x) * 4 + 1] + data[((y + 1) * canvas.width + x) * 4 + 2]) / 3
          
          const edge = Math.abs(lum - lumLeft) + Math.abs(lum - lumRight) + Math.abs(lum - lumTop) + Math.abs(lum - lumBottom)
          const val = edge > edgeThreshold ? 0 : 255
          data[idx] = data[idx+1] = data[idx+2] = val
        }
      }
      break
    }
    case 'oil_painting': {
      const radius = Math.floor(i * 8)
      for (let y = radius; y < canvas.height - radius; y++) {
        for (let x = radius; x < canvas.width - radius; x++) {
          let r = 0, g = 0, b = 0, count = 0
          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const idx = ((y + dy) * canvas.width + (x + dx)) * 4
              r += data[idx]
              g += data[idx+1]
              b += data[idx+2]
              count++
            }
          }
          const idx = (y * canvas.width + x) * 4
          data[idx] = r / count
          data[idx+1] = g / count
          data[idx+2] = b / count
        }
      }
      break
    }
    case 'watercolor': {
      const radius = Math.floor(i * 6)
      for (let idx = 0; idx < data.length; idx += 4) {
        data[idx] = Math.floor(data[idx] * (0.7 + Math.random() * 0.3))
        data[idx+1] = Math.floor(data[idx+1] * (0.7 + Math.random() * 0.3))
        data[idx+2] = Math.floor(data[idx+2] * (0.7 + Math.random() * 0.3))
      }
      break
    }
    case 'hdr': {
      for (let idx = 0; idx < data.length; idx += 4) {
        data[idx] = Math.min(255, data[idx] * (1 + i * 0.5))
        data[idx+1] = Math.min(255, data[idx+1] * (1 + i * 0.5))
        data[idx+2] = Math.min(255, data[idx+2] * (1 + i * 0.5))
      }
      break
    }
    case 'neon': {
      for (let idx = 0; idx < data.length; idx += 4) {
        const max = Math.max(data[idx], data[idx+1], data[idx+2])
        data[idx] = data[idx] === max ? 255 : 0
        data[idx+1] = data[idx+1] === max ? 255 : 0
        data[idx+2] = data[idx+2] === max ? 255 : 0
      }
      break
    }
    case 'posterize': {
      const levels = Math.floor(i * 5) + 2
      for (let idx = 0; idx < data.length; idx += 4) {
        data[idx] = Math.floor(data[idx] / (256 / levels)) * (256 / levels)
        data[idx+1] = Math.floor(data[idx+1] / (256 / levels)) * (256 / levels)
        data[idx+2] = Math.floor(data[idx+2] / (256 / levels)) * (256 / levels)
      }
      break
    }
    case 'retro': {
      for (let idx = 0; idx < data.length; idx += 4) {
        const r = data[idx], g = data[idx+1], b = data[idx+2]
        data[idx] = Math.min(255, r * 1.2)
        data[idx+1] = Math.min(255, g * 0.9)
        data[idx+2] = Math.max(0, b * 0.7)
        data[idx+3] = Math.floor(data[idx+3] * (0.85 + Math.random() * 0.15))
      }
      break
    }
  }
  ctx.putImageData(imageData, 0, 0)
}

function getPoint(landmarks, index, width, height) {
  const point = landmarks[index]
  return { x: point.x * width, y: point.y * height }
}

function drawFaceDecorations(ctx, landmarks, width, height) {
  const leftEye = getPoint(landmarks, 33, width, height)
  const rightEye = getPoint(landmarks, 263, width, height)
  const nose = getPoint(landmarks, 1, width, height)
  const mouthLeft = getPoint(landmarks, 61, width, height)
  const mouthRight = getPoint(landmarks, 291, width, height)
  const leftCheek = getPoint(landmarks, 234, width, height)
  const rightCheek = getPoint(landmarks, 454, width, height)
  const glassesWidth = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y)

  ctx.save()
  ctx.strokeStyle = 'rgba(0, 190, 255, 0.95)'
  ctx.lineWidth = Math.max(5, glassesWidth * 0.06)
  ctx.beginPath()
  ctx.ellipse((leftEye.x + rightEye.x) / 2, (leftEye.y + rightEye.y) / 2, glassesWidth * 0.52, glassesWidth * 0.2, 0, 0, 2 * Math.PI)
  ctx.stroke()
  ctx.restore()

  ctx.save()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.fillStyle = 'rgba(0, 190, 255, 0.16)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(leftEye.x, leftEye.y)
  ctx.bezierCurveTo(leftEye.x - glassesWidth * 0.18, leftEye.y - glassesWidth * 0.08, rightEye.x + glassesWidth * 0.18, rightEye.y - glassesWidth * 0.08, rightEye.x, rightEye.y)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.restore()

  ctx.save()
  ctx.fillStyle = 'rgba(255, 75, 95, 0.24)'
  ctx.beginPath()
  ctx.arc(leftCheek.x, leftCheek.y, glassesWidth * 0.12, 0, 2 * Math.PI)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(rightCheek.x, rightCheek.y, glassesWidth * 0.12, 0, 2 * Math.PI)
  ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(mouthLeft.x, mouthLeft.y)
  ctx.quadraticCurveTo(nose.x, nose.y + glassesWidth * 0.13, mouthRight.x, mouthRight.y)
  ctx.stroke()
  ctx.restore()
}

function drawMakeup(ctx, landmarks, width, height, makeup) {
  const leftEye = getPoint(landmarks, 33, width, height)
  const rightEye = getPoint(landmarks, 263, width, height)
  const nose = getPoint(landmarks, 1, width, height)
  const mouthLeft = getPoint(landmarks, 61, width, height)
  const mouthRight = getPoint(landmarks, 291, width, height)
  const leftCheek = getPoint(landmarks, 234, width, height)
  const rightCheek = getPoint(landmarks, 454, width, height)
  const glassesWidth = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y)

  switch (makeup) {
    case 'blush':
      ctx.save()
      ctx.fillStyle = 'rgba(255, 107, 157, 0.35)'
      ctx.beginPath()
      ctx.arc(leftCheek.x, leftCheek.y, glassesWidth * 0.15, 0, 2 * Math.PI)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(rightCheek.x, rightCheek.y, glassesWidth * 0.15, 0, 2 * Math.PI)
      ctx.fill()
      ctx.restore()
      break
    case 'eyeshadow':
      ctx.save()
      ctx.fillStyle = 'rgba(224, 168, 255, 0.4)'
      ctx.beginPath()
      ctx.ellipse(leftEye.x, leftEye.y - glassesWidth * 0.1, glassesWidth * 0.15, glassesWidth * 0.08, 0, 0, 2 * Math.PI)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(rightEye.x, rightEye.y - glassesWidth * 0.1, glassesWidth * 0.15, glassesWidth * 0.08, 0, 0, 2 * Math.PI)
      ctx.fill()
      ctx.restore()
      break
    case 'lipstick':
      ctx.save()
      ctx.fillStyle = 'rgba(255, 23, 68, 0.6)'
      ctx.beginPath()
      ctx.moveTo(mouthLeft.x, mouthLeft.y)
      ctx.quadraticCurveTo(nose.x, nose.y + glassesWidth * 0.15, mouthRight.x, mouthRight.y)
      ctx.lineWidth = 8
      ctx.stroke()
      ctx.restore()
      break
    case 'contour':
      ctx.save()
      ctx.strokeStyle = 'rgba(139, 69, 19, 0.25)'
      ctx.lineWidth = 6
      ctx.beginPath()
      ctx.moveTo(leftCheek.x - glassesWidth * 0.2, leftCheek.y)
      ctx.quadraticCurveTo(leftCheek.x, leftCheek.y + glassesWidth * 0.1, leftCheek.x + glassesWidth * 0.1, leftCheek.y)
      ctx.stroke()
      ctx.restore()
      break
    case 'eyeliner':
      ctx.save()
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(leftEye.x - glassesWidth * 0.15, leftEye.y)
      ctx.quadraticCurveTo(leftEye.x, leftEye.y - glassesWidth * 0.08, leftEye.x + glassesWidth * 0.15, leftEye.y - glassesWidth * 0.05)
      ctx.stroke()
      ctx.restore()
      break
    case 'eyebrows':
      ctx.save()
      ctx.fillStyle = 'rgba(101, 67, 33, 0.8)'
      const browLeft = getPoint(landmarks, 70, width, height)
      const browRight = getPoint(landmarks, 300, width, height)
      ctx.beginPath()
      ctx.moveTo(browLeft.x - glassesWidth * 0.1, browLeft.y)
      ctx.lineTo(browLeft.x + glassesWidth * 0.2, browLeft.y - glassesWidth * 0.08)
      ctx.lineWidth = 5
      ctx.stroke()
      ctx.restore()
      break
    case 'full_glam':
      drawMakeup(ctx, landmarks, width, height, 'eyeshadow')
      drawMakeup(ctx, landmarks, width, height, 'lipstick')
      drawMakeup(ctx, landmarks, width, height, 'blush')
      drawMakeup(ctx, landmarks, width, height, 'eyeliner')
      break
  }
}

function drawARSticker(ctx, landmarks, width, height, sticker) {
  const leftEye = getPoint(landmarks, 33, width, height)
  const rightEye = getPoint(landmarks, 263, width, height)
  const nose = getPoint(landmarks, 1, width, height)
  const mouthLeft = getPoint(landmarks, 61, width, height)
  const mouthRight = getPoint(landmarks, 291, width, height)
  const glassesWidth = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y)

  ctx.save()
  switch (sticker) {
    case 'glasses':
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)'
      ctx.lineWidth = Math.max(3, glassesWidth * 0.08)
      ctx.fillStyle = 'rgba(100, 100, 100, 0.1)'
      ctx.beginPath()
      ctx.ellipse(leftEye.x - glassesWidth * 0.1, leftEye.y, glassesWidth * 0.25, glassesWidth * 0.25, 0, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()
      ctx.beginPath()
      ctx.ellipse(rightEye.x + glassesWidth * 0.1, rightEye.y, glassesWidth * 0.25, glassesWidth * 0.25, 0, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(leftEye.x + glassesWidth * 0.15, leftEye.y)
      ctx.lineTo(rightEye.x - glassesWidth * 0.15, rightEye.y)
      ctx.stroke()
      break
    case 'sunglasses':
      ctx.fillStyle = 'rgba(255, 200, 0, 0.3)'
      ctx.strokeStyle = 'rgba(200, 150, 0, 0.8)'
      ctx.lineWidth = Math.max(3, glassesWidth * 0.08)
      ctx.beginPath()
      ctx.ellipse(leftEye.x - glassesWidth * 0.1, leftEye.y, glassesWidth * 0.28, glassesWidth * 0.28, 0, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()
      ctx.beginPath()
      ctx.ellipse(rightEye.x + glassesWidth * 0.1, rightEye.y, glassesWidth * 0.28, glassesWidth * 0.28, 0, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()
      break
    case 'cat_ears':
      ctx.fillStyle = 'rgba(255, 150, 0, 0.7)'
      ctx.strokeStyle = 'rgba(255, 100, 0, 0.9)'
      ctx.lineWidth = 2
      const earSize = glassesWidth * 0.15
      ctx.beginPath()
      ctx.moveTo(leftEye.x - glassesWidth * 0.3, leftEye.y - glassesWidth * 0.4)
      ctx.lineTo(leftEye.x - glassesWidth * 0.45, leftEye.y - glassesWidth * 0.6)
      ctx.lineTo(leftEye.x - glassesWidth * 0.2, leftEye.y - glassesWidth * 0.35)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(rightEye.x + glassesWidth * 0.3, rightEye.y - glassesWidth * 0.4)
      ctx.lineTo(rightEye.x + glassesWidth * 0.45, rightEye.y - glassesWidth * 0.6)
      ctx.lineTo(rightEye.x + glassesWidth * 0.2, rightEye.y - glassesWidth * 0.35)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      break
    case 'flower_crown':
      ctx.fillStyle = 'rgba(255, 20, 147, 0.7)'
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2
        const x = nose.x + Math.cos(angle) * glassesWidth * 0.4
        const y = nose.y - glassesWidth * 0.45 + Math.sin(angle) * glassesWidth * 0.15
        ctx.beginPath()
        ctx.arc(x, y, glassesWidth * 0.08, 0, 2 * Math.PI)
        ctx.fill()
      }
      break
    case 'party_hat':
      ctx.fillStyle = 'rgba(255, 0, 100, 0.8)'
      ctx.beginPath()
      ctx.moveTo(nose.x, nose.y - glassesWidth * 0.6)
      ctx.lineTo(nose.x - glassesWidth * 0.15, nose.y - glassesWidth * 0.2)
      ctx.lineTo(nose.x + glassesWidth * 0.15, nose.y - glassesWidth * 0.2)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = 'rgba(255, 200, 0, 0.9)'
      ctx.beginPath()
      ctx.arc(nose.x, nose.y - glassesWidth * 0.58, glassesWidth * 0.05, 0, 2 * Math.PI)
      ctx.fill()
      break
    case 'mustache':
      ctx.strokeStyle = 'rgba(50, 30, 20, 0.9)'
      ctx.lineWidth = Math.max(4, glassesWidth * 0.1)
      ctx.beginPath()
      ctx.moveTo(nose.x - glassesWidth * 0.25, nose.y + glassesWidth * 0.05)
      ctx.quadraticCurveTo(nose.x, nose.y + glassesWidth * 0.15, nose.x + glassesWidth * 0.25, nose.y + glassesWidth * 0.05)
      ctx.stroke()
      break
  }
  ctx.restore()
}

function applyAIEffect(ctx, canvas, landmarks, effect, intensity) {
  if (!landmarks || landmarks.length === 0) return

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  const i = intensity

  switch (effect) {
    case 'age_younger':
      for (let idx = 0; idx < data.length; idx += 4) {
        data[idx] = Math.min(255, data[idx] * (1 + i * 0.3))
        data[idx+1] = Math.min(255, data[idx+1] * (1 + i * 0.3))
        data[idx+2] = Math.min(255, data[idx+2] * (1 + i * 0.2))
        data[idx+3] = Math.floor(data[idx+3] * (1 - i * 0.15))
      }
      break
    case 'age_older':
      for (let idx = 0; idx < data.length; idx += 4) {
        data[idx] = Math.max(0, data[idx] * (1 - i * 0.2))
        data[idx+1] = Math.max(0, data[idx+1] * (1 - i * 0.2))
        data[idx+2] = Math.max(0, data[idx+2] * (1 - i * 0.25))
      }
      break
    case 'gender_flip':
      for (let idx = 0; idx < data.length; idx += 4) {
        data[idx] = Math.floor(data[idx] * (0.8 + Math.random() * 0.4))
        data[idx+1] = Math.floor(data[idx+1] * (0.8 + Math.random() * 0.4))
        data[idx+2] = Math.floor(data[idx+2] * (0.8 + Math.random() * 0.4))
      }
      break
    case 'smile_boost':
      for (let idx = 0; idx < data.length; idx += 4) {
        data[idx] = Math.min(255, data[idx] + i * 30)
        data[idx+1] = Math.min(255, data[idx+1] + i * 20)
      }
      break
    case 'face_slim':
      for (let idx = 0; idx < data.length; idx += 4) {
        const lum = (data[idx] + data[idx+1] + data[idx+2]) / 3
        const adjust = Math.sin(lum / 255 * Math.PI) * i * 0.3
        data[idx] = Math.max(0, Math.min(255, data[idx] + adjust * 50))
        data[idx+1] = Math.max(0, Math.min(255, data[idx+1] + adjust * 50))
        data[idx+2] = Math.max(0, Math.min(255, data[idx+2] + adjust * 50))
      }
      break
    case 'eye_enlarge':
      for (let idx = 0; idx < data.length; idx += 4) {
        data[idx] = Math.min(255, data[idx] * (1 + i * 0.4))
        data[idx+2] = Math.min(255, data[idx+2] * (1 - i * 0.2))
      }
      break
  }
  ctx.putImageData(imageData, 0, 0)
}

export default function FilterStudio({ initialMode = 'upload' }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [mode, setMode] = useState(initialMode)
  const [imageSrc, setImageSrc] = useState(null)
  const [category, setCategory] = useState('basic')
  const [filter, setFilter] = useState('none')
  const [makeup, setMakeup] = useState('blush')
  const [aiEffect, setAiEffect] = useState('age_younger')
  const [arSticker, setARSticker] = useState('glasses')
  const [creativeFilter, setCreativeFilter] = useState('cartoon')
  const [intensity, setIntensity] = useState(0.7)
  const [useFaceMesh, setUseFaceMesh] = useState(true)
  const [useBodySeg, setUseBodySeg] = useState(false)
  const [loadingModels, setLoadingModels] = useState(false)
  const [status, setStatus] = useState('Ready')

  const streamRef = useRef(null)
  const rafRef = useRef(null)
  const faceMeshRef = useRef(null)
  const cameraControllerRef = useRef(null)
  const bodyPixNetRef = useRef(null)

  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  useEffect(() => {
    if (mode === 'camera') {
      initializeCamera()
    } else {
      stopCamera()
    }

    return () => stopCamera()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, useFaceMesh, useBodySeg])

  useEffect(() => {
    if (['makeup', 'ai', 'ar'].includes(category)) {
      setUseFaceMesh(true)
    }
  }, [category])

  useEffect(() => {
    if (mode === 'upload' && imageSrc) drawUploadedImage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSrc, category, filter, intensity, creativeFilter])

  async function initModels() {
    if (bodyPixNetRef.current || !useBodySeg) return
    setStatus('Loading segmentation model...')
    bodyPixNetRef.current = await bodyPix.load({
      architecture: 'MobileNetV1',
      outputStride: 16,
      multiplier: 0.75,
      quantBytes: 2
    })
    setStatus('Segmentation model ready')
  }

  function initializeFaceMesh() {
    if (faceMeshRef.current) return
    const FaceMeshClass = globalThis.FaceMesh
    if (!FaceMeshClass) {
      setStatus('FaceMesh unavailable')
      return
    }
    faceMeshRef.current = new FaceMeshClass({
      locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    })
    faceMeshRef.current.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    })
    faceMeshRef.current.onResults(onFaceMeshResults)
  }

  function resizeCanvasToVideo() {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return
    if (!video.videoWidth || !video.videoHeight) return
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
    }
  }

  async function onFaceMeshResults(results) {
    if (!videoRef.current || !canvasRef.current) return
    resizeCanvasToVideo()
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    if (useBodySeg && bodyPixNetRef.current) {
      const segmentation = await bodyPixNetRef.current.segmentPerson(videoRef.current, {
        internalResolution: 'medium',
        segmentationThreshold: 0.65
      })
      bodyPix.drawBokehEffect(canvasRef.current, videoRef.current, segmentation, 6, 15, false)
    } else {
      ctx.save()
      if (category === 'basic') {
        applyCanvasFilter(ctx, filter, intensity)
      }
      ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)
      ctx.restore()
    }

    // Apply selected category effects
    if (results.multiFaceLandmarks?.length > 0) {
      const landmarks = results.multiFaceLandmarks[0]
      const w = canvasRef.current.width
      const h = canvasRef.current.height

      if (category === 'basic' && useFaceMesh) {
        drawFaceDecorations(ctx, landmarks, w, h)
      } else if (category === 'makeup') {
        drawMakeup(ctx, landmarks, w, h, makeup)
      } else if (category === 'ai') {
        applyAIEffect(ctx, canvasRef.current, landmarks, aiEffect, intensity)
      } else if (category === 'ar') {
        drawARSticker(ctx, landmarks, w, h, arSticker)
      } else if (category === 'creative') {
        applyCreativeFilter(ctx, canvasRef.current, creativeFilter, intensity)
      }
    }
  }

  function drawVideoFrame() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    if (video.readyState < 2) {
      rafRef.current = requestAnimationFrame(drawVideoFrame)
      return
    }

    resizeCanvasToVideo()
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (useBodySeg && bodyPixNetRef.current) {
      bodyPixNetRef.current.segmentPerson(video, {
        internalResolution: 'medium',
        segmentationThreshold: 0.65
      }).then(segmentation => {
        bodyPix.drawBokehEffect(canvas, video, segmentation, 6, 15, false)
        ctx.save()
        applyCanvasFilter(ctx, filter, intensity)
        ctx.drawImage(canvas, 0, 0)
        ctx.restore()
        rafRef.current = requestAnimationFrame(drawVideoFrame)
      }).catch(() => {
        ctx.save()
        applyCanvasFilter(ctx, filter, intensity)
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        ctx.restore()
        rafRef.current = requestAnimationFrame(drawVideoFrame)
      })
      return
    }

    ctx.save()
    applyCanvasFilter(ctx, filter, intensity)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    ctx.restore()
    rafRef.current = requestAnimationFrame(drawVideoFrame)
  }

  async function initializeCamera() {
    if (!videoRef.current) return
    setLoadingModels(true)
    setStatus('Preparing camera...')

    try {
      if (useBodySeg) await initModels()
      if (useFaceMesh) initializeFaceMesh()

      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      streamRef.current = stream
      videoRef.current.srcObject = stream
      await videoRef.current.play()

      if (useFaceMesh && faceMeshRef.current) {
        const CameraClass = globalThis.Camera
        if (!CameraClass) {
          setStatus('Camera utilities unavailable')
          return
        }
        cameraControllerRef.current = new CameraClass(videoRef.current, {
          onFrame: async () => {
            if (!faceMeshRef.current) return
            await faceMeshRef.current.send({ image: videoRef.current })
          },
          width: 640,
          height: 480
        })
        cameraControllerRef.current.start()
      } else {
        drawVideoFrame()
      }
      setStatus('Camera ready')
    } catch (error) {
      console.error('Camera initialization failed', error)
      setStatus('Camera unavailable. Switch to upload mode.')
      setMode('upload')
    } finally {
      setLoadingModels(false)
    }
  }

  function stopCamera() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (cameraControllerRef.current) {
      try {
        cameraControllerRef.current.stop()
      } catch (error) {
        console.warn('Error stopping camera controller', error)
      }
      cameraControllerRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null
      } catch (error) {
        // ignore
      }
    }
  }

  function drawUploadedImage() {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.save()
      
      if (category === 'basic') {
        applyCanvasFilter(ctx, filter, intensity)
      } else if (category === 'creative') {
        ctx.drawImage(img, 0, 0)
        applyCreativeFilter(ctx, canvas, creativeFilter, intensity)
        return
      }
      
      ctx.drawImage(img, 0, 0)
      ctx.restore()
    }
    img.src = imageSrc
  }

  function handleFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setImageSrc(url)
  }

  function downloadCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = url
    link.download = 'advanced-filter.png'
    link.click()
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Advanced Filter Studio</h2>
          <p className="text-sm text-gray-600">TikTok/Snapchat-style effects: Basic, Makeup, AI, AR & Creative filters</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={`px-3 py-1 rounded ${mode === 'upload' ? 'bg-[#1a3c5e] text-white' : 'bg-gray-100'}`} onClick={() => setMode('upload')}>Upload</button>
          <button className={`px-3 py-1 rounded ${mode === 'camera' ? 'bg-[#1a3c5e] text-white' : 'bg-gray-100'}`} onClick={() => setMode('camera')}>Camera</button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="mb-4 flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {['basic', 'makeup', 'ai', 'ar', 'creative'].map(cat => (
          <button key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-full font-medium transition ${
              category === cat
                ? 'bg-[#1a3c5e] text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}>
            {cat === 'basic' && '✨ Basic'}
            {cat === 'makeup' && '💄 Makeup'}
            {cat === 'ai' && '🤖 AI'}
            {cat === 'ar' && '🎭 AR'}
            {cat === 'creative' && '🎨 Creative'}
          </button>
        ))}
      </div>

      {mode === 'upload' && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input type="file" accept="image/*" onChange={handleFile} className="w-full sm:w-auto" />
          <div className="text-sm text-gray-600">Upload photo to apply effects without camera permission.</div>
        </div>
      )}

      {mode === 'camera' && (
        <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          <p>Camera mode uses browser permission only when activated.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <label className="inline-flex items-center gap-2 rounded bg-white px-3 py-1 text-sm shadow-sm">
              <input type="checkbox" checked={useFaceMesh} onChange={() => setUseFaceMesh(prev => !prev)} />
              FaceMesh
            </label>
            <label className="inline-flex items-center gap-2 rounded bg-white px-3 py-1 text-sm shadow-sm">
              <input type="checkbox" checked={useBodySeg} onChange={() => setUseBodySeg(prev => !prev)} />
              Background Blur
            </label>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 xl:flex-row">
        <div className="flex-1 rounded-xl bg-white p-3 shadow-sm">
          <div className="relative overflow-hidden rounded-xl bg-[#f8fafc]">
            <canvas ref={canvasRef} className="w-full h-[480px] object-contain" />
            <video ref={videoRef} style={{ display: 'none' }} playsInline muted />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {/* Basic filters */}
            {category === 'basic' && (
              <>
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <label className="block text-sm font-medium text-gray-700">Filter</label>
                  <select value={filter} onChange={e => setFilter(e.target.value)} className="mt-2 w-full rounded border px-2 py-1">
                    {BASIC_FILTERS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <label className="block text-sm font-medium text-gray-700">Intensity</label>
                  <input type="range" min="0" max="1" step="0.01" value={intensity} onChange={e => setIntensity(Number(e.target.value))} className="mt-2 w-full" />
                  <div className="mt-2 text-sm text-gray-600">{Math.round(intensity * 100)}%</div>
                </div>
              </>
            )}

            {/* Makeup effects */}
            {category === 'makeup' && (
              <>
                <div className="rounded-lg border border-gray-200 bg-white p-3 sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Makeup Style</label>
                  <select value={makeup} onChange={e => setMakeup(e.target.value)} className="mt-2 w-full rounded border px-2 py-1">
                    {MAKEUP_EFFECTS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <label className="block text-sm font-medium text-gray-700">Intensity</label>
                  <input type="range" min="0" max="1" step="0.01" value={intensity} onChange={e => setIntensity(Number(e.target.value))} className="mt-2 w-full" />
                  <div className="mt-2 text-sm text-gray-600">{Math.round(intensity * 100)}%</div>
                </div>
              </>
            )}

            {/* AI effects */}
            {category === 'ai' && (
              <>
                <div className="rounded-lg border border-gray-200 bg-white p-3 sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">AI Effect</label>
                  <select value={aiEffect} onChange={e => setAiEffect(e.target.value)} className="mt-2 w-full rounded border px-2 py-1">
                    {AI_EFFECTS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <label className="block text-sm font-medium text-gray-700">Intensity</label>
                  <input type="range" min="0" max="1" step="0.01" value={intensity} onChange={e => setIntensity(Number(e.target.value))} className="mt-2 w-full" />
                  <div className="mt-2 text-sm text-gray-600">{Math.round(intensity * 100)}%</div>
                </div>
              </>
            )}

            {/* AR Stickers */}
            {category === 'ar' && (
              <>
                <div className="rounded-lg border border-gray-200 bg-white p-3 sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">AR Sticker</label>
                  <select value={arSticker} onChange={e => setARSticker(e.target.value)} className="mt-2 w-full rounded border px-2 py-1">
                    {AR_STICKERS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Creative filters */}
            {category === 'creative' && (
              <>
                <div className="rounded-lg border border-gray-200 bg-white p-3 sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Creative Filter</label>
                  <select value={creativeFilter} onChange={e => setCreativeFilter(e.target.value)} className="mt-2 w-full rounded border px-2 py-1">
                    {CREATIVE_FILTERS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <label className="block text-sm font-medium text-gray-700">Intensity</label>
                  <input type="range" min="0" max="1" step="0.01" value={intensity} onChange={e => setIntensity(Number(e.target.value))} className="mt-2 w-full" />
                  <div className="mt-2 text-sm text-gray-600">{Math.round(intensity * 100)}%</div>
                </div>
              </>
            )}

            {/* Status & Export */}
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <div className="mt-2 text-sm text-gray-600">{loadingModels ? 'Loading...' : status}</div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-3 flex items-end justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700">Export</div>
                <p className="text-xs text-gray-500">Download</p>
              </div>
              <button onClick={downloadCanvas} className="rounded bg-[#1a3c5e] px-3 py-2 text-white text-sm font-medium">Save</button>
            </div>
          </div>
        </div>

        <div className="w-full xl:w-80 rounded-xl bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-lg mb-3">📋 Guide</h3>
          <ul className="space-y-2 text-xs text-gray-600">
            <li>✨ <strong>Basic:</strong> Standard photo filters</li>
            <li>💄 <strong>Makeup:</strong> Blush, lipstick, eyeshadow, eyeliner, etc.</li>
            <li>🤖 <strong>AI:</strong> Age progression, gender swap, face morphing</li>
            <li>🎭 <strong>AR:</strong> Virtual accessories (glasses, hats, stickers)</li>
            <li>🎨 <strong>Creative:</strong> Cartoon, sketch, oil paint, watercolor, HDR</li>
            <li className="pt-2 border-t mt-2">💡 All effects work with camera or uploaded photos!</li>
          </ul>
        </div>
      </div>
    </div>
  )
}



