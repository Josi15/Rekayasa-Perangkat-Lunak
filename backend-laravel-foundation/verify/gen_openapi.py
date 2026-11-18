#!/usr/bin/env python3
"""Membangun docs/openapi.yaml + docs/API-REFERENCE.md DARI KODE (route, FormRequest, Resource, service), bukan tulisan tangan.
Pemakaian: python3 verify/gen_openapi.py  (dari root foundation)."""
import re, glob, json, os, sys, subprocess, yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, 'finalisasi-layer', 'docs')
SCR = os.environ.get('SCRATCH', '/tmp')
ROUTES_JSON = os.path.join(SCR, 'routes_gen.json')

subprocess.run([sys.executable, os.environ.get('AUDIT_ROUTES', os.path.join(SCR, 'audit_routes.py')), ROUTES_JSON], check=True, stdout=subprocess.DEVNULL)
routes = json.load(open(ROUTES_JSON))

_cache = {}
def find(cls):
    if cls in _cache: return _cache[cls]
    r = [x for x in glob.glob(f'{ROOT}/**/{cls}.php', recursive=True) if '/verify/' not in x]
    _cache[cls] = r[0] if r else None
    return _cache[cls]

def read(cls):
    p = find(cls); return open(p).read() if p else ''

def func_body(src, name):
    m = re.search(r'function %s\(([^)]*)\)[^{]*\{(.*?)\n    \}' % re.escape(name), src, re.S)
    return (m.group(1), m.group(2)) if m else ('', '')

def docblock(src, name):
    """Docblock yang MENEMPEL tepat di atas `public function name(` (bukan docblock kelas/method lain)."""
    m = re.search(r'public function %s\(' % re.escape(name), src)
    if not m: return ''
    pre = src[:m.start()]
    d = re.search(r'/\*\*((?:(?!\*/).)*)\*/\s*$', pre, re.S)
    if not d: return ''
    t = re.sub(r'^\s*\*\s?', '', d.group(1), flags=re.M)
    return ' '.join(t.split())

def balanced_entries(body):
    """Ambil entri 'kunci' => nilai dari isi array rules (mendukung nilai multi-baris)."""
    out = {}; lines = body.splitlines(); i = 0
    while i < len(lines):
        m = re.match(r"\s+'([\w.*]+)' => (.*)$", lines[i])
        if m:
            key, val = m.group(1), m.group(2)
            depth = val.count('[') - val.count(']') + val.count('(') - val.count(')')
            while depth > 0 and i + 1 < len(lines):
                i += 1; val += ' ' + lines[i].strip()
                depth += lines[i].count('[') - lines[i].count(']') + lines[i].count('(') - lines[i].count(')')
            out[key] = val.rstrip(',')
        i += 1
    return out

def rules_of(cls, seen=None):
    seen = seen or set()
    if cls in seen or not find(cls): return {}
    seen.add(cls); src = read(cls)
    _, body = func_body(src, 'rules')
    rules = {}
    parent = re.search(r'extends (\w+)', src)
    if 'parent::rules()' in body and parent:
        rules.update(rules_of(parent.group(1), seen))
    rules.update(balanced_entries(body))
    return rules

def jtype(rule):
    r = rule.lower()
    if 'jenisfile' in r or "'file'" in r or 'mimetypes' in r or "'image'" in r: return {'type': 'string', 'format': 'binary'}
    if "'integer'" in r: return {'type': 'integer'}
    if "'numeric'" in r or "'decimal" in r: return {'type': 'number'}
    if "'boolean'" in r: return {'type': 'boolean'}
    if "'array'" in r: return {'type': 'array', 'items': {}}
    if "'email" in r: return {'type': 'string', 'format': 'email'}
    if 'date_format:y-m-d\'' in r or "date_format:y-m-d" in r: return {'type': 'string', 'format': 'date'}
    if "'date'" in r or 'iso' in r and 'regex' in r: return {'type': 'string', 'format': 'date-time'}
    ens = re.findall(r"Rule::in\(([^)]*)\)", rule)
    if ens:
        vals = re.findall(r"'([\w\-]+)'", ens[0])
        if vals: return {'type': 'string', 'enum': vals}
        m = re.search(r'(\w+)::values\(\)', ens[0])
        if m:
            e = re.search(r'enum %s\b.*?\{(.*?)\n\}' % m.group(1), read(m.group(1)), re.S)
            vals = re.findall(r"case \w+ = '([\w\-]+)'", e.group(1)) if e else []
            if vals: return {'type': 'string', 'enum': vals}
    return {'type': 'string'}

def only_prohibited(rule):
    return re.fullmatch(r"\[\s*'prohibited'\s*\]", rule.strip()) is not None

# ---------------------------------------------------------------- resource schemas
schemas = {}
def resource_schema(name):
    if name in schemas or not find(name): return name in schemas
    src = read(name)
    _, body = func_body(src, 'toArray')
    keys = re.findall(r"^\s{12}'(\w+)' =>", body, re.M)
    props = {k: {} for k in dict.fromkeys(keys)}
    desc = (re.search(r'/\*\*\s*(.*?)\*/\s*class', src, re.S) or [None, ''])[1]
    desc = ' '.join(re.sub(r'^\s*\*\s?', '', desc, flags=re.M).split()).replace('@mixin ', '')
    schemas[name] = {'type': 'object', 'description': (desc or name)[:300], 'properties': props}
    return True

# ---------------------------------------------------------------- kode konflik 409 dari service
def konflik_codes(ctl_src, body):
    kodes = set()
    props = dict(re.findall(r'private readonly (\w+) \$(\w+)', ctl_src))
    inv = {v: k for k, v in props.items()}  # nama prop -> kelas
    for prop, meth in re.findall(r'\$this->(\w+)->(\w+)\(', body):
        cls = inv.get(prop)
        if not cls or not find(cls): continue
        ssrc = read(cls)
        _, sbody = func_body(ssrc, meth)
        todo = [sbody]; vis = set()
        for h in re.findall(r'\$this->(\w+)\(', sbody):
            if h not in vis:
                vis.add(h); _, hb = func_body(ssrc, h); todo.append(hb)
        for b in todo:
            kodes.update(re.findall(r"KonflikBisnisException\((?:[^;]*?),\s*'(\w+)'\s*\)", b, re.S))
    return sorted(kodes)

TAGS = {'auth': 'Autentikasi', 'profil': 'Profil', 'admin': 'Pengguna (admin)', 'kelas': 'Kelas', 'mapel': 'Mata pelajaran', 'materi': 'Materi', 'tugas': 'Tugas',
        'pengumpulan': 'Pengumpulan tugas', 'kuis': 'Kuis', 'nilai': 'Nilai', 'jadwal': 'Jadwal', 'presensi': 'Presensi', 'rekap': 'Presensi', 'pengumuman': 'Pengumuman',
        'dashboard': 'Dashboard', 'health': 'Health', 'siswa': 'Siswa', 'guru': 'Guru'}
PUBLIK = ('health', 'health/ready', 'auth/login', 'auth/forgot-password', 'auth/reset-password/validate', 'auth/reset-password')

def tag_of(uri, ctl, fn):
    seg = uri.replace('/api/v1/', '').split('/')
    first = seg[0]
    if ctl == 'MateriController': return 'Materi'
    if ctl == 'TugasController': return 'Tugas'
    if ctl == 'PengumpulanController': return 'Pengumpulan tugas'
    if ctl == 'KuisController': return 'Kuis'
    if ctl == 'NilaiController': return 'Nilai'
    if ctl == 'JadwalController': return 'Jadwal'
    if ctl == 'PresensiController': return 'Presensi'
    if ctl == 'PengumumanController': return 'Pengumuman'
    if ctl == 'DashboardController': return 'Dashboard'
    if ctl in ('KelasController', 'KelasAnggotaController', 'SiswaKelasController'): return 'Kelas & keanggotaan'
    if ctl == 'MataPelajaranController': return 'Mata pelajaran'
    if ctl in ('PenggunaController',): return 'Pengguna (admin)'
    if ctl == 'ProfilController': return 'Profil'
    if ctl in ('AuthController', 'PasswordResetController'): return 'Autentikasi'
    if ctl == 'HealthController': return 'Health'
    return TAGS.get(first, first)

SUM = {
 'POST /auth/forgot-password': 'Minta tautan reset password (respons selalu generik)', 'POST /auth/login': 'Login (NISN/NIP/username/email + password), memulai sesi',
 'POST /auth/logout': 'Logout, mengakhiri sesi', 'GET /auth/me': 'Data pengguna yang sedang login', 'POST /auth/reset-password': 'Atur password baru dengan token reset',
 'POST /auth/reset-password/validate': 'Periksa token reset masih berlaku', 'GET /guru/{guru}/jadwal': 'Jadwal mengajar seorang guru (admin atau guru itu)',
 'GET /siswa/{siswa}/jadwal': 'Jadwal seorang siswa (admin, siswa itu, atau guru terkait)', 'POST /jadwal': 'Buat jadwal (admin); cek bentrok kelas/guru',
 'GET /jadwal/{jadwal}': 'Detail jadwal', 'PATCH /jadwal/{jadwal}': 'Ubah jadwal mendatang tanpa presensi (admin)',
 'GET /kelas/{kelas}': 'Detail kelas', 'GET /kelas/{kelas}/anggota': 'Daftar siswa anggota kelas', 'DELETE /kelas/{kelas}/anggota/{siswa}': 'Keluarkan siswa dari kelas',
 'GET /kuis': 'Daftar kuis yang boleh dilihat', 'GET /kuis/{kuis}': 'Detail kuis (tautan Google Forms)', 'PATCH /kuis/{kuis}': 'Ubah judul/tautan kuis (guru pengampu)',
 'GET /mapel/{mapel}/kuis': 'Daftar kuis satu mapel', 'POST /mapel/{mapel}/kuis': 'Buat kuis (guru pengampu); validasi tautan Google Forms',
 'GET /mapel/{mapel}': 'Detail mata pelajaran', 'GET /mapel/{mapel}/materi': 'Daftar materi satu mapel', 'POST /mapel/{mapel}/materi': 'Unggah materi (guru pengampu, multipart)',
 'GET /materi/{materi}': 'Detail materi', 'PATCH /materi/{materi}': 'Ubah judul materi (guru pengampu)',
 'POST /kuis/{kuis}/nilai': 'Catat nilai kuis seorang siswa (guru pengampu)', 'GET /nilai/{nilai}': 'Detail nilai', 'POST /pengumpulan/{pengumpulan}/nilai': 'Beri nilai pengumpulan tugas (guru pengampu)',
 'GET /admin/pengguna': 'Daftar pengguna (admin)', 'POST /admin/pengguna': 'Buat pengguna (admin)', 'GET /admin/pengguna/{pengguna}': 'Detail pengguna (admin)',
 'PATCH /admin/pengguna/{pengguna}': 'Ubah pengguna (admin)', 'POST /admin/pengguna/{pengguna}/aktifkan': 'Aktifkan kembali akun pengguna',
 'GET /pengumpulan/{pengumpulan}/file': 'Unduh jawaban (pemilik, guru pengampu, admin)', 'POST /pengumuman': 'Buat pengumuman global (admin) atau mapel (guru pengampu/admin)',
 'GET /pengumuman/{pengumuman}': 'Detail pengumuman', 'GET /presensi': 'Daftar presensi yang boleh dilihat (dengan filter)', 'GET /presensi/{presensi}': 'Detail presensi',
 'GET /profil': 'Profil sendiri', 'GET /mapel/{mapel}/tugas': 'Daftar tugas satu mapel', 'POST /mapel/{mapel}/tugas': 'Buat tugas (guru pengampu, multipart bila ada lampiran)',
 'GET /tugas/{tugas}': 'Detail tugas', 'PATCH /tugas/{tugas}': 'Ubah tugas (guru pengampu)', 'DELETE /tugas/{tugas}/lampiran': 'Hapus lampiran tugas', 'GET /tugas/{tugas}/lampiran': 'Unduh lampiran tugas',
}

paths = {}; ref_rows = []; used_tags = []
ERR = lambda d: {'description': d, 'content': {'application/json': {'schema': {'$ref': '#/components/schemas/Error'}}}}

for r in routes:
    uri = r['uri']; method = r['method'].lower(); fn = r['fn']; ctl = r['ctl']
    csrc = read(ctl)
    params_s, body = func_body(csrc, fn)
    doc = docblock(csrc, fn)
    summary = re.sub(r'^(GET|POST|PUT|PATCH|DELETE)\s+\S+\s*[—-]?\s*', '', doc).strip() or fn
    summary = SUM.get(r['method'] + ' ' + uri.replace('/api/v1', ''), summary)
    publik = any(uri.endswith('/' + p) or uri == '/api/v1/' + p for p in PUBLIK)
    tag = tag_of(uri, ctl, fn); used_tags.append(tag)

    # parameter path
    oas_path = re.sub(r'\{(\w+)\}', r'{\1}', uri)
    parameters = [{'name': n, 'in': 'path', 'required': True, 'schema': {'type': 'integer', 'minimum': 1}} for n in re.findall(r'\{(\w+)\}', uri)]

    # request
    reqs = re.findall(r'(\w+Request)\s+\$', params_s)
    rules = {}
    for q in reqs:
        if q not in ('Request',): rules.update(rules_of(q))
    rules = {k: v for k, v in rules.items() if not only_prohibited(v)}
    multipart = any(re.search(r"jenisfile|mimetypes|'file'|'image'", v.lower()) for v in rules.values())
    body_schema = None
    if rules:
        props = {}; required = []
        for k, v in rules.items():
            if '.*' in k: continue
            props[k] = jtype(v)
            if props[k].get('type') == 'array' and (k + '.*') in rules: props[k]['items'] = jtype(rules[k + '.*'])
            if re.search(r"'required'|Rule::requiredIf|required_if", v) and "'sometimes'" not in v and 'required_if' not in v and 'requiredIf' not in v: required.append(k)
        if method in ('get', 'delete'):
            for k, sch in props.items():
                parameters.append({'name': k, 'in': 'query', 'required': k in required, 'schema': sch})
        else:
            body_schema = {'type': 'object', 'properties': props}
            if required: body_schema['required'] = required

    # sukses
    status = '200'
    if re.search(r'setStatusCode\(201\)|->created\(|,\s*201\)', body): status = '201'
    if 'noContent' in body: status = '204'
    resp_cls = re.findall(r'(\w+Resource)::(collection|make)', body)
    content = None
    if status != '204':
        if resp_cls and resource_schema(resp_cls[0][0]):
            ref = {'$ref': f'#/components/schemas/{resp_cls[0][0]}'}
            if resp_cls[0][1] == 'collection':
                content = {'application/json': {'schema': {'type': 'object', 'properties': {'data': {'type': 'array', 'items': ref}, 'links': {'type': 'object'}, 'meta': {'$ref': '#/components/schemas/PaginationMeta'}}}}}
            else:
                content = {'application/json': {'schema': {'type': 'object', 'properties': {'data': ref}}}}
        elif 'download' in body or 'unduh' in body or uri.endswith(('/file', '/lampiran')) and method == 'get':
            content = {'application/octet-stream': {'schema': {'type': 'string', 'format': 'binary'}}}
        else:
            content = {'application/json': {'schema': {'type': 'object', 'properties': {'data': {'type': 'object'}}}}}
    responses = {status: {'description': 'Berhasil'}}
    if content: responses[status]['content'] = content
    if not publik:
        responses['401'] = ERR('Belum login / akun nonaktif (code: unauthenticated)')
        if not ('/me' in uri or uri.endswith(('/logout', '/profil', '/dashboard'))) and not (ctl == 'ProfilController'):
            responses['403'] = ERR('Tidak berwenang (code: forbidden)')
    if parameters and any(p['in'] == 'path' for p in parameters): responses['404'] = ERR('Tidak ditemukan (code: not_found)')
    kodes = konflik_codes(csrc, body)
    if kodes: responses['409'] = ERR('Konflik aturan bisnis. Kode kemungkinan: ' + ', '.join(kodes))
    if rules or method in ('post', 'patch', 'put'): responses['422'] = ERR('Validasi gagal (code: validation_error, errors per field)')
    if any(m.startswith('throttle:') for m in r['mw']) or method: responses['429'] = ERR('Terlalu banyak permintaan (code: too_many_requests, header Retry-After)')

    policies = sorted(set(re.findall(r"(?:can|authorize)\('(\w+)'", body + ''.join(read(q) for q in reqs))))
    roles = [m.split(':')[1] for m in r['mw'] if m.startswith('role:')]
    op = {'tags': [tag], 'summary': summary[:120], 'operationId': r.get('name', '').replace('.', '_') or f'{method}_{fn}_{uri}',
          'responses': responses}
    if doc: op['description'] = doc
    ext = {}
    if roles: ext['peran'] = roles
    if policies: ext['policy'] = policies
    if ext: op['x-akses'] = ext
    if parameters: op['parameters'] = parameters
    if body_schema:
        ct = 'multipart/form-data' if multipart else 'application/json'
        op['requestBody'] = {'required': True, 'content': {ct: {'schema': body_schema}}}
    op['security'] = [] if publik else [{'cookieAuth': [], 'csrfHeader': []}]
    paths.setdefault(oas_path, {})[method] = op
    ref_rows.append((r['method'], uri, tag, 'publik' if publik else ('role:' + ','.join(roles) if roles else 'login'), ', '.join(policies) or '-', status, summary,
                     ', '.join(sorted(rules)) if rules else '-', ', '.join(kodes) or '-'))

paths['/sanctum/csrf-cookie'] = {'get': {'tags': ['Autentikasi'], 'summary': 'Menerbitkan cookie XSRF-TOKEN (panggil sekali sebelum login dari SPA)', 'operationId': 'sanctum_csrf_cookie',
                                          'responses': {'204': {'description': 'Cookie XSRF-TOKEN dan sesi diterbitkan'}}, 'security': []}}

spec = {
    'openapi': '3.0.3',
    'info': {'title': 'LMS Simba API', 'version': '1.0.0',
             'description': ('Dibangkitkan otomatis dari kode (route, FormRequest, Resource, service) oleh verify/gen_openapi.py. '
                             'Autentikasi: cookie sesi Sanctum SPA + header X-XSRF-TOKEN (CSRF). Format error: {message, code, errors?, request_id}. '
                             'Daftar field Resource adalah nama field; tipe tiap field mengikuti docs/API-*.md. '
                             'Dokumen ini BELUM diuji terhadap server yang berjalan.')},
    'servers': [{'url': 'http://lms-simba.test', 'description': 'Lokal (Laravel Herd)'}, {'url': 'https://api.contoh.sekolah.id', 'description': 'Produksi (contoh)'}],
    'tags': [{'name': t} for t in dict.fromkeys(used_tags + ['Autentikasi'])],
    'paths': dict(sorted(paths.items())),
    'components': {
        'securitySchemes': {'cookieAuth': {'type': 'apiKey', 'in': 'cookie', 'name': 'laravel_session', 'description': 'Cookie sesi (HttpOnly) diterbitkan saat login.'},
                            'csrfHeader': {'type': 'apiKey', 'in': 'header', 'name': 'X-XSRF-TOKEN', 'description': 'Isi dari cookie XSRF-TOKEN (didekode URL); wajib untuk metode selain GET.'}},
        'schemas': {'Error': {'type': 'object', 'required': ['message', 'code'], 'properties': {'message': {'type': 'string'}, 'code': {'type': 'string'}, 'errors': {'type': 'object', 'additionalProperties': {'type': 'array', 'items': {'type': 'string'}}}, 'request_id': {'type': 'string'}}},
                    'PaginationMeta': {'type': 'object', 'properties': {'current_page': {'type': 'integer'}, 'per_page': {'type': 'integer'}, 'total': {'type': 'integer'}, 'last_page': {'type': 'integer'}, 'from': {'type': 'integer', 'nullable': True}, 'to': {'type': 'integer', 'nullable': True}}},
                    **schemas},
    },
}
os.makedirs(OUT_DIR, exist_ok=True)
with open(os.path.join(OUT_DIR, 'openapi.yaml'), 'w') as f:
    yaml.safe_dump(spec, f, sort_keys=False, allow_unicode=True, width=140)

with open(os.path.join(OUT_DIR, 'API-REFERENCE.md'), 'w') as f:
    f.write('# Referensi Endpoint LMS Simba\n\n> Dibangkitkan dari kode oleh `verify/gen_openapi.py` (jumlah endpoint: %d). Spesifikasi lengkap: `openapi.yaml`.\n'
            '> Basis URL `/api/v1`. Semua endpoint selain "publik" memerlukan sesi login + akun aktif. "role:admin" = dicek middleware; '
            '"login" = otorisasi per baris lewat policy (kolom Policy) dan/atau pembatasan data pada query.\n' % len(ref_rows))
    cur = None
    for row in sorted(ref_rows, key=lambda x: (x[2], x[1], x[0])):
        if row[2] != cur:
            cur = row[2]; f.write(f'\n## {cur}\n\n| Metode | Path | Akses | Policy | Sukses | Ringkasan | Field input | Kode 409 |\n|---|---|---|---|---|---|---|---|\n')
        f.write('| %s | `%s` | %s | %s | %s | %s | %s | %s |\n' % (row[0], row[1].replace('/api/v1', ''), row[3], row[4], row[5], row[6].replace('|', '/'), row[7], row[8]))
print('endpoint:', len(ref_rows), '| paths:', len(paths), '| schemas:', len(schemas))
