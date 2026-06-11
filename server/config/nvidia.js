import { OpenAI } from 'openai';

let nvidiaClient = null;

export function initializeNvidiaNIM() {
  try {
    console.log('[v0] Initializing NVIDIA NIM client...');
    nvidiaClient = new OpenAI({
      apiKey: process.env.NVIDIA_NIM_API_KEY,
      baseURL: process.env.NVIDIA_NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1',
      defaultHeaders: {
        'User-Agent': 'ProjectHive/1.0',
      },
    });
    console.log('[v0] NVIDIA NIM client initialized');
    return nvidiaClient;
  } catch (error) {
    console.error('[v0] Failed to initialize NVIDIA NIM:', error.message);
    throw error;
  }
}

export function getNvidiaClient() {
  if (!nvidiaClient) {
    throw new Error('NVIDIA NIM client not initialized. Call initializeNvidiaNIM() first.');
  }
  return nvidiaClient;
}
