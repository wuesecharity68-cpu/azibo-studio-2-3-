'use client'

import { useState } from 'react'
import { Download, RotateCcw, Share2 } from 'lucide-react'
import { useToast } from '@/lib/hooks/useToast'

interface VideoPlayerProps {
  videoUrl: string
  videoId: string
  onRegenerate?: () => void
  onDownload?: (addWatermark: boolean) => void | Promise<void>
  isLoading?: boolean
  userRole?: 'user' | 'owner'
  subscriptionPlan?: 'free' | 'starter' | 'creator' | 'pro'
  fileSizeMB?: string
}

export function VideoPlayer({
  videoUrl,
  videoId,
  onRegenerate,
  onDownload,
  isLoading = false,
  userRole = 'user',
  subscriptionPlan = 'free',
  fileSizeMB = '',
}: VideoPlayerProps) {
  const [downloading, setDownloading] = useState(false)
  const { success, error } = useToast()

  const isFreeUser = subscriptionPlan === 'free'

  const shouldShowWatermarkNotice =
    isFreeUser && userRole === 'user'

  const handleDownload = async () => {
    try {
      setDownloading(true)

      const addWatermark = isFreeUser

      if (onDownload) {
        await onDownload(addWatermark)
      }

      success('Video downloaded successfully')
    } catch (err) {
      console.error('[AZIBO] Download error:', err)
      error('Failed to download video')
    } finally {
      setDownloading(false)
    }
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Check out my AI video from AZIBO STUDIO',
          text: 'I created this amazing video using AZIBO STUDIO AI video generator',
          url: window.location.href,
        })

        success('Video shared successfully')
      } else {
        await navigator.clipboard.writeText(window.location.href)
        success('Link copied to clipboard')
      }
    } catch (err) {
      console.error('[AZIBO] Share error:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Video Player */}
      <div className="relative w-full bg-background border border-border rounded-lg overflow-hidden">
        <video
          src={videoUrl}
          controls
          playsInline
          className="w-full aspect-video bg-black"
        />
      </div>

      {/* Watch Before Downloading Notice */}
      <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
        <p className="text-sm text-foreground text-center">
          <span className="font-semibold text-primary">
            Watch your video before downloading.
          </span>{' '}
          Please review the generated video above to make sure
          you&apos;re satisfied with it before downloading.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        {/* Regenerate Button */}
        {onRegenerate && (
          <button
            type="button"
            onClick={onRegenerate}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            {isLoading ? 'Generating...' : 'Regenerate Video'}
          </button>
        )}

        {/* Download Button */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading || !onDownload}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="h-4 w-4" />

          {downloading
            ? 'Downloading...'
            : isFreeUser
              ? `Download (${fileSizeMB} with Watermark)`
              : `Download (${fileSizeMB})`}
        </button>

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors"
        >
          <Share2 className="h-4 w-4" />
          Share
        </button>
      </div>

      {/* Watermark Notice */}
      {shouldShowWatermarkNotice && (
        <div className="p-4 bg-card border border-border rounded-lg">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-primary">
              AZIBO STUDIO Watermark:
            </span>{' '}
            All free tier videos include our watermark. Upgrade to a
            paid plan to remove the watermark and unlock premium
            features.
          </p>
        </div>
      )}
    </div>
  )
  }
