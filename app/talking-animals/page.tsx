'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Coins,
  Loader2,
  Sparkles,
  Video,
} from 'lucide-react'

import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import VideoPlayer from '@/components/VideoPlayer'
import { deductCredits } from '@/lib/credits-utils'
import {
  defaultGeneratorConfig,
  getActiveGenerators,
} from '@/lib/video-generator-config'

export default function TalkingAnimalsContent() {
  const { user, profile } = useAuth()
  const { toast } = useToast()

  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null)

  const activeGenerators = useMemo(
    () => getActiveGenerators(),
    []
  )

  const primaryGenerator = activeGenerators[0] || defaultGeneratorConfig

  const creditCost = primaryGenerator?.creditCost || 50

  const isOwner = profile?.role === 'owner'

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    if (!prompt.trim()) {
      toast({
        title: 'Prompt required',
        description: 'Please describe the talking animal video you want to create.',
        variant: 'destructive',
      })
      return
    }

    if (!user?.uid) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in before generating a video.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    setGeneratedVideo(null)

    try {
      // Owners have unlimited generation access and do not need credits.
      if (!isOwner && (profile?.credits || 0) < creditCost) {
        toast({
          title: 'Insufficient credits',
          description: `You need ${creditCost} credits to generate this video.`,
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      if (!primaryGenerator?.enabled) {
        toast({
          title: 'Generator unavailable',
          description: 'The talking animals generator is currently unavailable.',
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      // deductCredits() is already configured to skip deductions
      // for owner accounts.
      const result = await deductCredits(
        user.uid,
        creditCost,
        `Talking animals video generation (${primaryGenerator.name})`
      )

      if (!result.success) {
        toast({
          title: 'Generation failed',
          description:
            result.error ||
            'Unable to process your credits. Please try again.',
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      // Simulated generation while the actual video generation service
      // is being connected.
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setGeneratedVideo(
        'https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4'
      )

      toast({
        title: 'Video generated',
        description: isOwner
          ? 'Your owner account has unlimited generation access.'
          : 'Your video has been generated successfully.',
      })
    } catch (error) {
      console.error(
        '[AZIBO] Talking animals generation error:',
        error
      )

      toast({
        title: 'Generation failed',
        description: 'Something went wrong while generating your video.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <Link
                href="/"
                className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to dashboard
              </Link>

              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-3">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>

                <div>
                  <h1 className="text-2xl font-bold">
                    Talking Animals
                  </h1>

                  <p className="text-sm text-muted-foreground">
                    Create entertaining AI talking animal videos.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2">
              <Coins className="h-5 w-5 text-yellow-500" />

              <span className="text-sm font-medium">
                Credits:{' '}
                {isOwner
                  ? 'Unlimited'
                  : profile?.credits?.toLocaleString() || 0}
              </span>
            </div>
          </div>

          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl font-semibold">
                  Create your talking animal
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Describe the animal, its appearance, personality,
                  dialogue, and the scene you want.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="prompt"
                    className="mb-2 block text-sm font-medium"
                  >
                    Video prompt
                  </label>

                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(event) =>
                      setPrompt(event.target.value)
                    }
                    placeholder="Example: A funny golden retriever wearing sunglasses talks to a cat in a beautiful garden..."
                    className="min-h-[180px] w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    disabled={loading}
                  />
                </div>

                <div className="rounded-xl border bg-muted/30 p-4">
                  <div className="flex items-center gap-3">
                    <Video className="h-5 w-5 text-primary" />

                    <div className="flex-1">
                      <p className="font-medium">
                        {primaryGenerator.name}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        Generate an AI talking animal video.
                      </p>
                    </div>

                    <div className="text-right text-sm">
                      <p className="font-semibold">
                        {isOwner
                          ? 'Unlimited'
                          : `${creditCost} credits`}
                      </p>

                      {!isOwner && (
                        <p className="text-muted-foreground">
                          per generation
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Generate Talking Animal Video
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 rounded-xl border bg-muted/20 p-4 text-sm">
                <p className="text-muted-foreground">
                  Your current balance:{' '}
                  <span className="font-semibold text-foreground">
                    {isOwner
                      ? 'Unlimited'
                      : profile?.credits || 0}
                  </span>{' '}
                  {isOwner ? '' : 'credits'}
                </p>
              </div>
            </div>

            {generatedVideo && (
              <div className="mt-8 rounded-2xl border bg-card p-6 shadow-sm">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold">
                    Your generated video
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    Watch your generated video before downloading it.
                  </p>
                </div>

                <VideoPlayer
                  videoUrl={generatedVideo}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
    }
