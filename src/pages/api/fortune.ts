import OpenAI from 'openai';
import type { NextApiRequest, NextApiResponse } from 'next';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const question = req.query.question as string;
    const prompt = question
      ? `As a mystical fortune teller, provide a specific response to this question: ${question}`
      : 'As a mystical fortune teller, provide a daily fortune with spiritual insights and guidance for the day ahead. Keep it concise (2-3 sentences).';

    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a mystical fortune teller who speaks in an enchanting and mysterious way, offering insights and guidance. Use mystical and ethereal language, and keep responses concise but impactful."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      stream: true,
      temperature: 0.8,
      max_tokens: 200,
    });

    let fullResponse = '';

    // Stream the response
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        // Send the chunk as an SSE event
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    // Send the final message with lucky numbers
    const luckyNumbers = generateLuckyNumbers();
    res.write(`data: ${JSON.stringify({ 
      done: true,
      content: fullResponse,
      luckyNumbers 
    })}\n\n`);

    res.end();
  } catch (error: any) {
    console.error('Fortune API Error:', error);
    
    const errorMessage = error.code === 'ECONNREFUSED' 
      ? 'OpenAI service is unavailable'
      : error.response?.status === 429 
      ? 'Rate limit exceeded'
      : process.env.NODE_ENV === 'development' ? error.message : 'Unknown error';

    res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
    res.end();
  }
}

function generateLuckyNumbers(): number[] {
  return Array.from({ length: 5 }, () => Math.floor(Math.random() * 100));
} 