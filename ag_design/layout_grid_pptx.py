"""Read bounded explicit OOXML geometry, including ordinary group transforms, without raster recognition."""
import base64
import hashlib
import json
from io import BytesIO
import xml.etree.ElementTree as ET
from zipfile import ZipFile
from .errors import DesignError
from .golden_canon_pptx import _read_package, _diagnostic_slide, ANCHORS, GUIDE as LEGACY_GUIDE
from .journey_pptx import P,A,Slide
from .layout_grids import check_tree, geometry, fields, invalid, specification

GUIDE='AG Layout Grid review '


def shape_box(shape, transform):
    """Map an unrotated explicit box into the visual coordinates of its immediate group carrier."""
    group=shape.tag=='{'+P+'}grpSp'
    path='./{'+P+'}grpSpPr/{'+A+'}xfrm' if group else './{'+P+'}spPr/{'+A+'}xfrm'
    xfrm=shape.find(path)
    if xfrm is None:
        xfrm=shape.find('./{'+P+'}xfrm')
    if xfrm is None:
        return None,None,'inherited-or-missing-transform'
    if int(xfrm.get('rot','0')) or any(xfrm.get(k,'0') not in ('0','false') for k in ('flipH','flipV')):
        return None,None,'rotation-or-flip'
    off=xfrm.find('{'+A+'}off');ext=xfrm.find('{'+A+'}ext')
    if off is None or ext is None:
        return None,None,'missing-transform-geometry'
    raw={k:int(off.get(k)) for k in ('x','y')}
    raw.update(width=int(ext.get('cx')),height=int(ext.get('cy')))
    if raw['width']<=0 or raw['height']<=0:
        return None,None,'zero-or-negative-extent'
    rect={'x':(raw['x']-transform['x'])*transform['sx'],'y':(raw['y']-transform['y'])*transform['sy'],
          'width':raw['width']*transform['sx'],'height':raw['height']*transform['sy']}
    child=None
    if group:
        start=xfrm.find('{'+A+'}chOff');size=xfrm.find('{'+A+'}chExt')
        if start is None or size is None or int(size.get('cx'))<=0 or int(size.get('cy'))<=0:
            return None,None,'invalid-group-child-transform'
        child={'x':int(start.get('x')),'y':int(start.get('y')),'sx':rect['width']/int(size.get('cx')),'sy':rect['height']/int(size.get('cy'))}
    return rect,child,None


def slide_scopes(tree,number,width,height,grid,overrides,anchor,counter):
    """Collect a bounded parent-first scope tree. Unsupported parents never lend false child coordinates."""
    root_id=f'slide-{number}'
    scopes=[{'id':root_id,'parentId':None,'rect':{'x':0,'y':0,'width':width,'height':height},'grid':grid,'anchors':[]}]
    unknown=[];identities=set();used=set()
    def visit(container,scope,transform,depth):
        """Descend only explicit ordinary groups and retain every unsupported object as unknown."""
        if depth>8:
            invalid('PPTX group depth')
        for shape in container:
            if shape.tag in {'{'+P+'}nvGrpSpPr','{'+P+'}grpSpPr','{'+P+'}extLst'}:
                continue
            common=shape.find('.//{'+P+'}cNvPr')
            identity=common.get('id') if common is not None else None
            name=common.get('name','') if common is not None else ''
            if name.startswith((GUIDE,LEGACY_GUIDE)):
                continue
            if not identity or identity in identities:
                invalid('PPTX shape identity')
            identities.add(identity);counter[0]+=1
            if counter[0]>512:
                invalid('PPTX total shape budget')
            key=f'{root_id}/shape-{identity}'
            if shape.tag not in {'{'+P+'}sp','{'+P+'}pic','{'+P+'}graphicFrame','{'+P+'}grpSp'}:
                rect=child=None;reason='unsupported-shape'
            else:
                rect,child,reason=shape_box(shape,transform)
            if reason:
                unknown.append({'id':key,'reason':reason});scope['anchors'].append({'id':key,'ownerId':key,'unknownReason':reason});continue
            dx,dy=ANCHORS[anchor]
            scope['anchors'].append({'id':key+'/'+anchor,'ownerId':key,'x':rect['x']+rect['width']*dx,'y':rect['y']+rect['height']*dy})
            selected=overrides.get((number,identity))
            if selected is not None:
                used.add((number,identity))
            if child or selected is not None:
                local={'id':key,'parentId':scope['id'],'rect':rect,'grid':selected if selected is not None else scope['grid'],'anchors':[]}
                scopes.append(local)
                if child:
                    visit(shape,local,child,depth+1)
    visit(tree,scopes[0],{'x':0,'y':0,'sx':1,'sy':1},0)
    return scopes,unknown,used


def guides(tree,width,height,report):
    """Create editable native guides and targets at the same global EMU positions as the numeric report."""
    scratch=ET.Element('{'+P+'}spTree');writer=Slide.__new__(Slide);writer.tree=scratch
    writer.next_id=max((int(x.get('id')) for x in tree.findall('.//{'+P+'}cNvPr')),default=1)+1;writer.links=[]
    unit=914400;thickness=max(1,min(width,height)*.0004)
    def box(x,y,w,h,color,label):
        """Give every diagnostic primitive a removable literal name and unique shape ID."""
        shape=writer.shape(x/unit,y/unit,max(1,w)/unit,max(1,h)/unit,fill=color)
        shape.find('.//{'+P+'}cNvPr').set('name',GUIDE+label)
        return shape
    for scope in report['scopes']:
        origin=scope['origin'];g=scope['geometry']
        for x in g['x']:box(origin['x']+x,origin['y'],thickness,g['height'],'A5ACC8',scope['id']+' x')
        for y in g['y']:box(origin['x'],origin['y']+y,g['width'],thickness,'A5ACC8',scope['id']+' y')

        for diagonal in g['diagonals']:
            writer.arrow((origin['x']+diagonal['x1'])/unit,(origin['y']+diagonal['y1'])/unit,(origin['x']+diagonal['x2'])/unit,(origin['y']+diagonal['y2'])/unit)
            segment=scratch[-1];segment.find('.//{'+P+'}cNvPr').set('name',GUIDE+scope['id']+' diagonal')
            line=segment.find('./{'+P+'}spPr/{'+A+'}ln');line.set('w',str(max(1,round(thickness))))
            for tail in list(line.findall('./{'+A+'}tailEnd')):line.remove(tail)
        for region in g.get('regions',[]):
            outline=box(origin['x']+region['x'],origin['y']+region['y'],region['width'],region['height'],None,scope['id']+' region '+region['id'])
            line=outline.find('./{'+P+'}spPr/{'+A+'}ln');line.clear();line.set('w',str(max(1,round(thickness))))
            ET.SubElement(ET.SubElement(line,'{'+A+'}solidFill'),'{'+A+'}srgbClr',{'val':'A5ACC8'})
        for circle in g.get('circles',[]):
            outline=box(origin['x']+circle['cx']-circle['r'],origin['y']+circle['cy']-circle['r'],circle['r']*2,circle['r']*2,None,scope['id']+' circle '+circle['id'])
            outline.find('./{'+P+'}spPr/{'+A+'}prstGeom').set('prst','ellipse')
            line=outline.find('./{'+P+'}spPr/{'+A+'}ln');line.clear();line.set('w',str(max(1,round(thickness))))
            ET.SubElement(ET.SubElement(line,'{'+A+'}solidFill'),'{'+A+'}srgbClr',{'val':'A5ACC8'})
        radius=min(g['width'],g['height'])*.005
        for result in scope['results']:
            if result['status']=='unknown' or result['targetX'] is None or result['targetY'] is None:
                continue
            color='087C54' if result['status']=='hit' else 'C13838'
            point=box(origin['x']+result['targetX']-radius,origin['y']+result['targetY']-radius,radius*2,radius*2,color,'target '+result['id'])
            point.find('./{'+P+'}spPr/{'+A+'}prstGeom').set('prst','ellipse')
            if result['x'] is not None and result['y'] is not None:
                box(origin['x']+result['x']-radius,origin['y']+result['y']-radius,radius*2,radius*2,'182433','anchor '+result['id'])
    return list(scratch)


def review_layout_pptx(raw,*,grid=None,overrides=None,anchor='center',tolerance=.008,diagnostic=False):
    """Review one deck in EMU with optional per-group/shape grids; keep original bytes untouched."""
    if anchor not in ANCHORS or type(diagnostic) is not bool:
        invalid('PPTX anchor/diagnostic')
    grid=grid if grid is not None else {'type':'golden-canon'}
    selected={}
    if overrides is not None:
        if not isinstance(overrides,list) or len(overrides)>32:
            invalid('PPTX overrides')
        for item in overrides:
            fields(item,('slide','shapeId','grid'),'PPTX override')
            if type(item.get('slide')) is not int or not isinstance(item.get('shapeId'),str):
                invalid('PPTX override identity')
            key=(item['slide'],item['shapeId'])
            if key in selected:
                invalid('duplicate PPTX override')
            specification(1e9,1e9,'emu',item.get('grid'))
            selected[key]=item['grid']
    archive,width,height,slides=_read_package(raw)
    reports=[];replacements={};counter=[0];used=set();line_count=0
    try:
        geometry(width,height,grid,'emu')
        for number,(path,root) in enumerate(slides,1):
            tree=root.find('./{'+P+'}cSld/{'+P+'}spTree')
            if tree is None:
                invalid('PPTX shape tree')
            scopes,unknown,applied=slide_scopes(tree,number,width,height,grid,selected,anchor,counter)
            used.update(applied)
            report=check_tree({'unit':'emu','tolerance':tolerance,'scopes':scopes})
            line_count+=sum(len(s['geometry']['x'])+len(s['geometry']['y'])+len(s['geometry']['diagonals'])+len(s['geometry'].get('circles',[]))+len(s['geometry'].get('regions',[])) for s in report['scopes'])
            if line_count>4096:
                invalid('PPTX guide budget')
            reports.append({'slide':number,'part':path,**report,'unknown':unknown,'masterAndLayout':'unknown','textInk':'unknown'})
            if diagnostic:
                replacements[path]=_diagnostic_slide(archive.read(path),tree,width,height,report,shape_factory=guides,guide_prefix=(GUIDE,LEGACY_GUIDE))
        if set(selected)-used:
            invalid('PPTX override owner unavailable or unsupported')
        result={'schemaVersion':'ag-design/layout-grid-pptx-v1','sourceSha256':hashlib.sha256(raw).hexdigest(),'slides':reports,'nativePowerPoint':'unknown','accessibility':'unknown','scope':'Explicit axis-aligned shapes and ordinary group transforms; no optical/text-baseline inference.'}
        if len(json.dumps(result).encode())>4*1024*1024:
            invalid('PPTX report byte budget')
        if diagnostic:
            output=BytesIO()
            with ZipFile(output,'w') as destination:
                for info in archive.infolist():
                    destination.writestr(info,replacements.get(info.filename,archive.read(info.filename)))
            if output.tell()>12*1024*1024:
                invalid('PPTX diagnostic byte budget')
            result['diagnosticPptxBase64']=base64.b64encode(output.getvalue()).decode('ascii')
        return result
    except (ValueError,TypeError,AttributeError,OverflowError) as error:
        raise DesignError('invalid_layout_grid','Invalid explicit PPTX geometry',422) from error
    finally:
        archive.close()
