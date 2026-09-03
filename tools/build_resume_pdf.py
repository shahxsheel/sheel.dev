from pathlib import Path
import re

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, HRFlowable, PageBreak


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path("/Users/shahxsheel/Downloads/Sheel_Shah_Master_Resume(2).md")
OUTPUT = ROOT / "output/pdf/Sheel_Shah_Master_Resume.pdf"


def ascii_safe(value: str) -> str:
    replacements = {
        "—": "-", "–": "-", "→": "to", "·": "|", "’": "'", "“": '"', "”": '"',
        "κ": "kappa", "~": "about ", "≥": ">=", "≤": "<=",
    }
    for old, new in replacements.items():
        value = value.replace(old, new)
    value = value.encode("ascii", "ignore").decode("ascii")
    value = re.sub(r"\s+", " ", value).strip()
    return value


def inline(value: str) -> str:
    value = ascii_safe(value)
    value = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", value)
    return value.replace("&", "&amp;").replace("<b>", "__B__").replace("</b>", "__EB__").replace("<", "&lt;").replace(">", "&gt;").replace("__B__", "<b>").replace("__EB__", "</b>")


styles = getSampleStyleSheet()
name_style = ParagraphStyle("Name", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=24, leading=25, alignment=TA_CENTER, textColor=colors.HexColor("#181711"), spaceAfter=2)
subtitle_style = ParagraphStyle("Subtitle", parent=styles["Normal"], fontName="Helvetica", fontSize=9.5, leading=12, alignment=TA_CENTER, textColor=colors.HexColor("#5f5a4e"), spaceAfter=2)
contact_style = ParagraphStyle("Contact", parent=styles["Normal"], fontName="Helvetica", fontSize=7.6, leading=10, alignment=TA_CENTER, textColor=colors.HexColor("#5f5a4e"), spaceAfter=8)
section_style = ParagraphStyle("Section", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=11, leading=13, textColor=colors.HexColor("#181711"), spaceBefore=8, spaceAfter=4, keepWithNext=True)
item_style = ParagraphStyle("Item", parent=styles["Heading3"], fontName="Helvetica-Bold", fontSize=9.5, leading=11.5, textColor=colors.HexColor("#181711"), spaceBefore=5, spaceAfter=1, keepWithNext=True)
date_style = ParagraphStyle("Date", parent=styles["Normal"], fontName="Helvetica-Oblique", fontSize=7.6, leading=9.5, textColor=colors.HexColor("#77705f"), spaceAfter=2, keepWithNext=True)
body_style = ParagraphStyle("Body", parent=styles["BodyText"], fontName="Helvetica", fontSize=7.95, leading=10.35, textColor=colors.HexColor("#3d392f"), spaceAfter=2.5)
bullet_style = ParagraphStyle("Bullet", parent=body_style, leftIndent=11, firstLineIndent=-7, bulletIndent=2, spaceAfter=1.9)
tech_style = ParagraphStyle("Tech", parent=body_style, fontName="Helvetica-Oblique", fontSize=7.4, leading=9.3, textColor=colors.HexColor("#625c4e"), spaceBefore=1, spaceAfter=3)


class ResumeDoc(BaseDocTemplate):
    def __init__(self, filename):
        super().__init__(filename, pagesize=letter, leftMargin=0.55*inch, rightMargin=0.55*inch, topMargin=0.48*inch, bottomMargin=0.46*inch, title="Sheel Shah - Master Resume", author="Sheel Shah")
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="resume")
        self.addPageTemplates(PageTemplate(id="resume", frames=frame, onPage=self.footer))

    def footer(self, canvas, doc):
        canvas.saveState()
        canvas.setStrokeColor(colors.HexColor("#ded7c8"))
        canvas.setLineWidth(0.35)
        canvas.line(self.leftMargin, 0.31*inch, letter[0] - self.rightMargin, 0.31*inch)
        canvas.setFillColor(colors.HexColor("#817a6a"))
        canvas.setFont("Helvetica", 6.7)
        canvas.drawString(self.leftMargin, 0.18*inch, "SHEEL SHAH | MASTER RESUME")
        canvas.drawRightString(letter[0] - self.rightMargin, 0.18*inch, str(doc.page))
        canvas.restoreState()


def build_story(lines):
    story = []
    first_section = True
    for raw in lines:
        line = raw.strip()
        if not line:
            continue
        if line.startswith("# "):
            story.append(Paragraph(inline(line[2:]), name_style))
        elif line.startswith("## "):
            if not first_section:
                story.append(Spacer(1, 2))
            story.extend([Paragraph(inline(line[3:]).upper(), section_style), HRFlowable(width="100%", thickness=0.7, color=colors.HexColor("#a9ca6b"), spaceAfter=3)])
            first_section = False
        elif line.startswith("### "):
            story.append(Paragraph(inline(line[4:]), item_style))
        elif line.startswith("- "):
            story.append(Paragraph(inline(line[2:]), bullet_style, bulletText="•"))
        elif line.startswith("*") and line.endswith("*"):
            story.append(Paragraph(inline(line.strip("*")), date_style))
        elif line.lower().startswith("technologies:"):
            label, content = line.split(":", 1)
            story.append(Paragraph(f"<b>{inline(label)}:</b>{inline(content)}", tech_style))
        elif "@" in line and "linkedin.com" in line:
            story.append(Paragraph(inline(line), contact_style))
        elif len(story) == 1:
            story.append(Paragraph(inline(line), subtitle_style))
        else:
            story.append(Paragraph(inline(line), body_style))
    return story


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    lines = SOURCE.read_text(encoding="utf-8").splitlines()
    doc = ResumeDoc(str(OUTPUT))
    doc.build(build_story(lines))
    print(OUTPUT)


if __name__ == "__main__":
    main()
