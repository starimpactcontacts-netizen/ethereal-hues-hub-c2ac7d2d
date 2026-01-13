-- Update profanity filter to be more aggressive (Roblox-style full hashtag replacement)
CREATE OR REPLACE FUNCTION public.filter_message_profanity()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  filtered_text TEXT;
  profanity_words TEXT[] := ARRAY[
    -- Core profanity
    'fuck', 'fucking', 'fucked', 'fucker', 'fuckin', 'fck', 'fuk', 'f*ck', 'fu*k',
    'shit', 'shitting', 'shitty', 'bullshit', 'sh1t', 'sh*t',
    'bitch', 'bitches', 'bitching', 'b1tch', 'b*tch',
    'asshole', 'asses', 'a$$hole', 'a$$', '@ss',
    'damn', 'damned', 'dammit',
    'dick', 'dicks', 'dickhead', 'd1ck',
    'cock', 'cocks', 'c0ck',
    'pussy', 'pussies', 'p*ssy',
    'cunt', 'cunts', 'c*nt',
    'whore', 'whores', 'wh0re',
    'slut', 'sluts', 'sl*t',
    'bastard', 'bastards',
    'piss', 'pissed', 'pissing',
    'retard', 'retarded', 'r3tard',
    -- Slurs (zero tolerance)
    'fag', 'faggot', 'fags', 'f@g', 'f@ggot',
    'nigger', 'nigga', 'niggas', 'n1gger', 'n1gga', 'nigg@', 'n*gga', 'n*gger',
    'kike', 'spic', 'chink', 'gook', 'wetback', 'beaner',
    'jew', 'jews', -- when used as slur (will catch false positives but safer)
    -- Additional
    'twat', 'wanker', 'tosser',
    'bollocks', 'bugger', 'arse',
    -- Scam/harassment related
    'scammer', 'scam', 'scammed'
  ];
  word TEXT;
BEGIN
  filtered_text := NEW.message_text;
  
  -- Loop through each profanity word and replace ENTIRELY with hashtags (Roblox style)
  FOREACH word IN ARRAY profanity_words
  LOOP
    -- Replace entire word with hashtags of same length
    filtered_text := regexp_replace(
      filtered_text,
      '\m' || word || '\M',
      repeat('#', length(word)),
      'gi'
    );
  END LOOP;
  
  NEW.message_text := filtered_text;
  RETURN NEW;
END;
$function$;