"""Design recommendations, profiles and safe declarative library writes; no arbitrary code or scenario execution."""

import asyncio
from fastapi import Request

from .contrast import Contrast, TYPOGRAPHY_GUIDANCE
from .color_scheme import evaluate_scheme
from .palette import Palette
from .interface_evaluation import rubric, evaluate_interface
from .design_policy import authoring_brief
from .rule_sections import section_page, section_detail
from .errors import DesignError
from .qualification import history, record
from .recommendations import recommend
from .routes import storage
from .security import json_body
from .validation import object_fields, query_parameters, text
from .usage import register_usage as save_usage


def install(app, catalog, library):
    """Register fixed routes around the owned library and isolated contrast engine."""
    from .library_routes import install as install_library_routes
    install_library_routes(app, catalog, library)
    contrast = Contrast()
    palette = Palette()

    @app.get('/api/v1/rule-sections')
    def rule_sections(request: Request):
        """Search readable guideline section summaries, retaining source citations and revision."""
        values = query_parameters(request, {'q', 'limit', 'offset', 'locale', 'audience'})
        return section_page(catalog, **values)

    @app.get('/api/v1/rule-sections/{section_id}')
    def rule_section(section_id: str, request: Request):
        """Return one complete source-backed section without accepting file paths."""
        values = query_parameters(request, {'locale', 'audience'})
        return section_detail(catalog, section_id, **values)

    @app.get('/api/v1/design-brief')
    def design_brief(request: Request):
        """Return current requirements and concrete variants before agents implement an actual catalog component."""
        values = query_parameters(request, {'componentId'})
        component = catalog.get(values['componentId']) if values.get('componentId') else None
        return authoring_brief(component)

    @app.get('/api/v1/interface-rubric')
    def interface_rubric():
        """Export fixed AG weights, evidence schema and reproducible conservative arithmetic."""
        return rubric()

    @app.post('/api/v1/interface-evaluation', status_code=200)
    async def interface_evaluation(request: Request):
        """Evaluate bounded caller observations without storing claims or certifying the interface."""
        return evaluate_interface(await json_body(request))

    @app.post('/api/v1/palette', status_code=200)
    async def generate_palette(request: Request):
        """Return stateless harmony candidates off the event loop; never apply or store a profile."""
        return await asyncio.to_thread(palette.generate, await json_body(request))

    @app.post('/api/v1/color-scheme', status_code=200)
    async def color_scheme(request: Request):
        """Evaluate literal text pairs off the event loop; WCAG failures remain a separate gate."""
        return await asyncio.to_thread(evaluate_scheme, await json_body(request), contrast)

    @app.get('/api/v1/library')
    def library_status():
        """Show the separate library location and upgrade conflicts without allowing arbitrary path reads."""
        return {'directory':str(library.directory), 'external':True, 'restartSafe':True, 'upgradeConflicts':library.conflicts[:100], 'executablePlugins':False}

    @app.get('/api/v1/recommendations')
    def recommendations(request: Request):
        """Return stage guidance even when no matching component exists."""
        values = query_parameters(request, {'q','stage','platform','project'})
        return recommend(catalog, library, query=values.get('q',''), stage=values.get('stage','plan'), platform=values.get('platform','web'), project=values.get('project',''))

    @app.get('/api/v1/profiles')
    def profiles():
        """Read semantic light/dark color profiles; components share behavior while hosts keep palettes."""
        return {'items':library.collection('profiles'), 'apcaWeight':.7, 'wcagWeight':.3, 'wcagAARequired':True}

    @app.get('/api/v1/contrast')
    def contrast_pair(request: Request):
        """Evaluate a literal color pair through the same trusted JS used by the showcase."""
        values = query_parameters(request, {'foreground','background','fontSize','fontWeight','role'})
        try:
            size, weight = float(values.get('fontSize','16')), int(values.get('fontWeight','400'))
        except ValueError as error:
            raise DesignError('invalid_typography', TYPOGRAPHY_GUIDANCE, 422) from error
        return contrast.evaluate(values.get('foreground'), values.get('background'), font_size=size, font_weight=weight, role=values.get('role','body'))

    @app.get('/api/v1/components/{component_id}/checks')
    def checks(component_id: str):
        """Read qualification claims for this definition, preserving old reports as explicitly stale evidence."""
        return history(storage(app), catalog.get(component_id))

    @app.post('/api/v1/agent/components', status_code=201)
    @app.post('/api/v1/library/components', status_code=201)
    async def register_component(request: Request):
        """Register or CAS-update draft metadata only; no supplied import, usageExample or path is executed."""
        value = await json_body(request)
        object_fields(value, {'definition','expectedRevision'}, {'definition'})
        if value.get('expectedRevision') is not None:
            text(value['expectedRevision'], 'expectedRevision', 64)
        return await asyncio.to_thread(library.register, value['definition'], catalog, expected_revision=value.get('expectedRevision'))

    @app.post('/api/v1/agent/checks', status_code=201)
    @app.post('/api/v1/component-checks', status_code=201)
    async def report_checks(request: Request):
        """Record caller evidence with a server-enforced design-system-before-consumer gate."""
        return await asyncio.to_thread(record, storage(app), catalog, await json_body(request))

    @app.post('/api/v1/agent/usage', status_code=201)
    @app.post('/api/v1/library/usage', status_code=201)
    async def register_usage(request: Request):
        """Create or repeat exact qualified usage without blocking the event loop on library writes."""
        value = await json_body(request)
        return await asyncio.to_thread(save_usage, library, catalog, storage(app), value)
