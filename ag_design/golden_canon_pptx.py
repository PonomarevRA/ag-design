"""Bounded PPTX geometry review and editable diagnostic copies; originals remain untouched."""
from io import BytesIO
import base64
import hashlib
import json
import posixpath
import xml.etree.ElementTree as ET
from zipfile import ZipFile, BadZipFile
from xml.dom import minidom
from xml.parsers import expat
from .errors import DesignError
from .golden_canon import check_grid, grid_policy
from .journey_pptx import P,A,R,REL,Slide,node,xml

MAX_INPUT=12*1024*1024
MAX_EXPANDED=64*1024*1024
MAX_SHAPES=200
GUIDE='AG Golden Canon review '
GUIDE_PREFIXES=(GUIDE,'AG Layout Grid review ')
ANCHORS={'top-left':(0,0),'top-right':(1,0),'bottom-left':(0,1),'bottom-right':(1,1),'center':(.5,.5)}


def _read_package(raw):
    """Reject oversized, duplicate and encrypted ZIP members before reading XML; never extract or follow links."""
    if not isinstance(raw,bytes) or len(raw)>MAX_INPUT:
        raise DesignError('invalid_pptx','PPTX input exceeds 12 MiB',413)
    try:
        archive=ZipFile(BytesIO(raw));infos=archive.infolist()
        names=[item.filename for item in infos]
        if len(names)>4000 or len(names)!=len(set(names)) or sum(x.file_size for x in infos)>MAX_EXPANDED:
            raise ValueError('archive limits')
        for item in infos:
            if item.flag_bits&1 or item.file_size>8*1024*1024 or item.filename.startswith('/') or '..' in item.filename.split('/'):
                raise ValueError('unsafe member')
        # Read only structural XML here. No external relationship is ever resolved.
        def read(name):
            data=archive.read(name)
            # Parser events see DTD declarations in UTF-8 and UTF-16 alike.
            parser=expat.ParserCreate()
            def reject_declaration(*arguments):
                raise ValueError('DTD and entity declarations forbidden')
            parser.StartDoctypeDeclHandler=reject_declaration
            parser.EntityDeclHandler=reject_declaration
            parser.ExternalEntityRefHandler=reject_declaration
            parser.Parse(data,True)
            return ET.fromstring(data)
        presentation=read('ppt/presentation.xml')
        relations=read('ppt/_rels/presentation.xml.rels')
        targets={x.get('Id'):x.get('Target') for x in relations if x.get('TargetMode')!='External'}
        size=presentation.find('{'+P+'}sldSz')
        width,height=int(size.get('cx')),int(size.get('cy'))
        entries=presentation.findall('./{'+P+'}sldIdLst/{'+P+'}sldId')
        if not 1<=len(entries)<=100: raise ValueError('slide count')
        slides=[];slide_paths=set()
        for entry in entries:
            target=targets[entry.get('{'+R+'}id')]
            path=posixpath.normpath(posixpath.join('ppt',target)) if not target.startswith('/') else target.lstrip('/')
            if not path.startswith('ppt/slides/') or not path.endswith('.xml'):
                raise ValueError('invalid slide relationship')
            if path in slide_paths: raise ValueError('duplicate slide part')
            slide_paths.add(path)
            slides.append((path,read(path)))
        if not 1<=len(slides)<=100:
            raise ValueError('slide count')
        check_grid(width,height,[])
        return archive,width,height,slides
    except (BadZipFile,KeyError,ValueError,TypeError,AttributeError,ET.ParseError,expat.ExpatError,OverflowError) as error:
        raise DesignError('invalid_pptx','Expected a bounded ordinary PPTX with 1..100 slides',422) from error


def _shape_anchor(shape, anchor):
    """Read only direct axis-aligned slide shapes; unsupported/inherited/group transforms stay unknown."""
    common=shape.find('.//{'+P+'}cNvPr')
    identity=common.get('id') if common is not None else None
    name=common.get('name','') if common is not None else ''
    if name.startswith(GUIDE_PREFIXES):
        return identity,None,'diagnostic-guide'
    if shape.tag not in {'{'+P+'}sp','{'+P+'}pic','{'+P+'}graphicFrame'}:
        return identity,None,'unsupported-shape-or-group'
    transform=shape.find('./{'+P+'}spPr/{'+A+'}xfrm')
    if transform is None:
        transform=shape.find('./{'+P+'}xfrm')
    if transform is None:
        return identity,None,'inherited-or-missing-transform'
    if int(transform.get('rot','0')) or any(transform.get(key,'0') not in ('0','false') for key in ['flipH','flipV']):
        return identity,None,'rotation-or-flip'
    offset=transform.find('{'+A+'}off');extent=transform.find('{'+A+'}ext')
    if offset is None or extent is None:
        return identity,None,'missing-transform-geometry'
    x,y=int(offset.get('x')),int(offset.get('y'))
    w,h=int(extent.get('cx')),int(extent.get('cy'))
    if w<0 or h<0:
        raise ValueError('negative shape size')
    dx,dy=ANCHORS[anchor]
    return identity,{'x':x+w*dx,'y':y+h*dy},None


def review_pptx(raw, *, anchor='top-left', tolerance=0.008, diagnostic=False):
    """Review one explicitly selected anchor per shape; export optional guides as native OOXML objects."""
    if anchor not in ANCHORS or type(diagnostic) is not bool:
        raise DesignError('invalid_grid','Select a declared box anchor and boolean diagnostic',422)
    archive,width,height,slides=_read_package(raw)
    reports=[];replacements={}
    try:
        for number,(path,root) in enumerate(slides,1):
            tree=root.find('./{'+P+'}cSld/{'+P+'}spTree')
            if tree is None: raise ValueError('slide shape tree missing')
            source_shapes=0
            for candidate in tree:
                if candidate.tag in {'{'+P+'}nvGrpSpPr','{'+P+'}grpSpPr','{'+P+'}extLst'}: continue
                common=candidate.find('.//{'+P+'}cNvPr')
                if common is not None and not common.get('name','').startswith(GUIDE_PREFIXES): source_shapes+=1
            if source_shapes>MAX_SHAPES: raise ValueError('too many direct shapes')
            anchors=[];unknown=[];identities=set();excluded=[]
            for shape in tree:
                if shape.tag in {'{'+P+'}nvGrpSpPr','{'+P+'}grpSpPr','{'+P+'}extLst'}: continue
                identity,point,reason=_shape_anchor(shape,anchor)
                if identity is None or identity in identities: raise ValueError('invalid shape identity')
                identities.add(identity)
                key=f'slide-{number}/shape-{identity}/{anchor}'
                if reason=='diagnostic-guide':
                    excluded.append(key);continue
                if reason:
                    unknown.append({'id':key,'reason':reason});continue
                anchors.append({'id':key,**point})
            measured=check_grid(width,height,anchors,tolerance)
            reports.append({'slide':number,'part':path,'anchor':anchor,**measured,'unknown':unknown,
                            'complete':not unknown,'excludedGuides':excluded,'units':'EMU','textInk':'unknown','masterAndLayout':'unknown'})
            if diagnostic:
                replacements[path]=_diagnostic_slide(archive.read(path),tree,width,height,measured)
        report={'schemaVersion':'ag-design/golden-canon-pptx-v1','sourceSha256':hashlib.sha256(raw).hexdigest(),
                'profile':grid_policy()['profile'],'slides':reports,'nativePowerPoint':'unknown','accessibility':'unknown',
                'scope':'Direct axis-aligned slide shapes only; nearest declared box anchors, not text baselines or optical balance.'}
        if diagnostic:
            output=BytesIO()
            with ZipFile(output,'w') as destination:
                for info in archive.infolist():
                    destination.writestr(info,replacements.get(info.filename) if info.filename in replacements else archive.read(info.filename))
            report['diagnosticPptxBase64']=base64.b64encode(output.getvalue()).decode('ascii')
        return report
    except (ValueError,TypeError,AttributeError,OverflowError) as error:
        raise DesignError('invalid_pptx','Invalid or unsupported shape geometry',422) from error
    finally:
        archive.close()


def _diagnostic_slide(original,tree,width,height,report,*,shape_factory=None,guide_prefix=GUIDE_PREFIXES):
    """Preserve original namespace prefixes, including lexical mc:Ignorable values, in a copied slide."""
    document=minidom.parseString(original)
    try:
        target=document.getElementsByTagNameNS(P,'spTree')[0]
        for child in list(target.childNodes):
            if child.nodeType!=child.ELEMENT_NODE: continue
            common=child.getElementsByTagNameNS(P,'cNvPr')
            if common and common[0].getAttribute('name').startswith(guide_prefix):
                target.removeChild(child);child.unlink()
        extension=next((child for child in target.childNodes if child.nodeType==child.ELEMENT_NODE and child.namespaceURI==P and child.localName=='extLst'),None)
        for shape in (shape_factory or _guide_shapes)(tree,width,height,report):
            fragment=minidom.parseString(ET.tostring(shape,encoding='utf-8'))
            try:
                target.insertBefore(document.importNode(fragment.documentElement,True),extension)
            finally:
                fragment.unlink()
        return document.toxml(encoding='utf-8')
    finally:
        document.unlink()


def _guide_shapes(tree,width,height,report):
    """Build native guide lines and separate measured/target markers with unique shape IDs."""
    ids=[int(item.get('id')) for item in tree.findall('.//{'+P+'}cNvPr')]
    scratch=ET.Element('{'+P+'}spTree')
    writer=Slide.__new__(Slide);writer.tree=scratch;writer.next_id=max(ids,default=1)+1;writer.links=[]
    emu=914400
    def guide(x,y,w,h,color,label):
        shape=writer.shape(x/emu,y/emu,max(w,1)/emu,max(h,1)/emu,fill=color)
        shape.find('.//{'+P+'}cNvPr').set('name',GUIDE+label)
        return shape
    thickness=max(1,int(min(width,height)*0.0005))
    for index,(a,b) in enumerate(grid_policy()['fractions'][1:-1],1):
        f=a/b
        guide(f*width,0,thickness,height,'A5ACC8',f'x{index}')
        guide(0,f*height,width,thickness,'A5ACC8',f'y{index}')
    radius=min(width,height)*0.005
    for item in report['results']:
        color='087C54' if item['status']=='hit' else 'C13838'
        target=guide(item['targetX']-radius,item['targetY']-radius,radius*2,radius*2,color,'target '+item['id'])
        target.find('./{'+P+'}spPr/{'+A+'}prstGeom').set('prst','ellipse')
        guide(item['x']-radius,item['y']-radius,radius*2,radius*2,'182433','anchor '+item['id'])
        writer.arrow(item['x']/emu,item['y']/emu,item['targetX']/emu,item['targetY']/emu)
        connector=list(scratch)[-1]
        connector.find('.//{'+P+'}cNvPr').set('name',GUIDE+'residual '+item['status']+' '+item['id'])
    return list(scratch)
