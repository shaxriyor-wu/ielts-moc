"""
Management command to import IELTS answer keys from predefined data.
Based on Cambridge IELTS 8 Book 8 Test 1 answer keys.
"""

from django.core.management.base import BaseCommand, CommandError
from exams.models import Variant, Answer


class Command(BaseCommand):
    help = 'Import answer keys for IELTS Reading and Listening sections'

    def add_arguments(self, parser):
        parser.add_argument(
            'variant_code',
            type=str,
            help='The 6-digit variant code to import answers for'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing answers before importing'
        )

    def handle(self, *args, **options):
        variant_code = options['variant_code']
        
        try:
            variant = Variant.objects.get(code=variant_code)
        except Variant.DoesNotExist:
            raise CommandError(f'Variant with code "{variant_code}" does not exist')
        
        if options['clear']:
            deleted_count = Answer.objects.filter(variant=variant).delete()[0]
            self.stdout.write(f'Deleted {deleted_count} existing answers')
        
        # Cambridge IELTS 8 Book 8 Test 1 - Listening Answer Key
        listening_answers = [
            # Section 1 - Library George
            (1, 'C', None),
            (2, 'B', None),
            (3, '48 North Avenue', ['48 North Avenue']),
            (4, 'WS6 2YH', None),
            (5, '01674 553242', ['01674553242']),
            (6, 'drinks', ['(free) drinks', 'refreshments', '(free) refreshments']),
            (7, 'pianist', ['(the/a) pianist', 'piano player', '(the/a) piano player']),
            (8, '10.50', None),
            (9, '4', None),
            (10, '50%', ['50 percent', '50', 'fifty percent']),
            # Section 2 - The Dinosaur Museum
            (11, '1:30', ['1.30', '130', 'one thirty']),
            (12, '25 December', ['25 Dec', 'Christmas Day', 'Christmas', '25th December']),
            (13, 'car-park', ['car park', 'carpark', 'parking lot', 'parking']),
            (14, '45', None),
            (15, 'tables', ['(some) tables', 'table']),
            (16, 'C', None),  # 16-18 IN ANY ORDER
            (17, 'F', None),
            (18, 'G', None),
            (19, 'B', None),  # 19-20 IN ANY ORDER
            (20, 'E', None),
            # Section 3 - Field Trip Proposal
            (21, 'A', None),
            (22, 'C', None),
            (23, 'A', None),
            (24, 'B', None),
            (25, 'B', None),  # 25-27 IN ANY ORDER
            (26, 'C', None),
            (27, 'F', None),
            (28, '12,000', ['12000', '12 000']),
            (29, 'horses', ['horse']),
            (30, 'caves', ['cave']),
            # Section 4 - Geography
            (31, 'surface', None),
            (32, 'environment', None),
            (33, 'impacts', ['impact', 'effects', 'effect', 'impacts/effects']),
            (34, 'urban', None),
            (35, 'problems', ['problem']),
            (36, 'images', ['image']),
            (37, 'patterns', ['pattern']),
            (38, 'distortions', ['distortion']),
            (39, 'traffic', None),
            (40, 'weather', None),
        ]
        
        # Cambridge IELTS 8 Book 8 Test 1 - Reading Answer Key
        reading_answers = [
            # Passage 1 - A Chronicle of Timekeeping
            (1, 'D', None),
            (2, 'B', None),
            (3, 'F', None),
            (4, 'E', None),
            (5, 'B', None),
            (6, 'F', None),
            (7, 'D', None),
            (8, 'A', None),
            (9, 'anchor', ["(ship's) anchor", 'on/the anchor']),
            (10, 'escape wheel', ['(escape) wheel']),
            (11, 'tooth', None),
            (12, 'pendulum', ['(long) pendulum']),
            (13, 'second', None),
            # Passage 2 - Air Traffic Control in the USA
            (14, 'ii', None),
            (15, 'iii', None),
            (16, 'v', None),
            (17, 'iv', None),
            (18, 'viii', None),
            (19, 'vii', None),
            (20, 'FALSE', None),
            (21, 'FALSE', None),
            (22, 'NOT GIVEN', None),
            (23, 'TRUE', None),
            (24, 'TRUE', None),
            (25, 'FALSE', None),
            (26, 'TRUE', None),
            # Passage 3 - Telepathy
            (27, 'E', None),
            (28, 'B', None),
            (29, 'A', None),
            (30, 'F', None),
            (31, 'sender', None),
            (32, 'picture', ['image', 'picture/image']),
            (33, 'receiver', None),
            (34, 'sensory leakage', ['fraud']),  # 34-35 IN EITHER ORDER
            (35, 'fraud', ['sensory leakage', '(outright) fraud']),
            (36, 'computers', ['computer']),
            (37, 'human involvement', None),
            (38, 'meta-analysis', None),
            (39, 'lack of consistency', None),
            (40, 'big enough', ['large enough', 'big/large enough']),
        ]
        
        created_count = 0
        updated_count = 0
        
        # Import Listening answers
        for q_num, correct_answer, alternatives in listening_answers:
            answer, created = Answer.objects.update_or_create(
                variant=variant,
                section='listening',
                question_number=q_num,
                defaults={
                    'correct_answer': correct_answer,
                    'alternative_answers': alternatives,
                    'case_sensitive': False,
                }
            )
            if created:
                created_count += 1
            else:
                updated_count += 1
        
        # Import Reading answers
        for q_num, correct_answer, alternatives in reading_answers:
            answer, created = Answer.objects.update_or_create(
                variant=variant,
                section='reading',
                question_number=q_num,
                defaults={
                    'correct_answer': correct_answer,
                    'alternative_answers': alternatives,
                    'case_sensitive': False,
                }
            )
            if created:
                created_count += 1
            else:
                updated_count += 1
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully imported answer keys for variant "{variant.name}" ({variant.code})\n'
                f'Created: {created_count}, Updated: {updated_count}'
            )
        )
