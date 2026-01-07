const API_KEY = import.meta.env.VITE_DASHSCOPE_API_KEY;

export interface AnalysisResult {
  category?: string;
  color?: string;
  season?: string;
}

export async function analyzeImage(imageUrl: string): Promise<AnalysisResult> {
  if (!API_KEY) {
    console.warn('Missing VITE_DASHSCOPE_API_KEY. Returning mock data.');
    return mockAnalysis();
  }

  try {
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'X-DashScope-WorkSpace': 'modal',
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
      throw new Error(`Qwen API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.output?.choices?.[0]?.message?.content?.[0]?.text || data.output?.choices?.[0]?.message?.content;
    
    // Clean up markdown code blocks if present
    const cleanJson = content.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleanJson);

  } catch (error) {
    console.error('AI Analysis failed:', error);
    throw error;
  }
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
