'use server';
/**
 * @fileOverview An AI-powered inventory recommendation tool. It analyzes product inventory,
 * sales data, and lead times to provide intelligent recommendations for reorder points,
 * identifies low-stock items, and explains the rationale behind each suggestion.
 *
 * - intelligentInventoryRecommendation - A function that handles the inventory recommendation process.
 * - IntelligentInventoryRecommendationInput - The input type for the intelligentInventoryRecommendation function.
 * - IntelligentInventoryRecommendationOutput - The return type for the intelligentInventoryRecommendation function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ProductInputSchema = z.object({
  productId: z.string().describe('Unique identifier for the product.'),
  productName: z.string().describe('Name of the product.'),
  currentStock: z.number().int().min(0).describe('Current quantity of the product in stock.'),
  averageDailySales: z.number().min(0).describe('Average number of units sold per day based on historical data.'),
  leadTimeDays: z.number().int().min(0).describe('Number of days it takes for new stock to arrive after ordering.'),
  minStockLevel: z.number().int().min(0).optional().describe('Optional minimum desired stock level for the product.'),
  maxStockLevel: z.number().int().min(0).optional().describe('Optional maximum desired stock level for the product.'),
});

const IntelligentInventoryRecommendationInputSchema = z.object({
  products: z.array(ProductInputSchema).describe('A list of products with their current inventory, sales data, and lead times.'),
});
export type IntelligentInventoryRecommendationInput = z.infer<typeof IntelligentInventoryRecommendationInputSchema>;

const ProductRecommendationSchema = z.object({
  productId: z.string().describe('Unique identifier for the product.'),
  productName: z.string().describe('Name of the product.'),
  currentStock: z.number().int().describe('Current quantity of the product in stock.'),
  recommendedReorderPoint: z.number().int().min(0).describe('The recommended stock level at which a new order should be placed.'),
  status: z.enum(['low_stock', 'optimal', 'over_stock']).describe('Current inventory status relative to recommendations.'),
  rationale: z.string().describe('Explanation for the recommendation, including calculation basis and potential risks/benefits.'),
});

const IntelligentInventoryRecommendationOutputSchema = z.object({
  recommendations: z.array(ProductRecommendationSchema).describe('A list of inventory recommendations for each product.'),
  overallSummary: z.string().optional().describe('An optional overall summary of inventory health and key insights.'),
});
export type IntelligentInventoryRecommendationOutput = z.infer<typeof IntelligentInventoryRecommendationOutputSchema>;

export async function intelligentInventoryRecommendation(input: IntelligentInventoryRecommendationInput): Promise<IntelligentInventoryRecommendationOutput> {
  return intelligentInventoryRecommendationFlow(input);
}

const intelligentInventoryRecommendationPrompt = ai.definePrompt({
  name: 'intelligentInventoryRecommendationPrompt',
  input: { schema: IntelligentInventoryRecommendationInputSchema },
  output: { schema: IntelligentInventoryRecommendationOutputSchema },
  prompt: `You are an AI-powered inventory management expert. Your goal is to analyze product inventory, sales data, and lead times to provide intelligent recommendations for reorder points and identify low-stock items.

For each product, calculate the recommended reorder point. A basic reorder point is typically calculated as (Average Daily Sales * Lead Time Days). You should also consider adding a safety stock buffer to prevent stockouts, especially if sales are volatile. Explain your calculation and the rationale behind your recommendation for each product.

Based on the current stock and your recommended reorder point, determine if the product is 'low_stock', 'optimal', or 'over_stock'.

Here is the product data:
{{#each products}}
Product ID: {{{productId}}}
Product Name: {{{productName}}}
Current Stock: {{{currentStock}}}
Average Daily Sales: {{{averageDailySales}}}
Lead Time (Days): {{{leadTimeDays}}}
{{#if minStockLevel}}
Minimum Stock Level: {{{minStockLevel}}}
{{/if}}
{{#if maxStockLevel}}
Maximum Stock Level: {{{maxStockLevel}}}
{{/if}}
---
{{/each}}

Provide your output in JSON format, adhering strictly to the IntelligentInventoryRecommendationOutputSchema.`,
});

const intelligentInventoryRecommendationFlow = ai.defineFlow(
  {
    name: 'intelligentInventoryRecommendationFlow',
    inputSchema: IntelligentInventoryRecommendationInputSchema,
    outputSchema: IntelligentInventoryRecommendationOutputSchema,
  },
  async (input) => {
    const { output } = await intelligentInventoryRecommendationPrompt(input);
    return output!;
  },
);
