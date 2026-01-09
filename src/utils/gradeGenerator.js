/**
 * Utility to generate random independent grades that satisfy a target average.
 */

import { calculateModuleAverage, calculateUEAverage } from './calculations';

/**
 * Generates random grades for selected modules to reach a desired semester average.
 * Uses a constrained random construction approach to ensure mathematical validity.
 * 
 * @param {Object} activeSemester - The current semester state
 * @param {number} desiredAverage - Target semester average (0-20)
 * @param {Set<string>} selectedModuleIds - IDs of modules allowed to be modified
 * @returns {Object|null} - A deep copy of the semester with updated grades, or null if impossible
 */
export function generateRandomGrades(activeSemester, desiredAverage, selectedModuleIds) {
    // Deep clone the semester to work on
    const newSemester = JSON.parse(JSON.stringify(activeSemester));
    const targetAvg = parseFloat(desiredAverage);

    if (isNaN(targetAvg) || targetAvg < 0 || targetAvg > 20) return null;
    if (!selectedModuleIds || selectedModuleIds.size === 0) return null;

    // 1. Calculate Global Weights for every grade slot (CC and Exam)
    // Formula: GlobalWeight = (UE_Coef / Total_UE_Coefs) * (Mod_Coef / Total_Mod_Coefs_In_UE) * (0.4 or 0.6 or 1.0)

    const totalUECoefs = newSemester.ues.reduce((sum, ue) => sum + ue.coefficient, 0);
    if (totalUECoefs === 0) return null;

    let lockedWeightedScore = 0;
    const mutableSlots = [];

    newSemester.ues.forEach(ue => {
        const totalModCoefsInUE = ue.modules.reduce((sum, m) => sum + m.coefficient, 0);

        // Factors common to this UE
        const ueFactor = ue.coefficient; // We'll divide by totalUECoefs at the end, so we work in "Coef-Points"

        ue.modules.forEach(module => {
            // Effective weight of this module within the semester sum
            // Contribution = (ModAvg * ModCoef / TotalModCoefsInUE) * UECoef
            //              = (0.4*CC + 0.6*Exam) * (ModCoef * UECoef / TotalModCoefsInUE)

            const effectiveModWeight = totalModCoefsInUE > 0
                ? (module.coefficient * ueFactor) / totalModCoefsInUE
                : 0;

            const isSelected = selectedModuleIds.has(module.id);

            // Define Slots
            if (module.type === '100%') {
                const weight = effectiveModWeight * 1.0;
                if (isSelected) {
                    mutableSlots.push({
                        type: 'exam',
                        module,
                        weight,
                        ueId: ue.id
                    });
                } else {
                    const val = parseFloat(module.exam) || 0; // Treat null/empty as 0 for locked
                    lockedWeightedScore += val * weight;
                }
            } else {
                const weightCC = effectiveModWeight * 0.4;
                const weightExam = effectiveModWeight * 0.6;

                if (isSelected) {
                    mutableSlots.push({
                        type: 'cc',
                        module,
                        weight: weightCC,
                        ueId: ue.id
                    });
                    mutableSlots.push({
                        type: 'exam',
                        module,
                        weight: weightExam,
                        ueId: ue.id
                    });
                } else {
                    const valCC = parseFloat(module.cc) || 0;
                    const valExam = parseFloat(module.exam) || 0;
                    lockedWeightedScore += (valCC * weightCC) + (valExam * weightExam);
                }
            }
        });
    });

    // 2. Solve for Mutable Slots
    // Equation: Sum(Slot_i * Weight_i) = (TargetAvg * TotalUECoefs) - LockedWeightedScore
    const totalTargetScore = targetAvg * totalUECoefs;
    const remainingTargetScore = totalTargetScore - lockedWeightedScore;

    if (mutableSlots.length === 0) return null; // Should have been caught earlier

    // Shuffle slots for randomness
    for (let i = mutableSlots.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [mutableSlots[i], mutableSlots[j]] = [mutableSlots[j], mutableSlots[i]];
    }

    // 3. Constrained Random Construction
    let currentAccumulatedScore = 0;

    for (let i = 0; i < mutableSlots.length; i++) {
        const slot = mutableSlots[i];
        const isLast = i === mutableSlots.length - 1;

        if (isLast) {
            // Calculate exact needed value
            const neededScore = remainingTargetScore - currentAccumulatedScore;
            const neededVal = neededScore / slot.weight;

            // Check validity (allow tiny float error)
            if (neededVal >= -0.01 && neededVal <= 20.01) {
                // Clamp to [0, 20] and round to 2 decimals
                const finalVal = Math.min(20, Math.max(0, parseFloat(neededVal.toFixed(2))));
                applyValue(slot, finalVal);
            } else {
                // Impossible to satisfy with this random path
                // For a more robust solution, we'd backtrack, but for now we return null or retry
                // A simple "retry" wrapper in the caller or extensive retries here helps.
                // Let's try to just clamp it and accept the slight error? 
                // No, the user wants the exact average. 
                // If we fail here, it means the random choices were "too wild".
                // Let's try a heuristic: if we fail, we just return null. 
                // But to make it robust, we should constrain the *previous* choices range.
                return null;
            }
        } else {
            // Not last. Pick a random value within constraints.
            // We need the FUTURE sum to be able to reach the target.
            // Remaining Weights Sum
            let remainingWeights = 0;
            for (let j = i + 1; j < mutableSlots.length; j++) {
                remainingWeights += mutableSlots[j].weight;
            }

            // Bounds for the Rest
            const minFutureScore = 0;
            const maxFutureScore = remainingWeights * 20;

            // Need: (Target - Current - ThisVal*ThisWeight) in [MinFuture, MaxFuture]
            // => Target - Current - MaxFuture <= ThisVal*ThisWeight <= Target - Current - MinFuture
            const neededForRest = remainingTargetScore - currentAccumulatedScore;

            const minValLimit = (neededForRest - maxFutureScore) / slot.weight;
            const maxValLimit = (neededForRest - minFutureScore) / slot.weight;

            // Intersect with [0, 20]
            const validMin = Math.max(0, minValLimit);
            const validMax = Math.min(20, maxValLimit);

            if (validMin > validMax) return null; // Path blocked

            // Pick random
            const randomVal = (Math.random() * (validMax - validMin)) + validMin;
            const roundedVal = parseFloat(randomVal.toFixed(2));

            // Update
            applyValue(slot, roundedVal);
            currentAccumulatedScore += roundedVal * slot.weight;
        }
    }

    return newSemester;
}

function applyValue(slot, value) {
    if (slot.type === 'cc') {
        slot.module.cc = value;
    } else {
        slot.module.exam = value;
    }
}
