import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Palette, 
  Image as ImageIcon, 
  Upload, 
  X, 
  Monitor,
  Check,
  Sparkles,
  Grid3X3,
  Maximize2,
  Droplets
} from "lucide-react"

// Comprehensive color palette
const COLOR_THEMES = [
  { name: "Ocean Blue", primary: "#3b82f6", secondary: "#60a5fa", accent: "#93c5fd" },
  { name: "Emerald Green", primary: "#10b981", secondary: "#34d399", accent: "#6ee7b7" },
  { name: "Purple Magic", primary: "#8b5cf6", secondary: "#a78bfa", accent: "#c4b5fd" },
  { name: "Rose Pink", primary: "#f43f5e", secondary: "#fb7185", accent: "#fda4af" },
  { name: "Amber Gold", primary: "#f59e0b", secondary: "#fbbf24", accent: "#fcd34d" },
  { name: "Cyan Sky", primary: "#06b6d4", secondary: "#22d3ee", accent: "#67e8f9" },
  { name: "Indigo Night", primary: "#6366f1", secondary: "#818cf8", accent: "#a5b4fc" },
  { name: "Teal Wave", primary: "#14b8a6", secondary: "#2dd4bf", accent: "#5eead4" },
  { name: "Orange Sunset", primary: "#f97316", secondary: "#fb923c", accent: "#fdba74" },
  { name: "Lime Fresh", primary: "#84cc16", secondary: "#a3e635", accent: "#bef264" },
  { name: "Violet Dream", primary: "#7c3aed", secondary: "#8b5cf6", accent: "#a78bfa" },
  { name: "Crimson Red", primary: "#dc2626", secondary: "#ef4444", accent: "#f87171" },
  { name: "Slate Modern", primary: "#475569", secondary: "#64748b", accent: "#94a3b8" },
  { name: "Pink Candy", primary: "#ec4899", secondary: "#f472b6", accent: "#f9a8d4" },
  { name: "Yellow Sunny", primary: "#eab308", secondary: "#facc15", accent: "#fde047" },
  { name: "Mint Cool", primary: "#10b981", secondary: "#34d399", accent: "#6ee7b7" },
]

// Special Gradient Themes - Classy & Modern
const SPECIAL_THEMES = [
  { 
    name: "Midnight Gradient", 
    primary: "#667eea", 
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    accent: "#a78bfa"
  },
  { 
    name: "Sunset Boulevard", 
    primary: "#f093fb", 
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    accent: "#fb7185"
  },
  { 
    name: "Ocean Breeze", 
    primary: "#4facfe", 
    gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    accent: "#22d3ee"
  },
  { 
    name: "Forest Mist", 
    primary: "#43e97b", 
    gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    accent: "#34d399"
  },
  { 
    name: "Golden Hour", 
    primary: "#fa709a", 
    gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    accent: "#fbbf24"
  },
  { 
    name: "Arctic Frost", 
    primary: "#a8edea", 
    gradient: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    accent: "#a5f3fc"
  },
  { 
    name: "Neon Dreams", 
    primary: "#b721ff", 
    gradient: "linear-gradient(135deg, #b721ff 0%, #21d4fd 100%)",
    accent: "#c084fc"
  },
  { 
    name: "Warm Ember", 
    primary: "#ff9a9e", 
    gradient: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)",
    accent: "#fda4af"
  },
  { 
    name: "Deep Space", 
    primary: "#0c3483", 
    gradient: "linear-gradient(135deg, #0c3483 0%, #a2b6df 100%, #6b8cce 100%, #a2b6df 100%)",
    accent: "#60a5fa"
  },
  { 
    name: "Tropical Paradise", 
    primary: "#42e695", 
    gradient: "linear-gradient(135deg, #42e695 0%, #3bb2b8 100%)",
    accent: "#2dd4bf"
  },
  { 
    name: "Berry Smoothie", 
    primary: "#8b5cf6", 
    gradient: "linear-gradient(135deg, #8b5cf6 0%, #d946ef 50%, #f43f5e 100%)",
    accent: "#c084fc"
  },
  { 
    name: "Monochrome Dark", 
    primary: "#2d3748", 
    gradient: "linear-gradient(135deg, #2d3748 0%, #1a202c 100%)",
    accent: "#94a3b8"
  },
]

interface SystemSettingsProps {
  accentColor: string
  setAccentColor: (color: string) => void
  wallpaper: string | null
  setWallpaper: (wallpaper: string | null) => void
  wallpaperMode: 'cover' | 'contain' | 'repeat'
  setWallpaperMode: (mode: 'cover' | 'contain' | 'repeat') => void
  wallpaperBlur: number
  setWallpaperBlur: (blur: number) => void
  wallpaperOpacity: number
  setWallpaperOpacity: (opacity: number) => void
  setGradientTheme?: (gradient: string | null) => void
}

export function SystemSettings({
  accentColor,
  setAccentColor,
  wallpaper,
  setWallpaper,
  wallpaperMode,
  setWallpaperMode,
  wallpaperBlur,
  setWallpaperBlur,
  wallpaperOpacity,
  setWallpaperOpacity,
  setGradientTheme,
}: SystemSettingsProps) {
  const [activeTab, setActiveTab] = useState<'colors' | 'special' | 'wallpaper'>('colors')
  const [selectedGradient, setSelectedGradient] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleColorSelect = (color: string) => {
    setAccentColor(color)
    localStorage.setItem('accentColor', color)
    
    // Apply CSS variable directly
    document.documentElement.style.setProperty('--accent-color', color)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setWallpaper(result)
        localStorage.setItem('wallpaper', result)
      }
      reader.readAsDataURL(file)
    }
  }

  const clearWallpaper = () => {
    setWallpaper(null)
    localStorage.removeItem('wallpaper')
  }

  const handleBlurChange = (value: number) => {
    setWallpaperBlur(value)
    localStorage.setItem('wallpaperBlur', value.toString())
  }

  const handleOpacityChange = (value: number) => {
    setWallpaperOpacity(value)
    localStorage.setItem('wallpaperOpacity', value.toString())
  }

  const handleModeChange = (mode: 'cover' | 'contain' | 'repeat') => {
    setWallpaperMode(mode)
    localStorage.setItem('wallpaperMode', mode)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b pb-4 flex-wrap">
        <Button
          variant={activeTab === 'colors' ? 'default' : 'outline'}
          onClick={() => setActiveTab('colors')}
          className="gap-2"
        >
          <Palette className="h-4 w-4" />
          Color Theme
        </Button>
        <Button
          variant={activeTab === 'special' ? 'default' : 'outline'}
          onClick={() => setActiveTab('special')}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Special Themes
        </Button>
        <Button
          variant={activeTab === 'wallpaper' ? 'default' : 'outline'}
          onClick={() => setActiveTab('wallpaper')}
          className="gap-2"
        >
          <ImageIcon className="h-4 w-4" />
          Wallpaper
        </Button>
      </div>

      {activeTab === 'colors' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Sparkles className="h-5 w-5" style={{ color: accentColor }} />
              Choose Your Color Theme
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Select from our curated collection of beautiful color themes to personalize your experience
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {COLOR_THEMES.map((theme) => (
              <button
                key={theme.name}
                onClick={() => handleColorSelect(theme.primary)}
                className={`group relative p-3 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                  accentColor === theme.primary
                    ? 'ring-2 ring-offset-2'
                    : 'border-border hover:border-gray-400'
                }`}
                style={{
                  borderColor: accentColor === theme.primary ? theme.primary : undefined,
                  '--tw-ring-color': accentColor === theme.primary ? theme.primary : undefined,
                } as React.CSSProperties}
              >
                <div 
                  className="w-full h-16 rounded-lg mb-2 shadow-inner"
                  style={{
                    background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 50%, ${theme.accent} 100%)`
                  }}
                />
                <p className="text-xs font-medium text-center truncate">{theme.name}</p>
                {accentColor === theme.primary && (
                  <div 
                    className="absolute top-2 right-2 rounded-full p-1"
                    style={{ backgroundColor: theme.primary }}
                  >
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div 
                  className="w-20 h-20 rounded-xl shadow-lg"
                  style={{ backgroundColor: accentColor }}
                />
                <div>
                  <h4 className="font-medium">Current Selection</h4>
                  <p className="text-sm text-muted-foreground">{accentColor}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This color is now active throughout the dashboard
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'special' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Sparkles className="h-5 w-5" style={{ color: accentColor }} />
              Special Gradient Themes
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Choose from our exclusive collection of classy gradient themes for a premium look
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SPECIAL_THEMES.map((theme) => (
              <button
                key={theme.name}
                onClick={() => {
                  setSelectedGradient(theme.gradient)
                  handleColorSelect(theme.primary)
                  localStorage.setItem('gradientTheme', theme.gradient)
                  if (setGradientTheme) {
                    setGradientTheme(theme.gradient)
                  }
                }}
                className={`group relative p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                  selectedGradient === theme.gradient
                    ? 'ring-2 ring-offset-2 border-primary'
                    : 'border-border hover:border-gray-400'
                }`}
                style={{
                  background: theme.gradient,
                  borderColor: selectedGradient === theme.gradient ? theme.primary : undefined,
                }}
              >
                <div className="h-24 rounded-lg mb-3 shadow-lg bg-white/10 backdrop-blur-sm" />
                <p className="text-sm font-bold text-center text-white drop-shadow-md">{theme.name}</p>
                {selectedGradient === theme.gradient && (
                  <div 
                    className="absolute top-3 right-3 bg-white rounded-full p-1.5 shadow-lg"
                  >
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div 
                  className="w-20 h-20 rounded-xl shadow-lg"
                  style={{ 
                    background: selectedGradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  }}
                />
                <div>
                  <h4 className="font-medium">Current Gradient</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedGradient ? 'Custom gradient theme active' : 'Select a gradient theme'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    These themes provide a classy, modern appearance
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'wallpaper' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Monitor className="h-5 w-5" style={{ color: accentColor }} />
              Dashboard Wallpaper
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload your own image to use as a beautiful background with effects
            </p>
          </div>

          {!wallpaper ? (
            <Card 
              className="border-dashed border-2 hover:border-gray-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div 
                  className="rounded-full p-4 mb-4"
                  style={{ backgroundColor: `${accentColor}20` }}
                >
                  <Upload className="h-8 w-8" style={{ color: accentColor }} />
                </div>
                <p className="font-medium">Click to upload wallpaper</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Supports JPG, PNG, GIF, WEBP up to 10MB
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                    <img
                      src={wallpaper}
                      alt="Wallpaper preview"
                      className="w-full h-full object-cover"
                    />
                    <div 
                      className="absolute inset-0 bg-black/20"
                      style={{ backdropFilter: `blur(${wallpaperBlur}px)` }}
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={clearWallpaper}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                        <Grid3X3 className="h-4 w-4" />
                        Display Mode
                      </label>
                      <div className="flex gap-2">
                        {(['cover', 'contain', 'repeat'] as const).map((mode) => (
                          <Button
                            key={mode}
                            variant={wallpaperMode === mode ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleModeChange(mode)}
                            className="capitalize"
                            style={wallpaperMode === mode ? { backgroundColor: accentColor, borderColor: accentColor } : undefined}
                          >
                            {mode}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                        <Droplets className="h-4 w-4" />
                        Blur Effect ({wallpaperBlur}px)
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        value={wallpaperBlur}
                        onChange={(e) => handleBlurChange(Number(e.target.value))}
                        className="w-full"
                        style={{ accentColor: accentColor }}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                        <Maximize2 className="h-4 w-4" />
                        Background Darkness ({Math.round(wallpaperOpacity * 100)}%)
                      </label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Increase to make text more readable
                      </p>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={wallpaperOpacity * 100}
                        onChange={(e) => handleOpacityChange(Number(e.target.value) / 100)}
                        className="w-full"
                        style={{ accentColor: accentColor }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-muted/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Maximize2 className="h-4 w-4" />
                  Cover Mode
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Image fills the entire screen, may be cropped
                </p>
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4" />
                  Contain Mode
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Full image visible, may have empty spaces
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}