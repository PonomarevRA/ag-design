"""Local origin boundary, actual streamed request budgets and atomic endpoint discovery."""

import ipaddress
import json
import os
from pathlib import Path
from urllib.parse import urlsplit

from .errors import DesignError


def local_origin(value):
    """Accept only numeric loopback HTTP(S) origins with an explicit port and no redirection controls."""
    if not isinstance(value, str) or len(value) > 256:
        raise ValueError('Invalid local origin')
    parsed = urlsplit(value)
    if parsed.scheme not in {'http','https'} or parsed.username or parsed.password or parsed.path not in {'','/'} or parsed.query or parsed.fragment:
        raise ValueError('Invalid local origin')
    if not ipaddress.ip_address(parsed.hostname or '').is_loopback or not parsed.port:
        raise ValueError('Invalid local origin')
    return f'{parsed.scheme}://{parsed.netloc}'


def permitted_request(request, configured_origin=None):
    """Require a loopback peer and numeric Host; browser requests must have the exact local origin."""
    try:
        expected = local_origin(str(request.base_url).rstrip('/'))
        peer = request.client.host if request.client else ''
        if peer != 'testclient' and not ipaddress.ip_address(peer).is_loopback:
            return False
        if configured_origin and expected != configured_origin:
            return False
        supplied = request.headers.get('origin')
        return (supplied is None or supplied == expected) and request.headers.get('sec-fetch-site') != 'cross-site'
    except ValueError:
        return False


async def json_body(request, *, maximum=65536):
    """Stream a route-owned byte budget (64 KiB by default) and reject ambiguous/nonfinite JSON."""
    if request.headers.get('content-type','').split(';',1)[0].strip().lower() != 'application/json':
        raise DesignError('invalid_content_type','Expected application/json',415)
    raw = bytearray()
    async for chunk in request.stream():
        if len(raw) + len(chunk) > maximum:
            raise DesignError('too_large','Request exceeds the route byte budget',413)
        raw.extend(chunk)
    try:
        value = json.loads(raw, parse_constant=_invalid_constant, object_pairs_hook=_unique_object)
    except (ValueError,UnicodeError,RecursionError) as error:
        raise DesignError('invalid_json','Expected finite JSON object',422) from error
    if not isinstance(value,dict):
        raise DesignError('invalid_fields','Expected JSON object',422)
    return value


def _unique_object(pairs):
    """Reject repeated object keys so caller controls cannot change meaning between decoders."""
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError('Repeated JSON field')
        result[key] = value
    return result


def _invalid_constant(value):
    """Refuse JSON extensions such as NaN rather than converting unknown measurements to zero."""
    raise ValueError('Nonfinite JSON number')


class Discovery:
    """Own one atomic endpoint marker; shutdown cannot delete a marker belonging to another instance."""

    def __init__(self, directory, origin, instance_id):
        """Retain only service-owned paths and a validated local origin, never caller-selected HTTP paths."""
        self.directory, self.origin, self.instance_id = Path(directory), local_origin(origin), instance_id
        self.path = self.directory / 'endpoint.json'

    def publish(self):
        """Publish discovery after acquiring the data lock; use a private regular temporary file."""
        temporary = self.directory / 'endpoint.json.tmp'
        if self.path.is_symlink() or temporary.is_symlink():
            raise DesignError('unsafe_storage','Discovery symlinks are not supported',503)
        descriptor = os.open(temporary, os.O_WRONLY|os.O_CREAT|os.O_TRUNC|getattr(os,'O_NOFOLLOW',0),0o600)
        with os.fdopen(descriptor,'w',encoding='utf-8') as stream:
            json.dump({'origin':self.origin,'instanceId':self.instance_id},stream)
            stream.flush()
            os.fsync(stream.fileno())
        temporary.replace(self.path)

    def close(self):
        """Remove only this instance's regular marker; preserve unrelated or replaced discovery data."""
        try:
            if not self.path.is_symlink() and self.path.stat().st_size <= 1024:
                value = json.loads(self.path.read_text(encoding='utf-8'))
                if value.get('instanceId') == self.instance_id:
                    self.path.unlink()
        except (OSError,ValueError,AttributeError):
            pass
