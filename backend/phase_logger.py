"""
Clean Phase Logger for SubsTranslator
====================================

Provides structured, clean logging for different processing phases:
- A/Download: Video download and preparation
- B/Transcribe: Audio transcription with Whisper
- C/Translate: Text translation services
- D/Embed: Video creation with subtitles/watermarks

Features:
- Consistent phase naming
- Clean, readable output
- JSON structured logging option
- Performance metrics integration
- Spam reduction
"""

import json
import logging
import time
from dataclasses import asdict, dataclass
from typing import Any, Optional

logger = logging.getLogger(__name__)


@dataclass
class PhaseMetrics:
    """Structured metrics for a processing phase."""
    
    phase: str
    event: str
    task_id: str
    duration_s: Optional[float] = None
    size_mb: Optional[float] = None
    speed_mbps: Optional[float] = None
    segments: Optional[int] = None
    segments_range: Optional[str] = None
    tokens_in: Optional[int] = None
    tokens_out: Optional[int] = None
    tokens_total: Optional[int] = None
    cost_usd: Optional[float] = None
    model: Optional[str] = None
    language: Optional[str] = None
    confidence: Optional[float] = None
    output_path: Optional[str] = None
    note: Optional[str] = None


class PhaseLogger:
    """Clean, structured logger for processing phases."""
    
    PHASES = {
        'download': 'A/Download',
        'transcribe': 'B/Transcribe', 
        'translate': 'C/Translate',
        'embed': 'D/Embed'
    }
    
    def __init__(self, task_id: str, enable_json: bool = False):
        self.task_id = task_id
        self.enable_json = enable_json
        self.phase_start_times = {}
        
    def _format_size(self, size_bytes: Optional[float]) -> Optional[float]:
        """Convert bytes to MB (10^6)."""
        if size_bytes is None:
            return None
        return round(size_bytes / (1024 * 1024), 2)
    
    def _format_duration(self, duration: Optional[float]) -> Optional[float]:
        """Format duration to 1 decimal place."""
        if duration is None:
            return None
        return round(duration, 1)
    
    def _format_speed(self, size_mb: Optional[float], duration_s: Optional[float]) -> Optional[float]:
        """Calculate speed in MB/s."""
        if size_mb is None or duration_s is None or duration_s <= 0:
            return None
        return round(size_mb / duration_s, 2)
    
    def _truncate_path(self, path: Optional[str]) -> Optional[str]:
        """Truncate path for clean display."""
        if not path:
            return None
        # Show only filename for downloads, relative path for others
        if '/downloads/' in path:
            return path.split('/downloads/')[-1]
        elif '/uploads/' in path:
            return path.split('/uploads/')[-1]
        return path.split('/')[-1]  # Just filename
    
    def start_phase(self, phase: str, **kwargs) -> None:
        """Start a processing phase."""
        phase_name = self.PHASES.get(phase, phase)
        self.phase_start_times[phase] = time.time()
        
        # Create clean start message
        details = []
        if 'url' in kwargs:
            details.append(f"url={kwargs['url'][:50]}...")
        if 'model' in kwargs:
            details.append(f"model={kwargs['model']}")
        if 'service' in kwargs:
            details.append(f"service={kwargs['service']}")
        if 'target_lang' in kwargs:
            details.append(f"target={kwargs['target_lang']}")
        if 'size_mb' in kwargs:
            details.append(f"size={kwargs['size_mb']}MB")
        if 'segments' in kwargs:
            details.append(f"segments={kwargs['segments']}")
            
        detail_str = " ".join(details)
        message = f"{phase_name} ▶ start {detail_str}".strip()
        
        logger.info(message)
        
        # JSON logging
        if self.enable_json:
            metrics = PhaseMetrics(
                phase=phase,
                event="start",
                task_id=self.task_id,
                **{k: v for k, v in kwargs.items() if k in PhaseMetrics.__annotations__}
            )
            logger.info(json.dumps(asdict(metrics), default=str))
    
    def complete_phase(self, phase: str, **kwargs) -> None:
        """Complete a processing phase with metrics."""
        phase_name = self.PHASES.get(phase, phase)
        
        # Calculate duration
        start_time = self.phase_start_times.get(phase)
        duration_s = time.time() - start_time if start_time else None
        
        # Format metrics
        size_mb = self._format_size(kwargs.get('size_bytes'))
        duration_formatted = self._format_duration(duration_s)
        speed_mbps = self._format_speed(size_mb, duration_s)
        output_path = self._truncate_path(kwargs.get('output_path'))
        
        # Create clean completion message
        details = []
        if duration_formatted:
            details.append(f"dur={duration_formatted}s")
        if speed_mbps and phase == 'download':
            details.append(f"avg={speed_mbps}MB/s")
        elif speed_mbps and phase in ['transcribe', 'embed']:
            # For transcribe/embed, show speed as multiplier
            if kwargs.get('input_duration'):
                speed_ratio = kwargs['input_duration'] / duration_s if duration_s else 0
                details.append(f"speed={speed_ratio:.1f}×")
        if size_mb:
            details.append(f"size={size_mb}MB")
        if kwargs.get('segments'):
            details.append(f"segments={kwargs['segments']}")
        if kwargs.get('segments_range'):
            details.append(f"seg={kwargs['segments_range']}")
        if kwargs.get('tokens_total'):
            details.append(f"tokens={kwargs['tokens_total']}")
        if kwargs.get('cost_usd'):
            details.append(f"cost≈${kwargs['cost_usd']:.4f}")
        if kwargs.get('language') and kwargs.get('confidence'):
            details.append(f"lang={kwargs['language']} p={kwargs['confidence']:.2f}")
        if output_path:
            details.append(f"out={output_path}")
        if kwargs.get('note'):
            details.append(f'note="{kwargs["note"]}"')
            
        detail_str = " ".join(details)
        message = f"{phase_name} ✅ done {detail_str}".strip()
        
        logger.info(message)
        
        # JSON logging
        if self.enable_json:
            metrics = PhaseMetrics(
                phase=phase,
                event="complete",
                task_id=self.task_id,
                duration_s=duration_formatted,
                size_mb=size_mb,
                speed_mbps=speed_mbps,
                output_path=output_path,
                **{k: v for k, v in kwargs.items() if k in PhaseMetrics.__annotations__}
            )
            logger.info(json.dumps(asdict(metrics), default=str))
    
    def log_batch_progress(self, phase: str, batch_num: int, total_batches: int, **kwargs) -> None:
        """Log batch progress (for translation)."""
        phase_name = self.PHASES.get(phase, phase)
        
        details = []
        if kwargs.get('segments_range'):
            details.append(f"seg={kwargs['segments_range']}")
        if kwargs.get('tokens_in') and kwargs.get('tokens_out'):
            details.append(f"in={kwargs['tokens_in']} out={kwargs['tokens_out']}")
        if kwargs.get('tokens_total'):
            details.append(f"total={kwargs['tokens_total']}")
        if kwargs.get('cost_usd'):
            details.append(f"cost≈${kwargs['cost_usd']:.4f}")
        if kwargs.get('model'):
            details.append(f"model={kwargs['model']}")
            
        detail_str = " ".join(details)
        message = f"{phase_name} ✅ batch={batch_num}/{total_batches} {detail_str}".strip()
        
        logger.info(message)
    
    def log_error(self, phase: str, error: str, **kwargs) -> None:
        """Log phase error."""
        phase_name = self.PHASES.get(phase, phase)
        message = f"{phase_name} ❌ error: {error}"
        
        logger.error(message)
        
        # JSON logging
        if self.enable_json:
            metrics = PhaseMetrics(
                phase=phase,
                event="error",
                task_id=self.task_id,
                note=error,
                **{k: v for k, v in kwargs.items() if k in PhaseMetrics.__annotations__}
            )
            logger.error(json.dumps(asdict(metrics), default=str))
    
    def log_final_summary(self, total_duration_s: float, **kwargs) -> None:
        """Log final task completion summary."""
        details = []
        details.append(f"total={total_duration_s:.1f}s")
        
        if kwargs.get('files'):
            files = [self._truncate_path(f) for f in kwargs['files']]
            details.append(f"files={files}")
        if kwargs.get('final_size_mb'):
            details.append(f"final={kwargs['final_size_mb']}MB")
            
        detail_str = " ".join(details)
        message = f"✅ DONE task={self.task_id[:8]}... {detail_str}"
        
        logger.info(message)


def create_phase_logger(task_id: str, enable_json: bool = False) -> PhaseLogger:
    """Create a new phase logger instance."""
    return PhaseLogger(task_id, enable_json)


# Utility functions for backward compatibility
def log_phase_start(task_id: str, phase: str, **kwargs) -> PhaseLogger:
    """Quick start a phase and return logger."""
    phase_logger = create_phase_logger(task_id)
    phase_logger.start_phase(phase, **kwargs)
    return phase_logger


def log_phase_complete(phase_logger: PhaseLogger, phase: str, **kwargs) -> None:
    """Quick complete a phase."""
    phase_logger.complete_phase(phase, **kwargs)