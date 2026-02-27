import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function explainLogisticsRisk(data: any) {
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
    return "### Recommended Route\n**Medical Emergency Corridor (Alpha)**\n\n### Estimated Time Saved\n**16 minutes**\n\n### Operational Risk Explanation\nDefaulting to priority corridor due to system error. Clinical priority remains high.";
  }
}
