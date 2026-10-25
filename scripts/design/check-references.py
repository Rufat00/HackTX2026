"""Validate audit integrity; rehash private reference files when imported locally."""
import hashlib, json, re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
manifest=json.loads((ROOT/'design/reference-manifest.json').read_text())
evidence=json.loads((ROOT/'design/evidence.json').read_text())
images=manifest['images']; ids={item['id'] for item in images}
assert len(ids)==len(images)==manifest['screenshotCount']==manifest['inspectedCount']==evidence['inspectedCount']
assert manifest['source']['sha256']==evidence['sourceArchive']['sha256']
for item in images:
    assert item['inspected'] and item['inspection']['note'].strip(), item['id']
    assert item['width']>0 and item['height']>0
    assert re.fullmatch('[a-f0-9]{64}',item['sha256'])
for finding in evidence['findings']:
    assert finding['sourceIds'] and set(finding['sourceIds'])<=ids
    assert finding['kind'] in {'observed','inferred','adaptation'}
    assert finding['confidence'] and finding['region'] and finding['conclusion']
source=ROOT/'design/reference/bond/source.zip'
if source.exists():
    assert hashlib.sha256(source.read_bytes()).hexdigest()==manifest['source']['sha256']
    for item in images:
        assert hashlib.sha256((ROOT/item['path']).read_bytes()).hexdigest()==item['sha256'],item['id']
    print(f'Validated {len(images)} individual inspections and rehashed archive + originals.')
else:
    print(f'Validated {len(images)} inspection records; private references absent, hashes NOT rechecked.')
for path in (ROOT/'apps/mobile/src').rglob('*'):
    if path.suffix in {'.ts','.tsx'}:
        assert not re.search(r'(?:from\s*|require\s*\(|import\s*\()[\s\'"]*[^\n]*design/reference',path.read_text()),path
