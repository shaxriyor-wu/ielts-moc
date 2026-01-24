"""
Speech-to-Text service using OpenAI Whisper API.
"""

import os
import logging

logger = logging.getLogger(__name__)


def transcribe_audio_whisper(audio_file_path: str) -> dict:
    """
    Transcribe audio using OpenAI Whisper API.

    Args:
        audio_file_path: Path to audio file (webm, mp3, wav, m4a, etc.)

    Returns:
        dict: {
            'success': True/False,
            'text': transcribed text,
            'language': detected language,
            'duration': audio duration in seconds,
            'error': error message (if failed)
        }
    """
    openai_api_key = os.getenv('OPENAI_API_KEY')

    if not openai_api_key:
        logger.error("OpenAI API key not configured for speech-to-text")
        return {
            'success': False,
            'text': None,
            'language': None,
            'duration': None,
            'error': 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.'
        }

    try:
        # Import OpenAI library
        try:
            import openai
        except ImportError:
            logger.error("OpenAI library not installed")
            return {
                'success': False,
                'text': None,
                'language': None,
                'duration': None,
                'error': 'OpenAI library not installed. Please run: pip install openai'
            }

        # Initialize OpenAI client
        client = openai.OpenAI(api_key=openai_api_key)

        # Open and transcribe the audio file
        with open(audio_file_path, 'rb') as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="verbose_json"
            )

        logger.info(f"Successfully transcribed audio: {audio_file_path}")

        return {
            'success': True,
            'text': transcript.text,
            'language': getattr(transcript, 'language', 'en'),
            'duration': getattr(transcript, 'duration', None),
            'error': None
        }

    except FileNotFoundError:
        logger.error(f"Audio file not found: {audio_file_path}")
        return {
            'success': False,
            'text': None,
            'language': None,
            'duration': None,
            'error': f'Audio file not found: {audio_file_path}'
        }

    except Exception as e:
        logger.error(f"Error transcribing audio: {str(e)}")
        return {
            'success': False,
            'text': None,
            'language': None,
            'duration': None,
            'error': f'Transcription failed: {str(e)}'
        }


def get_audio_duration(audio_file_path: str) -> float:
    """
    Get audio file duration in seconds.

    Args:
        audio_file_path: Path to audio file

    Returns:
        float: Duration in seconds, or None if failed
    """
    try:
        # Try using mutagen library for audio metadata
        try:
            from mutagen import File
            audio = File(audio_file_path)
            if audio is not None and hasattr(audio.info, 'length'):
                return audio.info.length
        except ImportError:
            pass

        # Fallback: estimate from file size (rough approximation)
        # Assuming average bitrate of 128kbps for speech
        import os
        file_size_bytes = os.path.getsize(audio_file_path)
        # Rough estimate: 16KB per second at 128kbps
        estimated_duration = file_size_bytes / (16 * 1024)
        return estimated_duration

    except Exception as e:
        logger.warning(f"Could not determine audio duration: {str(e)}")
        return None
