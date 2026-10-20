"""
=============================================================================
NYARA LUXE - AUTOMATED ORDER ENGINE (FLIPKART, MEESHO, AMAZON & STORE)
=============================================================================
Monitors incoming order notification emails in info@nyaraluxe.in,
extracts order details, syncs with MongoDB, triggers rich email notifications
with real product photos & action buttons ('Accept' / 'Accept & Generate Label'),
and enters every order into the Google Sheet 'sale' tab with remark 'automated'.
=============================================================================
"""

import imaplib
import email
from email.header import decode_header
import re
import json
import time
import os
import sys
from datetime import datetime
import requests

# Configuration
IMAP_SERVER = "imap.hostinger.com"
EMAIL_USER = "info@nyaraluxe.in"
EMAIL_PASS = "NyaraLuxe@978"
API_ENDPOINT = "https://website-ppur.vercel.app/api/orders/marketplace-sync"
POLL_INTERVAL_SECONDS = 30  # Poll every 30 seconds

try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

def log(msg):
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    clean_msg = str(msg).encode('ascii', errors='replace').decode('ascii')
    print(f"[{now_str}] {clean_msg}", flush=True)

def decode_mime_header(val):
    if not val:
        return ""
    parts = []
    for part, enc in decode_header(val):
        if isinstance(part, bytes):
            parts.append(part.decode(enc or 'utf-8', errors='ignore'))
        else:
            parts.append(str(part))
    return "".join(parts)

def parse_order_from_email(msg):
    subject = decode_mime_header(msg.get("Subject", ""))
    from_addr = decode_mime_header(msg.get("From", "")).lower()

    # Extract plain body & html body
    body = ""
    html_body = ""
    if msg.is_multipart():
        for part in msg.walk():
            ctype = part.get_content_type()
            if ctype == "text/plain":
                body += part.get_payload(decode=True).decode("utf-8", errors="ignore")
            elif ctype == "text/html":
                html_body += part.get_payload(decode=True).decode("utf-8", errors="ignore")
    else:
        body = msg.get_payload(decode=True).decode("utf-8", errors="ignore")

    combined_text = subject + " " + body
    if not body.strip() and html_body:
        combined_text = subject + " " + re.sub(r'<[^>]+>', ' ', html_body)

    platform = None
    order_id = None
    sku = None
    amount = 0
    qty = 1
    cust_name = "Valued Customer"
    phone = ""
    address = "India"
    pincode = ""

    # 1. FLIPKART
    if "flipkart" in from_addr or "flipkart" in subject.lower():
        platform = "flipkart"
        m_od = re.search(r'(OD\d{16,22})', combined_text)
        if m_od:
            order_id = m_od.group(1)

        m_sku = re.search(r'SKU[:\s\-]+([A-Za-z0-9_]{3,20})', combined_text, re.IGNORECASE)
        if m_sku:
            sku = m_sku.group(1)
        else:
            m_gen = re.search(r'\b(WL_\d{3}(?:_\d+)?|GL_\d{3}[A-Za-z0-9_]*|CC_\d{3}[A-Za-z0-9_]*|CHN_\d{3}[A-Za-z0-9_]*)\b', combined_text, re.IGNORECASE)
            if m_gen:
                sku = m_gen.group(1)

        m_amt = re.search(r'(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{2})?)', combined_text)
        if m_amt:
            try:
                amount = float(m_amt.group(1).replace(',', ''))
            except:
                pass

        m_pin = re.search(r'\b([1-9][0-9]{5})\b', combined_text)
        if m_pin:
            pincode = m_pin.group(1)

    # 2. MEESHO
    elif "meesho" in from_addr or "meesho" in subject.lower():
        platform = "meesho"
        m_oid = re.search(r'(?:Sub-?order|Order\s*ID)[:\s\-]+([0-9_]{10,25})', combined_text, re.IGNORECASE)
        if m_oid:
            order_id = m_oid.group(1)
        else:
            m_digits = re.search(r'\b(\d{18,20}(?:_\d+)?)\b', combined_text)
            if m_digits:
                order_id = m_digits.group(1)

        m_sku = re.search(r'SKU[:\s\-]+([A-Za-z0-9_]{3,20})', combined_text, re.IGNORECASE)
        if m_sku:
            sku = m_sku.group(1)
        else:
            m_gen = re.search(r'\b(WL_\d{3}(?:_\d+)?|GL_\d{3}[A-Za-z0-9_]*|CC_\d{3}[A-Za-z0-9_]*|CHN_\d{3}[A-Za-z0-9_]*)\b', combined_text, re.IGNORECASE)
            if m_gen:
                sku = m_gen.group(1)

        m_amt = re.search(r'(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{2})?)', combined_text)
        if m_amt:
            try:
                amount = float(m_amt.group(1).replace(',', ''))
            except:
                pass

        m_pin = re.search(r'\b([1-9][0-9]{5})\b', combined_text)
        if m_pin:
            pincode = m_pin.group(1)

    # 3. AMAZON
    elif "amazon" in from_addr or "amazon" in subject.lower():
        platform = "amazon"
        m_oid = re.search(r'(\d{3}-\d{7}-\d{7})', combined_text)
        if m_oid:
            order_id = m_oid.group(1)

        m_sku = re.search(r'Sold, ship now:\s*([A-Za-z0-9_]+)', subject)
        if m_sku:
            sku = m_sku.group(1)
        else:
            m_gen = re.search(r'\b(WL_\d{3}(?:_\d+)?|GL_\d{3}[A-Za-z0-9_]*|CC_\d{3}[A-Za-z0-9_]*|CHN_\d{3}[A-Za-z0-9_]*)\b', combined_text, re.IGNORECASE)
            if m_gen:
                sku = m_gen.group(1)

    if platform and (order_id or sku):
        return {
            "platform": platform,
            "orderId": order_id or f"{platform.upper()}-{int(time.time())}",
            "sku": sku or "UNKNOWN_SKU",
            "quantity": qty,
            "amount": amount,
            "customerName": cust_name,
            "customerPhone": phone,
            "deliveryAddress": address,
            "pincode": pincode,
            "orderDate": datetime.now().strftime("%Y-%m-%d"),
            "remark": "automated"
        }

    return None

def check_and_process_orders(max_emails=10):
    try:
        mail = imaplib.IMAP4_SSL(IMAP_SERVER, 993)
        mail.login(EMAIL_USER, EMAIL_PASS)
        mail.select("INBOX")

        # Search for unseen order notification emails
        status, messages = mail.search(None, '(UNSEEN)')
        msg_ids = messages[0].split()

        if not msg_ids:
            # log("No new unseen order emails.")
            mail.logout()
            return

        # Take the most recent unseen emails up to max_emails to avoid flood
        target_ids = msg_ids[-max_emails:]
        log(f"Detected {len(msg_ids)} unseen email(s). Processing latest {len(target_ids)}...")

        for mid in target_ids:
            try:
                status, data = mail.fetch(mid, '(RFC822)')
                raw_email = data[0][1]
                msg = email.message_from_bytes(raw_email)

                order_info = parse_order_from_email(msg)
                if order_info:
                    log(f"🔔 NEW ORDER FOUND: [{order_info['platform'].upper()}] Order ID: {order_info['orderId']} | SKU: {order_info['sku']}")
                    
                    # Dispatch to Nyara Luxe Backend
                    res = requests.post(API_ENDPOINT, json=order_info, timeout=20)
                    if res.status_code == 200:
                        log(f"✅ Synced successfully: {res.json().get('message')}")
                        log(f"🏷️ Label Ready: {res.json().get('labelUrl')}")
                    else:
                        log(f"⚠️ API Response {res.status_code}: {res.text[:200]}")

                # Mark email as read / seen so it does not re-process
                mail.store(mid, '+FLAGS', '\\Seen')

            except Exception as parse_err:
                mid_str = mid.decode() if isinstance(mid, bytes) else str(mid)
                log(f"Error parsing email ID {mid_str}: {parse_err}")

        mail.logout()

    except Exception as imap_err:
        log(f"IMAP Error: {imap_err}")

def run_bot():
    log("="*65)
    log("NYARA LUXE AUTOMATED ORDER BOT STARTED")
    log(f"Monitoring IMAP: {EMAIL_USER} on {IMAP_SERVER}")
    log(f"Sync API: {API_ENDPOINT}")
    log("="*65)

    while True:
        try:
            check_and_process_orders()
        except KeyboardInterrupt:
            log("Bot stopped by user.")
            break
        except Exception as e:
            log(f"Unexpected error in main loop: {e}")
        time.sleep(POLL_INTERVAL_SECONDS)

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--once":
        check_and_process_orders()
    else:
        run_bot()
