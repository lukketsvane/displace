'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Plus, Download } from "lucide-react"

const effectPatterns = [
  "https://i.ibb.co/nCv2qTg/01tn.png",
  "https://i.ibb.co/5FfKKS0/02tn.png",
  "https://i.ibb.co/C637GbD/03tn.png",
  "https://i.ibb.co/QHbYKGP/04tn.png",
  "https://i.ibb.co/CWNPSm2/05tn.png",
  "https://i.ibb.co/BVw0bvJ/06tn.png",
  "https://i.ibb.co/LpM3kWn/07tn.png",
  "https://i.ibb.co/DwSGqSc/08tn.png",
  "https://i.ibb.co/k34pXtg/09tn.png",
  "https://i.ibb.co/sw3mB9g/10tn.png"
]

const defaultImage = "/kryssord.png"

interface CustomSliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  isScale?: boolean;
}

const CustomSlider: React.FC<CustomSliderProps> = ({ value, onChange, min, max, step, isScale = false }) => {
  const percentage = ((value - min) / (max - min)) * 100
  const leftColor = isScale ? 'bg-gray-200' : 'bg-blue-500'
  const rightColor = isScale ? 'bg-blue-500' : 'bg-gray-200'

  return (
    <div className="relative w-full h-1 bg-gray-200 rounded-full">
      <div
        className={`absolute top-0 left-0 h-full ${leftColor} rounded-l-full`}
        style={{ width: `${isScale ? 0 : Math.min(50, percentage)}%` }}
      ></div>
      <div
        className={`absolute top-0 right-0 h-full ${rightColor} rounded-r-full`}
        style={{ width: `${isScale ? percentage : Math.max(0, percentage - 50)}%` }}
      ></div>
      <Slider
        value={[value]}
        onValueChange={(newValue) => onChange(newValue[0])}
        min={min}
        max={max}
        step={step}
        className="absolute inset-0"
      />
    </div>
  )
}

export default function Home() {
  const [selectedEffect, setSelectedEffect] = useState(0)
  const [xShift, setXShift] = useState(15)
  const [yShift, setYShift] = useState(0)
  const [scale, setScale] = useState(1)
  const [selectedImage, setSelectedImage] = useState<string>(defaultImage)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [customPatterns, setCustomPatterns] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const patternInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePatternUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setCustomPatterns(prev => [...prev, e.target?.result as string])
      }
      reader.readAsDataURL(file)
    }
  }

  const handleColumnClick = () => {
    fileInputRef.current?.click()
  }

  const removeImage = () => {
    setSelectedImage(defaultImage)
    setProcessedImage(null)
  }

  const applyEffect = () => {
    if (!selectedImage || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const pattern = new Image()
      pattern.crossOrigin = "anonymous"
      pattern.onload = () => {
        const patternCanvas = document.createElement('canvas')
        patternCanvas.width = pattern.width
        patternCanvas.height = pattern.height
        const patternCtx = patternCanvas.getContext('2d')
        if (!patternCtx) return

        patternCtx.drawImage(pattern, 0, 0)
        const patternData = patternCtx.getImageData(0, 0, pattern.width, pattern.height)

        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const patternX = Math.floor((x + xShift) % pattern.width)
            const patternY = Math.floor((y + yShift) % pattern.height)
            const patternIndex = (patternY * pattern.width + patternX) * 4
            const displacement = (patternData.data[patternIndex] / 255) * scale

            let sourceX = x
            let sourceY = y

            switch (selectedEffect % 3) {
              case 0: // Horizontal displacement
                sourceX = x + displacement * 20
                break
              case 1: // Vertical displacement
                sourceY = y + displacement * 20
                break
              case 2: // Radial displacement
                const centerX = canvas.width / 2
                const centerY = canvas.height / 2
                const dx = x - centerX
                const dy = y - centerY
                const distance = Math.sqrt(dx * dx + dy * dy)
                const angle = Math.atan2(dy, dx)
                const newDistance = distance + displacement * 20
                sourceX = centerX + newDistance * Math.cos(angle)
                sourceY = centerY + newDistance * Math.sin(angle)
                break
            }

            sourceX = Math.max(0, Math.min(canvas.width - 1, sourceX))
            sourceY = Math.max(0, Math.min(canvas.height - 1, sourceY))

            const sourceIndex = (Math.floor(sourceY) * canvas.width + Math.floor(sourceX)) * 4
            const targetIndex = (y * canvas.width + x) * 4

            imageData.data[targetIndex] = imageData.data[sourceIndex]
            imageData.data[targetIndex + 1] = imageData.data[sourceIndex + 1]
            imageData.data[targetIndex + 2] = imageData.data[sourceIndex + 2]
            imageData.data[targetIndex + 3] = imageData.data[sourceIndex + 3]
          }
        }

        ctx.putImageData(imageData, 0, 0)
        setProcessedImage(canvas.toDataURL())
      }
      pattern.src = selectedEffect < effectPatterns.length ? effectPatterns[selectedEffect] : customPatterns[selectedEffect - effectPatterns.length]
    }
    img.src = selectedImage
  }

  useEffect(() => {
    applyEffect()
  }, [selectedImage, selectedEffect, xShift, yShift, scale])

  const handleRandom = () => {
    setXShift(Math.floor(Math.random() * 201) - 100)
    setYShift(Math.floor(Math.random() * 201) - 100)
    setScale(Math.random() * 4 + 1)
  }

  const handleDownload = () => {
    if (processedImage) {
      const link = document.createElement('a')
      link.href = processedImage
      link.download = 'displaced_image.png'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-7xl h-[calc(100vh-2rem)] m-4 bg-white rounded-lg overflow-hidden">
        <div className="flex flex-col h-full bg-white overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h1 className="text-xl">
              <span className="font-bold">Displace</span>
              <span className="font-normal text-gray-500"> – pattern glass, noise and glitch effects</span>
            </h1>
            <button className="text-gray-500 hover:text-gray-700" onClick={removeImage}>
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="flex flex-1 overflow-hidden">
            <div 
              className="flex-1 flex items-center justify-center border-r border-gray-200 cursor-pointer overflow-auto bg-white"
              onClick={handleColumnClick}
            >
              {processedImage ? (
                <img src={processedImage} alt="Processed" className="max-w-full max-h-full object-contain" />
              ) : (
                <img src={selectedImage} alt="Default or Selected" className="max-w-full max-h-full object-contain" />
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
                aria-label="Upload image"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="w-80 flex flex-col p-4 overflow-y-auto">
              <div className="grid grid-cols-5 gap-2 mb-6">
                {[...effectPatterns, ...customPatterns].map((pattern, index) => (
                  <img
                    key={index}
                    src={pattern}
                    alt={`Effect ${index + 1}`}
                    className={`w-12 h-12 cursor-pointer rounded ${
                      selectedEffect === index ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedEffect(index)}
                  />
                ))}
                <button 
                  className="w-12 h-12 bg-white flex items-center justify-center text-gray-400 rounded hover:bg-gray-200"
                  onClick={() => patternInputRef.current?.click()}
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              <input
                type="file"
                ref={patternInputRef}
                onChange={handlePatternUpload}
                accept="image/*"
                className="hidden"
                aria-label="Upload custom pattern"
              />
              <div className="flex-grow" />
              <div className="space-y-4 mb-4">
                <div className="flex items-center">
                  <span className="text-sm font-medium w-20">X Shift</span>
                  <Input
                    type="number"
                    value={xShift}
                    onChange={(e) => setXShift(Number(e.target.value))}
                    className="w-20 mr-4 text-sm border-0 bg-white"
                  />
                  <CustomSlider
                    value={xShift}
                    onChange={setXShift}
                    min={-100}
                    max={100}
                    step={1}
                  />
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium w-20">Y Shift</span>
                  <Input
                    type="number"
                    value={yShift}
                    onChange={(e) => setYShift(Number(e.target.value))}
                    className="w-20 mr-4 text-sm border-0 bg-white"
                  />
                  <CustomSlider
                    value={yShift}
                    onChange={setYShift}
                    min={-100}
                    max={100}
                    step={1}
                  />
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium w-20">Scale</span>
                  <Input
                    type="number"
                    value={scale.toFixed(1)}
                    onChange={(e) => setScale(Number(e.target.value))}
                    className="w-20 mr-4 text-sm border-0 bg-white"
                    step="0.1"
                  />
                  <CustomSlider
                    value={scale}
                    onChange={setScale}
                    min={0}
                    max={5}
                    step={0.1}
                    isScale={true}
                  />
                </div>
              </div>
              <div className="flex gap-2 pb-8">
                <Button variant="outline" className="flex-1" onClick={handleRandom}>
                  Random
                </Button>
                <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}