CREATE OR REPLACE FUNCTION public.calculate_level_from_xp(xp_amount integer)
 RETURNS integer
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN CASE
    WHEN xp_amount >= 1255943 THEN 100
    WHEN xp_amount >= 1228478 THEN 99
    WHEN xp_amount >= 1201344 THEN 98
    WHEN xp_amount >= 1174540 THEN 97
    WHEN xp_amount >= 1148066 THEN 96
    WHEN xp_amount >= 1121920 THEN 95
    WHEN xp_amount >= 1096103 THEN 94
    WHEN xp_amount >= 1070613 THEN 93
    WHEN xp_amount >= 1045450 THEN 92
    WHEN xp_amount >= 1020613 THEN 91
    WHEN xp_amount >= 996101 THEN 90
    WHEN xp_amount >= 971914 THEN 89
    WHEN xp_amount >= 948051 THEN 88
    WHEN xp_amount >= 924512 THEN 87
    WHEN xp_amount >= 901294 THEN 86
    WHEN xp_amount >= 878399 THEN 85
    WHEN xp_amount >= 855824 THEN 84
    WHEN xp_amount >= 833569 THEN 83
    WHEN xp_amount >= 811634 THEN 82
    WHEN xp_amount >= 790018 THEN 81
    WHEN xp_amount >= 768720 THEN 80
    WHEN xp_amount >= 747738 THEN 79
    WHEN xp_amount >= 727073 THEN 78
    WHEN xp_amount >= 706724 THEN 77
    WHEN xp_amount >= 686689 THEN 76
    WHEN xp_amount >= 666968 THEN 75
    WHEN xp_amount >= 647560 THEN 74
    WHEN xp_amount >= 628464 THEN 73
    WHEN xp_amount >= 609679 THEN 72
    WHEN xp_amount >= 591205 THEN 71
    WHEN xp_amount >= 573041 THEN 70
    WHEN xp_amount >= 555185 THEN 69
    WHEN xp_amount >= 537638 THEN 68
    WHEN xp_amount >= 520397 THEN 67
    WHEN xp_amount >= 503462 THEN 66
    WHEN xp_amount >= 486832 THEN 65
    WHEN xp_amount >= 470507 THEN 64
    WHEN xp_amount >= 454485 THEN 63
    WHEN xp_amount >= 438765 THEN 62
    WHEN xp_amount >= 423346 THEN 61
    WHEN xp_amount >= 408228 THEN 60
    WHEN xp_amount >= 393409 THEN 59
    WHEN xp_amount >= 378889 THEN 58
    WHEN xp_amount >= 364666 THEN 57
    WHEN xp_amount >= 350739 THEN 56
    WHEN xp_amount >= 337107 THEN 55
    WHEN xp_amount >= 323770 THEN 54
    WHEN xp_amount >= 310726 THEN 53
    WHEN xp_amount >= 297973 THEN 52
    WHEN xp_amount >= 285512 THEN 51
    WHEN xp_amount >= 273341 THEN 50
    WHEN xp_amount >= 261458 THEN 49
    WHEN xp_amount >= 249862 THEN 48
    WHEN xp_amount >= 238553 THEN 47
    WHEN xp_amount >= 227529 THEN 46
    WHEN xp_amount >= 216789 THEN 45
    WHEN xp_amount >= 206332 THEN 44
    WHEN xp_amount >= 196156 THEN 43
    WHEN xp_amount >= 186260 THEN 42
    WHEN xp_amount >= 176642 THEN 41
    WHEN xp_amount >= 167302 THEN 40
    WHEN xp_amount >= 158238 THEN 39
    WHEN xp_amount >= 149449 THEN 38
    WHEN xp_amount >= 140933 THEN 37
    WHEN xp_amount >= 132689 THEN 36
    WHEN xp_amount >= 124715 THEN 35
    WHEN xp_amount >= 117010 THEN 34
    WHEN xp_amount >= 109572 THEN 33
    WHEN xp_amount >= 102400 THEN 32
    WHEN xp_amount >= 95492 THEN 31
    WHEN xp_amount >= 88846 THEN 30
    WHEN xp_amount >= 82460 THEN 29
    WHEN xp_amount >= 76334 THEN 28
    WHEN xp_amount >= 70464 THEN 27
    WHEN xp_amount >= 64850 THEN 26
    WHEN xp_amount >= 59489 THEN 25
    WHEN xp_amount >= 54379 THEN 24
    WHEN xp_amount >= 49519 THEN 23
    WHEN xp_amount >= 44906 THEN 22
    WHEN xp_amount >= 40537 THEN 21
    WHEN xp_amount >= 36411 THEN 20
    WHEN xp_amount >= 32526 THEN 19
    WHEN xp_amount >= 28878 THEN 18
    WHEN xp_amount >= 25466 THEN 17
    WHEN xp_amount >= 22286 THEN 16
    WHEN xp_amount >= 19336 THEN 15
    WHEN xp_amount >= 16613 THEN 14
    WHEN xp_amount >= 14114 THEN 13
    WHEN xp_amount >= 11835 THEN 12
    WHEN xp_amount >= 9773 THEN 11
    WHEN xp_amount >= 7924 THEN 10
    WHEN xp_amount >= 6285 THEN 9
    WHEN xp_amount >= 4850 THEN 8
    WHEN xp_amount >= 3616 THEN 7
    WHEN xp_amount >= 2576 THEN 6
    WHEN xp_amount >= 1725 THEN 5
    WHEN xp_amount >= 1056 THEN 4
    WHEN xp_amount >= 561 THEN 3
    WHEN xp_amount >= 230 THEN 2
    ELSE 1
  END;
END;
$function$;