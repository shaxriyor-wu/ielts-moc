"""Utility functions for exam management."""

import os
import json
import glob
import random
import string
from django.conf import settings


def generate_test_id():
    """Generate a unique 6-digit test ID."""
    from .models import MockTest
    while True:
        test_id = ''.join(random.choices(string.digits, k=6))
        if not MockTest.objects.filter(test_id=test_id).exists():
            return test_id


def get_data_path():
    """Get the path to the exams data directory."""
    return os.path.join(settings.BASE_DIR, 'exams', 'data')


def scan_json_files(directory_path):
    """Scan a directory for JSON files and return their count and file paths."""
    if not os.path.exists(directory_path):
        return 0, []

    json_files = glob.glob(os.path.join(directory_path, '*.json'))
    return len(json_files), [os.path.basename(f) for f in json_files]


def count_available_variants():
    """Count available variants for each section/passage/part."""
    data_path = get_data_path()

    counts = {
        'listening': {},
        'reading': {},
        'writing': {},
        'speaking': {}
    }

    # Listening sections
    for section_num in [1, 2, 3, 4]:
        section_path = os.path.join(data_path, 'listening', f'section{section_num}')
        count, files = scan_json_files(section_path)
        counts['listening'][f'section{section_num}'] = {
            'count': count,
            'files': files
        }

    # Reading passages
    for passage_num in [1, 2, 3]:
        passage_path = os.path.join(data_path, 'reading', f'passage{passage_num}')
        count, files = scan_json_files(passage_path)
        counts['reading'][f'passage{passage_num}'] = {
            'count': count,
            'files': files
        }

    # Writing tasks
    for task_num in [1, 2]:
        task_path = os.path.join(data_path, 'writing', f'task{task_num}')
        count, files = scan_json_files(task_path)
        counts['writing'][f'task{task_num}'] = {
            'count': count,
            'files': files
        }

    # Speaking parts
    for part_num in [1, 2, 3]:
        part_path = os.path.join(data_path, 'speaking', f'part{part_num}')
        count, files = scan_json_files(part_path)
        counts['speaking'][f'part{part_num}'] = {
            'count': count,
            'files': files
        }

    return counts


def load_json_variant(file_path):
    """Load a JSON variant file and return its contents."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        return None


def select_random_variant(section_type, section_name):
    """
    Select a random variant file for a given section.

    Args:
        section_type: 'listening', 'reading', 'writing', or 'speaking'
        section_name: e.g., 'section1', 'passage1', 'task1', 'part1'

    Returns:
        str: Filename of selected variant (e.g., 'section1_001.json')
    """
    data_path = get_data_path()
    section_path = os.path.join(data_path, section_type, section_name)

    count, files = scan_json_files(section_path)

    if count == 0:
        return None

    return random.choice(files)


def generate_test_variants(strategy='unique'):
    """
    Generate a complete test variant combination.

    Args:
        strategy: 'same' or 'unique' (for future use)

    Returns:
        dict: Dictionary containing selected variants for all sections
    """
    variants = {
        'listening': {},
        'reading': {},
        'writing': {},
        'speaking': {}
    }

    # Select listening sections
    for section_num in [1, 2, 3, 4]:
        section_name = f'section{section_num}'
        selected = select_random_variant('listening', section_name)
        variants['listening'][section_name] = selected

    # Select reading passages
    for passage_num in [1, 2, 3]:
        passage_name = f'passage{passage_num}'
        selected = select_random_variant('reading', passage_name)
        variants['reading'][passage_name] = selected

    # Select writing tasks
    for task_num in [1, 2]:
        task_name = f'task{task_num}'
        selected = select_random_variant('writing', task_name)
        variants['writing'][task_name] = selected

    # Select speaking parts
    for part_num in [1, 2, 3]:
        part_name = f'part{part_num}'
        selected = select_random_variant('speaking', part_name)
        variants['speaking'][part_name] = selected

    return variants


def get_variant_content(section_type, section_name, filename):
    """
    Get the full content of a variant file.

    Args:
        section_type: 'listening', 'reading', 'writing', or 'speaking'
        section_name: e.g., 'section1', 'passage1', 'task1', 'part1'
        filename: JSON filename

    Returns:
        dict: Variant content or None if not found
    """
    data_path = get_data_path()
    file_path = os.path.join(data_path, section_type, section_name, filename)
    return load_json_variant(file_path)


def check_minimum_variants():
    """
    Check if there are minimum required variants to create a test.

    Returns:
        tuple: (bool, list) - (has_minimum, missing_sections)
    """
    counts = count_available_variants()
    missing = []

    # Check listening
    for section_num in [1, 2, 3, 4]:
        section_name = f'section{section_num}'
        if counts['listening'][section_name]['count'] == 0:
            missing.append(f'Listening {section_name}')

    # Check reading
    for passage_num in [1, 2, 3]:
        passage_name = f'passage{passage_num}'
        if counts['reading'][passage_name]['count'] == 0:
            missing.append(f'Reading {passage_name}')

    # Check writing
    for task_num in [1, 2]:
        task_name = f'task{task_num}'
        if counts['writing'][task_name]['count'] == 0:
            missing.append(f'Writing {task_name}')

    # Check speaking
    for part_num in [1, 2, 3]:
        part_name = f'part{part_num}'
        if counts['speaking'][part_name]['count'] == 0:
            missing.append(f'Speaking {part_name}')

    return len(missing) == 0, missing


def ensure_cambridge_8_test1_exists():
    """
    Ensure the Cambridge IELTS 8 - Test 1 sample variant exists.
    If it doesn't exist, automatically load it from the sample test JSON file.
    
    Returns:
        Variant: The Cambridge 8 Test 1 variant (existing or newly created)
    """
    from .models import Variant, TestFile, Answer
    from .test_structures import create_test_from_json
    from django.contrib.auth import get_user_model
    import logging
    
    logger = logging.getLogger(__name__)
    User = get_user_model()
    
    variant_name = "Cambridge IELTS 8 - Test 1"
    
    # Check if variant already exists
    variant = Variant.objects.filter(name=variant_name).first()
    if variant:
        # Verify it has all required test files
        has_listening = TestFile.objects.filter(variant=variant, file_type='listening').exists()
        has_reading = TestFile.objects.filter(variant=variant, file_type='reading').exists()
        has_writing = TestFile.objects.filter(variant=variant, file_type='writing').exists()
        has_speaking = TestFile.objects.filter(variant=variant, file_type='speaking').exists()
        
        if has_listening and has_reading and has_writing and has_speaking:
            return variant
        else:
            # Variant exists but is incomplete, delete and recreate
            logger.info(f"Variant {variant_name} exists but is incomplete. Recreating...")
            variant.test_files.all().delete()
            variant.answers.all().delete()
    
    # Load the sample test JSON file
    sample_test_path = os.path.join(settings.BASE_DIR, 'exams', 'sample_tests', 'cambridge_ielts_8_test1.json')
    
    if not os.path.exists(sample_test_path):
        logger.warning(f"Sample test file not found: {sample_test_path}")
        return None
    
    try:
        with open(sample_test_path, 'r', encoding='utf-8') as f:
            test_data = json.load(f)
        
        # Parse test structure
        test = create_test_from_json(test_data)
        
        # Get or create admin user
        admin_user = User.objects.filter(role='admin').first()
        if not admin_user:
            logger.warning("No admin user found. Cannot create sample variant.")
            return None
        
        # Create or update variant
        if not variant:
            variant, created = Variant.objects.get_or_create(
                name=test.variant_name,
                defaults={
                    'duration_minutes': 180,  # 3 hours total
                    'created_by': admin_user,
                    'is_active': True
                }
            )
        else:
            variant.duration_minutes = 180
            variant.created_by = admin_user
            variant.is_active = True
            variant.save()
        
        # Create Listening section
        if test.listening:
            listening_data = test.listening.to_dict()
            audio_file_path = None
            if test.listening.audio_url and not test.listening.audio_url.startswith(('http://', 'https://', '/')):
                audio_file_path = test.listening.audio_url
            elif test.listening.audio_url and test.listening.audio_url.startswith('audio_files/'):
                audio_file_path = test.listening.audio_url
            
            TestFile.objects.filter(variant=variant, file_type='listening').delete()
            test_file = TestFile.objects.create(
                variant=variant,
                file_type='listening',
                questions_data=listening_data,
                duration_minutes=test.listening.duration_minutes,
                file='placeholder.pdf',
                audio_file=audio_file_path
            )
            
            # Create answer keys
            Answer.objects.filter(variant=variant, section='listening').delete()
            for q_num, answer in test.listening_answers.items():
                Answer.objects.create(
                    variant=variant,
                    section='listening',
                    question_number=int(q_num),
                    correct_answer=str(answer) if not isinstance(answer, list) else str(answer[0]),
                    alternative_answers=answer if isinstance(answer, list) and len(answer) > 1 else None
                )
        
        # Create Reading section
        if test.reading:
            reading_data = test.reading.to_dict()
            TestFile.objects.filter(variant=variant, file_type='reading').delete()
            test_file = TestFile.objects.create(
                variant=variant,
                file_type='reading',
                questions_data=reading_data,
                duration_minutes=test.reading.duration_minutes,
                file='placeholder.pdf'
            )
            
            # Create answer keys
            Answer.objects.filter(variant=variant, section='reading').delete()
            for q_num, answer in test.reading_answers.items():
                Answer.objects.create(
                    variant=variant,
                    section='reading',
                    question_number=int(q_num),
                    correct_answer=str(answer) if not isinstance(answer, list) else str(answer[0]),
                    alternative_answers=answer if isinstance(answer, list) and len(answer) > 1 else None
                )
        
        # Create Writing section
        if test.writing:
            # Task 1
            if test.writing.task1:
                TestFile.objects.filter(variant=variant, file_type='writing', task_number=1).delete()
                TestFile.objects.create(
                    variant=variant,
                    file_type='writing',
                    task_number=1,
                    questions_data=test.writing.task1.to_dict(),
                    duration_minutes=test.writing.task1.duration_minutes,
                    file='placeholder.pdf'
                )
            
            # Task 2
            if test.writing.task2:
                TestFile.objects.filter(variant=variant, file_type='writing', task_number=2).delete()
                TestFile.objects.create(
                    variant=variant,
                    file_type='writing',
                    task_number=2,
                    questions_data=test.writing.task2.to_dict(),
                    duration_minutes=test.writing.task2.duration_minutes,
                    file='placeholder.pdf'
                )
        
        # Create Speaking section
        if test.speaking:
            speaking_data = test.speaking.to_dict()
            TestFile.objects.filter(variant=variant, file_type='speaking').delete()
            TestFile.objects.create(
                variant=variant,
                file_type='speaking',
                questions_data=speaking_data,
                duration_minutes=test.speaking.total_duration_minutes,
                file='placeholder.pdf'
            )
        
        logger.info(f"Successfully ensured {variant_name} variant exists (Code: {variant.code})")
        return variant
        
    except Exception as e:
        logger.error(f"Error loading sample test: {e}", exc_info=True)
        return None
