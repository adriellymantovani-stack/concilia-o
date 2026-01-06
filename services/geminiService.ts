
import { GoogleGenAI, Type } from "@google/genai";
import { Expense } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const extractExpensesFromStatement = async (input: string | File): Promise<Partial<Expense>[]> => {
  let contents: any;

  if (typeof input === 'string') {
    contents = `Analise este extrato ou lista de transações e extraia as despesas individuais. 
    Retorne apenas os dados estruturados de compras. Ignore pagamentos da fatura ou créditos.
    Texto do extrato: ${input}`;
  } else {
    // Handle file (image of statement)
    const base64Data = await fileToBase64(input);
    contents = {
      parts: [
        { text: "Extraia todas as transações de compra deste extrato de cartão de crédito. Retorne uma lista de objetos com data, descrição e valor numérico positivo." },
        { inlineData: { mimeType: input.type, data: base64Data } }
      ]
    };
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: contents,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING, description: "Data da transação (ex: 15/05)" },
            description: { type: Type.STRING, description: "Nome do estabelecimento ou descrição" },
            amount: { type: Type.NUMBER, description: "Valor da transação como número positivo" },
            category: { type: Type.STRING, description: "Categoria sugerida (ex: Alimentação, Transporte, Lazer)" }
          },
          required: ["date", "description", "amount"]
        }
      }
    }
  });

  try {
    const data = JSON.parse(response.text || '[]');
    return data.map((item: any) => ({
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      receiptAttached: false
    }));
  } catch (error) {
    console.error("Error parsing Gemini response:", error);
    return [];
  }
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = error => reject(error);
  });
};
