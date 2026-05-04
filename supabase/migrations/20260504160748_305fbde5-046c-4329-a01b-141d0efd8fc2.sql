UPDATE public.missions
SET base_payout_cents = 1000,
    payout_display_override = '$10–15 per edit',
    base_payout_requirements = E'You qualify if either:\n\n• We''ve already reached out to you directly, OR\n• You make edits featuring any of these characters:\n   – Suguru Geto (Jujutsu Kaisen)\n   – Aki Hayakawa (Chainsaw Man)\n   – Light Yagami (Death Note)\n   – Fyodor Dostoevsky (Bungo Stray Dogs)\n\nOr more broadly — you make dark / alt-style anime edits.'
WHERE id = '33d2f047-5b13-447b-81f0-b27af5351e4f';