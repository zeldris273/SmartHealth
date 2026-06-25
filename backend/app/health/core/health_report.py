"""
health_report.py
================
Generate health report PDF for users.
"""

from io import BytesIO
from datetime import datetime, date, timedelta
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, PageBreak,
    ListFlowable, ListItem
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


def remove_diacritics(text):
    """
    Remove Vietnamese diacritics to improve font compatibility.
    """
    if not text:
        return text
    
    # Mapping of Vietnamese characters with diacritics to their base forms
    diacritic_map = {
        'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
        'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
        'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
        'đ': 'd',
        'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
        'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
        'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
        'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
        'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
        'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
        'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
        'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
        'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
        'À': 'A', 'Á': 'A', 'Ả': 'A', 'Ã': 'A', 'Ạ': 'A',
        'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ẳ': 'A', 'Ẵ': 'A', 'Ặ': 'A',
        'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 'Ậ': 'A',
        'Đ': 'D',
        'È': 'E', 'É': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ẹ': 'E',
        'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ể': 'E', 'Ễ': 'E', 'Ệ': 'E',
        'Ì': 'I', 'Í': 'I', 'Ỉ': 'I', 'Ĩ': 'I', 'Ị': 'I',
        'Ò': 'O', 'Ó': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ọ': 'O',
        'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ộ': 'O',
        'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ở': 'O', 'Ỡ': 'O', 'Ợ': 'O',
        'Ù': 'U', 'Ú': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ụ': 'U',
        'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ử': 'U', 'Ữ': 'U', 'Ự': 'U',
        'Ỳ': 'Y', 'Ý': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y', 'Ỵ': 'Y'
    }
    
    result = []
    for char in text:
        result.append(diacritic_map.get(char, char))
    return ''.join(result)


def generate_health_report(
    user,
    latest_bmi,
    previous_bmi,
    bmi_history_30days
):
    """
    Generate health report PDF.
    
    Args:
        user: User object
        latest_bmi: Latest BMIRecord object
        previous_bmi: BMIRecord from 1 month ago (or None)
        bmi_history_30days: List of BMIRecord from last 30 days
        
    Returns:
        BytesIO containing the PDF
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, 
                            rightMargin=inch, leftMargin=inch,
                            topMargin=inch, bottomMargin=inch)
    
    styles = getSampleStyleSheet()
    
    # Configure Vietnamese font support
    # Use DejaVu Sans which has excellent Vietnamese support
    try:
        pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
        pdfmetrics.registerFont(TTFont('DejaVuSans-Bold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
        font_name = 'DejaVuSans'
    except Exception as e:
        print(f"Warning: Could not load DejaVu font, falling back: {e}")
        font_name = 'Helvetica'
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Title'],
        fontSize=24,
        textColor=colors.HexColor('#0066CC'),
        spaceAfter=20,
        fontName=font_name
    )
    
    section_title_style = ParagraphStyle(
        'SectionTitle',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#333333'),
        spaceBefore=20,
        spaceAfter=10,
        fontName=font_name
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=12,
        spaceAfter=6,
        fontName=font_name
    )
    
    story = []
    
    # Title
    story.append(Paragraph("BÁO CÁO SỨC KHỎE CÁ NHÂN", title_style))
    story.append(Spacer(1, 20))
    
    # User info
    today = date.today()
    gender_map = {"male": "Nam", "female": "Nữ", "other": "Khác"}
    
    user_info = [
        f"Họ và tên: {user.full_name or 'Chưa cập nhật'}",
        f"Giới tính: {gender_map.get(user.gender, 'Chưa cập nhật')}",
        f"Tuổi: {user.age or 'Chưa cập nhật'} tuổi",
        f"Ngày xuất báo cáo: {today.strftime('%d/%m/%Y')}"
    ]
    
    for line in user_info:
        story.append(Paragraph(line, normal_style))
    
    story.append(Spacer(1, 20))
    
    # Section 1: Chỉ số cơ thể
    story.append(Paragraph("CHỈ SỐ CƠ THỂ", section_title_style))
    
    # Prepare body stats data
    body_stats_data = []
    
    if latest_bmi:
        # Current weight
        weight_text = f"{latest_bmi.weight_kg} kg"
        if previous_bmi:
            weight_change = latest_bmi.weight_kg - previous_bmi.weight_kg
            if weight_change < 0:
                weight_text += f" (tháng trước: {previous_bmi.weight_kg} kg ▼)"
            elif weight_change > 0:
                weight_text += f" (tháng trước: {previous_bmi.weight_kg} kg ▲)"
            else:
                weight_text += f" (tháng trước: {previous_bmi.weight_kg} kg)"
        
        body_stats_data.append(["Cân nặng hiện tại:", weight_text])
        body_stats_data.append(["Chiều cao:", f"{latest_bmi.height_cm} cm"])
        
        # BMI
        bmi_text = f"{latest_bmi.bmi_value:.1f}"
        bmi_text += f" → {latest_bmi.bmi_category_vi}"
        body_stats_data.append(["BMI:", bmi_text])
    
    if body_stats_data:
        body_stats_table = Table(body_stats_data, colWidths=[160, 280])
        body_stats_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('FONTNAME', (0, 0), (-1, -1), font_name),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(body_stats_table)
    else:
        story.append(Paragraph("Chưa có dữ liệu BMI. Vui lòng tính BMI trước.", normal_style))
    
    # Section 2: Xu hướng 30 ngày
    story.append(Spacer(1, 20))
    story.append(Paragraph("XU HƯỚNG 30 NGÀY", section_title_style))
    
    if len(bmi_history_30days) >= 2:
        first_record = bmi_history_30days[0]
        last_record = bmi_history_30days[-1]
        
        weight_change = last_record.weight_kg - first_record.weight_kg
        bmi_change = last_record.bmi_value - first_record.bmi_value
        
        trend_data = []
        
        # Weight trend
        weight_trend_text = ""
        if weight_change < 0:
            weight_trend_text = f"Giảm {abs(weight_change):.1f} kg ✅"
        elif weight_change > 0:
            weight_trend_text = f"Tăng {weight_change:.1f} kg ⚠️"
        else:
            weight_trend_text = "Ổn định"
        
        trend_data.append(["Cân nặng:", weight_trend_text])
        
        # BMI trend
        bmi_trend_text = ""
        if bmi_change < 0:
            bmi_trend_text = f"Giảm từ {first_record.bmi_value:.1f} → {last_record.bmi_value:.1f} ✅"
        elif bmi_change > 0:
            bmi_trend_text = f"Tăng từ {first_record.bmi_value:.1f} → {last_record.bmi_value:.1f} ⚠️"
        else:
            bmi_trend_text = f"Ổn định ở {first_record.bmi_value:.1f}"
        
        trend_data.append(["BMI:", bmi_trend_text])
        
        trend_table = Table(trend_data, colWidths=[160, 280])
        trend_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('FONTNAME', (0, 0), (-1, -1), font_name),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(trend_table)
    else:
        story.append(Paragraph("Chưa đủ dữ liệu để hiển thị xu hướng.", normal_style))
    
    # Section 4: Gợi ý
    story.append(Spacer(1, 20))
    story.append(Paragraph("GỢI Ý", section_title_style))
    
    suggestions = [
        "✅ Tập cardio 3-4 buổi/tuần (đi bộ nhanh, bơi lội, đạp xe)",
        "✅ Uống đủ 2-2.5 lít nước mỗi ngày",
        "✅ Ăn nhiều rau xanh, trái cây và protein nạc",
        "✅ Ngủ đủ 7-8 giờ mỗi đêm",
        "✅ Thường xuyên theo dõi cân nặng và sức khỏe"
    ]
    
    if latest_bmi:
        if latest_bmi.bmi_value > 25:
            suggestions.append("⚠️ Giảm thiểu đồ uống có đường và thực phẩm chế biến sẵn")
        elif latest_bmi.bmi_value < 18.5:
            suggestions.append("⚠️ Tăng lượng calo nạp vào với thực phẩm giàu dinh dưỡng")
    
    for suggestion in suggestions:
        story.append(Paragraph(suggestion, normal_style))
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    
    return buffer
