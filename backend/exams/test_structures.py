"""
IELTS Test Data Structures and Validation

This module defines the structure for IELTS test data in JSON format.
Used for code-based test creation and validation.
"""

from typing import List, Dict, Any, Optional, Union
from dataclasses import dataclass, field, asdict
from enum import Enum


class QuestionType(str, Enum):
    """Question types supported in IELTS tests."""
    FILL_IN_BLANK = "fill"
    MULTIPLE_CHOICE = "multiple"
    TRUE_FALSE_NOT_GIVEN = "tfng"
    YES_NO_NOT_GIVEN = "ynng"
    MATCHING = "matching"
    SHORT_ANSWER = "short"
    SENTENCE_COMPLETION = "completion"
    DIAGRAM_LABELING = "diagram"
    TABLE_COMPLETION = "table"


class SectionType(str, Enum):
    """IELTS test sections."""
    LISTENING = "listening"
    READING = "reading"
    WRITING = "writing"
    SPEAKING = "speaking"


@dataclass
class Question:
    """Base question structure."""
    id: int  # Question number (1-40 for L/R)
    type: str  # QuestionType value
    question: str  # Question text
    options: Optional[List[str]] = None  # For multiple choice
    image_url: Optional[str] = None  # Optional image for question
    notes: Optional[str] = None  # Additional notes for students
    instruction_block: Optional[Dict[str, Any]] = None  # Structured instruction (e.g., matching headings)
    table_data: Optional[Dict[str, Any]] = None  # Structure for table completion questions
    is_hidden: bool = False  # If true, this question is part of a larger group (e.g., table) and shouldn't be rendered independently
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {k: v for k, v in asdict(self).items() if v is not None}


@dataclass
class ListeningSection:
    """Structure for one section of Listening test (1-4)."""
    section_number: int  # 1, 2, 3, or 4
    title: str  # e.g., "Section 1: Telephone Conversation"
    context: Optional[str] = None  # Brief context about the audio
    questions: List[Question] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "section_number": self.section_number,
            "title": self.title,
            "context": self.context,
            "questions": [q.to_dict() for q in self.questions]
        }


@dataclass
class ListeningTest:
    """Complete Listening test structure."""
    audio_url: str  # URL to audio file
    duration_minutes: int = 40  # Including 10 minutes for transfer
    sections: List[ListeningSection] = field(default_factory=list)
    total_questions: int = 40
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "audio_url": self.audio_url,
            "duration_minutes": self.duration_minutes,
            "sections": [s.to_dict() for s in self.sections],
            "total_questions": self.total_questions
        }
    
    def validate(self) -> tuple[bool, Optional[str]]:
        """Validate listening test structure."""
        if not self.audio_url:
            return False, "Audio URL is required"
        if len(self.sections) != 4:
            return False, f"Listening must have exactly 4 sections, got {len(self.sections)}"
        total_qs = sum(len(s.questions) for s in self.sections)
        if total_qs != 40:
            return False, f"Listening must have exactly 40 questions, got {total_qs}"
        return True, None


@dataclass
class ReadingPassage:
    """Structure for one reading passage."""
    passage_number: int  # 1, 2, or 3
    title: str
    text: str  # Full passage text (or URL to text file)
    image_url: Optional[str] = None  # Optional diagram/image
    questions: List[Question] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "passage_number": self.passage_number,
            "title": self.title,
            "text": self.text,
            "image_url": self.image_url,
            "questions": [q.to_dict() for q in self.questions]
        }


@dataclass
class ReadingTest:
    """Complete Reading test structure."""
    duration_minutes: int = 60
    passages: List[ReadingPassage] = field(default_factory=list)
    total_questions: int = 40
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "duration_minutes": self.duration_minutes,
            "passages": [p.to_dict() for p in self.passages],
            "total_questions": self.total_questions
        }
    
    def validate(self) -> tuple[bool, Optional[str]]:
        """Validate reading test structure."""
        if len(self.passages) != 3:
            return False, f"Reading must have exactly 3 passages, got {len(self.passages)}"
        total_qs = sum(len(p.questions) for p in self.passages)
        if total_qs != 40:
            return False, f"Reading must have exactly 40 questions, got {total_qs}"
        return True, None


@dataclass
class WritingTask:
    """Structure for a writing task."""
    task_number: int  # 1 or 2
    prompt: str  # Task prompt/question
    min_words: int  # Minimum word count
    image_url: Optional[str] = None  # For Task 1 (graph/chart)
    duration_minutes: int = 20  # Task 1: 20min, Task 2: 40min
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "task_number": self.task_number,
            "prompt": self.prompt,
            "min_words": self.min_words,
            "image_url": self.image_url,
            "duration_minutes": self.duration_minutes
        }


@dataclass
class WritingTest:
    """Complete Writing test structure."""
    task1: WritingTask = None
    task2: WritingTask = None
    total_duration_minutes: int = 60
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "task1": self.task1.to_dict() if self.task1 else None,
            "task2": self.task2.to_dict() if self.task2 else None,
            "total_duration_minutes": self.total_duration_minutes
        }
    
    def validate(self) -> tuple[bool, Optional[str]]:
        """Validate writing test structure."""
        if not self.task1:
            return False, "Task 1 is required"
        if not self.task2:
            return False, "Task 2 is required"
        if self.task1.min_words != 150:
            return False, "Task 1 must require 150 words"
        if self.task2.min_words != 250:
            return False, "Task 2 must require 250 words"
        return True, None


@dataclass
class SpeakingPart:
    """Structure for one part of Speaking test."""
    part_number: int  # 1, 2, or 3
    title: str
    prompts: List[str]  # List of questions/prompts
    duration_minutes: int
    notes: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "part_number": self.part_number,
            "title": self.title,
            "prompts": self.prompts,
            "duration_minutes": self.duration_minutes,
            "notes": self.notes
        }


@dataclass
class SpeakingTest:
    """Complete Speaking test structure."""
    parts: List[SpeakingPart] = field(default_factory=list)
    total_duration_minutes: int = 15  # 11-14 minutes typically
    response_type: str = "text"  # "text" or "audio"
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "parts": [p.to_dict() for p in self.parts],
            "total_duration_minutes": self.total_duration_minutes,
            "response_type": self.response_type
        }
    
    def validate(self) -> tuple[bool, Optional[str]]:
        """Validate speaking test structure."""
        if len(self.parts) != 3:
            return False, f"Speaking must have exactly 3 parts, got {len(self.parts)}"
        return True, None


@dataclass
class CompleteTest:
    """Complete IELTS test with all sections."""
    variant_name: str
    listening: Optional[ListeningTest] = None
    reading: Optional[ReadingTest] = None
    writing: Optional[WritingTest] = None
    speaking: Optional[SpeakingTest] = None
    
    # Answer keys
    listening_answers: Dict[int, Union[str, List[str]]] = field(default_factory=dict)  # {question_num: correct_answer(s)}
    reading_answers: Dict[int, Union[str, List[str]]] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "variant_name": self.variant_name,
            "listening": self.listening.to_dict() if self.listening else None,
            "reading": self.reading.to_dict() if self.reading else None,
            "writing": self.writing.to_dict() if self.writing else None,
            "speaking": self.speaking.to_dict() if self.speaking else None,
            "listening_answers": self.listening_answers,
            "reading_answers": self.reading_answers
        }
    
    def validate(self) -> tuple[bool, Optional[str]]:
        """Validate complete test structure."""
        if not any([self.listening, self.reading, self.writing, self.speaking]):
            return False, "Test must have at least one section"
        
        if self.listening:
            valid, msg = self.listening.validate()
            if not valid:
                return False, f"Listening section: {msg}"
            if len(self.listening_answers) != 40:
                return False, f"Listening must have 40 answers, got {len(self.listening_answers)}"
        
        if self.reading:
            valid, msg = self.reading.validate()
            if not valid:
                return False, f"Reading section: {msg}"
            if len(self.reading_answers) != 40:
                return False, f"Reading must have 40 answers, got {len(self.reading_answers)}"
        
        if self.writing:
            valid, msg = self.writing.validate()
            if not valid:
                return False, f"Writing section: {msg}"
        
        if self.speaking:
            valid, msg = self.speaking.validate()
            if not valid:
                return False, f"Speaking section: {msg}"
        
        return True, None


def create_test_from_json(data: Dict[str, Any]) -> CompleteTest:
    """
    Create a CompleteTest object from JSON data.
    
    Args:
        data: Dictionary containing test data
        
    Returns:
        CompleteTest object
        
    Raises:
        ValueError: If data is invalid
    """
    test = CompleteTest(variant_name=data.get("variant_name", "Unnamed Test"))
    
    # Parse Listening
    if "listening" in data and data["listening"]:
        l_data = data["listening"]
        sections = []
        for s in l_data.get("sections", []):
            questions = [Question(**q) for q in s.get("questions", [])]
            sections.append(ListeningSection(
                section_number=s["section_number"],
                title=s["title"],
                context=s.get("context"),
                questions=questions
            ))
        test.listening = ListeningTest(
            audio_url=l_data["audio_url"],
            duration_minutes=l_data.get("duration_minutes", 40),
            sections=sections
        )
        test.listening_answers = data.get("listening_answers", {})
    
    # Parse Reading
    if "reading" in data and data["reading"]:
        r_data = data["reading"]
        passages = []
        for p in r_data.get("passages", []):
            questions = [Question(**q) for q in p.get("questions", [])]
            passages.append(ReadingPassage(
                passage_number=p["passage_number"],
                title=p["title"],
                text=p["text"],
                image_url=p.get("image_url"),
                questions=questions
            ))
        test.reading = ReadingTest(
            duration_minutes=r_data.get("duration_minutes", 60),
            passages=passages
        )
        test.reading_answers = data.get("reading_answers", {})
    
    # Parse Writing
    if "writing" in data and data["writing"]:
        w_data = data["writing"]
        test.writing = WritingTest(
            task1=WritingTask(**w_data["task1"]) if "task1" in w_data else None,
            task2=WritingTask(**w_data["task2"]) if "task2" in w_data else None,
            total_duration_minutes=w_data.get("total_duration_minutes", 60)
        )
    
    # Parse Speaking
    if "speaking" in data and data["speaking"]:
        s_data = data["speaking"]
        parts = [SpeakingPart(**p) for p in s_data.get("parts", [])]
        test.speaking = SpeakingTest(
            parts=parts,
            total_duration_minutes=s_data.get("total_duration_minutes", 15),
            response_type=s_data.get("response_type", "text")
        )
    
    # Validate
    valid, msg = test.validate()
    if not valid:
        raise ValueError(f"Invalid test structure: {msg}")
    
    return test
