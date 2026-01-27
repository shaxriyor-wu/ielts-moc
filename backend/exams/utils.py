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
