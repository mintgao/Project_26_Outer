const API_KEY = import.meta.env.VITE_DASHSCOPE_API_KEY;

export interface AnalysisResult {
  category?: string;
  color?: string;
  season?: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function analyzeImage(imageUrl: string): Promise<AnalysisResult> {
  if (!API_KEY) {
    console.warn('Missing VITE_DASHSCOPE_API_KEY. Returning mock data.');
    return mockAnalysis();
  }

  let lastError: any;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt + 1}/${MAX_RETRIES}...`);
        await delay(RETRY_DELAY * attempt); // Exponential backoff
      }

      // Use proxy path in development to avoid CORS
      const apiUrl = import.meta.env.DEV 
        ? '/api/dashscope/api/v1/services/aigc/multimodal-generation/generation'
        : 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          // 'X-DashScope-WorkSpace': 'modal', // Removed as it causes AccessDenied for some keys
        },
        body: JSON.stringify({
          model: "qwen-vl-plus",
          input: {
            messages: [
              {
                role: "user",
                content: [
                  { image: imageUrl },
                  { text: "请分析这张衣服图片，并返回以下 JSON 格式的信息：\n1. category (只从以下选项中选择: top, bottom, shoes, outerwear, accessory)\n2. color (只从以下选项中选择: black, white, grey, beige, navy, blue, red, green, other)\n3. season (只从以下选项中选择: spring, summer, autumn, winter, all)\n\n请直接返回 JSON，不要包含其他文字。例如: {\"category\": \"top\", \"color\": \"white\", \"season\": \"summer\"}" }
                ]
              }
            ]
          },
          parameters: {}
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Qwen API error: ${response.status} ${response.statusText} - ${errorBody}`);
      }

      const data = await response.json();
      
      // Check for API-level errors even if status is 200
      if (data.code && data.code !== '') {
         throw new Error(`Qwen API logic error: ${data.message || data.code}`);
      }

      const content = data.output?.choices?.[0]?.message?.content?.[0]?.text || data.output?.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('Empty response from AI model');
      }

      // Clean up markdown code blocks if present
      const cleanJson = content.replace(/```json\n?|\n?```/g, '').trim();
      console.log('AI Raw Response:', content); // Debug log
      
      try {
        return JSON.parse(cleanJson);
      } catch (e) {
        console.error('JSON Parse Error:', cleanJson);
        // Try a more aggressive cleanup if simple replace failed
        const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
           return JSON.parse(jsonMatch[0]);
        }
        throw new Error('Failed to parse AI response');
      }

    } catch (error) {
      console.error(`AI Analysis attempt ${attempt + 1} failed:`, error);
      lastError = error;
      // Continue to next retry
    }
  }

  // All retries failed
  throw lastError || new Error('AI Analysis failed after retries');
}

function mockAnalysis(): Promise<AnalysisResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        category: 'top',
        color: 'white',
        season: 'summer'
      });
    }, 1500);
  });
}
