"""Reject recognisable credentials without echoing their values; this is a bounded publication gate."""
from pathlib import PurePosixPath
import re
from urllib.parse import urlsplit

CREDENTIAL_NAMES = {'.mcp.json', '.git-credentials', 'credentials.json', 'id_rsa', 'id_ed25519', 'settings.local.json', '.netrc', '.npmrc', '.pypirc', '.gitconfig'}
CREDENTIAL_SUFFIXES = {'.key', '.pem', '.p12', '.pfx', '.kdbx', '.jks', '.keystore'}
PATTERNS = [
    ('private-key', rb'-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----'),
    ('github-token', rb'\b(?:gh[pousr]_[A-Za-z0-9]{30,255}|github_pat_[A-Za-z0-9_]{50,255})\b'),
    ('service-token', rb'\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{32,255}\b'),
    ('cloud-access-id', rb'\b(?:AKIA|ASIA)[A-Z0-9]{16}\b'),
    ('google-api-key', rb'\bAIza[A-Za-z0-9_-]{35}\b'),
    ('slack-token', rb'\bxox[baprs]-[A-Za-z0-9-]{20,255}\b'),
    ('credential-url', rb'''https?://[^\s/<>:@"']{1,128}:[^\s/<>@"']{1,256}@[A-Za-z0-9.-]+'''),
    ('literal-credential', rb'''(?i)\b(?:api[_-]?key|access[_-]?token|client[_-]?secret|password)\b["']?\s*[:=]\s*["'][A-Za-z0-9/+=._-]{20,255}["']'''),
]
COMPILED = [(name, re.compile(pattern)) for name, pattern in PATTERNS]


def documentation_url(value):
    """Recognise obvious placeholder pairs only on reserved documentation domains, never an entire file."""
    try:
        url = urlsplit(value.decode('ascii'))
    except (ValueError,UnicodeDecodeError):
        return False
    host = (url.hostname or '').lower()
    reserved = host in {'example.com','example.org','example.net'} or host.endswith(('.invalid','.test','.example'))
    placeholder = ((url.username or '').lower(),(url.password or '').lower()) in {
        ('user','pass'),('u','p'),('user','password'),('username','password')}
    return reserved and placeholder


def check_secrets(name, content):
    """Reject credential paths and known byte signatures, returning no values or matched snippets.

    Args:
        name: Relative source/Git path; only its filename appears in errors.
        content: Bounded blob bytes, including ASCII metadata inside binary assets.
    Raises:
        ValueError: A credential path or recognisable signature needs explicit investigation.
    """
    path = PurePosixPath(name)
    if path.name.casefold().startswith('.env') or path.name.casefold() in CREDENTIAL_NAMES or path.suffix.lower() in CREDENTIAL_SUFFIXES:
        raise ValueError('Runtime or credential path: ' + name)
    for rule, pattern in COMPILED:
        for match in pattern.finditer(content):
            if rule == 'credential-url' and documentation_url(match.group()):
                continue
            raise ValueError('Credential signature ' + rule + ' in: ' + name)
