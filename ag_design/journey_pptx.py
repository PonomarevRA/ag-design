"""Small editable OOXML storyboards without raster caches, external assets, macros or runtime dependencies."""
from io import BytesIO
import textwrap
import xml.etree.ElementTree as ET
from zipfile import ZipFile, ZIP_DEFLATED

P = 'http://schemas.openxmlformats.org/presentationml/2006/main'
A = 'http://schemas.openxmlformats.org/drawingml/2006/main'
R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
REL = 'http://schemas.openxmlformats.org/package/2006/relationships'
CT = 'http://schemas.openxmlformats.org/package/2006/content-types'
EMU = 914400
for prefix,namespace in [('p',P),('a',A),('r',R)]:
    ET.register_namespace(prefix,namespace)


def node(parent, namespace, tag, attributes=None, text=None):
    """Create fixed OOXML tags with escaped literal content, never user-provided markup."""
    qualified = tag if namespace in (REL,CT) else '{'+namespace+'}'+tag
    child = ET.SubElement(parent,qualified,{key:str(value) for key,value in (attributes or {}).items()})
    child.text = text
    return child


def xml(element):
    """Write UTF-8 XML with a declaration for ordinary Office/LibreOffice importers."""
    return ET.tostring(element,encoding='utf-8',xml_declaration=True)


def group_tree(parent):
    """Every slide/master/layout starts with the standard nonvisual group transform."""
    tree = node(parent,P,'spTree')
    properties = node(tree,P,'nvGrpSpPr')
    node(properties,P,'cNvPr',{'id':1,'name':'Slide'})
    node(properties,P,'cNvGrpSpPr');node(properties,P,'nvPr')
    transform = node(node(tree,P,'grpSpPr'),A,'xfrm')
    for tag,attrs in [('off',{'x':0,'y':0}),('ext',{'cx':0,'cy':0}),('chOff',{'x':0,'y':0}),('chExt',{'cx':0,'cy':0})]:
        node(transform,A,tag,attrs)
    return tree


def relationships(values):
    """Declare only internal package targets; hyperlinks never leave this PPTX."""
    root = ET.Element('Relationships',{'xmlns':REL})
    for id,type,target in values:
        node(root,REL,'Relationship',{'Id':id,'Type':R+'/'+type,'Target':target})
    return xml(root)


class Slide:
    """Draw editable native shapes/text at a fixed 16:9 size; no screenshot fidelity is implied."""
    def __init__(self, title, subtitle=''):
        self.root = ET.Element('{'+P+'}sld')
        self.tree = group_tree(node(self.root,P,'cSld'))
        node(node(self.root,P,'clrMapOvr'),A,'masterClrMapping')
        self.next_id = 2
        self.links = []
        self.shape(0,0,13.333333,7.5,fill='FFFFFF')
        self.shape(.42,.42,.06,.6,fill='006D77')
        self.shape(.65,.38,12,.6,title,size=27,bold=True)
        self.shape(.65,1.04,12,.45,subtitle,size=11,color='536174')
        self.shape(.65,7.08,12,.25,'AG · прототип · данные и условия не исполняются',size=9,color='536174')

    def shape(self, x, y, width, height, text='', *, fill=None, color='182433', size=14, bold=False, target=None):
        """Add one independent editable shape with wrapped text and an optional local slide jump."""
        shape = node(self.tree,P,'sp')
        properties = node(shape,P,'nvSpPr')
        common = node(properties,P,'cNvPr',{'id':self.next_id,'name':'AG object '+str(self.next_id)})
        self.next_id += 1
        if target is not None:
            link_id = 'jump'+str(len(self.links)+1)
            self.links.append((link_id,'slide',f'slide{target}.xml'))
            node(common,A,'hlinkClick',{'{'+R+'}id':link_id,'action':'ppaction://hlinksldjump'})
        node(properties,P,'cNvSpPr',{'txBox':1});node(properties,P,'nvPr')
        geometry = node(shape,P,'spPr')
        transform = node(geometry,A,'xfrm')
        node(transform,A,'off',{'x':round(x*EMU),'y':round(y*EMU)})
        node(transform,A,'ext',{'cx':round(width*EMU),'cy':round(height*EMU)})
        node(node(geometry,A,'prstGeom',{'prst':'rect'}),A,'avLst')
        if fill:
            node(node(geometry,A,'solidFill'),A,'srgbClr',{'val':fill})
        else:
            node(geometry,A,'noFill')
        node(node(geometry,A,'ln'),A,'noFill')
        body = node(shape,P,'txBody')
        node(body,A,'bodyPr',{'wrap':'square','lIns':90000,'rIns':90000,'tIns':60000,'bIns':60000,'anchor':'t'})
        node(body,A,'lstStyle')
        # Explicit wrapping keeps long Cyrillic titles within bounds without relying on importer autofit.
        characters = max(8,int(width*72/(size*.56)))
        lines = []
        for line in str(text).split('\n'):
            lines.extend(textwrap.wrap(line,width=characters,replace_whitespace=False) or [''])
        capacity = max(1,int((height*72-12)/(size*1.15)))
        if len(lines)>capacity:
            lines = lines[:capacity]
            lines[-1] = lines[-1].rstrip()+'…'
        for line in lines:
            paragraph = node(body,A,'p')
            run = node(paragraph,A,'r')
            style = node(run,A,'rPr',{'lang':'ru-RU','sz':round(size*100),'b':int(bold)})
            node(node(style,A,'solidFill'),A,'srgbClr',{'val':color})
            node(style,A,'latin',{'typeface':'Arial'})
            node(run,A,'t',text=line)
            node(paragraph,A,'endParaRPr',{'lang':'ru-RU','sz':round(size*100)})
        return shape

    def arrow(self, x1,y1,x2,y2):
        """Use a native connector with a target arrow, preserving direction on editable graph overviews."""
        shape = node(self.tree,P,'cxnSp')
        properties = node(shape,P,'nvCxnSpPr')
        node(properties,P,'cNvPr',{'id':self.next_id,'name':'Transition'});self.next_id += 1
        node(properties,P,'cNvCxnSpPr');node(properties,P,'nvPr')
        geometry = node(shape,P,'spPr')
        transform = node(geometry,A,'xfrm',{'flipH':int(x2<x1),'flipV':int(y2<y1)})
        node(transform,A,'off',{'x':round(min(x1,x2)*EMU),'y':round(min(y1,y2)*EMU)})
        node(transform,A,'ext',{'cx':max(1,round(abs(x2-x1)*EMU)),'cy':max(1,round(abs(y2-y1)*EMU))})
        node(node(geometry,A,'prstGeom',{'prst':'line'}),A,'avLst')
        line = node(geometry,A,'ln',{'w':12700})
        node(node(line,A,'solidFill'),A,'srgbClr',{'val':'6B8790'})
        node(line,A,'tailEnd',{'type':'triangle','w':'med','len':'med'})


def theme():
    """Provide a complete plain Office theme with explicit local fonts and authored AG colors."""
    root = ET.Element('{'+A+'}theme',{'name':'AG'})
    elements = node(root,A,'themeElements')
    colors = node(elements,A,'clrScheme',{'name':'AG'})
    for role,color in [('dk1','182433'),('lt1','FFFFFF'),('dk2','334155'),('lt2','F1F5F9'),('accent1','006D77'),('accent2','CB6441'),('accent3','2563EB'),('accent4','A855F7'),('accent5','64748B'),('accent6','15803D'),('hlink','2563EB'),('folHlink','9333EA')]:
        node(node(colors,A,role),A,'srgbClr',{'val':color})
    fonts = node(elements,A,'fontScheme',{'name':'Arial'})
    for kind in ('majorFont','minorFont'):
        font = node(fonts,A,kind)
        node(font,A,'latin',{'typeface':'Arial'});node(font,A,'ea',{'typeface':''});node(font,A,'cs',{'typeface':''})
    formatting = node(elements,A,'fmtScheme',{'name':'AG'})
    for kind in ('fillStyleLst','bgFillStyleLst'):
        styles = node(formatting,A,kind)
        for color in ('FFFFFF','F1F5F9','006D77'):
            node(node(styles,A,'solidFill'),A,'srgbClr',{'val':color})
    lines = node(formatting,A,'lnStyleLst')
    for width in (9525,19050,28575):
        node(node(node(lines,A,'ln',{'w':width}),A,'solidFill'),A,'srgbClr',{'val':'64748B'})
    effects = node(formatting,A,'effectStyleLst')
    for index in range(3):
        node(node(effects,A,'effectStyle'),A,'effectLst')
    return xml(root)


def package(slides):
    """Assemble a standard PPTX ZIP with internal slide links and no attachments or executable parts."""
    output = BytesIO()
    with ZipFile(output,'w',ZIP_DEFLATED,compresslevel=6) as archive:
        content = ET.Element('Types',{'xmlns':CT})
        node(content,CT,'Default',{'Extension':'rels','ContentType':'application/vnd.openxmlformats-package.relationships+xml'})
        node(content,CT,'Default',{'Extension':'xml','ContentType':'application/xml'})
        parts = [('ppt/presentation.xml','presentation.main'),('ppt/slideMasters/slideMaster1.xml','slideMaster'),('ppt/slideLayouts/slideLayout1.xml','slideLayout')]
        for name,type in parts:
            node(content,CT,'Override',{'PartName':'/'+name,'ContentType':'application/vnd.openxmlformats-officedocument.presentationml.'+type+'+xml'})
        node(content,CT,'Override',{'PartName':'/ppt/theme/theme1.xml','ContentType':'application/vnd.openxmlformats-officedocument.theme+xml'})
        for index in range(1,len(slides)+1):
            node(content,CT,'Override',{'PartName':f'/ppt/slides/slide{index}.xml','ContentType':'application/vnd.openxmlformats-officedocument.presentationml.slide+xml'})
        archive.writestr('[Content_Types].xml',xml(content))
        archive.writestr('_rels/.rels',relationships([('presentation','officeDocument','ppt/presentation.xml')]))
        presentation = ET.Element('{'+P+'}presentation')
        node(node(presentation,P,'sldMasterIdLst'),P,'sldMasterId',{'id':2147483648,'{'+R+'}id':'master'})
        ids = node(presentation,P,'sldIdLst')
        for index in range(1,len(slides)+1):
            node(ids,P,'sldId',{'id':255+index,'{'+R+'}id':'slide'+str(index)})
        node(presentation,P,'sldSz',{'cx':12192000,'cy':6858000,'type':'screen16x9'})
        node(presentation,P,'notesSz',{'cx':6858000,'cy':9144000})
        archive.writestr('ppt/presentation.xml',xml(presentation))
        archive.writestr('ppt/_rels/presentation.xml.rels',relationships([('master','slideMaster','slideMasters/slideMaster1.xml')]+[(f'slide{i}','slide',f'slides/slide{i}.xml') for i in range(1,len(slides)+1)]))
        master = ET.Element('{'+P+'}sldMaster');group_tree(node(master,P,'cSld'))
        mapping = {'bg1':'lt1','tx1':'dk1','bg2':'lt2','tx2':'dk2',**{f'accent{i}':f'accent{i}' for i in range(1,7)},'hlink':'hlink','folHlink':'folHlink'}
        node(master,P,'clrMap',mapping)
        node(node(master,P,'sldLayoutIdLst'),P,'sldLayoutId',{'id':2147483649,'{'+R+'}id':'layout'})
        styles = node(master,P,'txStyles')
        for kind in ('titleStyle','bodyStyle','otherStyle'):
            node(styles,P,kind)
        archive.writestr('ppt/slideMasters/slideMaster1.xml',xml(master))
        archive.writestr('ppt/slideMasters/_rels/slideMaster1.xml.rels',relationships([('layout','slideLayout','../slideLayouts/slideLayout1.xml'),('theme','theme','../theme/theme1.xml')]))
        layout = ET.Element('{'+P+'}sldLayout',{'type':'blank','preserve':'1'})
        group_tree(node(layout,P,'cSld'));node(node(layout,P,'clrMapOvr'),A,'masterClrMapping')
        archive.writestr('ppt/slideLayouts/slideLayout1.xml',xml(layout))
        archive.writestr('ppt/slideLayouts/_rels/slideLayout1.xml.rels',relationships([('master','slideMaster','../slideMasters/slideMaster1.xml')]))
        archive.writestr('ppt/theme/theme1.xml',theme())
        for index,slide in enumerate(slides,1):
            archive.writestr(f'ppt/slides/slide{index}.xml',xml(slide.root))
            archive.writestr(f'ppt/slides/_rels/slide{index}.xml.rels',relationships([('layout','slideLayout','../slideLayouts/slideLayout1.xml'),*slide.links]))
    return output.getvalue()


def excerpt(value, maximum):
    """Mark short overview/card labels as excerpts; full transition text is exported on detail pages."""
    return value if len(value)<=maximum else value[:maximum-1].rstrip()+'…'


def transition_slides(screens, edges, targets):
    """Paginate full declared conditions separately from graph cards; no condition is silently truncated.

    Conservative 70-character lines fit the 12in/11pt body. Row height reserves padding plus
    line space. Large blocks continue on another page; pathological inputs fail the 256-page
    budget explicitly instead of producing a partial offline path.
    """
    from .errors import DesignError
    by_id = {screen['id']:screen for screen in screens}
    pages = []
    current = None
    y = 1.7
    for edge in edges:
        header = f"{by_id[edge['from']]['title']} → {by_id[edge['to']]['title']} · {edge['action']}"
        condition = 'Если: '+edge['condition'] if edge['condition'] else 'Без условия'
        lines = []
        for paragraph in (header+'\n'+condition).split('\n'):
            lines.extend(textwrap.wrap(paragraph,width=70,replace_whitespace=False) or [''])
        for offset in range(0,len(lines),20):
            chunk = lines[offset:offset+20]
            height = max(.56,len(chunk)*11*1.15/72+12/72+.05)
            if current is None or y+height>6.65:
                if len(pages)>=200:
                    raise DesignError('studio_capacity','PPTX transition text exceeds the page budget; export JSON for complete archival.',409)
                current = Slide('Действия и условия переходов',f'Часть {len(pages)+1} · нажмите карточку для перехода к целевому экрану')
                pages.append(current)
                y = 1.7
            current.shape(.65,y,12,height,'\n'.join(chunk),fill='F1F5F9',size=11,target=targets[edge['to']])
            y += height+.05
    return pages


def export_pptx(envelope, report):
    """Export editable graph, schematic screen cards, local navigation links and exact-revision prototype outcomes."""
    document = envelope['document'];screens = document['screens'];edges = document['transitions']
    overview_count = max(1,(len(screens)+7)//8)
    screen_slide = {screen['id']:2+overview_count+index for index,screen in enumerate(screens)}
    slides = []
    cover = Slide(document['title'][:110],f"Клиентский путь · ревизия {envelope['revision']} · {envelope['documentHash'][:12]}")
    summary = report['summary']
    cover.shape(.65,1.8,12,1.0,'Маркетинговая воронка' if document.get('testPlan',{}).get('purpose')=='funnel' else 'Технический сценарий управления',size=25,bold=True)
    cover.shape(.65,3.0,12,1.0,f"Экранов: {len(screens)}    Переходов: {len(edges)}    Закрытых тестов: {summary['finished']}",size=20)
    cover.shape(.65,4.35,12,1.7,'Редактируемая схема и карточки компонентов, не скриншоты браузера.\nРезультаты — наблюдения за прототипом. Корректность сервиса, доступность и рыночная конверсия отдельно не подтверждены.',size=17)
    slides.append(cover)
    for start in range(0,max(1,len(screens)),8):
        slide = Slide('Карта клиентского пути',f'Часть {start//8+1} из {overview_count}. Нажмите на узел для перехода к экрану.')
        positions = {}
        for index,screen in enumerate(screens[start:start+8]):
            x,y = .65+(index%4)*3.1,1.95+(index//4)*2.2
            positions[screen['id']] = (x,y)
        for edge in edges:
            if edge['from'] in positions and edge['to'] in positions and edge['from']!=edge['to']:
                x,y=positions[edge['from']];tx,ty=positions[edge['to']]
                if ty == y:
                    slide.arrow(x+2.7 if tx>x else x,y+.6,tx if tx>x else tx+2.7,ty+.6)
                else:
                    slide.arrow(x+1.35,y+1.2 if ty>y else y,tx+1.35,ty if ty>y else ty+1.2)
        for screen in screens[start:start+8]:
            x,y=positions[screen['id']]
            slide.shape(x,y,2.7,1.2,excerpt(screen['title'],24)+'\n'+excerpt(screen['state'],16),fill='E8F3F3',size=13,bold=True,target=screen_slide[screen['id']])
        slide.shape(.65,6.45,12,.45,'Все ветки и условия перечислены после экранов; переходы между частями сохраняются в списке.',size=11,color='536174')
        slides.append(slide)
    for screen in screens:
        slide = Slide(screen['title'][:100],f"Состояние: {screen['state'][:130]} · ревизия композиции {screen['source']['revision']}")
        slide.shape(.65,1.55,12,.45,'Схематическое представление состава экрана — не снимок браузера',size=13,color='536174')
        components = [item for item in envelope['screenSnapshots'][screen['id']]['document']['nodes'] if item['kind']=='component']
        for index,component in enumerate(components[:8]):
            label = component['props'].get('label') or component.get('title') or component['component']
            hint = component['props'].get('hint') or component['props'].get('placeholder') or ''
            slide.shape(.65+(index%2)*6.15,2.05+(index//2)*.85,5.85,.7,excerpt(str(label),28)+'\n'+excerpt(str(hint),28),fill='F1F5F9',size=12)
        if len(components)>8:
            slide.shape(.65,5.5,12,.3,f'Показаны 8 из {len(components)} компонентов. Полный состав сохраните в JSON.',size=10,color='536174')
        outgoing = [edge for edge in edges if edge['from']==screen['id']]
        for index,edge in enumerate(outgoing[:4]):
            slide.shape(.65+index*3.08,6.05,2.85,.65,excerpt(edge['action'],24),fill='006D77',color='FFFFFF',size=12,target=screen_slide[edge['to']])
        slides.append(slide)
    slides.extend(transition_slides(screens,edges,screen_slide))
    results = Slide('Результаты прохождения',f"Одна завершённая попытка — одна единица. Только ревизия {envelope['revision']} этого графа.")
    results.shape(.65,1.9,12,1.1,f"Начато: {summary['started']}    Завершено: {summary['finished']}    Активно: {summary['active']}",size=22,bold=True)
    attainment = f"Без помощи и с достигнутой целью: {summary['successful']} / {summary['finished']}" if summary['finished'] else 'Доля успешных попыток: неизвестна (N=0)'
    gates = summary.get('formObservations',{'fail':0,'unknown':0})
    results.shape(.65,3.1,12,1.65,attainment+f"\nС помощью: {summary['assisted']}    Прервано: {summary['abandoned']}\nФорма: проблем {gates['fail']}, не проверено {gates['unknown']}",size=18)
    results.shape(.65,5.15,12,1.1,'Это результаты теста прототипа, а не оценка конверсии рынка. Введённые в формы значения не записываются. Бизнес-операция и WCAG/AT: не проверены.',size=15,color='536174')
    slides.append(results)
    trials = [item for item in report['items'] if item.get('result')]
    for start in range(0,len(trials),8):
        slide = Slide('Наблюдения тестирования',f'Попытки {start+1}–{min(start+8,len(trials))} из {len(trials)} · самоотчёт и проверка маршрута')
        for index,trial in enumerate(trials[start:start+8]):
            result = trial['result']
            label = f"{trial['task']['title'][:70]} · {result['outcome']} · {result['durationMs']/1000:.1f} с · путь: {'достигнут' if result['pathCriteriaMet'] else 'не достигнут'}"
            label += '\nФорма: '+result.get('formChecks',{}).get('gate','unknown')+' · '+result['notes'][:120]
            slide.shape(.65,1.7+index*.61,12,.56,label,fill='F1F5F9' if index%2==0 else 'FFFFFF',size=11)
        slides.append(slide)
    return package(slides)
