"""Literal SVG primitives and documented color tokens, with no foreignObject, fonts, images or scripts."""
import xml.etree.ElementTree as ET
from .studio_model import normalize_document

SVG = 'http://www.w3.org/2000/svg'
ET.register_namespace('', SVG)


def element(parent, tag, **attributes):
    """Create a namespaced primitive; ElementTree escapes all supplied text and attribute values."""
    return ET.SubElement(parent, '{'+SVG+'}'+tag, {key.replace('_','-'):str(value) for key,value in attributes.items()})


def board_svg(document):
    """Export the board in CSS pixels; source text remains SVG text, and font availability affects import metrics."""
    document = normalize_document(document)
    board = document['board']
    root = ET.Element('{'+SVG+'}svg', {'width':str(board['width']),'height':str(board['height']),
                                     'viewBox':f"0 0 {board['width']} {board['height']}", 'role':'img'})
    element(root,'title').text = document['title']
    element(root,'desc').text = 'AG brand board. SVG primitives only; no native Figma components, layout constraints or embedded fonts.'
    element(root,'rect',width=board['width'],height=board['height'],fill=board['background'])
    for item in board['objects']:
        if item['hidden']:
            continue
        group = element(root,'g',id=item['id'],transform=f"translate({item['x']} {item['y']}) rotate({item['rotation']} {item['width']/2} {item['height']/2})")
        element(group,'title').text = item['title']
        if item['type'] == 'text':
            node = element(group,'text',x=0,y=item['fontSize'],fill=item['color'],font_family='sans-serif',
                           font_size=item['fontSize'],font_weight=item['fontWeight'])
            node.set('{http://www.w3.org/XML/1998/namespace}space','preserve')
            for index,line in enumerate(item['text'].split('\n')):
                element(node,'tspan',x=0,dy=0 if index==0 else item['fontSize']*1.25).text = line
        elif item['type'] == 'ellipse':
            element(group,'ellipse',cx=item['width']/2,cy=item['height']/2,rx=item['width']/2,ry=item['height']/2,fill=item['color'])
        else:
            element(group,'rect',width=item['width'],height=item['height'],rx=8,fill=item['color'])
    return ET.tostring(root,encoding='unicode',xml_declaration=False)


def color_tokens(document):
    """Export explicit swatches using DTCG 2025.10 sRGB color values; names remain stable object IDs."""
    board = normalize_document(document)['board']
    tokens = {'$description':'Brand swatches; semantic mapping and accessibility must be qualified per product.'}
    for item in board['objects']:
        if item['type'] != 'swatch' or item['hidden']:
            continue
        components = [int(item['color'][index:index+2],16)/255 for index in (1,3,5)]
        tokens[item['id']] = {'$type':'color','$description':item['title'],
                             '$value':{'colorSpace':'srgb','components':components,'alpha':1}}
    return {'brand':tokens}
