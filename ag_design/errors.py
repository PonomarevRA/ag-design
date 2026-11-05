"""Safe public errors shared by catalog validation, persistence and HTTP."""

class DesignError(Exception):
    """Describe an expected failure without leaking paths, SQL or raw exception text."""

    def __init__(self, code, message, status=422):
        """Retain a fixed public code, bounded explanation and HTTP status."""
        super().__init__(message)
        self.code, self.message, self.status = code, message, status
