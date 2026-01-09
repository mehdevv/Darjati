/**
 * OpenRouter API service
 * Handles AI chat interactions using meta-llama/llama-3.3-70b-instruct:free
 */

import { CHATBOT_SYSTEM_PROMPT } from '../data/chatPrompts';

const OPENROUTER_API_KEY = "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";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "meta-llama/llama-3.3-70b-instruct:free";

/**
 * Generate AI-powered Darja reaction based on student performance
 * @param {number|null} currentAverage - Current semester average
 * @param {number|null} desiredAverage - Desired semester average
 * @param {boolean} isFeasible - Whether the desired average is achievable
 * @param {Object} semester - Semester object with grades
 * @returns {Promise<string>} - AI-generated Darja reaction
 */
export async function generateAIDarjaReaction(currentAverage, desiredAverage, isFeasible, semester) {
  try {
    // Build context about student performance
    let context = "Tu es un assistant motivant pour des étudiants algériens en L2 Économie/Gestion. ";
    context += "Tu parles en Darja algérienne (mélange d'arabe algérien et français). ";
    context += "Soyez drôle, motivant, et authentique dans le style des étudiants algériens.\n\n";

    if (currentAverage !== null) {
      context += `L'étudiant a actuellement une moyenne de ${currentAverage.toFixed(2)}/20. `;
    } else {
      context += "L'étudiant n'a pas encore entré ses notes. ";
    }

    if (desiredAverage !== null && desiredAverage !== '') {
      const desired = parseFloat(desiredAverage);
      context += `Il vise une moyenne de ${desired}/20. `;

      if (currentAverage !== null) {
        const gap = desired - currentAverage;
        if (gap > 0) {
          context += `Il lui manque ${gap.toFixed(2)} points. `;
        } else if (gap === 0) {
          context += "Il a atteint son objectif ! ";
        } else {
          context += `Il dépasse son objectif de ${Math.abs(gap).toFixed(2)} points ! `;
        }
      }

      if (!isFeasible) {
        context += "L'objectif semble difficile à atteindre. ";
      } else {
        context += "L'objectif est réalisable. ";
      }
    }

    context += "\nGénère une réaction courte et motivante en Darja (maximum 2 phrases, avec emojis).";

    const messages = [
      {
        role: "system",
        content: context
      },
      {
        role: "user",
        content: "Donne-moi une réaction motivante en Darja pour cet étudiant."
      }
    ];

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
        "X-Title": "Moyenne Calculator"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: messages,
        temperature: 0.8,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "راك ماشي على الطريق الصح، كمل! 💪";
  } catch (error) {
    console.error("Error generating AI reaction:", error);
    // Fallback to static reaction
    return "راك ماشي على الطريق الصح، كمل! 💪";
  }
}

/**
 * Chat with AI about grades and study advice
 * @param {string} message - User message
 * @param {Array} conversationHistory - Previous conversation messages
 * @param {Object} semester - Current semester data
 * @returns {Promise<string>} - AI response
 */
export async function chatWithAI(message, conversationHistory = [], semester = null) {
  try {
    let systemPrompt = CHATBOT_SYSTEM_PROMPT + "\n\n";

    if (semester && semester.ues) {
      // Calculate semester average manually
      let totalWeighted = 0;
      let totalCoeff = 0;

      semester.ues.forEach((ue) => {
        let ueWeighted = 0;
        let ueCoeff = 0;

        ue.modules.forEach((module) => {
          let moduleAvg = null;
          if (module.type === '100%') {
            moduleAvg = module.exam !== null && module.exam !== '' ? parseFloat(module.exam) : null;
          } else {
            const cc = module.cc !== null && module.cc !== '' ? parseFloat(module.cc) : null;
            const exam = module.exam !== null && module.exam !== '' ? parseFloat(module.exam) : null;
            if (cc !== null && exam !== null) {
              moduleAvg = (cc * 0.4) + (exam * 0.6);
            }
          }

          if (moduleAvg !== null) {
            ueWeighted += moduleAvg * module.coefficient;
            ueCoeff += module.coefficient;
          }
        });

        if (ueCoeff > 0) {
          const ueAvg = ueWeighted / ueCoeff;
          totalWeighted += ueAvg * ue.coefficient;
          totalCoeff += ue.coefficient;
        }
      });

      if (totalCoeff > 0) {
        const currentAverage = totalWeighted / totalCoeff;
        systemPrompt += `CONTEXTE ÉTUDIANT:\nL'étudiant a actuellement une moyenne de ${currentAverage.toFixed(2)}/20 pour ce semestre. Utilise cette info pour personnaliser ta réponse.`;
      }
    }

    const messages = [
      {
        role: "system",
        content: systemPrompt
      },
      ...conversationHistory,
      {
        role: "user",
        content: message
      }
    ];

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
        "X-Title": "Moyenne Calculator"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: messages,
        temperature: 0.8,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "Désolé, je n'ai pas pu répondre. Réessaye!";
  } catch (error) {
    console.error("Error chatting with AI:", error);
    return "Désolé, il y a eu une erreur. Réessaye plus tard!";
  }
}

