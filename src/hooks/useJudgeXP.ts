import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// XP amounts for judge actions
export const JUDGE_XP_REWARDS = {
  review_completed: 25,    // Judge completes a review
  receive_review: 15,      // Editor receives a review
  first_review_daily: 10,  // Bonus for first review of the day
  high_quality_review: 10, // Bonus for detailed feedback
  viral_bonus_10k: 50,     // Video hits 10k views
  viral_bonus_100k: 100,   // Video hits 100k views
  viral_bonus_1m: 500,     // Video hits 1M views
};

/**
 * Award JXP to a judge for completing a review
 * Also awards regular XP and increments review count
 */
export async function awardJudgeXP(judgeId: string): Promise<{ success: boolean; xpAwarded: number }> {
  try {
    const result = await supabase.rpc('award_judge_xp', {
      p_judge_id: judgeId,
      p_amount: JUDGE_XP_REWARDS.review_completed,
      p_action: 'review_completed',
      p_description: 'Completed a review as QOI Judge',
    });

    if (result.error) throw result.error;
    
    // Show toast for judge XP
    toast.success(`+${JUDGE_XP_REWARDS.review_completed} JXP`, {
      description: 'Review completed!',
      duration: 3000,
    });
    
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

/**
 * Award viral bonus XP to a judge when their rating video goes viral
 */
export async function awardViralBonusXP(
  judgeId: string, 
  views: number,
  videoId: string
): Promise<{ success: boolean; xpAwarded: number }> {
  let bonusAmount = 0;
  let bonusType = '';

  if (views >= 1000000) {
    bonusAmount = JUDGE_XP_REWARDS.viral_bonus_1m;
    bonusType = '1M+ views';
  } else if (views >= 100000) {
    bonusAmount = JUDGE_XP_REWARDS.viral_bonus_100k;
    bonusType = '100k+ views';
  } else if (views >= 10000) {
    bonusAmount = JUDGE_XP_REWARDS.viral_bonus_10k;
    bonusType = '10k+ views';
  } else {
    return { success: false, xpAwarded: 0 };
  }

  try {
    // Award the JXP
    await supabase.rpc('award_judge_xp', {
      p_judge_id: judgeId,
      p_amount: bonusAmount,
      p_action: 'viral_bonus',
      p_description: `Rating video hit ${bonusType}`,
    });

    // Mark video as bonus awarded
    await supabase
      .from('judge_rating_videos')
      .update({ 
        viral_bonus_awarded: true, 
        bonus_xp_awarded: bonusAmount,
        current_views: views,
      })
      .eq('id', videoId);

    toast.success(`+${bonusAmount} JXP`, {
      description: `🔥 Viral bonus: ${bonusType}!`,
      duration: 5000,
    });

    return { success: true, xpAwarded: bonusAmount };
  } catch (error) {
    console.error('Error awarding viral bonus:', error);
    return { success: false, xpAwarded: 0 };
  }
}
