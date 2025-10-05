import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

// Initialize the client with API key from environment
const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GEMINI_API_KEY || ''
})

export async function POST(request: NextRequest) {
  try {
    const { topic, tone, length } = await request.json()

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      )
    }

    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      console.error('GOOGLE_GEMINI_API_KEY not configured')
      return NextResponse.json(
        {
          error: 'AI service not configured. Please add GOOGLE_GEMINI_API_KEY to your environment variables.',
          setup_required: true,
          instructions: 'Get your API key from: https://ai.google.dev/gemini-api/docs/api-key',
          debug: {
            hasKey: false,
            nodeEnv: process.env.NODE_ENV,
            vercelEnv: process.env.VERCEL_ENV
          }
        },
        { status: 500 }
      )
    }

    const lengthGuide = length === 'short' ? '300-500 words' : length === 'long' ? '1000-1500 words' : '600-800 words'
    const toneGuide = tone || 'professional and engaging'

    const prompt = `Write a compelling blog post about "${topic}" for a dating app blog.

Requirements:
- Tone: ${toneGuide}
- Length: ${lengthGuide}
- Include a catchy title
- Write an engaging introduction
- Provide valuable insights and tips
- End with a strong conclusion
- Use a friendly, relatable voice that resonates with singles looking for love

Format the response as JSON with this exact structure:
{
  "title": "Blog post title",
  "excerpt": "Brief 2-3 sentence summary for preview",
  "content": "Full blog post content in HTML format with proper paragraphs, headings (h2, h3), lists, and emphasis",
  "tags": ["tag1", "tag2", "tag3"],
  "meta_description": "SEO-friendly meta description (150-160 characters)",
  "image_query": "unsplash search query for a relevant image (3-4 words)"
}

Make it authentic, helpful, and engaging for people navigating the dating world. Return ONLY valid JSON, no markdown code blocks.`

    let text

    try {
      // Use Gemini 2.0 Flash model with the new API
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: prompt
      })

      if (!response || !response.text) {
        throw new Error('No response received from Gemini API')
      }

      text = response.text

      if (!text || text.trim().length === 0) {
        throw new Error('Empty response received from Gemini API')
      }
    } catch (apiError: any) {
      console.error('Gemini API Error:', {
        message: apiError?.message,
        status: apiError?.status,
        statusText: apiError?.statusText,
        details: apiError
      })

      // Provide more specific error messages
      const errorMessage = apiError?.message || 'Unknown API error'
      if (errorMessage.includes('API_KEY') || errorMessage.includes('apiKey')) {
        throw new Error('Invalid API key provided to Gemini')
      } else if (errorMessage.includes('QUOTA') || errorMessage.includes('quota')) {
        throw new Error('Gemini API quota exceeded. Please try again later or check your billing.')
      } else if (errorMessage.includes('PERMISSION') || errorMessage.includes('permission')) {
        throw new Error('Gemini API access denied. Please check your API key permissions.')
      } else {
        throw new Error(`Gemini API error: ${errorMessage}`)
      }
    }

    // Try to extract JSON from the response
    let blogData
    try {
      // Remove markdown code blocks if present
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      blogData = JSON.parse(cleanText)
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Raw text:', text)
      // If JSON parsing fails, create a structured response
      blogData = {
        title: topic,
        excerpt: text.substring(0, 200) + '...',
        content: text.replace(/\n\n/g, '</p><p>').replace(/^/, '<p>').replace(/$/, '</p>'),
        tags: ['dating', 'relationships', 'love'],
        meta_description: text.substring(0, 155) + '...',
        image_query: 'couple dating love romance'
      }
    }

    // Fetch image from Unsplash
    let featuredImage = 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800'

    if (process.env.UNSPLASH_ACCESS_KEY && blogData.image_query) {
      try {
        const unsplashResponse = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(blogData.image_query)}&per_page=1&orientation=landscape`,
          {
            headers: {
              Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
            },
          }
        )

        const unsplashData = await unsplashResponse.json()
        if (unsplashData.results && unsplashData.results.length > 0) {
          featuredImage = unsplashData.results[0].urls.regular
        }
      } catch (unsplashError) {
        console.error('Unsplash fetch error:', unsplashError)
        // Continue with default image
      }
    }

    blogData.featured_image = featuredImage

    return NextResponse.json({
      success: true,
      blog: blogData
    })

  } catch (error: any) {
    console.error('AI blog generation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate blog post',
        details: error.message
      },
      { status: 500 }
    )
  }
}
