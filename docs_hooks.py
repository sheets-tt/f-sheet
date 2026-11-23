"""Hooks de MkDocs.

1. Los enlaces internos del README («#gestión-de-cuentas») llevan a la página del sitio donde quedó ese
   encabezado.
2. Las rutas relativas escritas en HTML dentro del Markdown (<img src="photos/login.png">, que usa el
   manual) se corrigen igual que MkDocs corrige las de ![](…): cada página se publica en su propia
   carpeta (…/Manual_Usuario_Plataforma_Web/), así que «photos/login.png» tiene que ser «../photos/…».
3. Las notas del manual («> **Nota:** …», «> **Importante:** …») se muestran como recuadros de MkDocs
   Material (admonitions). El manual no cambia: en GitHub siguen siendo citas.

En GitHub el README es una sola página; en el sitio cada sección es su propia página (incluida con
include-markdown), que reescribe «#ancla» como «..#ancla». El mapa ancla → página se arma con los
encabezados de cada página ya con el README incluido: no hay que mantenerlo a mano. MkDocs procesa el
Markdown de todas las páginas antes de generar el HTML, así que el mapa está completo en on_post_page.
"""
import posixpath
import re

from mkdocs.utils import get_relative_url
from pymdownx.slugs import slugify

_slug = slugify(case="lower")  # mismo slug que GitHub y que toc (conserva acentos)
_ENCABEZADO = re.compile(r"^#{1,6}\s+(.+?)\s*#*\s*$", re.M)
_ENLACE = re.compile(r'href="\.\.#([^"]+)"')
_anclas: dict[str, str] = {}


def on_page_markdown(markdown, page, **kwargs):
    for titulo in _ENCABEZADO.findall(markdown):
        _anclas.setdefault(_slug(titulo, "-"), page.file.src_uri)
    return _notas_como_recuadros(markdown)


# Cita al inicio de línea cuyo primer renglón empieza con «**Nota…:**» o «**Importante…:**».
_TIPO_NOTA = {"nota": "note", "importante": "warning"}
_CABEZA_NOTA = re.compile(r"^> \*\*((Nota|Importante)[^*]*?):?\*\*:?\s*(.*)$", re.I)


def _notas_como_recuadros(markdown):
    lineas, salida, i = markdown.split("\n"), [], 0
    while i < len(lineas):
        m = _CABEZA_NOTA.match(lineas[i])
        if not m:
            salida.append(lineas[i])
            i += 1
            continue
        titulo, tipo, resto = m.group(1).strip(), _TIPO_NOTA[m.group(2).lower()], m.group(3)
        cuerpo = [resto] if resto else []
        i += 1
        while i < len(lineas) and lineas[i].startswith(">"):
            cuerpo.append(lineas[i][1:].lstrip(" ") if lineas[i].strip() != ">" else "")
            i += 1
        salida.append('!!! %s "%s"' % (tipo, titulo))
        salida.extend(("    " + c) if c else "" for c in cuerpo)
        salida.append("")
    return "\n".join(salida)


def on_post_page(output, page, **kwargs):
    actual = page.file.src_uri

    def reemplazar(m):
        ancla = m.group(1)
        destino = _anclas.get(ancla)
        if destino is None:
            return m.group(0)
        if destino == actual:
            return f'href="#{ancla}"'
        base = "" if actual == "index.md" else "../"
        ruta = "" if destino == "index.md" else destino[: -len(".md")] + "/"
        return f'href="{base}{ruta}#{ancla}"'

    return _ENLACE.sub(reemplazar, output)


# src/href relativos en HTML crudo: sin esquema (http:, data:, mailto:), sin «/» ni «#» al inicio.
_RUTA_HTML = re.compile(r'(<(?:img|source|a)\b[^>]*?\s(?:src|href)=")(?![a-z][a-z0-9+.-]*:|/|#)([^"]+)(")', re.I)


def on_page_content(html, page, files, **kwargs):
    """Reescribe a la URL publicada solo las rutas que apuntan a un archivo real de docs/ (el resto se queda)."""
    carpeta = posixpath.dirname(page.file.src_uri)

    def corregir(m):
        ruta, sufijo = m.group(2), ""
        for sep in ("#", "?"):
            if sep in ruta:
                ruta, resto = ruta.split(sep, 1)
                sufijo = sep + resto + sufijo
        destino = files.get_file_from_path(posixpath.normpath(posixpath.join(carpeta, ruta)))
        if destino is None:
            return m.group(0)
        return m.group(1) + get_relative_url(destino.url, page.url) + sufijo + m.group(3)

    return _RUTA_HTML.sub(corregir, html)
