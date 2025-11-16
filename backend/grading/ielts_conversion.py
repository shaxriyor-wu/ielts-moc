"""
IELTS Band Score Conversion Tables
Official conversion charts for Listening and Reading sections.
"""


def listening_band_score(raw_score: int) -> float:
    """
    Convert Listening raw score (out of 40) to IELTS band score.
    
    Official IELTS Listening conversion table:
    39-40 = 9.0
    37-38 = 8.5
    35-36 = 8.0
    33-34 = 7.5
    30-32 = 7.0
    27-29 = 6.5
    23-26 = 6.0
    20-22 = 5.5
    16-19 = 5.0
    13-15 = 4.5
    10-12 = 4.0
    7-9 = 3.5
    4-6 = 3.0
    2-3 = 2.5
    1 = 2.0
    0 = 1.0
    """
    conversion_table = {
        39: 9.0, 40: 9.0,
        37: 8.5, 38: 8.5,
        35: 8.0, 36: 8.0,
        33: 7.5, 34: 7.5,
        30: 7.0, 31: 7.0, 32: 7.0,
        27: 6.5, 28: 6.5, 29: 6.5,
        23: 6.0, 24: 6.0, 25: 6.0, 26: 6.0,
        20: 5.5, 21: 5.5, 22: 5.5,
        16: 5.0, 17: 5.0, 18: 5.0, 19: 5.0,
        13: 4.5, 14: 4.5, 15: 4.5,
        10: 4.0, 11: 4.0, 12: 4.0,
        7: 3.5, 8: 3.5, 9: 3.5,
        4: 3.0, 5: 3.0, 6: 3.0,
        2: 2.5, 3: 2.5,
        1: 2.0,
        0: 1.0,
    }
    
    # Clamp score to valid range
    raw_score = max(0, min(40, raw_score))
    
    # Find band score
    for score, band in sorted(conversion_table.items(), reverse=True):
        if raw_score >= score:
            return band
    
    return 1.0


def reading_band_score(raw_score: int, academic: bool = True) -> float:
    """
    Convert Reading raw score (out of 40) to IELTS band score.
    
    Note: Academic and General Training have different conversion tables.
    This implementation uses Academic conversion (more common for mock tests).
    
    Official IELTS Academic Reading conversion table:
    39-40 = 9.0
    37-38 = 8.5
    35-36 = 8.0
    33-34 = 7.5
    30-32 = 7.0
    27-29 = 6.5
    23-26 = 6.0
    20-22 = 5.5
    16-19 = 5.0
    13-15 = 4.5
    10-12 = 4.0
    7-9 = 3.5
    4-6 = 3.0
    2-3 = 2.5
    1 = 2.0
    0 = 1.0
    """
    if academic:
        # Academic Reading conversion (same as Listening)
        return listening_band_score(raw_score)
    else:
        # General Training Reading conversion (slightly different)
        conversion_table = {
            40: 9.0,
            39: 9.0,
            38: 8.5,
            37: 8.5,
            36: 8.0,
            35: 8.0,
            34: 7.5,
            33: 7.5,
            32: 7.0,
            31: 7.0,
            30: 7.0,
            29: 6.5,
            28: 6.5,
            27: 6.5,
            26: 6.0,
            25: 6.0,
            24: 6.0,
            23: 6.0,
            22: 5.5,
            21: 5.5,
            20: 5.5,
            19: 5.0,
            18: 5.0,
            17: 5.0,
            16: 5.0,
            15: 4.5,
            14: 4.5,
            13: 4.5,
            12: 4.0,
            11: 4.0,
            10: 4.0,
            9: 3.5,
            8: 3.5,
            7: 3.5,
            6: 3.0,
            5: 3.0,
            4: 3.0,
            3: 2.5,
            2: 2.5,
            1: 2.0,
            0: 1.0,
        }
        
        raw_score = max(0, min(40, raw_score))
        
        for score, band in sorted(conversion_table.items(), reverse=True):
            if raw_score >= score:
                return band
        
        return 1.0

