"""Bounded snapshot of this application's WKWebView using WebKit's content API."""

from base64 import b64encode
from threading import Event, Lock
from urllib.parse import urlsplit


def web_content_capture(window, origin):
    """Create a single-flight adapter with main-thread WebKit and AppKit ownership."""
    from AppKit import NSBitmapImageRep, NSBitmapImageFileTypePNG
    from Foundation import NSNumber
    from PyObjCTools.AppHelper import callAfter
    from WebKit import WKSnapshotConfiguration, WKWebView

    pending = Lock()
    expected = urlsplit(origin)

    def views(root):
        """Walk only subviews of the owned window."""
        yield root
        for child in root.subviews():
            yield from views(child)

    def capture():
        """Return an ephemeral PNG or a status while bounding wait and image bytes."""
        if not pending.acquire(blocking=False):
            return {'status': 'busy'}
        ready = Event()
        result = {'status': 'failed'}

        def complete(image, error):
            """Convert the platform result on its owning thread and release the slot."""
            try:
                if image is not None and error is None:
                    bitmap = NSBitmapImageRep.imageRepWithData_(image.TIFFRepresentation())
                    data = bitmap.representationUsingType_properties_(NSBitmapImageFileTypePNG, {})
                    if data is not None and 0 < data.length() <= 1024 * 1024:
                        result.update(status='captured', mimeType='image/png',
                                      imageBase64=b64encode(bytes(data)).decode('ascii'))
                    elif data is not None:
                        result['status'] = 'too-large'
            except Exception:
                pass
            finally:
                pending.release()
                ready.set()

        def begin():
            """Find one matching WKWebView and verify its live address before capture."""
            try:
                matches = [view for view in views(window.native.contentView()) if isinstance(view, WKWebView)]
                if len(matches) != 1:
                    complete(None, None)
                    return
                view = matches[0]
                current = urlsplit(str(view.URL().absoluteString()))
                if (current.scheme, current.netloc, current.path) != (expected.scheme, expected.netloc, '/'):
                    complete(None, None)
                    return
                config = WKSnapshotConfiguration.alloc().init()
                config.setSnapshotWidth_(NSNumber.numberWithDouble_(720))
                view.takeSnapshotWithConfiguration_completionHandler_(config, complete)
            except Exception:
                complete(None, None)

        try:
            callAfter(begin)
        except Exception:
            pending.release()
            return {'status': 'failed'}
        if not ready.wait(2):
            return {'status': 'timeout'}
        return result

    return capture
