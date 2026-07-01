"""
health_report.py
================
Generate health report PDF for users — full Vietnamese support.
"""

from io import BytesIO
from datetime import date
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os


def _register_fonts():
    """
    Register DejaVuSans — hỗ trợ đầy đủ tiếng Việt.
    Ưu tiên font hệ thống, fallback sang matplotlib bundle
    (hoạt động trên cả Windows / Mac / Linux).
    """
    candidates = [
        (
            '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
            '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
        ),
    ]
    try:
        import matplotlib
        mpl = matplotlib.get_data_path()
        candidates.append((
            os.path.join(mpl, 'fonts', 'ttf', 'DejaVuSans.ttf'),
            os.path.join(mpl, 'fonts', 'ttf', 'DejaVuSans-Bold.ttf'),
        ))
    except ImportError:
        pass

    for normal_path, bold_path in candidates:
        if os.path.exists(normal_path) and os.path.exists(bold_path):
            pdfmetrics.registerFont(TTFont('DejaVuSans', normal_path))
            pdfmetrics.registerFont(TTFont('DejaVuSans-Bold', bold_path))
            return 'DejaVuSans', 'DejaVuSans-Bold'

    return 'Helvetica', 'Helvetica-Bold'


def generate_health_report(user, latest_bmi, previous_bmi, bmi_history_30days):
    """
    Generate a personal health report PDF with full Vietnamese text.

    Args:
        user              : User object (full_name, gender, age, activity_level)
        latest_bmi        : Latest BMIRecord object
        previous_bmi      : BMIRecord from ~1 month ago (or None)
        bmi_history_30days: List[BMIRecord] from last 30 days

    Returns:
        BytesIO containing the PDF
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        rightMargin=inch, leftMargin=inch,
        topMargin=inch, bottomMargin=inch
    )

    font_name, font_bold = _register_fonts()
    styles = getSampleStyleSheet()

    # ── Styles ────────────────────────────────────────────────────────────────

    def ms(name, **kw):
        kw.setdefault('fontName', font_name)
        return ParagraphStyle(name, parent=styles['Normal'], **kw)

    title_style    = ms('T',  fontName=font_bold, fontSize=18,
                         textColor=colors.HexColor('#1a1a2e'), spaceAfter=4, alignment=0)
    subtitle_style = ms('St', fontSize=9, textColor=colors.HexColor('#888888'), spaceAfter=2)
    section_style  = ms('Sc', fontName=font_bold, fontSize=11,
                         textColor=colors.HexColor('#2c3e50'), spaceBefore=18, spaceAfter=8)
    normal_style   = ms('N',  fontSize=10, spaceAfter=5, leading=16)
    good_style     = ms('G',  fontSize=10, spaceAfter=5, leading=16,
                         textColor=colors.HexColor('#27ae60'))
    warning_style  = ms('W',  fontSize=10, spaceAfter=5, leading=16,
                         textColor=colors.HexColor('#e67e22'))
    danger_style   = ms('D',  fontSize=10, spaceAfter=5, leading=16,
                         textColor=colors.HexColor('#e74c3c'))
    footer_style   = ms('F',  fontSize=8, textColor=colors.HexColor('#aaaaaa'),
                         alignment=1, spaceBefore=6)

    def divider(color='#3498db', thickness=1.5):
        return Table([['']], colWidths=[6.5 * inch], style=TableStyle([
            ('LINEBELOW', (0, 0), (-1, -1), thickness, colors.HexColor(color)),
        ]))

    # ── Story ─────────────────────────────────────────────────────────────────

    story = []
    today = date.today()

    story.append(Paragraph("BÁO CÁO SỨC KHỎE CÁ NHÂN", title_style))
    story.append(Spacer(1, 4))
    story.append(divider('#3498db', 1.5))
    story.append(Spacer(1, 8))

    gender_map  = {"male": "Nam", "female": "Nữ", "other": "Khác"}
    user_gender = gender_map.get(getattr(user, 'gender', ''), 'Chưa cập nhật')
    user_age    = getattr(user, 'age', None) or '—'
    user_name   = getattr(user, 'full_name', None) or 'Chưa cập nhật'

    story.append(Paragraph(
        f"Họ tên: {user_name} | {user_gender} | {user_age} tuổi", normal_style
    ))
    story.append(Paragraph(f"Ngày xuất: {today.strftime('%d/%m/%Y')}", subtitle_style))
    story.append(Spacer(1, 10))

    # TDEE
    tdee_value = "—"
    if latest_bmi and user_age != '—':
        w, h, a   = latest_bmi.weight_kg, latest_bmi.height_cm, user.age
        gender    = getattr(user, 'gender', '')
        bmr       = (10*w + 6.25*h - 5*a + 5)   if gender == 'male'   else \
                    (10*w + 6.25*h - 5*a - 161)  if gender == 'female' else \
                    (10*w + 6.25*h - 5*a)
        mul       = {'sedentary':1.2,'light':1.375,'moderate':1.55,'active':1.725}.get(
                        getattr(user, 'activity_level', ''), 1.2)
        tdee_value = f"{int(bmr * mul):,}"

    # Section 1: Chỉ số cơ thể
    story.append(Paragraph("CHỈ SỐ CƠ THỂ", section_style))

    if latest_bmi:
        weight_text = f"{latest_bmi.weight_kg} kg"
        if previous_bmi:
            diff = latest_bmi.weight_kg - previous_bmi.weight_kg
            tag  = "giảm" if diff < 0 else ("tăng" if diff > 0 else "")
            weight_text += f"  (tháng trước: {previous_bmi.weight_kg} kg{', ' + tag if tag else ''})"

        bmi_val   = latest_bmi.bmi_value
        bmi_color = '#3498db' if bmi_val < 18.5 else \
                    '#27ae60' if bmi_val < 25    else \
                    '#e67e22' if bmi_val < 30    else '#e74c3c'

        tbl = Table([
            ['Cân nặng hiện tại', weight_text],
            ['Chiều cao',         f"{latest_bmi.height_cm} cm"],
            ['BMI',               f"{bmi_val:.1f}  →  {latest_bmi.bmi_category_vi}"],
            ['TDEE',              f"{tdee_value} kcal/ngày"],
        ], colWidths=[2.2*inch, 4.3*inch])

        tbl.setStyle(TableStyle([
            ('FONTNAME',       (0,0),(-1,-1), font_name),
            ('FONTNAME',       (0,0),(0,-1),  font_bold),
            ('FONTSIZE',       (0,0),(-1,-1), 10),
            ('TEXTCOLOR',      (0,0),(0,-1),  colors.HexColor('#555555')),
            ('TEXTCOLOR',      (1,0),(1,-1),  colors.HexColor('#1a1a2e')),
            ('TEXTCOLOR',      (1,2),(1,2),   colors.HexColor(bmi_color)),
            ('ROWBACKGROUNDS', (0,0),(-1,-1), [colors.HexColor('#f9f9f9'), colors.white]),
            ('GRID',           (0,0),(-1,-1), 0.5, colors.HexColor('#dddddd')),
            ('TOPPADDING',     (0,0),(-1,-1), 7),
            ('BOTTOMPADDING',  (0,0),(-1,-1), 7),
            ('LEFTPADDING',    (0,0),(-1,-1), 10),
        ]))
        story.append(tbl)
    else:
        story.append(Paragraph("Chưa có dữ liệu BMI. Vui lòng tính BMI trước.", warning_style))

    # Section 2: Xu hướng 30 ngày
    story.append(Paragraph("XU HƯỚNG 30 NGÀY", section_style))

    if len(bmi_history_30days) >= 2:
        fr, lr = bmi_history_30days[0], bmi_history_30days[-1]
        wd, bd = lr.weight_kg - fr.weight_kg, lr.bmi_value - fr.bmi_value

        if wd < 0:
            story.append(Paragraph(f"[OK]  Cân nặng:  Giảm {abs(wd):.1f} kg", good_style))
        elif wd > 0:
            story.append(Paragraph(f"[!]   Cân nặng:  Tăng {wd:.1f} kg", warning_style))
        else:
            story.append(Paragraph("Cân nặng:  Ổn định", normal_style))

        if bd < 0:
            story.append(Paragraph(f"[OK]  BMI:  Giảm từ {fr.bmi_value:.1f} → {lr.bmi_value:.1f}", good_style))
        elif bd > 0:
            story.append(Paragraph(f"[!]   BMI:  Tăng từ {fr.bmi_value:.1f} → {lr.bmi_value:.1f}", warning_style))
        else:
            story.append(Paragraph(f"BMI:  Ổn định ở {fr.bmi_value:.1f}", normal_style))
    else:
        story.append(Paragraph("Chưa đủ dữ liệu để hiển thị xu hướng.", warning_style))

    # Section 3: Nhận xét AI
    story.append(Paragraph("NHẬN XÉT", section_style))

    comment = ("Hệ thống chưa đủ thông tin để đưa ra nhận xét chi tiết. "
               "Vui lòng theo dõi chỉ số BMI trong 30 ngày tới.")

    if latest_bmi:
        v = latest_bmi.bmi_value
        if v > 25:
            comment = ("Dựa trên dữ liệu của bạn, bạn đang trong tình trạng thừa cân. "
                       "Nên điều chỉnh chế độ ăn uống và tăng cường vận động "
                       "để đưa BMI về mức bình thường.")
        elif v < 18.5:
            comment = ("Dựa trên dữ liệu của bạn, bạn đang hơi thiếu cân. "
                       "Hãy chú ý bổ sung dinh dưỡng và tập luyện tăng cơ "
                       "để cải thiện sức khỏe.")
        else:
            comment = ("Dựa trên dữ liệu của bạn, chỉ số BMI đang ở mức bình thường. "
                       "Hãy tiếp tục duy trì lối sống lành mạnh và chế độ tập luyện hiện tại.")

        if len(bmi_history_30days) >= 2:
            if bmi_history_30days[-1].weight_kg < bmi_history_30days[0].weight_kg:
                comment += " Bạn đang có tiến triển tốt, hãy duy trì phong độ này!"
            elif bmi_history_30days[-1].weight_kg > bmi_history_30days[0].weight_kg:
                comment += " Cân nặng có xu hướng tăng, bạn nên xem lại chế độ calo nạp vào hàng ngày."

    story.append(Paragraph(comment, normal_style))

    # Section 4: Gợi ý
    story.append(Paragraph("GỢI Ý", section_style))

    suggestions = [
        ('ok',   "Tập cardio 3-4 buổi/tuần"),
        ('ok',   "Uống đủ 2L nước mỗi ngày"),
    ]
    if latest_bmi:
        v = latest_bmi.bmi_value
        if v > 25:
            suggestions += [
                ('warn', "BMI vẫn còn trên mức bình thường"),
                ('warn', "Giảm thiểu đồ uống có đường và thực phẩm chế biến sẵn"),
            ]
        elif v < 18.5:
            suggestions += [
                ('warn', "BMI hiện đang thấp hơn mức bình thường"),
                ('warn', "Tăng lượng calo nạp vào với thực phẩm giàu dinh dưỡng"),
            ]

    smap = {'ok': good_style, 'warn': warning_style, 'danger': danger_style}
    pmap = {'ok': '[OK]',     'warn': '[!] ',        'danger': '[X] '}
    for kind, text in suggestions:
        story.append(Paragraph(f"{pmap[kind]}  {text}", smap[kind]))

    # Footer
    story.append(Spacer(1, 30))
    story.append(divider('#cccccc', 0.5))
    story.append(Paragraph(
        f"Báo cáo được tạo tự động bởi Smart Health  |  {today.strftime('%d/%m/%Y')}",
        footer_style
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer