"""Independent HTTP, native desktop and bounded metadata stdio entrypoints."""

import argparse
from pathlib import Path


def main(argv=None):
    """Resolve only operator-supplied paths/ports; MCP queries an existing owner instead of starting a database."""
    from . import __version__
    from .config import default_data_dir
    from .library import default_library_dir
    parser = argparse.ArgumentParser(prog='ag-design')
    parser.add_argument('--version',action='version',version=__version__)
    parser.add_argument('--data-dir',type=Path)
    parser.add_argument('--library-dir',type=Path,help='Separate component/profile library directory')
    parser.add_argument('--port',type=int,default=None)
    parser.add_argument('--strict-port',action='store_true',help='Fail on an occupied port instead of selecting an owned ephemeral port')
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--mcp',action='store_true')
    mode.add_argument('--desktop',action='store_true')
    options = parser.parse_args(argv)
    if options.port is not None and not 0 <= options.port <= 65535:
        parser.error('Port must be from 0 to 65535')
    if options.mcp:
        from .mcp_server import build_mcp
        build_mcp(directory=options.data_dir).run()
        return
    from .app import create_app
    from functools import partial
    create_app = partial(create_app, library_dir=options.library_dir or default_library_dir())
    from .desktop import reserve_loopback, run_desktop
    directory = options.data_dir or default_data_dir()
    if options.port is None:
        from desktop_support import read_installation
        options.port = read_installation('ag-design-community', directory).preferred_port or 8897
    if options.desktop:
        run_desktop(create_app,directory,options.port,allow_fallback=not options.strict_port)
        return
    import uvicorn
    listener = reserve_loopback(options.port,allow_fallback=not options.strict_port)
    try:
        port = listener.getsockname()[1]
        origin = f'http://127.0.0.1:{port}'
        config = uvicorn.Config(create_app(data_dir=directory,origin=origin),host='127.0.0.1',port=port,
                                loop='asyncio',http='h11',ws='none',log_config=None,log_level='warning',
                                access_log=False,proxy_headers=False,timeout_graceful_shutdown=2)
        try:
            uvicorn.Server(config).run(sockets=[listener])
        except KeyboardInterrupt:
            # Uvicorn re-raises Ctrl+C after lifespan cleanup; a requested stop is a normal CLI exit.
            pass
    finally:
        listener.close()


if __name__ == '__main__':
    main()
