-- Create a function to filter profanity from messages
CREATE OR REPLACE FUNCTION filter_message_profanity()
RETURNS TRIGGER AS $$
DECLARE
  filtered_text TEXT;
  profanity_words TEXT[] := ARRAY[
    'fuck', 'fucking', 'fucked', 'fucker', 'fuckin',
    'shit', 'shitting', 'shitty', 'bullshit',
    'bitch', 'bitches', 'bitching',
    'asshole', 'asses',
    'damn', 'damned', 'dammit',
    'dick', 'dicks', 'dickhead',
    'cock', 'cocks',
    'pussy', 'pussies',
    'cunt', 'cunts',
    'whore', 'whores',
    'slut', 'sluts',
    'bastard', 'bastards',
    'piss', 'pissed', 'pissing',
    'retard', 'retarded',
    'fag', 'faggot', 'fags',
    'nigger', 'nigga', 'niggas',
    'kike', 'spic', 'chink', 'gook',
    'twat', 'wanker', 'tosser',
    'bollocks', 'bugger', 'arse'
  ];
  word TEXT;
BEGIN
  filtered_text := NEW.message_text;
  
  -- Loop through each profanity word and replace with censored version
  FOREACH word IN ARRAY profanity_words
  LOOP
    -- Replace word keeping first letter, rest becomes #
    -- Using regexp_replace with word boundaries and case-insensitive flag
    filtered_text := regexp_replace(
      filtered_text,
      '\m' || word || '\M',
      substring(word, 1, 1) || repeat('#', length(word) - 1),
      'gi'
    );
  END LOOP;
  
  NEW.message_text := filtered_text;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for arena_messages
DROP TRIGGER IF EXISTS filter_arena_message_profanity ON arena_messages;
CREATE TRIGGER filter_arena_message_profanity
  BEFORE INSERT OR UPDATE ON arena_messages
  FOR EACH ROW
  EXECUTE FUNCTION filter_message_profanity();

-- Create trigger for crew_messages
DROP TRIGGER IF EXISTS filter_crew_message_profanity ON crew_messages;
CREATE TRIGGER filter_crew_message_profanity
  BEFORE INSERT OR UPDATE ON crew_messages
  FOR EACH ROW
  EXECUTE FUNCTION filter_message_profanity();