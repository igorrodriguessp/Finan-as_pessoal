import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, Category } from '../types';

// Ensure API key is available
const apiKey = process.env.API_KEY || '';
if (!apiKey) {
  console.warn("Missing API_KEY in environment variables. Gemini features will fail.");
}

const ai = new GoogleGenAI({ apiKey });

// Helper to convert File to Base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64 = base64String.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzeReceipt = async (file: File): Promise<Partial<Transaction>> => {
  const base64Data = await fileToGenerativePart(file);

  const model = "gemini-2.5-flash";
  
  // Prompt otimizado para recibos brasileiros
  const prompt = `Você é um especialista em OCR e contabilidade brasileira. Analise a imagem deste recibo/cupom fiscal.
  Extraia as seguintes informações com precisão:
  
  1. **Merchant (Estabelecimento)**: O nome fantasia do local. Remova CNPJ, endereços ou códigos.
  2. **Amount (Valor)**: O valor total da compra. Retorne um número (float). Se tiver "R$", ignore o símbolo.
  3. **Date (Data)**: A data da transação. Converta qualquer formato encontrado (ex: DD/MM/YYYY) para o formato ISO padrão: YYYY-MM-DD.
  4. **Category (Categoria)**: Classifique o gasto EXATAMENTE em uma destas categorias:
     - Alimentação
     - Transporte
     - Habitação
     - Utilidades
     - Entretenimento
     - Saúde
     - Compras
     - Salário
     - Investimento
     - Outros

  Retorne APENAS o JSON.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType: file.type, data: base64Data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchant: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            date: { type: Type.STRING },
            category: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Sem resposta da IA");
    
    const data = JSON.parse(text);
    
    // Map AI category to our enum, default to Other if mismatch
    let category = Category.Other;
    
    // Normalize string comparisons
    const aiCat = data.category ? data.category.trim() : '';
    const match = Object.values(Category).find(c => c.toLowerCase() === aiCat.toLowerCase());
    
    if (match) {
      category = match;
    }

    return {
      merchant: data.merchant,
      amount: data.amount,
      date: data.date,
      category: category,
      type: 'expense' // Receipts are usually expenses
    };
  } catch (error) {
    console.error("Erro ao analisar recibo:", error);
    throw error;
  }
};

export const getFinancialAdvice = async (
  query: string, 
  transactions: Transaction[]
): Promise<string> => {
  const recentTransactions = transactions.slice(0, 50); // Send last 50 to avoid huge context
  const context = JSON.stringify(recentTransactions.map(t => ({
    date: t.date,
    merchant: t.merchant,
    amount: t.amount,
    category: t.category,
    type: t.type
  })));

  const prompt = `Você é um consultor financeiro pessoal.
  Aqui está uma lista das transações recentes do usuário: ${context}.
  
  Pergunta do Usuário: "${query}"
  
  Forneça uma resposta útil, concisa e acionável com base nos dados, se relevante. Responda em Português do Brasil. Use markdown para formatação.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "Você é um assistente financeiro útil. Seja encorajador, mas realista. Fale sempre em Português."
      }
    });

    return response.text || "Não consegui gerar uma resposta no momento.";
  } catch (error) {
    console.error("Erro ao obter conselho:", error);
    return "Desculpe, estou com problemas para me conectar ao meu cérebro financeiro agora. Por favor, tente novamente mais tarde.";
  }
};