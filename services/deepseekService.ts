// DeepSeek AI Service - Fallback when Gemini is overloaded
// DeepSeek API is compatible with OpenAI's API format

const DEEPSEEK_API_KEY = (import.meta as any).env?.VITE_DEEPSEEK_API_KEY;
const DEEPSEEK_API_BASE = 'https://api.deepseek.com/v1';

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

class DeepSeekService {
  private apiKey: string;

  constructor() {
    this.apiKey = DEEPSEEK_API_KEY || '';
    if (this.apiKey) {
      console.log('🤖 DeepSeek AI initialized as fallback');
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  async generateContent(prompt: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('DeepSeek API key not configured');
    }

    console.log('🔄 Using DeepSeek AI (Gemini fallback)...');

    const messages: DeepSeekMessage[] = [
      {
        role: 'user',
        content: prompt,
      },
    ];

    try {
      const response = await fetch(`${DEEPSEEK_API_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat', // or 'deepseek-coder' for code-specific tasks
          messages,
          temperature: 0.7,
          max_tokens: 4000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ DeepSeek API error:', response.status, errorText);
        throw new Error(`DeepSeek API error: ${response.status}`);
      }

      const data: DeepSeekResponse = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content in DeepSeek response');
      }

      console.log('✅ DeepSeek analysis complete');
      return content;
    } catch (error) {
      console.error('❌ DeepSeek request failed:', error);
      throw error;
    }
  }
}

export const deepseekService = new DeepSeekService();
