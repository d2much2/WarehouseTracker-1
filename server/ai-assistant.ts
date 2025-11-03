import OpenAI from 'openai';
import { storage } from './storage';

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function getInventoryContext() {
  const [products, warehouses, lowStock, kpis] = await Promise.all([
    storage.getAllProducts(),
    storage.getAllWarehouses(),
    storage.getLowStockAlerts(),
    storage.getDashboardKPIs(),
  ]);

  return {
    totalProducts: products.length,
    totalWarehouses: warehouses.length,
    lowStockItems: lowStock.length,
    kpis,
    products: products.slice(0, 10), // Sample of products
    warehouses,
    lowStockAlerts: lowStock.slice(0, 5), // Top 5 low stock items
  };
}

export async function chatWithAssistant(userMessage: string, conversationHistory: Array<{ role: string; content: string }>) {
  const context = await getInventoryContext();
  
  const systemPrompt = `You are an intelligent warehouse inventory management assistant. You help users manage their inventory, track stock levels, and make informed decisions.

Current Inventory Status:
- Total Products: ${context.totalProducts}
- Total Warehouses: ${context.totalWarehouses}
- Low Stock Items: ${context.lowStockItems}
- Total Stock Value: ${context.kpis.stockValue}
- Active Warehouses: ${context.kpis.activeWarehouses}

Sample Products: ${JSON.stringify(context.products.map(p => ({ name: p.name, sku: p.sku, category: p.category })))}

Warehouses: ${JSON.stringify(context.warehouses.map(w => ({ name: w.name, location: w.location, status: w.status })))}

Low Stock Alerts: ${JSON.stringify(context.lowStockAlerts.map(item => ({ 
  product: item.product.name, 
  quantity: item.quantity, 
  threshold: item.product.lowStockThreshold 
})))}

Guidelines:
- Provide clear, concise answers about inventory
- Suggest actions when appropriate (e.g., reorder low stock items)
- Use data from the inventory context when available
- Be helpful and proactive in suggesting improvements
- Keep responses conversational and friendly
- If asked about specific products or warehouses not in the sample data, acknowledge you have limited visibility and suggest checking the full inventory page`;

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    { role: 'user', content: userMessage },
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.7,
    max_tokens: 500,
  });

  return response.choices[0].message.content || 'I apologize, but I could not generate a response.';
}
