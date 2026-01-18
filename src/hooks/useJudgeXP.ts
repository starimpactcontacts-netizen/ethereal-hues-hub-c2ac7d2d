import { supabase } from '@/integrations/supabase/client';

// XP amounts for judge actions
export const JUDGE_XP_REWARDS = {
  review_completed: 25,    // Judge completes a review
  receive_review: 15,      // Editor receives a review
  first_review_daily: 10,  // Bonus for first review of the day
};

/**
 * Award XP to a judge for completing a review
 */
export async function awardJudgeXP(judgeId: string): Promise<{ success: boolean; xpAwarded: number }> {
  try {
    const result = await supabase.rpc('award_xp', {
      p_user_id: judgeId,
      p_amount: JUDGE_XP_REWARDS.review_completed,
      p_action: 'judge_review',
      p_description: 'Completed a review as QOI Judge',
    });

    if (result.error) throw result.error;
    
    return { success: true, xpAwarded: JUDGE_XP_REWARDS.review_completed };
  } catch (error) {
    console.error('Error awarding judge XP:', error);
    return { success: false, xpAwarded: 0 };
  }
}

/**
 * Award XP to an editor for receiving a review
 */
export async function awardEditorReviewXP(editorId: string, judgeUsername: string): Promise<{ success: boolean; xpAwarded: number }> {
  try {
    const result = await supabase.rpc('award_xp', {
      p_user_id: editorId,
      p_amount: JUDGE_XP_REWARDS.receive_review,
      p_action: 'receive_review',
      p_description: `Received a review from @${judgeUsername}`,
    });

    if (result.error) throw result.error;
    
    return { success: true, xpAwarded: JUDGE_XP_REWARDS.receive_review };
  } catch (error) {
    console.error('Error awarding editor review XP:', error);
    return { success: false, xpAwarded: 0 };
  }
}

/**
 * Award XP to both judge and editor after a review is completed
 */
export async function awardReviewXP(
  judgeId: string,
  judgeUsername: string,
  editorId: string
): Promise<{ judgeXP: number; editorXP: number }> {
  const [judgeResult, editorResult] = await Promise.all([
    awardJudgeXP(judgeId),
    awardEditorReviewXP(editorId, judgeUsername),
  ]);

  return {
    judgeXP: judgeResult.xpAwarded,
    editorXP: editorResult.xpAwarded,
  };
}
