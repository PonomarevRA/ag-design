"""Independent native-window lifecycle; HTTP service and data belong only to Design."""

import errno
from pathlib import Path
import socket
import sys
import threading
import time

from .native_shutdown import SERVER_DRAIN_SECONDS


def reserve_loopback(port: int, allow_fallback=True) -> socket.socket:
    """Bind before starting the server; occupied preferred ports fall back to an owned ephemeral socket."""
    listener = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    # Permit orderly restart after accepted connections enter TIME_WAIT; never enable port sharing.
    listener.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        try:
            listener.bind(("127.0.0.1", port))
        except OSError as error:
            if error.errno != errno.EADDRINUSE or not allow_fallback:
                raise
            listener.bind(("127.0.0.1", 0))
        listener.listen(128)
        return listener
    except BaseException:
        listener.close()
        raise


def wait_started(server, finished: threading.Event, timeout: float = 30) -> None:
    """Refuse an empty native window when Uvicorn fails startup or its readiness deadline expires."""
    deadline = time.monotonic() + timeout
    while not server.started:
        if finished.is_set() or server.should_exit:
            raise RuntimeError("Design HTTP server stopped before startup")
        if time.monotonic() >= deadline:
            raise RuntimeError("Design HTTP startup timed out")
        finished.wait(0.05)
    if finished.is_set():
        raise RuntimeError("Design HTTP server stopped before opening the window")


def run_desktop(app_factory, data_dir: Path, port: int = 8897, *, allow_fallback=True) -> None:
    """Run an independent native main-thread window; close it to stop only its own loopback server.

    app_factory receives data_dir=Path, origin. An already occupied port is never reused
    as a trusted application; this instance owns the bound socket it displays.
    """
    try:
        import uvicorn
        import webview
    except ImportError as error:
        raise RuntimeError("Install ag-design[desktop] to open its native window") from error
    listener = reserve_loopback(port, allow_fallback)
    try:
        data_dir = Path(data_dir)
        data_dir.mkdir(parents=True, exist_ok=True)
        finished = threading.Event()
        origin = f"http://127.0.0.1:{listener.getsockname()[1]}"
        app = app_factory(data_dir=data_dir, origin=origin)
        config = uvicorn.Config(app, host="127.0.0.1", port=listener.getsockname()[1],
                                timeout_graceful_shutdown=2, loop="asyncio", http="h11", ws="none", log_config=None, log_level="warning", access_log=False)
        server = uvicorn.Server(config)
    except BaseException:
        listener.close()
        raise

    def serve() -> None:
        """Always signal termination, including startup SystemExit from the server thread."""
        try:
            server.run(sockets=[listener])
        finally:
            finished.set()

    worker = threading.Thread(target=serve, name="ag-design-http", daemon=True)
    worker.start()

    def shutdown_owned_server():
        """Request graceful lifespan cleanup with a bounded desktop wait; the watchdog handles stalls."""
        server.should_exit = True
        worker.join(SERVER_DRAIN_SECONDS)
        return not worker.is_alive()

    restore_shutdown = None
    presentation = None
    background = None
    try:
        wait_started(server, finished)
        webview.settings["ALLOW_DOWNLOADS"] = False
        window = webview.create_window("ag-design", f"http://127.0.0.1:{listener.getsockname()[1]}/?desktop=1",
                              width=1160, height=780, min_size=(390, 560), text_select=True)
        from .native_menu import bind_native_shutdown, install_native_menu
        from .native_toolbar import bind_sidebar_presentation
        presentation = bind_sidebar_presentation(window, origin, sidebar_id="sidebar", right_class="", collapsed_class="sidebar-collapsed")

        from .window_review import WindowReview
        capture = None
        if sys.platform == 'darwin':
            try:
                from .window_capture_macos import web_content_capture
                capture = web_content_capture(window, origin)
            except ImportError:
                pass
        app.state.window_review = WindowReview(window, origin, capture)

        def toggle_sidebar():
            """Dispatch only the fixed local UI event shared by the native titlebar and menu shortcut."""
            window.run_js("window.dispatchEvent(new Event('ag-design:toggle-sidebar'))")

        def configure_menu():
            """Install macOS responder menus only after the native window is ready."""
            install_native_menu(window, "ag-design", sidebar_action=toggle_sidebar, view_actions=(("Change Appearance", lambda: window.run_js("document.getElementById('theme')?.click()")), ("Refresh Data", lambda: window.run_js("document.getElementById('refresh')?.click()")),), help_actions=(
                ("Design Help", lambda: window.create_confirmation_dialog("Ag Design",
                    "Search reusable components and source guidelines. Notes, audits and measurements are caller-reported and saved outside the repository. When the tray is ready, closing hides this window. Quit stops only this instance.")),
            ))
            from .native_toolbar import install_native_toolbar
            install_native_toolbar(window, toggle_sidebar, identity="ag-design")

        def close_native_resources():
            """Dispose only this instance's tray and presentation when bounded shutdown completes."""
            if background:
                background.close()
            presentation.close()

        restore_shutdown = bind_native_shutdown(window, shutdown_owned_server,
                                               on_closed=close_native_resources,
                                               hide_on_close=lambda: bool(background and background.hide_on_close()))
        from desktop_support import bind_background
        from . import __version__
        background = bind_background(window, app_id="ag-design", title="ag-design", origin=origin,
                                     on_quit=restore_shutdown.request_quit, data_directory=data_dir,
                                     current_version=__version__, open_activity=lambda: window.load_url(origin + "/desktop-activity.html?desktop=1"))
        window.events.loaded += configure_menu
        webview.start(gui={"darwin": "cocoa", "win32": "edgechromium"}.get(sys.platform, "qt"), debug=False, private_mode=False, storage_path=str(data_dir / "webview"))
    finally:
        try:
            stopped = shutdown_owned_server()
        finally:
            if background:
                background.close()
            if presentation:
                presentation.close()
            if restore_shutdown:
                restore_shutdown()
            listener.close()
        if not stopped:
            raise RuntimeError("Design HTTP server did not stop after closing its window")
