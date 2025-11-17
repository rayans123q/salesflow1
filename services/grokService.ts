// Grok AI Service (xAI) - Fallback option
// API: https://api.x.ai/v1/chat/completions

const GROK_API_KEY = import.meta.env.VITE_GROK_API_KEY || '';
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

class GrokService {
  private apiKey: string;

  constructor() {
    this.apiKey = GROK_API_KEY;
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  async generateContent(prompt: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Grok API key not configured');
    }

    try {
      console.log('🤖 Using Grok AI (xAI)...');
      
      const response = await fetch(GROK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant that generates high-quality content.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          model: 'grok-4-latest',
          stream: false,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Grok API error:', response.status, errorText);
        throw new Error(`Grok API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from Grok API');
      }

      const content = data.choices[0].message.content;
      console.log('✅ Content generated with Grok');
      
      return content;
      
    } catch (error: any) {
      console.error('❌ Grok service error:', error);
      throw error;
    }
  }
}

export const grokService = new GrokService();
