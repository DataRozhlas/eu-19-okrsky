#%%
import numpy as np
sys.path.append('./tools/')
import jenks
import json

#%%
with open('./data/data.json', 'r', encoding='utf-8') as f:
    d = json.loads(f.read())

#%%
d['features'][0]

#%%
vls = {}
for okrs in d['features']:
    for prop in okrs['properties']:
        if prop.startswith('part_'):
            if prop not in vls:
                vls[prop] = []
            vls[prop].append(okrs['properties'][prop] / okrs['properties']['hlasy_platne'])

#%%
breaks = {}
for p in vls:
    casp = jenks.jenksCaspall(vls[p], 6, 3, initStyle='kpp')
    breaks[p] = list(map(lambda x: round(x, 4), casp.breaks))

#%%
breaks

#%%
with open('./js/breaks.js', 'w', encoding='utf-8') as f:
    f.write('export const breaks = ' + json.dumps(breaks, ensure_ascii=False))

#%%
v = []
for okrs in d['features']:
    v.append(okrs['properties']['hlasy_platne'] / okrs['properties']['zapsani'])

#%%
casp = jenks.jenksCaspall(v, 6, 3, initStyle='kpp')
print(list(map(lambda x: round(x, 4), casp.breaks)))