# -*- coding: utf-8 -*-
import re
from pathlib import Path
path = Path('src/app/customer/helpdesk/page.tsx')
text = path.read_text()
pattern = r"\{ticket\.booking_id \? `#\$\{ticket\.booking_id\}` : '\\?'\}"
replacement = "{ticket.booking_id ? `#${ticket.booking_id}` : '—'}"
new_text, count = re.subn(pattern, replacement, text, count=1)
if count == 0:
    raise SystemExit('pattern not found')
path.write_text(new_text)
