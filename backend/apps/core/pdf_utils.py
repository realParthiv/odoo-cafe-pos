import io
import qrcode
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, mm
from reportlab.lib.utils import ImageReader

def generate_table_qr_pdf(table_number, qr_url, cafe_name="Our Cafe"):
    """
    Generate a PDF with a QR code and table info.
    Returns a FileResponse compatible buffer.
    """
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    # --- Draw Background/Center ---
    center_x = width / 2
    
    # 1. Cafe Name (Header)
    p.setFont("Helvetica-Bold", 24)
    p.drawCentredString(center_x, height - 1.5 * inch, cafe_name)
    
    # 2. QR Code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_url)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    qr_img_buffer = io.BytesIO()
    img.save(qr_img_buffer, format="PNG")
    qr_img_buffer.seek(0)
    
    qr_reader = ImageReader(qr_img_buffer)
    qr_size = 4 * inch
    p.drawImage(qr_reader, (width - qr_size) / 2, height / 2 - qr_size / 2, width=qr_size, height=qr_size)
    
    # 3. Table Number (Footer)
    p.setFont("Helvetica-Bold", 36)
    p.drawCentredString(center_x, height / 2 - qr_size / 2 - 0.7 * inch, f"Table: {table_number}")
    
    # 4. Instructions
    p.setFont("Helvetica", 12)
    p.drawCentredString(center_x, height / 2 - qr_size / 2 - 1.2 * inch, "Scan to view menu and order directly from your table")

    p.showPage()
    p.save()
    
    buffer.seek(0)
    return buffer
