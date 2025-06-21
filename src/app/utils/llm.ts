import { AxAI, AxAIOpenAIModel, AxAgent, type AxFunction } from '@ax-llm/ax';

const ai = new AxAI({
    name: 'openai',
    apiKey: process.env.OPENAI_API_KEY as string,
    config: { model: AxAIOpenAIModel.GPT4OMini }
  });

const quoteFactAgent = new AxAgent({
    name: 'QuoteFactCreator',
    description: 'Converts quotes into exact fact nodes',
    signature: `quotes:json -> factNodes:json
      "Convert each quote into an exact fact node. DO NOT modify quote text!
      
      For each quote, create a fact node in this EXACT format:
      {
        'type': 'fact',
        'title': 'Quote from [Source Name]',
        'content': '[EXACT QUOTE TEXT - DO NOT CHANGE]',
        'source': '[Source Name]'
      }
      
      Return an array of fact nodes, one for each quote."
    `
  });