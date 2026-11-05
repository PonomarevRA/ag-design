"""Exercise a fresh source catalogue without attaching to operator data."""
import json
from pathlib import Path
from tempfile import TemporaryDirectory
from fastapi.testclient import TestClient
from ag_design.app import create_app


def test_public_inventory_and_runtime():
    """
    Every declared built-in and namespace component must survive fresh seed installation.
    """
    root = Path(__file__).resolve().parents[1]
    expected = json.loads((root / 'PUBLICATION.json').read_text())
    with TemporaryDirectory() as temp:
        base = Path(temp)
        app = create_app(data_dir=base/'data', library_dir=base/'library', origin='http://127.0.0.1:19109')
        with TestClient(app, base_url='http://127.0.0.1:19109', client=('127.0.0.1', 50000)) as client:
            response = client.get('/api/v1/status')
            assert response.status_code == 200
            assert response.json()['counts']['components'] == len(expected['components'])
            items = client.get('/api/v1/components?limit=100').json()['items']
            assert sorted(item['id'] for item in items) == expected['components']
            assert client.get('/').status_code == 200
