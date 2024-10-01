'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Plus, Download, Moon, Sun, ZoomIn, ZoomOut, Shuffle } from "lucide-react"

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
  const leftColor = isScale ? 'bg-secondary' : 'bg-primary'
  const rightColor = isScale ? 'bg-primary' : 'bg-secondary'

  return (
    <div className="relative w-full h-1 bg-secondary rounded-full">
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

export default function DisplacePlugin() {
  const { theme, setTheme } = useTheme()
  const [selectedEffect, setSelectedEffect] = useState(0)
  const [xShift, setXShift] = useState(15)
  const [yShift, setYShift] = useState(0)
  const [scale, setScale] = useState(1)
  const [selectedImage, setSelectedImage] = useState<string>(defaultImage)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [customPatterns, setCustomPatterns] = useState<string[]>([])
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const patternInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const zoomCanvasRef = useRef<HTMLCanvasElement>(null)

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

  const randomizeParameters = () => {
    setSelectedEffect(Math.floor(Math.random() * (effectPatterns.length + customPatterns.length)))
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

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 5))
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 1))

  const handlePan = (e: React.MouseEvent<HTMLDivElement>) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / zoomLevel
      const y = (e.clientY - rect.top) / zoomLevel
      setPanPosition({ x, y })
    }
  }

  useEffect(() => {
    if (processedImage && zoomCanvasRef.current) {
      const zoomCanvas = zoomCanvasRef.current
      const zoomCtx = zoomCanvas.getContext('2d')
      if (zoomCtx) {
        const img = new Image()
        img.onload = () => {
          const zoomSize = 120
          zoomCanvas.width = zoomSize
          zoomCanvas.height = zoomSize
          const sourceX = Math.max(0, Math.min(img.width - zoomSize / zoomLevel, panPosition.x - zoomSize / (2 * zoomLevel)))
          const sourceY = Math.max(0, Math.min(img.height - zoomSize / zoomLevel, panPosition.y - zoomSize / (2 * zoomLevel)))
          zoomCtx.drawImage(img, sourceX, sourceY, zoomSize / zoomLevel, zoomSize / zoomLevel, 0, 0, zoomSize, zoomSize)
        }
        img.src = processedImage
      }
    }
  }, [processedImage, zoomLevel, panPosition])

  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
      <div className="flex items-center justify-between p-2 border-b border-border">
        <h1 className="text-lg">
          <span className="font-bold">Displace</span>
          <span className="font-normal text-muted-foreground text-sm"> – Apply amazing displacement effects</span>
        </h1>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <button className="text-muted-foreground hover:text-foreground" onClick={removeImage}>
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative overflow-hidden cursor-move" onClick={handleColumnClick} onMouseMove={handlePan}>
          {processedImage ? (
            <img src={processedImage} alt="Processed" className="w-full h-full object-contain" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }} />
          ) : (
            <img src={selectedImage} alt="Default or Selected" className="w-full h-full object-contain" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }} />
          )}
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" aria-label="Upload image" />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute bottom-2 left-2 w-28 h-28 border border-primary bg-card">
            <canvas ref={zoomCanvasRef} className="w-full h-full" />
          </div>
          <div className="absolute top-2 right-2 flex space-x-1">
            <Button onClick={handleZoomIn} size="icon" variant="secondary" className="h-6 w-6">
              <ZoomIn className="h-3 w-3" />
            </Button>
            <Button onClick={handleZoomOut} size="icon" variant="secondary" className="h-6 w-6">
              <ZoomOut className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="w-64 flex flex-col p-2 overflow-y-auto bg-card">
          <div className="grid grid-cols-5 gap-2 mb-4">
            {[...effectPatterns, ...customPatterns].map((pattern, index) => (
              <img
                key={index}
                src={pattern}
                alt={`Effect ${index + 1}`}
                className={`w-10 h-10 cursor-pointer rounded ${
                  selectedEffect === index ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedEffect(index)}
              />
            ))}
            <button 
              className="w-10 h-10 bg-secondary flex items-center justify-center text-muted-foreground rounded hover:bg-secondary/80"
              onClick={() => patternInputRef.current?.click()}
            >
              <Plus className="h-4 w-4" />
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
          <div className="space-y-2 mb-2">
            {[
              { label: "X", value: xShift, setValue: setXShift, min: -100, max: 100, step: 1 },
              { label: "Y Shift", value: yShift, setValue: setYShift, min: -100, max: 100, step: 1 },
              { label: "Scale", value: scale, setValue: setScale, min: 0, max: 5, step: 0.1, isScale: true }
            ].map(({ label, value, setValue, min, max, step, isScale }) => (
              <div key={label} className="flex items-center">
                <span className="text-xs font-medium w-14">{label}</span>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value))}
                  className="w-16 mr-2 text-xs h-6 px-1"
                  step={step.toString()}
                />
                <CustomSlider value={value} onChange={setValue} min={min} max={max} step={step} isScale={isScale} />
              </div>
            ))}
          </div>
          <div className="flex-grow" />
          <div className="flex gap-2 pb-2 w-full">
            <Button 
              className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 text-xs h-8" 
              onClick={randomizeParameters}
            >
              <Shuffle className="w-3 h-3 mr-1" />
              Random
            </Button>
            <Button 
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-8" 
              onClick={handleDownload}
            >
              <Download className="w-3 h-3 mr-1" />
              .png
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}