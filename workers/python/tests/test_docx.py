import zipfile

from rdw_worker.docx import docx_to_markdown

W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'
DOC = f"""<?xml version="1.0" encoding="UTF-8"?>
<w:document {W}><w:body>
<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>บทนำ</w:t></w:r></w:p>
<w:p><w:r><w:t>First line</w:t><w:br/><w:t>second line</w:t></w:r></w:p>
<w:p><w:pPr><w:numPr/></w:pPr><w:r><w:t>an item</w:t></w:r></w:p>
<w:p></w:p>
</w:body></w:document>"""


def test_docx_headings_breaks_and_lists(tmp_path):
    src = tmp_path / "a.docx"
    with zipfile.ZipFile(src, "w") as z:
        z.writestr("word/document.xml", DOC)
        z.writestr("docProps/app.xml", "<Properties><Pages>3</Pages></Properties>")
    text, pages = docx_to_markdown(src, lambda *_: None)
    assert text == "## บทนำ\n\nFirst line\nsecond line\n\n- an item\n"
    assert pages == 3


def test_not_a_word_document(tmp_path):
    src = tmp_path / "b.docx"
    with zipfile.ZipFile(src, "w") as z:
        z.writestr("other.xml", "<x/>")
    try:
        docx_to_markdown(src, lambda *_: None)
    except ValueError as exc:
        assert "not a Word document" in str(exc)
    else:
        raise AssertionError("expected ValueError")
