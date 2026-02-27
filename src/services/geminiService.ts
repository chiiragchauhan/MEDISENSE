import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

/**
 * Rule-based fallback engine for when API keys are unavailable.
 * Generates clinical logistics explanations using deterministic logic.
 */
function generateRuleBasedExplanation(data: any) {
  const { 
    trafficRisk, 
    weatherRisk, 
    delayRiskScore, 
    medicalPriorityScore, 
    recommendedRoute, 
    timeSaved, 
    accuracy 
  } = data;

  let riskAnalysis = "";
  
  if (delayRiskScore > 0.7) {
    riskAnalysis = "Critical infrastructure congestion detected. Primary transport corridors are experiencing significant throughput degradation.";
  } else if (delayRiskScore > 0.4) {
    riskAnalysis = "Moderate operational friction identified. Environmental and traffic vectors are converging to create potential delay windows.";
  } else {
    riskAnalysis = "Operational environment is stable. Low risk of delay for critical medical units.";
  }

  let priorityAnalysis = "";
  if (medicalPriorityScore > 0.8) {
    priorityAnalysis = " Transport urgency is categorized as 'Life-Critical'. Route selection prioritizes immediate clinical intervention over standard logistics efficiency.";
  } else {
    priorityAnalysis = " Transport is categorized as 'Time-Sensitive'. Route selection balances clinical priority with optimal asset utilization.";
  }

  const weatherImpact = weatherRisk > 0.5 ? " Severe weather conditions are impacting braking distance and visibility, necessitating the use of specialized emergency corridors." : "";

  return `
### Recommended Route
**${recommendedRoute.name}**

### Estimated Time Saved
**${timeSaved} minutes**

### Operational Risk Explanation
${riskAnalysis}${priorityAnalysis}${weatherImpact} The selection of **${recommendedRoute.name}** is mathematically optimized to minimize the risk-to-time ratio, ensuring medical integrity is maintained during the transit window.

### Model Confidence Score
**${accuracy}**
  `.trim();
}

export async function explainLogisticsRisk(data: any) {
  // Check if API key is valid (not empty or placeholder)
  const hasApiKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "YOUR_API_KEY";

  if (!hasApiKey) {
    console.log("MediSense: Using Rule-Based Logic Engine (No API Key detected)");
    return generateRuleBasedExplanation(data);
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        You are a healthcare logistics intelligence assistant. Analyze the following real-time operational data for medical transport.
        
        System Logic:
        - Delay Risk Score = (Traffic Risk × 0.4) + (Weather Risk × 0.3) + (Historical Delay Rate × 0.2) + (Incident Density × 0.1)
        - Medical Priority Score = (Emergency Level × 0.5) + (Time Sensitivity × 0.3) + (Critical Supply Factor × 0.2)
        - Optimization Objective: Minimize (Delay Risk + Time + Medical Priority Penalty)
        
        Input Data:
        - Traffic Risk: ${data.trafficRisk}
        - Weather Risk: ${data.weatherRisk}
        - Historical Delay Rate: ${data.historicalDelayRate}
        - Incident Density: ${data.incidentDensity}
        - Delay Risk Score: ${data.delayRiskScore}
        
        - Emergency Level: ${data.emergencyLevel}
        - Time Sensitivity: ${data.timeSensitivity}
        - Critical Supply Factor: ${data.criticalSupplyFactor}
        - Medical Priority Score: ${data.medicalPriorityScore}
        
        - Recommended Route: ${data.recommendedRoute.name}
        - Estimated Time Saved: ${data.timeSaved} minutes
        - Model Confidence: ${data.accuracy}
        
        Constraints:
        1. Explain operational impact in clear, clinical language.
        2. Prioritize medical urgency over cost or distance.
        3. Avoid speculative or emotional statements.
        
        Output Format:
        ### Recommended Route
        **${data.recommendedRoute.name}**
        
        ### Estimated Time Saved
        **${data.timeSaved} minutes**
        
        ### Operational Risk Explanation
        [Provide a concise clinical explanation of why this route was chosen based on the Delay Risk and Medical Priority scores. Focus on the impact on patient outcomes or supply integrity.]
        
        ### Model Confidence Score
        **${data.accuracy}**
      `,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return generateRuleBasedExplanation(data);
  }
}
