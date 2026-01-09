/**
 * Algerian Darja reaction generator
 * Generates dynamic, funny, motivational reactions based on student performance
 */

const reactions = {
  veryLow: [
    "راك طايح شوية بصح مازال الوقت، شد روحك 💪",
    "واش راك رايح يا خويا؟ لازم تخدم شوية بش تحسن الوضعية 😅",
    "راك في الخطر ولاكن ما زال في الأمل، شد البال وقوم خدمة 📚",
    "ما تحبسش، كل واحد يمر بهادك، ابدا تخدم من دلوك وكل شيء غادي يتحسن ✨",
  ],
  low: [
    "راك في النص، شوية خدمة وتطلعها إن شاء الله 😌",
    "قريبين من المطلوب، شوية صبر وتعملها بإذن الله 🤝",
    "راك على الطريق الصح، كمل بهاد الطريقة وواصل 💯",
    "ما بأس، شوية جهد إضافي وغادي تطلعها، توكل على الله 🎯",
  ],
  medium: [
    "راك كيما يجب، ما زال فيك تزيدها شوية وتطلعها أحسن 🚀",
    "ماشي وحش، بصح فيك تزود الطلعة شوية، شد روحك 📈",
    "قريب من الهدف، شوية جهد وتطلعها بزاف ✊",
  ],
  good: [
    "واش هذا يا وحش 🔥 هكذا تبان الخدمة الصح",
    "راك نجم يا خويا! هكذا يلزمو الطلاب 💎",
    "برافو عليك! راك خدمتي صح ونتا واضح 📊",
    "هذا المستوى المطلوب! راك ماشي في الطريق الصح ⭐",
  ],
  excellent: [
    "إيش هذا المستوى الفوقاني! راك بطل حقيقي 🏆",
    "واش هذا الطالب الممتاز! هكذا تبان التميز 🌟",
    "راك فوق كل التوقعات! برافو برافو برافو 🎉",
  ],
  impossible: [
    "هاد الهدف صعب شوية، بصح جرب تقرب منه قدر المستطاع 🤔",
    "واش راك تبي تشدها؟ هاد الهدف كبير شوية بصح ما تستسلمش 😤",
    "راك طامع بزاف! جرب تزيد من الخدمة وتوصل لقريب من الهدف 💪",
  ],
  achievable: [
    "هاد الهدف ممكن! شد روحك وقوم خدمة شوية وتوصل 🎯",
    "ماشي بعيد، شوية جهد إضافي وتطلعها إن شاء الله ✨",
    "راك قريب، جرب تخدم شوية أكثر وتوصل للهدف 📚",
  ],
};

/**
 * Get a random reaction from an array
 */
function getRandomReaction(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate Darja reaction based on current average, desired average, and feasibility
 * @param {number|null} currentAverage - Current semester average
 * @param {number|null} desiredAverage - Desired semester average
 * @param {boolean} isFeasible - Whether the desired average is achievable
 * @returns {string} - Darja reaction message
 */
export function generateDarjaReaction(currentAverage, desiredAverage, isFeasible) {
  // If there's a desired average and simulation is active
  if (desiredAverage !== null && desiredAverage !== '') {
    const desired = parseFloat(desiredAverage);
    
    if (!isFeasible) {
      return getRandomReaction(reactions.impossible);
    }
    
    if (currentAverage === null) {
      return getRandomReaction(reactions.achievable);
    }
    
    const current = parseFloat(currentAverage);
    const gap = desired - current;
    
    if (gap > 3) {
      return "هاد الهدف بعيد شوية، بصح كل شيء ممكن بالعمل الشاق 💪";
    } else if (gap > 1) {
      return getRandomReaction(reactions.achievable);
    } else if (gap > 0) {
      return "قريبين بزاف! شوية جهد إضافي وتطلعها إن شاء الله 🎯";
    } else {
      return "راك وصلت الهدف! جرب تزيدها شوية وتطلعها أحسن 🔥";
    }
  }
  
  // Base reaction on current average only
  if (currentAverage === null) {
    return "ابدأ تدخل النقاط وتحسب النتيجة مباشرة 📊";
  }
  
  const avg = parseFloat(currentAverage);
  
  if (avg < 10) {
    return getRandomReaction(reactions.veryLow);
  } else if (avg >= 10 && avg < 12) {
    return getRandomReaction(reactions.low);
  } else if (avg >= 12 && avg < 14) {
    return getRandomReaction(reactions.medium);
  } else if (avg >= 14 && avg < 16) {
    return getRandomReaction(reactions.good);
  } else {
    return getRandomReaction(reactions.excellent);
  }
}

