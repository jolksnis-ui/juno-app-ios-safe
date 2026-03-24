// services/claudeAPI.ts
interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{
    type: 'text';
    text: string;
  }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

interface ClaudeStreamChunk {
  type: string;
  message?: {
    id: string;
    type: string;
    role: string;
    content: any[];
    model: string;
    stop_reason: string | null;
    stop_sequence: string | null;
    usage: {
      input_tokens: number;
      output_tokens: number;
    };
  };
  index?: number;
  content_block?: {
    type: string;
    text: string;
  };
  delta?: {
    type: string;
    text: string;
  };
}

class ClaudeAPI {
  private apiKey: string;
  private baseUrl = 'https://api.anthropic.com/v1';
  private model = 'claude-3-5-sonnet-20241022';
  private maxTokens = 1024;
  private version = '2023-06-01';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Basic message sending (non-streaming)
  async sendMessage(
    messages: ClaudeMessage[],
    systemPrompt?: string,
    options?: {
      maxTokens?: number;
      temperature?: number;
      topP?: number;
    }
  ): Promise<string> {
    try {
      const requestBody = {
        model: this.model,
        max_tokens: options?.maxTokens || this.maxTokens,
        messages: messages,
        ...(systemPrompt && { system: systemPrompt }),
        ...(options?.temperature && { temperature: options.temperature }),
        ...(options?.topP && { top_p: options.topP }),
      };

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': this.version,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Claude API error: ${response.status} ${response.statusText} - ${
            errorData.error?.message || 'Unknown error'
          }`
        );
      }

      const data: ClaudeResponse = await response.json();
      return data.content[0]?.text || '';
    } catch (error) {
      console.error('Claude API sendMessage error:', error);
      throw error;
    }
  }

  // Streaming message (real-time response)
  async streamMessage(
    messages: ClaudeMessage[],
    onChunk: (chunk: string) => void,
    onComplete?: (fullResponse: string) => void,
    onError?: (error: Error) => void,
    systemPrompt?: string,
    options?: {
      maxTokens?: number;
      temperature?: number;
      topP?: number;
    }
  ): Promise<void> {
    let fullResponse = '';

    try {
      const requestBody = {
        model: this.model,
        max_tokens: options?.maxTokens || this.maxTokens,
        messages: messages,
        stream: true,
        ...(systemPrompt && { system: systemPrompt }),
        ...(options?.temperature && { temperature: options.temperature }),
        ...(options?.topP && { top_p: options.topP }),
      };

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': this.version,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Claude API error: ${response.status} ${response.statusText} - ${
            errorData.error?.message || 'Unknown error'
          }`
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last potentially incomplete line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6).trim();
              
              // Skip empty data or ping messages
              if (!jsonStr || jsonStr === '[DONE]') continue;
              
              const data: ClaudeStreamChunk = JSON.parse(jsonStr);
              
              // Handle different types of streaming events
              if (data.type === 'content_block_delta' && data.delta?.text) {
                const chunk = data.delta.text;
                fullResponse += chunk;
                onChunk(chunk);
              } else if (data.type === 'message_delta' && data.delta) {
                // Handle message completion
                continue;
              }
            } catch (parseError) {
              // Skip malformed JSON lines
              console.warn('Failed to parse streaming chunk:', parseError);
              continue;
            }
          }
        }
      }

      // Call completion callback
      if (onComplete) {
        onComplete(fullResponse);
      }

    } catch (error) {
      console.error('Claude API streamMessage error:', error);
      if (onError) {
        onError(error instanceof Error ? error : new Error('Unknown streaming error'));
      } else {
        throw error;
      }
    }
  }

  // Validate API key
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': this.version,
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hello' }],
        }),
      });

      return response.status !== 401;
    } catch (error) {
      return false;
    }
  }

  // Get token count estimation (rough approximation)
  estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token for English text
    return Math.ceil(text.length / 4);
  }

  // Calculate cost estimation (based on current pricing)
  estimateCost(inputTokens: number, outputTokens: number): number {
    // Claude 3.5 Sonnet pricing: $3/1M input tokens, $15/1M output tokens
    const inputCost = (inputTokens / 1000000) * 3;
    const outputCost = (outputTokens / 1000000) * 15;
    return inputCost + outputCost;
  }

  // Set model configuration
  setModel(model: string): void {
    this.model = model;
  }

  setMaxTokens(maxTokens: number): void {
    this.maxTokens = maxTokens;
  }

  // Get current configuration
  getConfig() {
    return {
      model: this.model,
      maxTokens: this.maxTokens,
      baseUrl: this.baseUrl,
    };
  }
}

// Factory function to create Claude API instance
export const createClaudeAPI = (apiKey: string): ClaudeAPI => {
  if (!apiKey) {
    throw new Error('Claude API key is required');
  }
  return new ClaudeAPI(apiKey);
};

// Export types
export type { ClaudeMessage, ClaudeResponse, ClaudeStreamChunk };
export { ClaudeAPI };
