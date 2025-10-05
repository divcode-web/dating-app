import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '')

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
      return NextResponse.json(
        { error: 'Google Gemini API key not configured' },
        { status: 500 }
      )
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

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

Format the response as JSON with this structure:
{
  "title": "Blog post title",
  "excerpt": "Brief 2-3 sentence summary for preview",
  "content": "Full blog post content in HTML format with proper paragraphs, headings (h2, h3), lists, and emphasis",
  "tags": ["tag1", "tag2", "tag3"],
  "meta_description": "SEO-friendly meta description (150-160 characters)"
}

Make it authentic, helpful, and engaging for people navigating the dating world.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Try to extract JSON from the response
    let blogData
    try {
      // Remove markdown code blocks if present
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      blogData = JSON.parse(cleanText)
    } catch (parseError) {
      // If JSON parsing fails, create a structured response
      blogData = {
        title: topic,
        excerpt: text.substring(0, 200) + '...',
        content: text.replace(/\n\n/g, '</p><p>').replace(/^/, '<p>').replace(/$/, '</p>'),
        tags: ['dating', 'relationships', 'love'],
        meta_description: text.substring(0, 155) + '...'
      }
    }

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
