"""Project-scoped component metadata in the existing local SQLite owner."""

import json
import uuid

from .errors import DesignError
from .validation import encode, identifier, object_fields, string_list, text

PROJECT_COMPONENTS = '/api/v1/agent/project-components'
PROJECT_COMPONENT_WRITE = PROJECT_COMPONENTS + '/save'
PROJECT_COMPONENT_REMOVE = PROJECT_COMPONENTS + '/remove'
PROJECT_CATALOG_WRITES = {PROJECT_COMPONENT_WRITE: 200, PROJECT_COMPONENT_REMOVE: 200}
PUBLIC_PROJECT_ERRORS = {
    'project_component_not_found': (404, 'No component with this ID in the addressed project.'),
    'project_component_conflict': (409, 'Read the addressed component and retry with its current revision.'),
    'invalid_fields': (422, 'Use the documented project component fields and limits.'),
    'invalid_id': (422, 'Use valid project and component IDs.'),
}
SCHEMA = '''
CREATE TABLE IF NOT EXISTS project_components(
    project_id TEXT NOT NULL,
    component_id TEXT NOT NULL,
    revision TEXT NOT NULL,
    definition TEXT NOT NULL,
    PRIMARY KEY(project_id, component_id)
);
'''


def normalize_definition(value):
    """Accept bounded metadata for reuse and handoff, including optional shared AG catalog references."""
    fields = {'title', 'purpose', 'locations', 'states', 'baseComponentIds', 'notes'}
    object_fields(value, fields, {'title', 'purpose'})
    return {
        'title': text(value['title'], 'title', 160),
        'purpose': text(value['purpose'], 'purpose', 512),
        'locations': string_list(value.get('locations', []), 'locations', 12),
        'states': string_list(value.get('states', []), 'states', 12),
        'baseComponentIds': [
            identifier(item, 'baseComponentId')
            for item in string_list(value.get('baseComponentIds', []), 'baseComponentIds', 12)
        ],
        'notes': text(value.get('notes', ''), 'notes', 1024, empty=True),
    }


class ProjectCatalog:
    """Keep project metadata independent of shared catalog, publication and usage state."""

    def __init__(self, owner):
        """Create the additive table under the existing process lock."""
        self.owner = owner
        with owner.lock:
            owner.connection.executescript(SCHEMA)

    @staticmethod
    def _read(connection, project_id, component_id):
        """Find one row only under the exact composite identity."""
        return connection.execute(
            'SELECT * FROM project_components WHERE project_id=? AND component_id=?',
            (project_id, component_id),
        ).fetchone()

    @staticmethod
    def _item(row):
        """Return metadata and its opaque concurrency revision."""
        return {'projectId': row['project_id'], 'componentId': row['component_id'],
                'revision': row['revision'], 'definition': json.loads(row['definition'])}

    def read(self, project_id, component_id=None, *, limit=20, offset=0):
        """Read one component or a bounded index for the explicitly addressed project."""
        identifier(project_id, 'projectId')
        with self.owner.lock:
            connection = self.owner.connection
            if component_id is not None:
                row = self._read(connection, project_id, identifier(component_id, 'componentId'))
                if row is None:
                    raise DesignError('project_component_not_found', 'Project component not found', 404)
                return self._item(row)
            rows = connection.execute(
                'SELECT component_id, revision, definition FROM project_components '
                'WHERE project_id=? ORDER BY component_id LIMIT ? OFFSET ?',
                (project_id, limit + 1, offset),
            ).fetchall()
        items = []
        for row in rows[:limit]:
            definition = json.loads(row['definition'])
            items.append({'componentId': row['component_id'], 'revision': row['revision'],
                          'title': definition['title'], 'purpose': definition['purpose']})
        return {'projectId': project_id, 'items': items,
                'nextOffset': offset + limit if len(rows) > limit else None}

    def save(self, project_id, component_id, definition, expected_revision):
        """Create or replace metadata with compare-and-set and retry-safe identical writes."""
        identifier(project_id, 'projectId')
        identifier(component_id, 'componentId')
        payload = encode(normalize_definition(definition))
        with self.owner.transaction() as connection:
            row = self._read(connection, project_id, component_id)
            if row is not None and row['definition'] == payload:
                return self._item(row)
            self._check_revision(row, expected_revision)
            revision = uuid.uuid4().hex
            connection.execute(
                'INSERT INTO project_components (project_id, component_id, revision, definition) VALUES (?, ?, ?, ?) '
                'ON CONFLICT(project_id, component_id) DO UPDATE SET '
                'revision=excluded.revision, definition=excluded.definition',
                (project_id, component_id, revision, payload),
            )
            return self._item(self._read(connection, project_id, component_id))

    @staticmethod
    def _check_revision(row, expected_revision):
        """Reject stale mutations, including stale writes after deletion and recreation."""
        current = row['revision'] if row is not None else None
        if current != expected_revision:
            raise DesignError('project_component_conflict', 'Project component revision changed', 409)

    def remove(self, project_id, component_id, expected_revision):
        """Remove an addressed revision. Retrying a removal of an absent record is a no-op."""
        identifier(project_id, 'projectId')
        identifier(component_id, 'componentId')
        with self.owner.transaction() as connection:
            row = self._read(connection, project_id, component_id)
            if row is None:
                return {'projectId': project_id, 'componentId': component_id, 'removed': False}
            self._check_revision(row, expected_revision)
            connection.execute(
                'DELETE FROM project_components WHERE project_id=? AND component_id=?',
                (project_id, component_id),
            )
        return {'projectId': project_id, 'componentId': component_id, 'removed': True}
